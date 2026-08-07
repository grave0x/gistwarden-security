import type { Result } from "neverthrow";
import type { GistId, GitHubAccessToken, TranslationKey } from "@gistwarden/domain";

export type SyncProviderId = "github_gist";

export interface SyncValidationResult {
  username: string;
  avatarUrl: string;
}

export interface SyncOptions {
  token?: GitHubAccessToken;
  gistId?: GistId;
  username?: string;
}

export interface SyncResult {
  content?: string;
  gistId?: GistId;
}

export interface ISyncProvider {
  readonly id: SyncProviderId;
  readonly name: string;

  upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;
  download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;
  delete(
    targetId?: GistId,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>>;
  validateConfig(
    configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>>;
}
