import {
  arrayBufferToBase64,
  computeHmac,
  deriveKey,
  encryptData,
  generateSalt,
  type TranslationKey,
} from "@gistwarden/domain";
import {
  DEFAULT_PIN_CONFIG,
  type PinUnlockConfig,
  updateAccountSettings,
  updateExtensionSettings,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { getSessionKey } from "./crypto-usecases.ts";

export interface SetPinUnlockOptions {
  pin: string;
  requireRestart: boolean;
}

export interface SetPinUnlockResult {
  pinConfig: PinUnlockConfig;
}

export async function setPinUnlockUseCase(
  options: SetPinUnlockOptions,
): Promise<Result<SetPinUnlockResult, TranslationKey>> {
  const key = await getSessionKey();
  if (!key) {
    return err("login_title_locked");
  }

  const raw = await crypto.subtle.exportKey("raw", key);
  const keyBytesB64 = arrayBufferToBase64(raw);

  const rawSalt = generateSalt();
  const pinSaltBase64 = rawSalt.toBase64();
  const pinKeyRes = await deriveKey(options.pin, rawSalt);
  if (pinKeyRes.isErr()) {
    return err(pinKeyRes.error);
  }
  const pinKey = pinKeyRes.value;
  const encryptRes = await encryptData(keyBytesB64, pinKey);
  if (encryptRes.isErr()) {
    return err(encryptRes.error);
  }
  const { iv, ciphertext } = encryptRes.value;

  const macRes = await computeHmac("0", pinSaltBase64);
  const failedMac = macRes.isOk() ? macRes.value : "";

  const pinConfig: PinUnlockConfig = {
    enabled: true,
    value: ciphertext,
    iv,
    salt: pinSaltBase64,
    failedAttempts: 0,
    failedMac,
  };

  await updateAccountSettings({ pinConfig });
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: options.requireRestart,
  });

  return ok({ pinConfig });
}

export async function disablePinUnlockUseCase(): Promise<
  Result<void, TranslationKey>
> {
  await updateAccountSettings({ pinConfig: DEFAULT_PIN_CONFIG });
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: true,
  });
  return ok();
}
