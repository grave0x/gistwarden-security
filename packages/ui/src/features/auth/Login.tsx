import {
  type LoginViewMode,
  SESSION_KEY_ENCRYPTED_VAULT,
} from "@gistwarden/domain";
import {
  checkVaultConfiguredUseCase,
  checkVaultStatusUseCase,
  startGithubOauthRoute,
} from "@gistwarden/orchestrator";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_SYNC_CONFIG,
  type VaultMode,
  VaultModeSchema,
} from "@gistwarden/repository";
import { setGlobalLoading, updateLanguage } from "@gistwarden/ui";
import {
  type Component,
  createEffect,
  createSignal,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { z } from "zod";
import GuideHelpButton from "@/components/ui/GuideHelpButton.tsx";
import { Select } from "@/components/ui/Select.tsx";
import TypedConfirmModal from "@/components/ui/TypedConfirmModal.tsx";
import {
  APP_NAME,
  OAUTH_CLIENT_ID,
  SESSION_KEY_PENDING_SYNC_TOKEN,
} from "@/core/constants.ts";
import { type TranslationKey, t } from "@/core/i18n.ts";
import { sendBackgroundMessage } from "@/core/messaging.ts";
import {
  getAccountSettings,
  getSessionItem,
  removeSessionItem,
  resetAccountSettings,
  setSessionItem,
  updateAccountSettings,
  updateExtensionSettings,
} from "@/core/storage.ts";
import {
  accountStore,
  setAccountStore,
  setSettingsStore,
  settingsStore,
} from "@/core/store.ts";
import {
  createNewVault,
  logout,
  unlock,
} from "@/features/auth/auth-service.ts";
import { GithubSetupForm } from "@/features/auth/components/GithubSetupForm.tsx";
import { MasterPasswordCreate } from "@/features/auth/components/MasterPasswordCreate.tsx";
import { MasterPasswordForm } from "@/features/auth/components/MasterPasswordForm.tsx";
import { SelfHostedSetupForm } from "@/features/auth/components/SelfHostedSetupForm.tsx";
import { handleForgotMasterPassword } from "@/features/auth/forgot-password-strategies.ts";
import PinUnlockForm from "@/features/auth/PinUnlockForm.tsx";
import { unlockWithPin } from "@/features/auth/pin-service.ts";
import { setupGithub } from "@/features/sync/github-auth.ts";
import {
  AppIcon,
  GithubIcon,
  GlobeIcon,
  ShieldAlertIcon,
  SyncIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";

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
    let isConfigured = false;

    if (acc) {
      const currentSyncConfig = acc.syncConfig;
      setAccountStore("masterPasswordConfig", acc.masterPasswordConfig);
      setAccountStore("pinConfig", acc.pinConfig);
      setAccountStore("syncConfig", currentSyncConfig);
      setAccountStore("gistId", currentSyncConfig.gistId || "");
      isConfigured = await checkVaultConfiguredUseCase(mode, acc);
      setAccountStore("vaultConfigured", isConfigured);
    } else {
      isConfigured = await checkVaultConfiguredUseCase(mode, null);
      setAccountStore("vaultConfigured", isConfigured);
    }

    const statusResult = await checkVaultStatusUseCase(
      mode,
      acc,
      accountStore.syncToken,
    );

    if (
      statusResult.salt &&
      statusResult.salt !== acc?.masterPasswordConfig.salt
    ) {
      const updatedMpConfig = {
        ...(acc?.masterPasswordConfig ||
          DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG),
        salt: statusResult.salt,
      };
      const baseSyncConfig = acc?.syncConfig || DEFAULT_SYNC_CONFIG;
      const updatedSyncConfig = {
        ...baseSyncConfig,
        ...(statusResult.gistId ? { gistId: statusResult.gistId } : {}),
      };
      await updateAccountSettings(
        {
          masterPasswordConfig: updatedMpConfig,
          syncConfig: updatedSyncConfig,
        },
        mode,
      );
      setAccountStore("masterPasswordConfig", updatedMpConfig);
      setAccountStore("syncConfig", updatedSyncConfig);
      if (statusResult.gistId) {
        setAccountStore("gistId", statusResult.gistId);
      }
    }

    if (statusResult.status === "new" && !isConfigured) {
      setAccountStore("vaultConfigured", false);
    }

    return statusResult.status;
  };

  onMount(async () => {
    let tokenToSetup: string | null = null;

    const rawTokenRes = await getSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
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
        const cleanUrl =
          window.location.origin +
          window.location.pathname +
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

    const initialStatus = await checkVaultStatusForMode(
      settingsStore.vaultMode,
    );
    setGistStatus(initialStatus);
  });

  createEffect(() => {
    if (accountStore.isLoaded && settingsStore.isLoaded) {
      if (accountStore.pinConfig.enabled) {
        if (
          settingsStore.requireMasterPasswordOnRestart &&
          !accountStore.hasUnlockedInSession
        ) {
          setViewMode("masterPassword");
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

  const handleConnectGithubToken = async (rawToken: string) => {
    const trimmed = rawToken.trim();
    if (!trimmed) {
      setError(t("login_error_empty_pat"));
      return;
    }
    setGlobalLoading(true);
    setError("");
    const setupRes = await setupGithub(trimmed);
    if (setupRes.isErr()) {
      setGlobalLoading(false);
      setError(t(setupRes.error));
      return;
    }
    const status = await checkVaultStatusForMode(settingsStore.vaultMode);
    setGistStatus(status);
    setGlobalLoading(false);
  };

  const handleSaveToken = async (token: string) => {
    await handleConnectGithubToken(token);
  };

  const handleGithubOauth = async () => {
    setGlobalLoading(true);
    setError("");

    const handleOauthError = (errVal: TranslationKey) => {
      setError(t(errVal));
      setGlobalLoading(false);
    };

    const sendResult = await sendBackgroundMessage(startGithubOauthRoute, {
      content: OAUTH_CLIENT_ID,
    });
    if (sendResult.isErr()) {
      handleOauthError(sendResult.error);
      return;
    }
    if (!sendResult.value.success) {
      handleOauthError(sendResult.value.error || "messaging_error_send_failed");
      return;
    }

    await handleConnectGithubToken(sendResult.value.token);
  };

  const handleSelfHostedAuth = async (
    action: "login" | "register",
    serverUrl: string,
    username: string,
    password: string,
  ) => {
    if (!serverUrl || !username || !password) {
      setError("Vui lòng điền đầy đủ Server URL, Username và Password.");
      return;
    }

    setGlobalLoading(true);
    setError("");

    try {
      const cleanUrl = serverUrl.trim().endsWith("/")
        ? serverUrl.trim().slice(0, -1)
        : serverUrl.trim();

      const endpoint =
        action === "login"
          ? `${cleanUrl}/auth/login`
          : `${cleanUrl}/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setGlobalLoading(false);
        if (response.status === 409 || data.error === "user_already_exists") {
          setError(t("self_hosted_error_user_exists"));
        } else if (
          response.status === 401 ||
          data.error === "invalid_credentials"
        ) {
          setError(t("self_hosted_error_invalid_credentials"));
        } else {
          setError(t("self_hosted_error_network"));
        }
        return;
      }

      const accessToken = data.accessToken;
      if (!accessToken) {
        setGlobalLoading(false);
        setError(t("self_hosted_error_network"));
        return;
      }

      const currentAccRes = await getAccountSettings("self_hosted_server");
      const currentAcc = currentAccRes.isOk() ? currentAccRes.value : null;

      const updatedSyncConfig = {
        ...(currentAcc?.syncConfig || DEFAULT_SYNC_CONFIG),
        serverUrl: cleanUrl,
        username,
        syncTokenEncrypted: "",
        syncTokenIv: "",
      };

      await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, accessToken);
      await updateAccountSettings(
        { syncConfig: updatedSyncConfig },
        "self_hosted_server",
      );

      setAccountStore("syncConfig", updatedSyncConfig);
      setAccountStore("syncToken", accessToken);
      setAccountStore("vaultConfigured", true);

      const status = await checkVaultStatusForMode("self_hosted_server");
      setGistStatus(status);
      setGlobalLoading(false);
    } catch {
      setGlobalLoading(false);
      setError(t("self_hosted_error_network"));
    }
  };

  const handleSaveSelfHostedServerUrl = async (serverUrl: string) => {
    const cleanUrl = serverUrl.trim().endsWith("/")
      ? serverUrl.trim().slice(0, -1)
      : serverUrl.trim();

    const currentAccRes = await getAccountSettings("self_hosted_server");
    const currentAcc = currentAccRes.isOk() ? currentAccRes.value : null;

    const updatedSyncConfig = {
      ...(currentAcc?.syncConfig || DEFAULT_SYNC_CONFIG),
      serverUrl: cleanUrl,
    };

    await updateAccountSettings(
      { syncConfig: updatedSyncConfig },
      "self_hosted_server",
    );

    setAccountStore("syncConfig", updatedSyncConfig);
  };

  const handleSwitchVaultMode = async (mode: VaultMode) => {
    setSettingsStore("vaultMode", mode);
    await updateExtensionSettings({ vaultMode: mode });
    await removeSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
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
    await handleForgotMasterPassword(settingsStore.vaultMode, {
      onOpenResetLocalModal: () => setShowResetLocalModal(true),
    });
  };

  const handleConfirmResetLocalVault = async () => {
    setShowResetLocalModal(false);
    await resetAccountSettings("local_storage");
    setAccountStore(
      "masterPasswordConfig",
      DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
    );
    setGistStatus("new");
  };

  return (
    <div class="app-body justify-center h-full">
      {/* Floating Language Switcher */}
      <div class="login-lang-selector">
        <button
          type="button"
          class={`lang-toggle-btn ${
            settingsStore.language === "en" ? "active" : ""
          }`}
          onClick={() => updateLanguage("en")}
        >
          EN
        </button>
        <span class="lang-divider">|</span>
        <button
          type="button"
          class={`lang-toggle-btn ${
            settingsStore.language === "vi" ? "active" : ""
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
            when={
              settingsStore.vaultMode === "local_storage" ||
              accountStore.vaultConfigured
            }
            fallback={t("login_title_setup")}
          >
            {t("login_title_locked")}
          </Show>
        </p>
      </div>

      {/* Provider Selector Dropdown */}
      <div class="form-group mb-16">
        <Select
          id="provider-select"
          class="w-100"
          value={settingsStore.vaultMode}
          onChange={(e) => {
            const parsedMode = VaultModeSchema.safeParse(e.currentTarget.value);
            if (parsedMode.success) {
              handleSwitchVaultMode(parsedMode.data);
            }
          }}
          options={[
            {
              value: "github_gist",
              label: t("login_provider_github_gist"),
              icon: <GithubIcon size={16} />,
            },
            {
              value: "local_storage",
              label: t("login_provider_local"),
              icon: <VaultIcon size={16} />,
            },
            {
              value: "self_hosted_server",
              label: t("login_provider_self_hosted"),
              icon: <GlobeIcon size={16} />,
            },
          ]}
        />
      </div>

      {/* Local Vault Must Read Warning Banner */}
      <Show when={settingsStore.vaultMode === "local_storage"}>
        <div class="local-vault-must-read-banner mb-16">
          <div class="must-read-text">
            <ShieldAlertIcon size={16} class="must-read-icon" />
            <span>{t("login_local_vault_must_read")}</span>
          </div>
          <div class="must-read-link-group">
            <span class="must-read-label">
              {t("login_local_vault_must_read_btn")}
            </span>
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
        when={
          settingsStore.vaultMode === "local_storage" ||
          accountStore.vaultConfigured
        }
        fallback={
          <Switch>
            <Match when={settingsStore.vaultMode === "self_hosted_server"}>
              <SelfHostedSetupForm
                initialServerUrl={accountStore.syncConfig.serverUrl}
                onSaveServerUrl={handleSaveSelfHostedServerUrl}
                onLogin={(url, user, pass) =>
                  handleSelfHostedAuth("login", url, user, pass)
                }
                onRegister={(url, user, pass) =>
                  handleSelfHostedAuth("register", url, user, pass)
                }
              />
            </Match>
            <Match when={settingsStore.vaultMode === "github_gist"}>
              <GithubSetupForm
                onSaveToken={handleSaveToken}
                onGithubOauth={handleGithubOauth}
              />
            </Match>
          </Switch>
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
                <MasterPasswordCreate onCreate={handleCreateMasterPassword} />
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
