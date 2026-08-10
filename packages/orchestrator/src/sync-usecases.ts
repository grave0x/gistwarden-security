import {
  getSyncProvider,
  launchGithubOauthFlow,
  validateToken,
} from "@gistwarden/network";
import {
  type DeleteGistMsg,
  type DownloadFromGistMsg,
  type DownloadGistResponse,
  getAccountSettings,
  getExtensionSettings,
  getGithubToken,
  setSessionItem,
  type StartGithubOauthMsg,
  type StartGithubOauthResponse,
  type SyncActionResponse,
  updateAccountSettings,
  type UploadToGistMsg,
  type ValidateTokenMsg,
  type ValidateTokenResponse,
} from "@gistwarden/repository";
import { asGistId, SESSION_KEY_PENDING_GITHUB_TOKEN } from "@gistwarden/domain";

export async function uploadVaultUseCase(
  payload: UploadToGistMsg,
): Promise<SyncActionResponse> {
  const vaultMode = payload.mode;
  const provider = getSyncProvider(vaultMode);

  const token = await getGithubToken(vaultMode);
  if (!await provider.isConfigured({ token: token || undefined })) {
    return { success: false, error: "github_error_missing_token" };
  }

  const settingsRes = await getAccountSettings(vaultMode);
  const githubConfig = settingsRes.isOk() ? settingsRes.value.githubConfig : undefined;
  const res = await provider.upload(payload.content || "", {
    token: token || undefined,
    gistId: githubConfig?.gistId,
    username: githubConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && githubConfig && gistId !== githubConfig.gistId) {
      await updateAccountSettings(
        {
          githubConfig: { ...githubConfig, gistId },
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

  const token = await getGithubToken(vaultMode);
  const gistId = payload.content ? asGistId(payload.content) : undefined;
  const res = await provider.delete(gistId, {
    token: token || undefined,
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

  const token = await getGithubToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const settings = settingsRes.isOk() ? settingsRes.value : null;
  const githubConfig = settings?.githubConfig;

  const res = await provider.download({
    token: token || undefined,
    gistId: githubConfig?.gistId,
    username: githubConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && githubConfig && gistId !== githubConfig.gistId) {
      await updateAccountSettings(
        {
          githubConfig: { ...githubConfig, gistId },
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
    await setSessionItem(
      SESSION_KEY_PENDING_GITHUB_TOKEN,
      oauthRes.value,
    );
    return { success: true, token: oauthRes.value };
  }
  return { success: false, error: oauthRes.error };
}
