import {
  type GistId,
  GistIdSchema,
  type GitHubAccessToken,
  GitHubAccessTokenSchema,
  type TranslationKey,
} from "@gistwarden/domain";
import type { Result } from "neverthrow";
import { z } from "zod";

export type SyncProviderId = "github_gist" | "local_storage";

export const SyncValidationResultSchema = z
  .object({
    username: z.string(),
    avatarUrl: z.string(),
  })
  .readonly();
export type SyncValidationResult = z.infer<typeof SyncValidationResultSchema>;

export const SyncOptionsSchema = z
  .object({
    token: GitHubAccessTokenSchema.optional(),
    gistId: GistIdSchema.optional(),
    serverUrl: z.string().optional(),
    username: z.string().optional(),
    hasStoredEncryptedToken: z.boolean().optional(),
    hasStoredSalt: z.boolean().optional(),
  })
  .readonly();
export type SyncOptions = z.infer<typeof SyncOptionsSchema>;

export const SyncResultSchema = z
  .object({
    content: z.string().optional(),
    gistId: GistIdSchema.optional(),
  })
  .readonly();
export type SyncResult = z.infer<typeof SyncResultSchema>;

export const SyncStatusResultSchema = z
  .object({
    status: z.enum(["exists", "new"]),
    salt: z.string().optional(),
    gistId: GistIdSchema.optional(),
  })
  .readonly();
export type SyncStatusResult = z.infer<typeof SyncStatusResultSchema>;

/**
 * Interface chuẩn cho các Provider lưu trữ và đồng bộ dữ liệu Vault (Đa hình).
 */
export interface ISyncProvider {
  readonly id: SyncProviderId;
  readonly name: string;

  /**
   * Tải dữ liệu Vault đã mã hóa lên nơi lưu trữ (Gist hoặc Local Storage).
   */
  upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>>;

  /**
   * Tải dữ liệu Vault đã mã hóa từ nơi lưu trữ về.
   */
  download(options?: SyncOptions): Promise<Result<SyncResult, TranslationKey>>;

  /**
   * Xóa Vault khỏi nơi lưu trữ.
   */
  delete(
    targetId?: GistId,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>>;

  /**
   * Xác thực tính hợp lệ của cấu hình hoặc Token kết nối.
   */
  validateConfig(
    configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>>;

  /**
   * Kiểm tra xem Provider đã có đủ thông tin cấu hình ban đầu chưa.
   */
  isConfigured(options?: SyncOptions): Promise<boolean>;

  /**
   * Xử lý đa hình kiểm tra trạng thái Vault ("exists": Đã có Vault để Unlock / "new": Cần tạo Vault mới).
   */
  checkVaultStatus(options?: SyncOptions): Promise<SyncStatusResult>;
}
