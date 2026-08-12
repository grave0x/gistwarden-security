import {
  asGistId,
  asGitHubAccessToken,
  DEFAULT_GITHUB_API_BASE,
  encryptData,
  GistIdSchema,
  SESSION_KEY_PENDING_SYNC_TOKEN,
  type TranslationKey,
} from "@gistwarden/domain";
import { downloadFromGist, validateToken } from "@gistwarden/network";
import {
  getAccountSettings,
  removeSessionItem,
  type SyncConfig,
  SyncConfigSchema,
  setSessionItem,
  updateAccountSettings,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { getSessionKey } from "./crypto-usecases.ts";

export const SetupGithubOptionsSchema = z
  .object({
    token: z.string(),
    serverUrl: z.string().optional(),
    currentGistId: GistIdSchema.optional(),
  })
  .readonly();
export type SetupGithubOptions = z.infer<typeof SetupGithubOptionsSchema>;

export const SetupSyncProviderResultSchema = z
  .object({
    syncConfig: SyncConfigSchema,
    token: z.string(),
  })
  .readonly();
export type SetupSyncProviderResult = z.infer<
  typeof SetupSyncProviderResultSchema
>;

export async function setupGithubUseCase(
  options: SetupGithubOptions,
): Promise<Result<SetupSyncProviderResult, TranslationKey>> {
  const parsedToken = asGitHubAccessToken(options.token);
  const validateRes = await validateToken(parsedToken);
  if (validateRes.isErr()) {
    return err(validateRes.error);
  }

  const { username, avatarUrl } = validateRes.value;

  const accRes = await getAccountSettings("github_gist");
  const currentAcc = accRes.isOk() ? accRes.value : null;

  let gistId =
    options.currentGistId || currentAcc?.syncConfig.gistId || asGistId("");
  if (!gistId) {
    const downloadRes = await downloadFromGist({ token: parsedToken });
    if (downloadRes.isOk() && downloadRes.value.gistId) {
      gistId = downloadRes.value.gistId;
    }
  }

  const key = await getSessionKey();

  if (key) {
    const encryptRes = await encryptData(options.token, key);
    if (encryptRes.isErr()) {
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    const updatedSyncConfig: SyncConfig = {
      serverUrl: options.serverUrl || DEFAULT_GITHUB_API_BASE,
      gistId,
      syncTokenEncrypted: ciphertext,
      syncTokenIv: iv,
      username,
      avatarUrl,
    };
    await updateAccountSettings(
      { syncConfig: updatedSyncConfig },
      "github_gist",
    );
    await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
    return ok({ syncConfig: updatedSyncConfig, token: options.token });
  }

  const newSyncConfig: SyncConfig = {
    serverUrl: options.serverUrl || DEFAULT_GITHUB_API_BASE,
    gistId,
    syncTokenEncrypted: "",
    syncTokenIv: "",
    username,
    avatarUrl,
  };
  await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, options.token);
  await updateAccountSettings({ syncConfig: newSyncConfig }, "github_gist");

  return ok({ syncConfig: newSyncConfig, token: options.token });
}
