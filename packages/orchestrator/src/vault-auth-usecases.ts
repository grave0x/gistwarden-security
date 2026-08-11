import {
  ALARM_NAME_VAULT_TIMEOUT,
  encryptData,
  generateSalt,
  MSG_USER_ACTIVITY,
  MSG_VAULT_LOGGED_OUT,
  SESSION_KEY_PENDING_SYNC_TOKEN,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  SESSION_KEYS_ON_LOCK,
  sessionManager,
  type TranslationKey,
} from "@gistwarden/domain";
import { getSyncProvider } from "@gistwarden/network";
import {
  type AccountSettings,
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  getAccountSettings,
  getSyncToken,
  type MasterPasswordSecurityConfig,
  removeSessionItem,
  resetAccountSettings,
  type SyncConfig,
  setSessionItem,
  setSessionUnlocked,
  updateAccountSettings,
  updateExtensionSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { clearAlarm } from "./alarms.ts";
import {
  clearDerivedKey,
  getOrDeriveKey,
  setDerivedKey,
} from "./crypto-usecases.ts";
import {
  broadcastMessage,
  notifyBackground,
  sendBackgroundMessage,
} from "./messaging.ts";
import { uploadToGistRoute } from "./messaging-contracts.ts";

export interface CreateNewVaultOptions {
  password: string;
  syncToken?: string;
  syncConfig?: SyncConfig;
  masterPasswordConfig?: MasterPasswordSecurityConfig;
  vaultMode: VaultMode;
}

export interface CreateNewVaultResult {
  key: CryptoKey;
  saltBase64: string;
  updatedSyncConfig?: SyncConfig;
  updatedMpConfig: MasterPasswordSecurityConfig;
  encryptedVaultPayload: string;
}

export async function createNewVaultUseCase(
  options: CreateNewVaultOptions,
): Promise<Result<CreateNewVaultResult, TranslationKey>> {
  await updateExtensionSettings({ vaultMode: options.vaultMode });
  const mode = options.vaultMode;
  const tokenToEncrypt = options.syncToken || (await getSyncToken(mode)) || "";
  await clearDerivedKey();

  const rawSalt = generateSalt();
  const saltBase64 = rawSalt.toBase64();
  const updatedMpConfig: MasterPasswordSecurityConfig = {
    ...(options.masterPasswordConfig ||
      DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG),
    salt: saltBase64,
  };
  await updateAccountSettings({ masterPasswordConfig: updatedMpConfig }, mode);

  const keyRes = await getOrDeriveKey(options.password, saltBase64);
  if (keyRes.isErr()) {
    await clearDerivedKey();
    return err(keyRes.error);
  }
  const key = keyRes.value;

  const activeSyncConfig = options.syncConfig;
  let updatedSyncConfig: SyncConfig | undefined;
  if (tokenToEncrypt && activeSyncConfig) {
    const encryptRes = await encryptData(tokenToEncrypt, key);
    if (encryptRes.isErr()) {
      await clearDerivedKey();
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    updatedSyncConfig = {
      ...activeSyncConfig,
      syncTokenEncrypted: ciphertext,
      syncTokenIv: iv,
    };
    await updateAccountSettings({ syncConfig: updatedSyncConfig }, mode);
    await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
  }

  const initialPayloadObject = { folders: [], items: [], trash: [] };
  const encryptVaultRes = await encryptData(
    JSON.stringify(initialPayloadObject),
    key,
  );
  if (encryptVaultRes.isErr()) {
    await clearDerivedKey();
    return err(encryptVaultRes.error);
  }

  const { iv: vaultIv, ciphertext: vaultCiphertext } = encryptVaultRes.value;
  const payloadToUpload = JSON.stringify({
    ciphertext: vaultCiphertext,
    iv: vaultIv,
    salt: saltBase64,
  });

  const sendResult = await sendBackgroundMessage(uploadToGistRoute, {
    content: payloadToUpload,
    mode,
  });

  if (sendResult.isErr()) {
    await clearDerivedKey();
    return err(sendResult.error);
  }

  if (!sendResult.value.success) {
    await clearDerivedKey();
    return err(sendResult.value.error || "messaging_error_send_failed");
  }

  await setDerivedKey(key);
  const verificationStr = "verification_token";
  const encryptVerifyRes = await encryptData(verificationStr, key);
  if (encryptVerifyRes.isErr()) {
    await clearDerivedKey();
    return err(encryptVerifyRes.error);
  }
  await setSessionItem(SESSION_KEY_VERIFICATION_IV, encryptVerifyRes.value.iv);
  await setSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
    encryptVerifyRes.value.ciphertext,
  );
  await setSessionUnlocked(true);
  notifyBackground({ type: MSG_USER_ACTIVITY });

  return ok({
    key,
    saltBase64,
    updatedSyncConfig,
    updatedMpConfig,
    encryptedVaultPayload: payloadToUpload,
  });
}

export async function lockSessionUseCase(): Promise<void> {
  await clearDerivedKey();
  sessionManager.clearKey();
  await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);
}

export async function logoutSessionUseCase(mode: VaultMode): Promise<void> {
  await clearDerivedKey();
  sessionManager.clearKey();
  await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
  await resetAccountSettings(mode);
  await clearAlarm(ALARM_NAME_VAULT_TIMEOUT);
  await broadcastMessage({ type: MSG_VAULT_LOGGED_OUT });
}

export async function checkVaultConfiguredUseCase(
  mode: VaultMode,
  accountSettings?: AccountSettings | null,
): Promise<boolean> {
  const acc =
    accountSettings ||
    (await getAccountSettings(mode)).match(
      (val) => val,
      () => null,
    );

  if (!acc) {
    return false;
  }

  const syncConfig = acc.syncConfig;
  const provider = getSyncProvider(mode);
  const decryptedToken = await getSyncToken(mode);
  return await provider.isConfigured({
    gistId: syncConfig.gistId || undefined,
    token: decryptedToken || undefined,
    hasStoredEncryptedToken: Boolean(
      syncConfig.syncTokenEncrypted || syncConfig.username,
    ),
    hasStoredSalt: Boolean(acc.masterPasswordConfig.salt),
  });
}
