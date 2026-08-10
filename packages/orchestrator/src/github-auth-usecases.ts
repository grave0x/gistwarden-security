import {
  asGistId,
  asGitHubAccessToken,
  encryptData,
  type GistId,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
  type TranslationKey,
} from "@gistwarden/domain";
import { downloadFromGist, validateToken } from "@gistwarden/network";
import {
  getAccountSettings,
  type GithubConfig,
  removeSessionItem,
  setSessionItem,
  updateAccountSettings,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { getSessionKey } from "./crypto-usecases.ts";

export interface SetupGithubOptions {
  token: string;
  currentGistId?: GistId;
}

export interface SetupGithubResult {
  githubConfig: GithubConfig;
  token: string;
}

export async function setupGithubUseCase(
  options: SetupGithubOptions,
): Promise<Result<SetupGithubResult, TranslationKey>> {
  const parsedToken = asGitHubAccessToken(options.token);
  const validateRes = await validateToken(parsedToken);
  if (validateRes.isErr()) {
    return err(validateRes.error);
  }

  const { username, avatarUrl } = validateRes.value;

  const accRes = await getAccountSettings("github_gist");
  const currentAcc = accRes.isOk() ? accRes.value : null;

  let gistId = options.currentGistId || currentAcc?.githubConfig.gistId || asGistId("");
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
    const updatedGithubConfig: GithubConfig = {
      gistId,
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
      username,
      avatarUrl,
    };
    await updateAccountSettings(
      { githubConfig: updatedGithubConfig },
      "github_gist",
    );
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
    return ok({ githubConfig: updatedGithubConfig, token: options.token });
  }

  const newGithubConfig: GithubConfig = {
    gistId,
    githubTokenEncrypted: "",
    githubTokenIv: "",
    username,
    avatarUrl,
  };
  await setSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN, options.token);
  await updateAccountSettings(
    { githubConfig: newGithubConfig },
    "github_gist",
  );

  return ok({ githubConfig: newGithubConfig, token: options.token });
}
