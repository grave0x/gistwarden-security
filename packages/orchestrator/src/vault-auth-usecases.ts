import {
  ALARM_NAME_VAULT_TIMEOUT,
  arrayBufferToBase64,
  asGistId,
  asGitHubAccessToken,
  base64ToArrayBuffer,
  computeHmac,
  DEFAULT_GITHUB_API_BASE,
  decryptData,
  deriveKey,
  encryptData,
  GistIdSchema,
  generateSalt,
  MSG_USER_ACTIVITY,
  MSG_VAULT_LOGGED_OUT,
  SESSION_KEY_PENDING_SYNC_TOKEN,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  SESSION_KEYS_ON_LOCK,
  sessionManager,
  type TranslationKey,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import { downloadFromGist, validateToken } from "@gistwarden/network";
import {
  type AccountSettings,
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
  getAccountSettings,
  getSyncToken,
  type MasterPasswordSecurityConfig,
  MasterPasswordSecurityConfigSchema,
  PinUnlockConfigSchema,
  removeSessionItem,
  type SyncConfig,
  SyncConfigSchema,
  setSessionItem,
  setSessionUnlocked,
  updateAccountSettings,
  updateExtensionSettings,
  type VaultMode,
  VaultModeSchema,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";
import { clearAlarm } from "./alarms.ts";
import {
  clearDerivedKey,
  getOrDeriveKey,
  getSessionKey,
  setDerivedKey,
  verifyMasterPassword,
} from "./crypto-usecases.ts";
import {
  broadcastMessage,
  notifyBackground,
  sendBackgroundMessage,
} from "./messaging.ts";
import { uploadToGistRoute } from "./messaging-contracts.ts";
import { getSyncProvider } from "./sync-provider-registry.ts";
import { syncVaultToGist } from "./sync-usecases.ts";

// ----------------------------------------------------
// Create & Unlock Vault Use Cases
// ----------------------------------------------------

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

  await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
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

export async function logoutSessionUseCase(_mode: VaultMode): Promise<void> {
  await clearDerivedKey();
  sessionManager.clearKey();
  await removeSessionItem([...SESSION_KEYS_ON_LOCK]);
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
    serverUrl: syncConfig.serverUrl || undefined,
    username: syncConfig.username || undefined,
    hasStoredEncryptedToken: Boolean(
      syncConfig.syncTokenEncrypted || syncConfig.username,
    ),
    hasStoredSalt: Boolean(acc.masterPasswordConfig.salt),
  });
}

export async function onboardPendingTokenUseCase(
  key: CryptoKey,
  vaultMode: VaultMode,
  syncConfig: SyncConfig,
): Promise<SyncConfig | null> {
  const activeToken = await getSyncToken(vaultMode);
  if (
    activeToken &&
    (!syncConfig.syncTokenEncrypted || !syncConfig.syncTokenIv)
  ) {
    const encryptRes = await encryptData(activeToken, key);
    if (encryptRes.isOk()) {
      const updatedSyncConfig: SyncConfig = {
        ...syncConfig,
        syncTokenEncrypted: encryptRes.value.ciphertext,
        syncTokenIv: encryptRes.value.iv,
      };
      await updateAccountSettings({ syncConfig: updatedSyncConfig }, vaultMode);
      await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
      return updatedSyncConfig;
    }
  }
  return null;
}

// ----------------------------------------------------
// Master Password Use Cases
// ----------------------------------------------------

export const ChangeMasterPasswordOptionsSchema = z
  .object({
    currentPass: z.string(),
    newPass: z.string(),
    payload: VaultPayloadSchema,
    currentSyncConfig: SyncConfigSchema,
    currentMpConfig: MasterPasswordSecurityConfigSchema,
    vaultMode: VaultModeSchema,
  })
  .readonly();
export type ChangeMasterPasswordOptions = z.infer<
  typeof ChangeMasterPasswordOptionsSchema
>;

export const ChangeMasterPasswordResultSchema = z
  .object({
    newKey: z.custom<CryptoKey>((val) => Boolean(val)),
    updatedSyncConfig: SyncConfigSchema,
    updatedMpConfig: MasterPasswordSecurityConfigSchema,
  })
  .readonly();
export type ChangeMasterPasswordResult = z.infer<
  typeof ChangeMasterPasswordResultSchema
>;

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
    options.payload.items,
    newKey,
    newSaltBase64,
    {
      vaultMode: options.vaultMode,
      folders: options.payload.folders,
      trashItems: options.payload.trash,
      skipRemoteMerge: true,
    },
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
  let syncToken: string | null = await getSyncToken(mode);

  if (
    !syncToken &&
    options.currentSyncConfig.syncTokenEncrypted &&
    options.currentSyncConfig.syncTokenIv
  ) {
    const oldSaltStr = options.currentMpConfig.salt;
    const oldSaltBufRes = base64ToArrayBuffer(oldSaltStr || "");
    const oldSaltRaw = oldSaltBufRes.isOk()
      ? new Uint8Array(oldSaltBufRes.value)
      : generateSalt();
    const oldKeyRes = await deriveKey(options.currentPass, oldSaltRaw);
    if (oldKeyRes.isOk()) {
      const decTokenRes = await decryptData(
        options.currentSyncConfig.syncTokenEncrypted,
        options.currentSyncConfig.syncTokenIv,
        oldKeyRes.value,
      );
      if (decTokenRes.isOk()) {
        syncToken = decTokenRes.value;
      }
    }
  }

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
  await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);

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

// ----------------------------------------------------
// PIN Unlock Use Cases
// ----------------------------------------------------

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

// ----------------------------------------------------
// GitHub Auth Use Cases
// ----------------------------------------------------

export const SetupGithubOptionsSchema = z
  .object({
    token: z.string(),
    serverUrl: z.string().optional(),
    currentGistId: GistIdSchema.optional(),
  })
  .readonly();
export type SetupGithubOptions = z.infer<typeof SetupGithubOptionsSchema>;

export const SetupSyncProviderResultSchema = z
  .object({
    syncConfig: SyncConfigSchema,
    token: z.string(),
  })
  .readonly();
export type SetupSyncProviderResult = z.infer<
  typeof SetupSyncProviderResultSchema
>;

export async function setupGithubUseCase(
  options: SetupGithubOptions,
): Promise<Result<SetupSyncProviderResult, TranslationKey>> {
  const parsedToken = asGitHubAccessToken(options.token);
  const validateRes = await validateToken(parsedToken);
  if (validateRes.isErr()) {
    return err(validateRes.error);
  }

  const { username, avatarUrl } = validateRes.value;

  const accRes = await getAccountSettings("github_gist");
  const currentAcc = accRes.isOk() ? accRes.value : null;

  let gistId =
    options.currentGistId || currentAcc?.syncConfig.gistId || asGistId("");
  if (!gistId) {
    const downloadRes = await downloadFromGist({ token: parsedToken });
    if (downloadRes.isOk() && downloadRes.value.gistId) {
      gistId = downloadRes.value.gistId;
    }
  }

  const key = await getSessionKey();

  if (key) {
    const encryptRes = await encryptData(options.token, key);
    if (encryptRes.isErr()) {
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    const updatedSyncConfig: SyncConfig = {
      serverUrl: options.serverUrl || DEFAULT_GITHUB_API_BASE,
      gistId,
      syncTokenEncrypted: ciphertext,
      syncTokenIv: iv,
      username,
      avatarUrl,
    };
    await updateAccountSettings(
      { syncConfig: updatedSyncConfig },
      "github_gist",
    );
    await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
    return ok({ syncConfig: updatedSyncConfig, token: options.token });
  }

  const newSyncConfig: SyncConfig = {
    serverUrl: options.serverUrl || DEFAULT_GITHUB_API_BASE,
    gistId,
    syncTokenEncrypted: "",
    syncTokenIv: "",
    username,
    avatarUrl,
  };
  await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, options.token);
  await updateAccountSettings({ syncConfig: newSyncConfig }, "github_gist");

  return ok({ syncConfig: newSyncConfig, token: options.token });
}
