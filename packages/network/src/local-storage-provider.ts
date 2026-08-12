import {
  type GistId,
  type GitHubAccessToken,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import {
  GistPayloadSchema,
  getLocalVaultPayload,
  removeLocalVaultPayload,
  setLocalVaultPayload,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import type {
  ISyncProvider,
  SyncOptions,
  SyncProviderId,
  SyncResult,
  SyncStatusResult,
  SyncValidationResult,
} from "./sync-provider-types.ts";

/**
 * Provider quản lý lưu trữ Vault hoàn toàn cục bộ trong Local Storage.
 */
export class LocalStorageProvider implements ISyncProvider {
  readonly id: SyncProviderId = "local_storage";
  readonly name = "Local Vault";

  /**
   * Lưu chuỗi Vault mã hóa vào Local Storage.
   */
  async upload(
    content: string,
    _options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    const res = await setLocalVaultPayload(content);
    if (res.isErr()) {
      return err(res.error);
    }
    return ok({ content });
  }

  /**
   * Đọc chuỗi Vault mã hóa từ Local Storage.
   */
  async download(
    _options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    const res = await getLocalVaultPayload();
    if (res.isErr()) {
      return err(res.error);
    }
    if (!res.value) {
      return err("vault_error_not_found");
    }
    return ok({ content: res.value });
  }

  /**
   * Xóa payload mã hóa Local Vault khỏi Local Storage.
   */
  async delete(
    _targetId?: GistId,
    _options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    return await removeLocalVaultPayload();
  }

  /**
   * Giả lập xác thực cấu hình cho Local Vault (luôn thành công nội bộ).
   */
  async validateConfig(
    _configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    return ok({
      username: "Local Vault",
      avatarUrl: "",
    });
  }

  /**
   * Kiểm tra Local Vault đã được cài đặt cấu hình/salt hay chưa.
   */
  async isConfigured(_options?: SyncOptions): Promise<boolean> {
    return Promise.resolve(
      _options?.hasStoredSalt !== undefined ? _options.hasStoredSalt : true,
    );
  }

  /**
   * Kiểm tra đa hình trạng thái của Local Vault:
   * - Có payload hợp lệ trong local storage -> "exists" (khôi phục salt)
   * - Thiếu payload -> tự dọn dẹp account_settings rác và trả về "new"
   */
  async checkVaultStatus(_options?: SyncOptions): Promise<SyncStatusResult> {
    const downloadRes = await this.download();
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
      return { status: "exists" };
    }

    return { status: "new" };
  }
}
