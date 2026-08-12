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
  PinUnlockConfigSchema,
  updateAccountSettings,
  updateExtensionSettings,
  type VaultMode,
  VaultModeSchema,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";

export const SetPinUnlockOptionsSchema = z
  .object({
    pin: z.string(),
    requireRestart: z.boolean(),
    vaultMode: VaultModeSchema,
    key: z.custom<CryptoKey>((val) => Boolean(val)),
  })
  .readonly();
export type SetPinUnlockOptions = z.infer<typeof SetPinUnlockOptionsSchema>;

export const SetPinUnlockResultSchema = z
  .object({
    pinConfig: PinUnlockConfigSchema,
  })
  .readonly();
export type SetPinUnlockResult = z.infer<typeof SetPinUnlockResultSchema>;

export async function setPinUnlockUseCase(
  options: SetPinUnlockOptions,
): Promise<Result<SetPinUnlockResult, TranslationKey>> {
  const mode = options.vaultMode;
  const raw = await crypto.subtle.exportKey("raw", options.key);
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

  const pinConfig = {
    enabled: true,
    value: ciphertext,
    iv,
    salt: pinSaltBase64,
    failedAttempts: 0,
    failedMac,
  };

  await updateAccountSettings({ pinConfig }, mode);
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: options.requireRestart,
  });

  return ok({ pinConfig });
}

export async function disablePinUnlockUseCase(
  vaultMode: VaultMode,
): Promise<Result<void, TranslationKey>> {
  await updateAccountSettings({ pinConfig: DEFAULT_PIN_CONFIG }, vaultMode);
  await updateExtensionSettings({
    requireMasterPasswordOnRestart: true,
  });
  return ok();
}
