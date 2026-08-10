import { type Result } from "neverthrow";
import {
  asGistId,
  asGitHubAccessToken,
  type GistId,
  type GitHubAccessToken,
  type TranslationKey,
} from "@gistwarden/domain";
import {
  deleteGist,
  downloadFromGist,
  uploadToGist,
  validateToken,
} from "./github-api.ts";
import type {
  ISyncProvider,
  SyncOptions,
  SyncProviderId,
  SyncResult,
  SyncValidationResult,
} from "./sync-provider-types.ts";

export class GithubGistProvider implements ISyncProvider {
  readonly id: SyncProviderId = "github_gist";
  readonly name = "GitHub Gist";

  async upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await uploadToGist(content, options);
  }

  async download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await downloadFromGist(options);
  }

  async delete(
    targetId?: GistId,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    return await deleteGist(targetId || asGistId(""), options?.token);
  }

  async validateConfig(
    configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    return await validateToken(configToken || asGitHubAccessToken(""));
  }

  async isConfigured(options?: SyncOptions): Promise<boolean> {
    return Promise.resolve(
      !!options?.token ||
        Boolean(options?.hasStoredEncryptedToken) ||
        !!options?.gistId,
    );
  }
}
