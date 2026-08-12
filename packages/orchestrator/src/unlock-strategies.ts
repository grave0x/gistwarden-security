import {
  asGitHubAccessToken,
  decryptData,
  safeJsonParse,
  type TranslationKey,
} from "@gistwarden/domain";
import { getSyncProvider } from "@gistwarden/network";
import {
  type AccountSettings,
  GistPayloadSchema,
  getSyncToken,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { getOrDeriveKey } from "./crypto-usecases.ts";

export interface UnlockVaultContext {
  password: string;
  accSettings: AccountSettings;
  secSalt: string;
  downloadVault?: () => Promise<Result<string | null, TranslationKey>>;
}

export interface UnlockVaultResult {
  content: string;
  salt: string;
  key: CryptoKey;
}

export interface UnlockVaultStrategy {
  readonly mode: VaultMode;
  execute(
    context: UnlockVaultContext,
  ): Promise<Result<UnlockVaultResult, TranslationKey>>;
}

export class LocalStorageUnlockStrategy implements UnlockVaultStrategy {
  readonly mode: VaultMode = "local_storage";

  async execute(
    context: UnlockVaultContext,
  ): Promise<Result<UnlockVaultResult, TranslationKey>> {
    const provider = getSyncProvider(this.mode);
    const downloadRes = await provider.download();
    if (downloadRes.isErr() || !downloadRes.value.content) {
      return err("vault_error_not_found");
    }

    const content = downloadRes.value.content;
    let salt = context.accSettings.masterPasswordConfig.salt;

    const payloadJsonRes = safeJsonParse(content);
    if (payloadJsonRes.isOk()) {
      const parsed = GistPayloadSchema.safeParse(payloadJsonRes.value);
      if (parsed.success && parsed.data.salt) {
        salt = parsed.data.salt;
      }
    }

    const activeSalt = salt || context.secSalt;
    if (!activeSalt) return err("vault_error_not_found");

    const keyRes = await getOrDeriveKey(context.password, activeSalt);
    if (keyRes.isErr() || !keyRes.value) return err("login_error_wrong_mp");

    return ok({ content, salt: activeSalt, key: keyRes.value });
  }
}

export class GithubGistUnlockStrategy implements UnlockVaultStrategy {
  readonly mode: VaultMode = "github_gist";

  async execute(
    context: UnlockVaultContext,
  ): Promise<Result<UnlockVaultResult, TranslationKey>> {
    let activeSalt =
      context.accSettings.masterPasswordConfig.salt || context.secSalt;
    if (!activeSalt) return err("vault_error_not_found");

    const keyRes = await getOrDeriveKey(context.password, activeSalt);
    if (keyRes.isErr() || !keyRes.value) return err("login_error_wrong_mp");
    let key = keyRes.value;

    let token: ReturnType<typeof asGitHubAccessToken> | undefined;
    if (
      context.accSettings.syncConfig.syncTokenEncrypted &&
      context.accSettings.syncConfig.syncTokenIv
    ) {
      const decTokenRes = await decryptData(
        context.accSettings.syncConfig.syncTokenEncrypted,
        context.accSettings.syncConfig.syncTokenIv,
        key,
      );
      if (decTokenRes.isErr()) return err("login_error_wrong_mp");
      token = asGitHubAccessToken(decTokenRes.value);
    } else {
      const fallbackToken = await getSyncToken("github_gist");
      if (fallbackToken) token = fallbackToken;
    }

    let content = "";
    if (context.downloadVault) {
      const dlRes = await context.downloadVault();
      if (dlRes.isOk() && dlRes.value) {
        content = dlRes.value;
      }
    }

    if (!content) {
      const provider = getSyncProvider(this.mode);
      const downloadRes = await provider.download({
        gistId: context.accSettings.syncConfig.gistId,
        token,
      });
      if (downloadRes.isErr() || !downloadRes.value.content) {
        return err(
          downloadRes.isErr() ? downloadRes.error : "vault_error_not_found",
        );
      }
      content = downloadRes.value.content;
    }

    const payloadJsonRes = safeJsonParse(content);
    if (payloadJsonRes.isOk()) {
      const parsed = GistPayloadSchema.safeParse(payloadJsonRes.value);
      if (
        parsed.success &&
        parsed.data.salt &&
        parsed.data.salt !== activeSalt
      ) {
        activeSalt = parsed.data.salt;
        const reDeriveRes = await getOrDeriveKey(context.password, activeSalt);
        if (reDeriveRes.isOk() && reDeriveRes.value) {
          key = reDeriveRes.value;
        }
      }
    }

    return ok({ content, salt: activeSalt, key });
  }
}

export class SelfHostedUnlockStrategy implements UnlockVaultStrategy {
  readonly mode: VaultMode = "self_hosted_server";

  async execute(
    context: UnlockVaultContext,
  ): Promise<Result<UnlockVaultResult, TranslationKey>> {
    let activeSalt =
      context.accSettings.masterPasswordConfig.salt || context.secSalt;
    if (!activeSalt) return err("vault_error_not_found");

    const keyRes = await getOrDeriveKey(context.password, activeSalt);
    if (keyRes.isErr() || !keyRes.value) return err("login_error_wrong_mp");
    let key = keyRes.value;

    let token = "";
    if (
      context.accSettings.syncConfig.syncTokenEncrypted &&
      context.accSettings.syncConfig.syncTokenIv
    ) {
      const decTokenRes = await decryptData(
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

    const provider = getSyncProvider(this.mode);
    const downloadRes = await provider.download({
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
        const reDeriveRes = await getOrDeriveKey(context.password, activeSalt);
        if (reDeriveRes.isOk() && reDeriveRes.value) {
          key = reDeriveRes.value;
        }
      }
    }

    return ok({ content, salt: activeSalt, key });
  }
}

const UNLOCK_STRATEGIES: Record<VaultMode, UnlockVaultStrategy> = {
  local_storage: new LocalStorageUnlockStrategy(),
  github_gist: new GithubGistUnlockStrategy(),
  self_hosted_server: new SelfHostedUnlockStrategy(),
};

export function getUnlockStrategy(mode: VaultMode): UnlockVaultStrategy {
  return UNLOCK_STRATEGIES[mode] ?? UNLOCK_STRATEGIES.local_storage;
}

export async function resolveVaultContentForUnlockUseCase(
  mode: VaultMode,
  context: UnlockVaultContext,
): Promise<Result<UnlockVaultResult, TranslationKey>> {
  const strategy = getUnlockStrategy(mode);
  return strategy.execute(context);
}
