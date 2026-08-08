import { VaultItemType } from "@gistwarden/domain";
import type { VaultItemStrategy } from "./vault-item-types.ts";
import { loginStrategy } from "./strategies/login-strategy.tsx";
import { cardStrategy } from "./strategies/card-strategy.tsx";
import { identityStrategy } from "./strategies/identity-strategy.tsx";
import { noteStrategy } from "./strategies/note-strategy.tsx";
import { sshKeyStrategy } from "./strategies/ssh-key-strategy.tsx";
import { t } from "@/core/i18n.ts";

export const vaultItemRegistry = {
  [VaultItemType.Login]: loginStrategy,
  [VaultItemType.Card]: cardStrategy,
  [VaultItemType.Identity]: identityStrategy,
  [VaultItemType.SecureNote]: noteStrategy,
  [VaultItemType.SshKey]: sshKeyStrategy,
} satisfies Record<VaultItemType, VaultItemStrategy>;

function isVaultItemKey(num: number): num is keyof typeof vaultItemRegistry {
  return num in vaultItemRegistry;
}

export function getVaultItemStrategy(
  type: VaultItemType | number | undefined,
): VaultItemStrategy {
  const numType = Number(type);
  if (isVaultItemKey(numType)) {
    return vaultItemRegistry[numType];
  }
  return loginStrategy;
}

export function getAllVaultItemStrategies(): VaultItemStrategy[] {
  return [
    loginStrategy,
    cardStrategy,
    identityStrategy,
    noteStrategy,
    sshKeyStrategy,
  ];
}

export function getVaultItemTypeLabel(
  type: VaultItemType | "all" | number | undefined,
): string {
  if (type === "all" || type === undefined) {
    return t("vault_filter_type");
  }
  const numType = Number(type);
  if (isVaultItemKey(numType)) {
    return vaultItemRegistry[numType].getTypeName();
  }
  return t("vault_filter_type");
}
