import { z } from "zod";
import {
  type GoogleOtpAccount,
  GoogleOtpAccountSchema,
} from "./google-migration-parser.ts";
import {
  type LoginVaultItem,
  type VaultItem,
  VaultItemIdSchema,
} from "./vault-schemas.ts";
import { isLoginItem } from "./vault-types.ts";

export const GoogleMigrationActionSchema = z.enum(["link", "create", "skip"]);
export type GoogleMigrationAction = z.infer<typeof GoogleMigrationActionSchema>;

export const GoogleMigrationAccountMappingSchema = z.object({
  account: GoogleOtpAccountSchema,
  action: GoogleMigrationActionSchema,
  targetItemId: VaultItemIdSchema.nullable(),
});
export type GoogleMigrationAccountMapping = z.infer<
  typeof GoogleMigrationAccountMappingSchema
>;

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
