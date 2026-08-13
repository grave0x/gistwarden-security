import {
  asGistId,
  asGitHubAccessToken,
  SESSION_KEY_PENDING_SYNC_TOKEN,
} from "@gistwarden/domain";
import {
  getSyncProvider,
  launchGithubOauthFlow,
  type SyncStatusResult,
  validateToken,
} from "@gistwarden/network";
import {
  type AccountSettings,
  type DeleteGistMsg,
  type DownloadFromGistMsg,
  type DownloadGistResponse,
  getAccountSettings,
  getExtensionSettings,
  getSyncToken,
  type StartGithubOauthMsg,
  type StartGithubOauthResponse,
  type SyncActionResponse,
  setSessionItem,
  type UploadToGistMsg,
  updateAccountSettings,
  type ValidateTokenMsg,
  type ValidateTokenResponse,
  type VaultMode,
} from "@gistwarden/repository";
import { checkVaultConfiguredUseCase } from "./vault-auth-usecases.ts";

export async function uploadVaultUseCase(
  payload: UploadToGistMsg,
): Promise<SyncActionResponse> {
  const vaultMode = payload.mode;
  const provider = getSyncProvider(vaultMode);

  if (!(await checkVaultConfiguredUseCase(vaultMode))) {
    return { success: false, error: "provider_error_missing_token" };
  }

  const token = await getSyncToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const syncConfig = settingsRes.isOk()
    ? settingsRes.value.syncConfig
    : undefined;
  const res = await provider.upload(payload.content || "", {
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
    gistId: syncConfig?.gistId,
    username: syncConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && syncConfig && gistId !== syncConfig.gistId) {
      await updateAccountSettings(
        {
          syncConfig: { ...syncConfig, gistId },
          lastSync: Date.now(),
        },
        vaultMode,
      );
    } else {
      await updateAccountSettings({ lastSync: Date.now() }, vaultMode);
    }
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function deleteVaultUseCase(
  payload: DeleteGistMsg,
): Promise<SyncActionResponse> {
  const extRes = await getExtensionSettings();
  const vaultMode = extRes.isOk() ? extRes.value.vaultMode : "github_gist";
  const provider = getSyncProvider(vaultMode);

  const token = await getSyncToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const syncConfig = settingsRes.isOk()
    ? settingsRes.value.syncConfig
    : undefined;
  const gistId = payload.content ? asGistId(payload.content) : undefined;
  const res = await provider.delete(gistId, {
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
  });
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function downloadVaultUseCase(
  payload: DownloadFromGistMsg,
): Promise<DownloadGistResponse> {
  const vaultMode = payload.mode;
  const provider = getSyncProvider(vaultMode);

  const token = await getSyncToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const settings = settingsRes.isOk() ? settingsRes.value : null;
  const syncConfig = settings?.syncConfig;

  const res = await provider.download({
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
    gistId: syncConfig?.gistId,
    username: syncConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && syncConfig && gistId !== syncConfig.gistId) {
      await updateAccountSettings(
        {
          syncConfig: { ...syncConfig, gistId },
          lastSync: Date.now(),
        },
        vaultMode,
      );
    } else if (settings) {
      await updateAccountSettings({ lastSync: Date.now() }, vaultMode);
    }
    return { success: true, content: res.value.content || "" };
  }
  return { success: false, error: res.error };
}

export async function validateTokenUseCase(
  payload: ValidateTokenMsg,
): Promise<ValidateTokenResponse> {
  if (!payload.token) {
    return { success: false, error: "login_error_invalid_token" };
  }
  const res = await validateToken(payload.token);
  if (res.isOk()) {
    return {
      success: true,
      username: res.value.username,
      avatarUrl: res.value.avatarUrl,
    };
  }
  return { success: false, error: res.error };
}

export async function startGithubOauthUseCase(
  payload: StartGithubOauthMsg,
): Promise<StartGithubOauthResponse> {
  const clientId = payload.content || "";
  const oauthRes = await launchGithubOauthFlow(clientId);
  if (oauthRes.isOk()) {
    await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, oauthRes.value);
    return { success: true, token: oauthRes.value };
  }
  return { success: false, error: oauthRes.error };
}

export async function checkVaultStatusUseCase(
  mode: VaultMode,
  acc: AccountSettings | null,
  syncToken?: string,
): Promise<SyncStatusResult> {
  const provider = getSyncProvider(mode);
  const retrievedToken = await getSyncToken(mode);
  const activeToken =
    retrievedToken || (syncToken ? asGitHubAccessToken(syncToken) : undefined);

  const activeSyncConfig = acc?.syncConfig;
  return await provider.checkVaultStatus({
    token: activeToken,
    serverUrl: activeSyncConfig?.serverUrl || undefined,
    gistId: activeSyncConfig?.gistId || undefined,
    hasStoredSalt: Boolean(acc?.masterPasswordConfig.salt),
  });
}
