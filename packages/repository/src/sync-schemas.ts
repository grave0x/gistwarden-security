import {
  GitHubAccessTokenSchema,
  ImportArraySchema,
  ImportCardItemSchema,
  type ImportFolder,
  ImportFolderSchema,
  ImportIdentityItemSchema,
  type ImportItem,
  ImportItemSchema,
  ImportLoginItemSchema,
  ImportObjectSchema,
  ImportSecureNoteItemSchema,
  ImportSshKeyItemSchema,
  MSG_DELETE_GIST,
  MSG_DOWNLOAD_FROM_GIST,
  MSG_START_SYNC_OAUTH,
  MSG_UPLOAD_TO_GIST,
  MSG_VALIDATE_TOKEN,
  type TranslationKey,
} from "@gistwarden/domain";
import { z } from "zod";
import { VaultModeSchema } from "./storage-schemas.ts";

export {
  ImportArraySchema,
  ImportCardItemSchema,
  type ImportFolder,
  ImportFolderSchema,
  ImportIdentityItemSchema,
  type ImportItem,
  ImportItemSchema,
  ImportLoginItemSchema,
  ImportObjectSchema,
  ImportSecureNoteItemSchema,
  ImportSshKeyItemSchema,
};

export const GistPayloadSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  salt: z.string().optional(),
});
export type GistPayload = z.infer<typeof GistPayloadSchema>;

export const EncryptedPayloadSchema = GistPayloadSchema.partial();
export type EncryptedPayload = z.infer<typeof EncryptedPayloadSchema>;

export const GistContentPayloadSchema = EncryptedPayloadSchema.extend({
  rawContent: z.string(),
}).readonly();
export type GistContentPayload = z.infer<typeof GistContentPayloadSchema>;

// --- Sync Extension Message & Response Schemas ---
export const SimpleSuccessResponseSchema = z
  .object({
    success: z.literal(true),
  })
  .readonly();
export type SimpleSuccessResponse = z.infer<typeof SimpleSuccessResponseSchema>;

export const SyncActionResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type SyncActionResponse = z.infer<typeof SyncActionResponseSchema>;

export const DownloadGistResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    content: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type DownloadGistResponse = z.infer<typeof DownloadGistResponseSchema>;

export const ValidateTokenResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    username: z.string(),
    avatarUrl: z.string(),
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type ValidateTokenResponse = z.infer<typeof ValidateTokenResponseSchema>;

export const StartGithubOauthResponseSchema = z.discriminatedUnion("success", [
  z.object({
    success: z.literal(true),
    token: GitHubAccessTokenSchema,
  }),
  z.object({
    success: z.literal(false),
    error: z.custom<TranslationKey>().optional(),
  }),
]);
export type StartGithubOauthResponse = z.infer<
  typeof StartGithubOauthResponseSchema
>;

export const UploadToGistMsgSchema = z
  .object({
    type: z.literal(MSG_UPLOAD_TO_GIST),
    mode: VaultModeSchema,
    content: z.string().optional(),
  })
  .readonly();
export type UploadToGistMsg = z.infer<typeof UploadToGistMsgSchema>;

export const DeleteGistMsgSchema = z
  .object({
    type: z.literal(MSG_DELETE_GIST),
    content: z.string().optional(),
  })
  .readonly();
export type DeleteGistMsg = z.infer<typeof DeleteGistMsgSchema>;

export const DownloadFromGistMsgSchema = z
  .object({
    type: z.literal(MSG_DOWNLOAD_FROM_GIST),
    mode: VaultModeSchema,
  })
  .readonly();
export type DownloadFromGistMsg = z.infer<typeof DownloadFromGistMsgSchema>;

export const ValidateTokenMsgSchema = z
  .object({
    type: z.literal(MSG_VALIDATE_TOKEN),
    token: GitHubAccessTokenSchema.optional(),
  })
  .readonly();
export type ValidateTokenMsg = z.infer<typeof ValidateTokenMsgSchema>;

export const StartGithubOauthMsgSchema = z
  .object({
    type: z.literal(MSG_START_SYNC_OAUTH),
    content: z.string().optional(),
  })
  .readonly();
export type StartGithubOauthMsg = z.infer<typeof StartGithubOauthMsgSchema>;
