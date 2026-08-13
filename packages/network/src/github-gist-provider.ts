import {
  asGistId,
  type GistId,
  type GitHubAccessToken,
  isRecord,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import { err, type Result } from "neverthrow";
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

  /**
   * Kiểm tra đa hình trạng thái của Cloud Vault (Gist):
   * 1. Chưa có Token -> "exists" (hiển thị form nhập Token / OAuth)
   * 2. Đã có Token: Gọi download() kiểm tra Gist thực tế từ xa
   * 3. Gist tồn tại -> Trả về "exists", salt, gistId
   * 4. Gist KHÔNG tồn tại trên GitHub (provider_error_not_found) -> Tự dọn dẹp account_settings rác và trả về "new"
   * 5. Lỗi mạng / offline mà đã có salt địa phương -> Trả về "exists" để dùng offline
   */
  async checkVaultStatus(options?: SyncOptions): Promise<SyncStatusResult> {
    if (!options?.token) {
      if (options?.hasStoredSalt) {
        return { status: "exists" };
      }
      return { status: "new" };
    }

    const downloadRes = await this.download(options);

    if (downloadRes.isOk() && downloadRes.value.content) {
      const content = downloadRes.value.content;
      const foundGistId = downloadRes.value.gistId;
      const payloadJsonRes = safeJsonParse(content);
      if (payloadJsonRes.isOk() && isRecord(payloadJsonRes.value)) {
        const salt =
          typeof payloadJsonRes.value.salt === "string"
            ? payloadJsonRes.value.salt
            : undefined;
        if (salt) {
          return {
            status: "exists",
            salt,
            gistId: foundGistId,
          };
        }
      }
      return { status: "exists", gistId: foundGistId };
    }

    if (
      downloadRes.isErr() &&
      downloadRes.error === "provider_error_not_found"
    ) {
      return { status: "new" };
    }

    if (options?.hasStoredSalt) {
      return { status: "exists" };
    }

    return { status: "new" };
  }
}
