import { err, ok, type Result } from "neverthrow";
import type {
  GistId,
  GitHubAccessToken,
  TranslationKey,
} from "@gistwarden/domain";
import {
  getLocalVaultPayload,
  removeLocalVaultPayload,
  setLocalVaultPayload,
} from "@gistwarden/repository";
import type {
  ISyncProvider,
  SyncOptions,
  SyncProviderId,
  SyncResult,
  SyncValidationResult,
} from "./sync-provider-types.ts";

export class LocalStorageProvider implements ISyncProvider {
  readonly id: SyncProviderId = "local_storage";
  readonly name = "Local Vault";

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

  async delete(
    _targetId?: GistId,
    _options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    return await removeLocalVaultPayload();
  }

  async validateConfig(
    _configToken?: GitHubAccessToken,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    return ok({
      username: "Local Vault",
      avatarUrl: "",
    });
  }

  async isConfigured(_options?: SyncOptions): Promise<boolean> {
    return Promise.resolve(true);
  }
}
