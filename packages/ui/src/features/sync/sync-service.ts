import { getSessionKey, syncVaultToGist } from "@gistwarden/orchestrator";
import { err, ok, type Result } from "neverthrow";
import { reconcile } from "solid-js/store";
import { STORE_KEY_VAULT_ITEMS } from "@/core/constants.ts";
import type { TranslationKey } from "@/core/i18n.ts";
import { accountStore, setAccountStore, settingsStore } from "@/core/store.ts";

import { handleGlobalApiError } from "@/core/ui-service.ts";

export async function syncVault(): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key || !accountStore.masterPasswordConfig.salt) {
    return err("login_title_locked");
  }

  const uploadRes = await syncVaultToGist(
    accountStore.vaultItems,
    key,
    accountStore.masterPasswordConfig.salt,
    {
      vaultMode: settingsStore.vaultMode,
      trashItems: accountStore.trashItems || [],
    },
  );

  if (uploadRes.isErr()) {
    handleGlobalApiError(uploadRes.error);
    return err(uploadRes.error);
  }

  setAccountStore(STORE_KEY_VAULT_ITEMS, reconcile(uploadRes.value));
  return ok();
}
