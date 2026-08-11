import {
  disablePinUnlockUseCase,
  getSessionKey,
  setPinUnlockUseCase,
} from "@gistwarden/orchestrator";
import { DEFAULT_PIN_CONFIG } from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import {
  setAccountStore,
  setSettingsStore,
  settingsStore,
} from "@/core/store.ts";
import { unlockVaultWithPin } from "@/features/auth/auth-service.ts";

export async function setPinUnlock(
  pin: string,
  requireRestart: boolean,
): Promise<Result<void, TranslationKey>> {
  const key = await getSessionKey();
  if (!key) {
    return err("login_title_locked");
  }

  const res = await setPinUnlockUseCase({
    pin,
    requireRestart,
    vaultMode: settingsStore.vaultMode,
    key,
  });
  if (res.isErr()) {
    return err(res.error);
  }

  setAccountStore("pinConfig", res.value.pinConfig);
  setSettingsStore("requireMasterPasswordOnRestart", requireRestart);

  return ok();
}

export async function unlockWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  return await unlockVaultWithPin(pin);
}

export async function disablePinUnlock(): Promise<void> {
  await disablePinUnlockUseCase(settingsStore.vaultMode);

  setAccountStore("pinConfig", DEFAULT_PIN_CONFIG);
  setSettingsStore("requireMasterPasswordOnRestart", true);
}
