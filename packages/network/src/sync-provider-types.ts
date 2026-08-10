import { z } from "zod";
import type { Result } from "neverthrow";
import { GistIdSchema, GitHubAccessTokenSchema, type GistId, type GitHubAccessToken, type TranslationKey } from "@gistwarden/domain";

export type SyncProviderId = "github_gist" | "local_storage";

export const SyncValidationResultSchema = z.object({
  username: z.string(),
  avatarUrl: z.string(),
}).readonly();
export type SyncValidationResult = z.infer<typeof SyncValidationResultSchema>;

export const SyncOptionsSchema = z.object({
  token: GitHubAccessTokenSchema.optional(),
  gistId: GistIdSchema.optional(),
  username: z.string().optional(),
  hasStoredEncryptedToken: z.boolean().optional(),
}).readonly();
export type SyncOptions = z.infer<typeof SyncOptionsSchema>;

export const SyncResultSchema = z.object({
  content: z.string().optional(),
  gistId: GistIdSchema.optional(),
}).readonly();
export type SyncResult = z.infer<typeof SyncResultSchema>;

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
  isConfigured(options?: SyncOptions): Promise<boolean>;
}
