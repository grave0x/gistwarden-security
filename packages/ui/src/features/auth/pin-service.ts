import { setAccountStore, setSettingsStore } from "@/core/store.ts";
import { DEFAULT_PIN_CONFIG } from "@gistwarden/repository";
import {
  disablePinUnlockUseCase,
  setPinUnlockUseCase,
} from "@gistwarden/orchestrator";
import { unlockVaultWithPin } from "@/features/auth/auth-service.ts";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export async function setPinUnlock(
  pin: string,
  requireRestart: boolean,
): Promise<Result<void, TranslationKey>> {
  const res = await setPinUnlockUseCase({ pin, requireRestart });
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
  await disablePinUnlockUseCase();

  setAccountStore("pinConfig", DEFAULT_PIN_CONFIG);
  setSettingsStore("requireMasterPasswordOnRestart", true);
}
