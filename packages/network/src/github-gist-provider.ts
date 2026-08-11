import {
  asGistId,
  asGitHubAccessToken,
  type GistId,
  type GitHubAccessToken,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import { GistPayloadSchema } from "@gistwarden/repository";
import type { Result } from "neverthrow";
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
  SyncStatusResult,
  SyncValidationResult,
} from "./sync-provider-types.ts";

/**
 * Provider quản lý lưu trữ và đồng bộ dữ liệu Vault qua GitHub Gist.
 */
export class GithubGistProvider implements ISyncProvider {
  readonly id: SyncProviderId = "github_gist";
  readonly name = "GitHub Gist";

  /**
   * Tải nội dung Vault mã hóa lên Gist trên GitHub.
   */
  async upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await uploadToGist(content, options);
  }

  /**
   * Tải nội dung Vault mã hóa từ Gist trên GitHub về.
   */
  async download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    return await downloadFromGist(options);
  }

  /**
   * Xóa Gist mã hóa khỏi tài khoản GitHub.
   */
  async delete(
    targetId?: GistId,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    return await deleteGist(targetId || asGistId(""), options?.token);
  }

  /**
   * Xác thực GitHub Access Token bằng cách kiểm tra tài khoản người dùng qua API GitHub.
   */
  async validateConfig(
    configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    return await validateToken(configToken || asGitHubAccessToken(""));
  }

  /**
   * Kiểm tra xem đã có Token, Gist ID hoặc thông tin cấu hình GitHub được lưu trữ chưa.
   */
  async isConfigured(options?: SyncOptions): Promise<boolean> {
    return Promise.resolve(
      !!options?.token ||
        Boolean(options?.hasStoredEncryptedToken) ||
        Boolean(options?.hasStoredSalt) ||
        !!options?.gistId,
    );
  }

  /**
   * Kiểm tra đa hình trạng thái của Cloud Vault (Gist):
   * - Đã có salt địa phương -> "exists" (nhập Master Password)
   * - Chưa có token -> "exists" (hiển thị form kết nối GitHub)
   * - Có token: Tải Gist từ xa để kiểm tra tồn tại và lấy salt/gistId mới nhất
   * - Gist không tồn tại từ xa (`github_error_gist_not_found`) -> "new" (cần khởi tạo Gist mới)
   */
  async checkVaultStatus(options?: SyncOptions): Promise<SyncStatusResult> {
    if (options?.hasStoredSalt) {
      if (options.gistId && options.token) {
        const downloadRes = await this.download(options);
        if (downloadRes.isOk() && downloadRes.value.content) {
          const payloadJsonRes = safeJsonParse(downloadRes.value.content);
          if (payloadJsonRes.isOk()) {
            const parsed = GistPayloadSchema.safeParse(payloadJsonRes.value);
            if (parsed.success && parsed.data.salt) {
              return {
                status: "exists",
                salt: parsed.data.salt,
              };
            }
          }
        }
      }
      return { status: "exists" };
    }

    if (!options?.token) {
      return { status: "exists" };
    }

    const downloadRes = await this.download(options);

    if (downloadRes.isOk() && downloadRes.value.content) {
      const content = downloadRes.value.content;
      const foundGistId = downloadRes.value.gistId;
      const payloadJsonRes = safeJsonParse(content);
      if (payloadJsonRes.isOk()) {
        const parsed = GistPayloadSchema.safeParse(payloadJsonRes.value);
        if (parsed.success && parsed.data.salt) {
          return {
            status: "exists",
            salt: parsed.data.salt,
            gistId: foundGistId,
          };
        }
      }
    }

    if (
      downloadRes.isErr() &&
      downloadRes.error === "github_error_gist_not_found"
    ) {
      return { status: "new" };
    }

    return { status: "exists" };
  }
}
