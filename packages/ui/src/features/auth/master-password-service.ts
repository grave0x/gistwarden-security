import { changeMasterPasswordUseCase } from "@gistwarden/orchestrator";
import { DEFAULT_PIN_CONFIG } from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { accountStore, setAccountStore, settingsStore } from "@/core/store.ts";

export async function changeMasterPassword(
  currentPass: string,
  newPass: string,
): Promise<Result<void, TranslationKey>> {
  const res = await changeMasterPasswordUseCase({
    currentPass,
    newPass,
    payload: {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    currentSyncConfig: accountStore.syncConfig,
    currentMpConfig: accountStore.masterPasswordConfig,
    vaultMode: settingsStore.vaultMode,
  });

  if (res.isErr()) {
    return err(res.error);
  }

  const { updatedSyncConfig, updatedMpConfig } = res.value;

  setAccountStore({
    syncConfig: updatedSyncConfig,
    masterPasswordConfig: updatedMpConfig,
    pinConfig: DEFAULT_PIN_CONFIG,
  });

  return ok();
}
