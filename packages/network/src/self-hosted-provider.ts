import {
  asGitHubAccessToken,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import { GistPayloadSchema, getSyncToken } from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import type {
  ISyncProvider,
  SyncOptions,
  SyncProviderId,
  SyncResult,
  SyncStatusResult,
  SyncValidationResult,
  UnlockContext,
  UnlockVaultResult,
} from "./sync-provider-types.ts";

export class SelfHostedProvider implements ISyncProvider {
  readonly id: SyncProviderId = "self_hosted_server";
  readonly name = "Self-Hosted Server";

  private getBaseUrl(options?: SyncOptions): string {
    const url = options?.serverUrl?.trim();
    if (!url) return "";
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  private getToken(options?: SyncOptions): string {
    return options?.token || "";
  }

  async upload(
    content: string,
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    const baseUrl = this.getBaseUrl(options);
    const token = this.getToken(options);
    if (!baseUrl || !token) {
      return err("provider_error_missing_token");
    }

    try {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(content);
      } catch {
        return err("provider_error_network");
      }

      const response = await fetch(`${baseUrl}/vault`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) return err("provider_error_unauthorized");
        return err("provider_error_network");
      }

      return ok({ content });
    } catch {
      return err("provider_error_network");
    }
  }

  async download(
    options?: SyncOptions,
  ): Promise<Result<SyncResult, TranslationKey>> {
    const baseUrl = this.getBaseUrl(options);
    const token = this.getToken(options);
    if (!baseUrl || !token) {
      return err("provider_error_missing_token");
    }

    try {
      const response = await fetch(`${baseUrl}/vault`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        return err("provider_error_not_found");
      }

      if (!response.ok) {
        if (response.status === 401) return err("provider_error_unauthorized");
        return err("provider_error_network");
      }

      const data = await response.json();
      return ok({ content: JSON.stringify(data) });
    } catch {
      return err("provider_error_network");
    }
  }

  async delete(
    _targetId?: unknown,
    options?: SyncOptions,
  ): Promise<Result<void, TranslationKey>> {
    const baseUrl = this.getBaseUrl(options);
    const token = this.getToken(options);
    if (!baseUrl || !token) {
      return err("provider_error_missing_token");
    }

    try {
      const response = await fetch(`${baseUrl}/vault`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        if (response.status === 401) return err("provider_error_unauthorized");
        return err("provider_error_network");
      }

      return ok(undefined);
    } catch {
      return err("provider_error_network");
    }
  }

  async validateConfig(
    _configToken?: unknown,
    options?: SyncOptions,
  ): Promise<Result<SyncValidationResult, TranslationKey>> {
    const baseUrl = this.getBaseUrl(options);
    const token = this.getToken(options);
    if (!baseUrl || !token) {
      return err("provider_error_missing_token");
    }

    try {
      const response = await fetch(`${baseUrl}/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) return err("provider_error_unauthorized");
        return err("provider_error_network");
      }

      const rawJson: unknown = await response.json().catch(() => ({}));
      const userSchema = z.object({ username: z.string().optional() });
      const parsedUser = userSchema.safeParse(rawJson);
      const username =
        (parsedUser.success ? parsedUser.data.username : "") ||
        options?.username ||
        "Self-Hosted User";

      return ok({
        username,
        avatarUrl: "",
      });
    } catch {
      return err("provider_error_network");
    }
  }

  async isConfigured(options?: SyncOptions): Promise<boolean> {
    const baseUrl = this.getBaseUrl(options);
    const token = this.getToken(options);
    const hasStored = Boolean(
      options?.hasStoredEncryptedToken || options?.hasStoredSalt,
    );
    return Promise.resolve(Boolean(baseUrl && (token || hasStored)));
  }

  async checkVaultStatus(options?: SyncOptions): Promise<SyncStatusResult> {
    const baseUrl = this.getBaseUrl(options);
    if (!baseUrl) {
      return { status: "new" };
    }

    if (options?.hasStoredSalt) {
      return { status: "exists" };
    }

    const token = this.getToken(options);
    if (!token) {
      return { status: "new" };
    }

    try {
      const response = await fetch(`${baseUrl}/vault`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        return { status: "new" };
      }

      if (response.ok) {
        const rawJson: unknown = await response.json().catch(() => ({}));
        const vaultSchema = z.object({ salt: z.string().optional() });
        const parsedVault = vaultSchema.safeParse(rawJson);
        const saltValue = parsedVault.success
          ? parsedVault.data.salt
          : undefined;

        return {
          status: "exists",
          salt: saltValue,
        };
      }

      return { status: "exists" };
    } catch {
      return { status: "exists" };
    }
  }

  async resolveVaultContentForUnlock(
    context: UnlockContext,
  ): Promise<Result<UnlockVaultResult, TranslationKey>> {
    let activeSalt =
      context.accSettings.masterPasswordConfig.salt || context.secSalt;
    if (!activeSalt) return err("vault_error_not_found");

    // 1. Derive Key ban đầu từ activeSalt
    const keyRes = await context.getOrDeriveKey(context.password, activeSalt);
    if (keyRes.isErr() || !keyRes.value) return err("login_error_wrong_mp");
    let key = keyRes.value;

    // 2. Giải mã Access Token nếu có Token mã hóa
    let token = "";
    if (
      context.accSettings.syncConfig.syncTokenEncrypted &&
      context.accSettings.syncConfig.syncTokenIv
    ) {
      const decTokenRes = await context.decryptData(
        context.accSettings.syncConfig.syncTokenEncrypted,
        context.accSettings.syncConfig.syncTokenIv,
        key,
      );
      if (decTokenRes.isErr()) return err("login_error_wrong_mp");
      token = decTokenRes.value;
    } else {
      const fallbackToken = await getSyncToken("self_hosted_server");
      if (fallbackToken) token = fallbackToken;
    }

    // 3. Gọi API tải Vault từ Self-Hosted Server
    const downloadRes = await this.download({
      serverUrl: context.accSettings.syncConfig.serverUrl,
      token: asGitHubAccessToken(token),
    });
    if (downloadRes.isErr() || !downloadRes.value.content) {
      return err(
        downloadRes.isErr() ? downloadRes.error : "vault_error_not_found",
      );
    }

    const content = downloadRes.value.content;

    const payloadJsonRes = safeJsonParse(content);
    if (payloadJsonRes.isOk()) {
      const parsed = GistPayloadSchema.safeParse(payloadJsonRes.value);
      if (
        parsed.success &&
        parsed.data.salt &&
        parsed.data.salt !== activeSalt
      ) {
        activeSalt = parsed.data.salt;
        const reDeriveRes = await context.getOrDeriveKey(
          context.password,
          activeSalt,
        );
        if (reDeriveRes.isOk() && reDeriveRes.value) {
          key = reDeriveRes.value;
        }
      }
    }

    return ok({ content, salt: activeSalt, key });
  }
}
