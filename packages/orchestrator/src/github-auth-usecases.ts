import {
  asGistId,
  asGitHubAccessToken,
  encryptData,
  type GistId,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
  type TranslationKey,
} from "@gistwarden/domain";
import { validateToken } from "@gistwarden/network";
import {
  type GithubConfig,
  removeSessionItem,
  resetAccountSettings,
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
  const validateRes = await validateToken(
    asGitHubAccessToken(options.token),
  );
  if (validateRes.isErr()) {
    return err(validateRes.error);
  }

  const { username, avatarUrl } = validateRes.value;
  const key = await getSessionKey();

  if (key) {
    const encryptRes = await encryptData(options.token, key);
    if (encryptRes.isErr()) {
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    const updatedGithubConfig: GithubConfig = {
      gistId: options.currentGistId || asGistId(""),
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

  await resetAccountSettings("github_gist");

  const newGithubConfig: GithubConfig = {
    gistId: options.currentGistId || asGistId(""),
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
