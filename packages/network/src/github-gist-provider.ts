import {
  asGistId,
  type GistId,
  type GitHubAccessToken,
  type SyncOptions,
  type SyncProviderId,
  type SyncResult,
  type SyncValidationResult,
  type TranslationKey,
} from "@gistwarden/domain";
import { err, type Result } from "neverthrow";
import { BaseSyncProvider } from "./base-sync-provider.ts";
import {
  deleteGist,
  downloadFromGist,
  uploadToGist,
  validateToken,
} from "./github-api.ts";

/**
 * Provider quản lý lưu trữ và đồng bộ dữ liệu Vault qua GitHub Gist.
 * Kế thừa BaseSyncProvider (Template Method Pattern).
 */
export class GithubGistProvider extends BaseSyncProvider {
  readonly id: SyncProviderId = "github_gist";
  readonly name = "GitHub Gist";

  /**
   * Tải chuỗi mã hóa Vault lên GitHub Gist.
   */
  async upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await uploadToGist(content, options);
  }

  /**
   * Tải chuỗi mã hóa Vault từ GitHub Gist.
   */
  async download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await downloadFromGist(options);
  }

  /**
   * Xóa file Gist khỏi GitHub.
   */
  async delete(
    targetGistId?: GistId,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    return await deleteGist(targetGistId || asGistId(""), options?.token);
  }

  /**
   * Kiểm tra và xác thực Token GitHub API.
   */
  async validateConfig(
    configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    if (!configToken) {
      return err("provider_error_missing_token");
    }
    return await validateToken(configToken);
  }

  /**
   * Kiểm tra GitHub Gist đã được cấu hình đủ điều kiện hay chưa.
   */
  async isConfigured(options?: SyncOptions): Promise<boolean> {
    return Promise.resolve(
      Boolean(options?.hasStoredEncryptedToken || options?.token),
    );
  }
}
