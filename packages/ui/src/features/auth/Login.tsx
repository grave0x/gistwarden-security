import {
  type Component,
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
  untrack,
} from "solid-js";
import { accountStore, setAccountStore, setSettingsStore, settingsStore, uiStore } from "@/core/store.ts";
import { setupGithub } from "@/features/sync/github-auth.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";

import {
  createNewVault,
  logout,
  unlock,
} from "@/features/auth/auth-service.ts";

import { unlockWithPin } from "@/features/auth/pin-service.ts";
import { confirm, setGlobalLoading, updateLanguage } from "@gistwarden/ui";
import PinUnlockForm from "@/features/auth/PinUnlockForm.tsx";
import { GithubSetupForm } from "@/features/auth/components/GithubSetupForm.tsx";
import { MasterPasswordForm } from "@/features/auth/components/MasterPasswordForm.tsx";
import { MasterPasswordCreate } from "@/features/auth/components/MasterPasswordCreate.tsx";
import TypedConfirmModal from "@/components/ui/TypedConfirmModal.tsx";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import { AppIcon, ShieldAlertIcon, SyncIcon } from "@/icons/svg/index.ts";
import { t, type TranslationKey } from "@/core/i18n.ts";
import { getAccountSettings, getGithubToken, getSessionItem, resetAccountSettings, updateAccountSettings, updateExtensionSettings } from "@/core/storage.ts";
import { DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG } from "@gistwarden/repository";
import { z } from "zod";
import {
  downloadFromGistRoute,
  startGithubOauthRoute,
} from "@gistwarden/orchestrator";
import {
  APP_NAME,
  OAUTH_CLIENT_ID,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
} from "@/core/constants.ts";
import { type LoginViewMode } from "@/core/storage-schemas.ts";
import { type VaultMode } from "@gistwarden/repository";
import { getSyncProvider } from "@gistwarden/network";
import { asGitHubAccessToken, safeJsonParse } from "@gistwarden/domain";
import { GistPayloadSchema } from "@gistwarden/repository";

export const Login: Component = () => {
  const [error, setError] = createSignal("");
  const [viewMode, setViewMode] = createSignal<LoginViewMode>("masterPassword");
  const [failedUnlockAttempts, setFailedUnlockAttempts] = createSignal(0);
  const [gistStatus, setGistStatus] = createSignal<
    "checking" | "new" | "exists"
  >("exists");
  const [showResetLocalModal, setShowResetLocalModal] = createSignal(false);

  const checkVaultStatusForMode = async (
    mode: VaultMode,
  ): Promise<"checking" | "exists" | "new"> => {
    const accRes = await getAccountSettings(mode);
    const acc = accRes.isOk() ? accRes.value : null;

    if (acc) {
      setAccountStore("masterPasswordConfig", acc.masterPasswordConfig);
      setAccountStore("pinConfig", acc.pinConfig);
      setAccountStore("githubConfig", acc.githubConfig);
      setAccountStore("gistId", acc.githubConfig.gistId || "");
      setAccountStore(
        "githubConfigured",
        !!acc.githubConfig.gistId && !!acc.masterPasswordConfig.salt,
      );
    }

    if (acc?.masterPasswordConfig.salt) {
      return "exists";
    }

    const provider = getSyncProvider(mode);
    const retrievedToken = await getGithubToken(mode);
    const activeToken = retrievedToken ||
      (accountStore.githubToken
        ? asGitHubAccessToken(accountStore.githubToken)
        : undefined);

    const isConfigured = await provider.isConfigured({
      token: activeToken,
      gistId: acc?.githubConfig.gistId || undefined,
    });

    if (!isConfigured) {
      return "new";
    }

    const downloadRes = await provider.download({
      token: activeToken,
      gistId: acc?.githubConfig.gistId || undefined,
    });

    if (downloadRes.isOk() && downloadRes.value.content) {
      const content = downloadRes.value.content;
      const payloadJsonRes = safeJsonParse(content);
      if (payloadJsonRes.isOk()) {
        const parsed = GistPayloadSchema.safeParse(payloadJsonRes.value);
        if (parsed.success && parsed.data.salt) {
          const updatedMpConfig = {
            ...accountStore.masterPasswordConfig,
            salt: parsed.data.salt,
          };
          await updateAccountSettings(
            { masterPasswordConfig: updatedMpConfig },
            mode,
          );
          setAccountStore("masterPasswordConfig", updatedMpConfig);
          return "exists";
        }
      }
    }

    return "new";
  };

  onMount(async () => {
    let tokenToSetup: string | null = null;

    const rawTokenRes = await getSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
    const rawToken = rawTokenRes.isOk() ? rawTokenRes.value : null;
    const parsed = z.string().safeParse(rawToken);
    if (parsed.success && parsed.data) {
      tokenToSetup = parsed.data;
    }

    if (!tokenToSetup && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      if (tokenFromUrl) {
        tokenToSetup = tokenFromUrl;
        const cleanUrl = window.location.origin + window.location.pathname +
          window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    if (tokenToSetup) {
      setGlobalLoading(true);
      const setupRes = await setupGithub(tokenToSetup);
      setGlobalLoading(false);
      if (setupRes.isErr()) {
        setError(t(setupRes.error));
      }
    }

    const initialStatus = await checkVaultStatusForMode(settingsStore.vaultMode);
    setGistStatus(initialStatus);
  });

  createEffect(() => {
    if (accountStore.isLoaded && settingsStore.isLoaded) {
      if (accountStore.pinConfig.enabled) {
        if (settingsStore.requireMasterPasswordOnRestart) {
          setViewMode(accountStore.sessionUnlocked ? "pin" : "masterPassword");
        } else {
          setViewMode("pin");
        }
      } else {
        setViewMode("masterPassword");
      }
    }
  });

  const handlePinUnlock = async (pin: string) => {
    setGlobalLoading(true);
    setError("");
    const res = await unlockWithPin(pin);
    if (res.isErr()) {
      setError(t(res.error));
    }
    setGlobalLoading(false);
  };

  const handleSaveToken = async (token: string) => {
    if (!token.trim()) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const result = await setupGithub(token.trim());
    setGlobalLoading(false);
    if (result.isErr()) {
      setError(t(result.error));
    }
  };

  const handleGithubOauth = async () => {
    setGlobalLoading(true);
    setError("");

    const handleOauthError = (errVal: TranslationKey) => {
      setError(t(errVal));
      setGlobalLoading(false);
    };

    const sendResult = await sendBackgroundMessage(
      startGithubOauthRoute,
      { content: OAUTH_CLIENT_ID },
    );
    if (sendResult.isErr()) {
      handleOauthError(sendResult.error);
      return;
    }
    if (!sendResult.value.success) {
      handleOauthError(sendResult.value.error || "messaging_error_send_failed");
      return;
    }

    // Setup GitHub with the obtained token
    const setupRes = await setupGithub(sendResult.value.token);
    if (setupRes.isErr()) {
      handleOauthError(setupRes.error);
      return;
    }

    setGlobalLoading(false);
  };

  const handleSwitchVaultMode = async (mode: VaultMode) => {
    setSettingsStore("vaultMode", mode);
    await updateExtensionSettings({ vaultMode: mode });
    setError("");

    setGistStatus("checking");
    const status = await checkVaultStatusForMode(mode);
    setGistStatus(status);
  };

  const handleCreateMasterPassword = async (password: string) => {
    if (!password) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const result = await createNewVault(password);
    setGlobalLoading(false);
    if (result.isErr()) {
      setError(t(result.error));
    }
  };

  const handleUnlock = async (password: string) => {
    if (!password) {
      setError(t("login_error_empty_mp"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const result = await unlock(password);
    setGlobalLoading(false);
    if (result.isErr()) {
      setFailedUnlockAttempts((prev) => prev + 1);
      setError(t(result.error));
    }
  };

  const handleResetToken = async () => {
    setError("");
    await logout();
  };

  const handleForgotPassword = async () => {
    if (settingsStore.vaultMode === "local_storage") {
      setShowResetLocalModal(true);
      return;
    }

    const gistId = accountStore.gistId;
    if (
      await confirm(
        t("login_forgot_password_title"),
        t("login_forgot_password_msg"),
        "danger",
      )
    ) {
      if (gistId) {
        window.open(`https://gist.github.com/${gistId}`, "_blank");
      }
      logout();
    }
  };

  const handleConfirmResetLocalVault = async () => {
    setShowResetLocalModal(false);
    await resetAccountSettings("local_storage");
    setAccountStore("masterPasswordConfig", DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG);
    setGistStatus("new");
  };

  return (
    <div class="app-body justify-center h-full">
      {/* Floating Language Switcher */}
      <div class="login-lang-selector">
        <button
          type="button"
          class={`lang-toggle-btn ${settingsStore.language === "en" ? "active" : ""
            }`}
          onClick={() => updateLanguage("en")}
        >
          EN
        </button>
        <span class="lang-divider">|</span>
        <button
          type="button"
          class={`lang-toggle-btn ${settingsStore.language === "vi" ? "active" : ""
            }`}
          onClick={() => updateLanguage("vi")}
        >
          VI
        </button>
      </div>

      <div class="text-center mb-24">
        <AppIcon class="login-header-logo" />
        <h2 class="login-brand-title">{APP_NAME}</h2>
        <p class="login-subtitle">
          <Show
            when={settingsStore.vaultMode === "local_storage" || accountStore.githubConfigured}
            fallback={t("login_title_setup")}
          >
            {t("login_title_locked")}
          </Show>
        </p>
      </div>

      {/* Vault Mode Selector Tabs */}
      <div class="login-tabs mb-16">
        <button
          type="button"
          class={`login-tab-btn ${settingsStore.vaultMode === "github_gist" ? "active" : ""}`}
          onClick={() => handleSwitchVaultMode("github_gist")}
        >
          Cloud Vault (Gist)
        </button>
        <button
          type="button"
          class={`login-tab-btn ${settingsStore.vaultMode === "local_storage" ? "active" : ""}`}
          onClick={() => handleSwitchVaultMode("local_storage")}
        >
          Local Vault
        </button>
      </div>

      {/* Local Vault Must Read Warning Banner */}
      <Show when={settingsStore.vaultMode === "local_storage"}>
        <div class="local-vault-must-read-banner mb-16">
          <div class="must-read-text">
            <ShieldAlertIcon size={16} class="must-read-icon" />
            <span>{t("login_local_vault_must_read")}</span>
          </div>
          <div class="must-read-link-group">
            <span class="must-read-label">{t("login_local_vault_must_read_btn")}</span>
            <GuideHelpButton route="getting-started/local-vault" size={15} />
          </div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="alert alert-danger mb-16">{error()}</div>
      </Show>

      <Show when={failedUnlockAttempts() >= 3}>
        <div class="text-center text-sm text-muted mb-16">
          {t("login_error_changed_mp_hint")}
        </div>
      </Show>

      <Show
        when={settingsStore.vaultMode === "local_storage" || accountStore.githubConfigured}
        fallback={
          <GithubSetupForm
            onSaveToken={handleSaveToken}
            onGithubOauth={handleGithubOauth}
          />
        }
      >
        <Show
          when={viewMode() === "pin"}
          fallback={
            <Switch>
              <Match when={gistStatus() === "checking"}>
                <div class="text-center p-24 card">
                  <SyncIcon class="spinning loading-icon mb-12" />
                  <div class="font-sz-13 text-muted">
                    {t("login_checking_gist")}
                  </div>
                </div>
              </Match>
              <Match when={gistStatus() === "new"}>
                <MasterPasswordCreate
                  onCreate={handleCreateMasterPassword}
                />
              </Match>
              <Match when={gistStatus() === "exists"}>
                <MasterPasswordForm
                  onUnlock={handleUnlock}
                  onSwitchToPin={() => setViewMode("pin")}
                  onLogout={handleResetToken}
                  onForgotPassword={handleForgotPassword}
                />
              </Match>
            </Switch>
          }
        >
          <PinUnlockForm
            error={error()}
            onUnlock={handlePinUnlock}
            onSwitchToMasterPassword={() => setViewMode("masterPassword")}
          />
        </Show>
      </Show>

      <TypedConfirmModal
        isOpen={showResetLocalModal()}
        title={t("login_local_forgot_password_title")}
        messageHtml={t("login_local_forgot_password_msg")}
        requiredWord="RESET"
        placeholder={t("login_local_reset_placeholder")}
        confirmButtonText={t("login_local_reset_btn")}
        variant="danger"
        onClose={() => setShowResetLocalModal(false)}
        onConfirm={handleConfirmResetLocalVault}
      />
    </div>
  );
};
export default Login;
