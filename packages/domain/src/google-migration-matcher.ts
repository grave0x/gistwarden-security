import type { GoogleOtpAccount } from "./google-migration-parser.ts";
import { isLoginItem } from "./vault-types.ts";
import type { LoginVaultItem, VaultItem, VaultItemId } from "./vault-schemas.ts";

export type GoogleMigrationAction = "link" | "create" | "skip";

export interface GoogleMigrationAccountMapping {
  account: GoogleOtpAccount;
  action: GoogleMigrationAction;
  targetItemId: VaultItemId | null;
}


export function findMatchingVaultItem(
  account: GoogleOtpAccount,
  vaultItems: VaultItem[],
): VaultItem | null {
  const loginItems = vaultItems.filter(
    (item): item is LoginVaultItem =>
      isLoginItem(item) && !item.login?.totp?.trim(),
  );

  const issuerLower = account.issuer.trim().toLowerCase();
  const nameLower = account.name.trim().toLowerCase();

  if (issuerLower.length > 0) {
    const matchByIssuer = loginItems.find((item) => {
      const itemName = item.name.trim().toLowerCase();
      const username = item.login?.username?.trim().toLowerCase() ?? "";
      return itemName.includes(issuerLower) || username.includes(issuerLower);
    });
    if (matchByIssuer) return matchByIssuer;
  }

  if (nameLower.length > 0) {
    const matchByName = loginItems.find((item) => {
      const itemName = item.name.trim().toLowerCase();
      const username = item.login?.username?.trim().toLowerCase() ?? "";
      return (
        itemName === nameLower ||
        username === nameLower ||
        (nameLower.includes("@") && username.includes(nameLower))
      );
    });
    if (matchByName) return matchByName;
  }

  return null;
}

export function matchGoogleMigrationAccounts(
  accounts: GoogleOtpAccount[],
  vaultItems: VaultItem[],
): GoogleMigrationAccountMapping[] {
  const usedTargetItemIds = new Set<string>();

  return accounts.map((account) => {
    const availableVaultItems = vaultItems.filter(
      (item) => !usedTargetItemIds.has(item.id),
    );
    const matched = findMatchingVaultItem(account, availableVaultItems);
    if (matched) {
      usedTargetItemIds.add(matched.id);
      return {
        account,
        action: "skip",
        targetItemId: matched.id,
      };
    }
    return {
      account,
      action: "skip",
      targetItemId: null,
    };
  });
}
