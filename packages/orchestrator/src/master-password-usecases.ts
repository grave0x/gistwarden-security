import {
  computeHmac,
  deriveKey,
  encryptData,
  generateSalt,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  type TranslationKey,
  type VaultItem,
} from "@gistwarden/domain";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
  getAccountSettings,
  getSyncToken,
  type MasterPasswordSecurityConfig,
  type SyncConfig,
  setSessionItem,
  updateAccountSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { setDerivedKey, verifyMasterPassword } from "./crypto-usecases.ts";
import { syncVaultToGist } from "./vault-sync-usecase.ts";

export interface ChangeMasterPasswordOptions {
  currentPass: string;
  newPass: string;
  vaultItems: VaultItem[];
  currentSyncConfig: SyncConfig;
  currentMpConfig: MasterPasswordSecurityConfig;
  vaultMode: VaultMode;
}

export interface ChangeMasterPasswordResult {
  newKey: CryptoKey;
  updatedSyncConfig: SyncConfig;
  updatedMpConfig: MasterPasswordSecurityConfig;
}

export async function changeMasterPasswordUseCase(
  options: ChangeMasterPasswordOptions,
): Promise<Result<ChangeMasterPasswordResult, TranslationKey>> {
  if (!options.newPass.trim()) {
    return err("settings_error_mp_empty_new");
  }

  const isCurrentPasswordCorrect = await verifyMasterPassword(
    options.currentPass,
    options.vaultMode,
  );
  if (!isCurrentPasswordCorrect) {
    return err("settings_error_mp_wrong_current");
  }

  const rawSalt = generateSalt();
  const newSaltBase64 = rawSalt.toBase64();

  const deriveResult = await deriveKey(options.newPass, rawSalt);
  if (deriveResult.isErr()) {
    return err(deriveResult.error);
  }
  const newKey = deriveResult.value;

  const uploadRes = await syncVaultToGist(
    options.vaultItems,
    newKey,
    newSaltBase64,
    { vaultMode: options.vaultMode },
  );
  if (uploadRes.isErr()) {
    return err(uploadRes.error);
  }

  await setDerivedKey(newKey);
  const verificationStr = "verification_token";
  const encryptVerifyResult = await encryptData(verificationStr, newKey);
  if (encryptVerifyResult.isErr()) {
    return err(encryptVerifyResult.error);
  }
  const { iv: vIv, ciphertext: vCiphertext } = encryptVerifyResult.value;

  await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
  await setSessionItem(SESSION_KEY_VERIFICATION_CIPHERTEXT, vCiphertext);

  const mode = options.vaultMode;
  const syncToken = await getSyncToken(mode);
  const updatedMpConfig: MasterPasswordSecurityConfig = {
    ...options.currentMpConfig,
    salt: newSaltBase64,
  };

  let updatedSyncConfig = options.currentSyncConfig;
  if (syncToken) {
    const encryptTokenResult = await encryptData(syncToken, newKey);
    if (encryptTokenResult.isErr()) {
      return err(encryptTokenResult.error);
    }
    const { iv, ciphertext } = encryptTokenResult.value;
    updatedSyncConfig = {
      ...options.currentSyncConfig,
      syncTokenEncrypted: ciphertext,
      syncTokenIv: iv,
    };
  }

  await updateAccountSettings(
    {
      syncConfig: updatedSyncConfig,
      masterPasswordConfig: updatedMpConfig,
      pinConfig: DEFAULT_PIN_CONFIG,
    },
    mode,
  );

  return ok({
    newKey,
    updatedSyncConfig,
    updatedMpConfig,
  });
}

export async function validateSecurityConfigUseCase(
  mode: VaultMode,
  secSalt: string,
): Promise<void> {
  const accRes = await getAccountSettings(mode);
  if (accRes.isErr()) return;
  const acc = accRes.value;

  let pinConfig = { ...acc.pinConfig };
  let masterPasswordConfig = { ...acc.masterPasswordConfig };
  let updated = false;

  if (pinConfig.failedAttempts > 0 || pinConfig.failedMac) {
    const macRes = await computeHmac(
      String(pinConfig.failedAttempts),
      pinConfig.salt || secSalt,
    );
    const expectedMac = macRes.isOk() ? macRes.value : "";
    if (
      !pinConfig.failedMac ||
      pinConfig.failedMac !== expectedMac ||
      pinConfig.failedAttempts >= 3
    ) {
      pinConfig = DEFAULT_PIN_CONFIG;
      updated = true;
    }
  }

  if (
    masterPasswordConfig.failedAttempts > 0 ||
    masterPasswordConfig.lockoutUntil > 0 ||
    masterPasswordConfig.failedMac
  ) {
    const macRes = await computeHmac(
      `${masterPasswordConfig.failedAttempts}:${masterPasswordConfig.lockoutUntil}`,
      secSalt,
    );
    const expectedMac = macRes.isOk() ? macRes.value : "";
    if (
      !masterPasswordConfig.failedMac ||
      masterPasswordConfig.failedMac !== expectedMac
    ) {
      masterPasswordConfig = DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG;
      updated = true;
    }
  }

  if (updated) {
    await updateAccountSettings({ pinConfig, masterPasswordConfig }, mode);
  }
}
