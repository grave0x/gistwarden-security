import {
  ALARM_NAME_VAULT_TIMEOUT,
  asGistId,
  base64ToArrayBuffer,
  computeHmac,
  decryptData,
  encryptData,
  type Folder,
  generateSalt,
  logger,
  MSG_USER_ACTIVITY,
  MSG_VAULT_LOGGED_OUT,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_PENDING_GITHUB_TOKEN,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  SESSION_KEYS_ON_LOCK,
  sessionManager,
  type TranslationKey,
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import { getSyncProvider } from "@gistwarden/network";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  getAccountSettings,
  getActiveVaultMode,
  getGithubToken,
  getSessionItem,
  GistPayloadSchema,
  type GithubConfig,
  type MasterPasswordSecurityConfig,
  removeSessionItem,
  resetAccountSettings,
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
import { downloadFromGistRoute, uploadToGistRoute } from "./messaging-contracts.ts";

export interface CreateNewVaultOptions {
  password: string;
  githubToken?: string;
  githubConfig?: GithubConfig;
  masterPasswordConfig?: MasterPasswordSecurityConfig;
  vaultMode: VaultMode;
}

export interface CreateNewVaultResult {
  key: CryptoKey;
  saltBase64: string;
  updatedGithubConfig?: GithubConfig;
  updatedMpConfig: MasterPasswordSecurityConfig;
  encryptedVaultPayload: string;
}

export async function createNewVaultUseCase(
  options: CreateNewVaultOptions,
): Promise<Result<CreateNewVaultResult, TranslationKey>> {
  await updateExtensionSettings({ vaultMode: options.vaultMode });
  const mode = options.vaultMode;
  const tokenToEncrypt = options.githubToken ||
    (await getGithubToken(mode)) || "";
  await clearDerivedKey();

  const rawSalt = generateSalt();
  const saltBase64 = rawSalt.toBase64();
  const updatedMpConfig: MasterPasswordSecurityConfig = {
    ...(options.masterPasswordConfig || DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG),
    salt: saltBase64,
  };
  await updateAccountSettings(
    { masterPasswordConfig: updatedMpConfig },
    mode,
  );

  const keyRes = await getOrDeriveKey(options.password, saltBase64);
  if (keyRes.isErr()) {
    await clearDerivedKey();
    return err(keyRes.error);
  }
  const key = keyRes.value;

  let updatedGithubConfig: GithubConfig | undefined;
  if (tokenToEncrypt && options.githubConfig) {
    const encryptRes = await encryptData(tokenToEncrypt, key);
    if (encryptRes.isErr()) {
      await clearDerivedKey();
      return err(encryptRes.error);
    }
    const { iv, ciphertext } = encryptRes.value;
    updatedGithubConfig = {
      ...options.githubConfig,
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
    };
    await updateAccountSettings(
      { githubConfig: updatedGithubConfig },
      mode,
    );
    await removeSessionItem(SESSION_KEY_PENDING_GITHUB_TOKEN);
  }

  const initialPayloadObject = { items: [], trash: [] };
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

  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payloadToUpload);

  await setDerivedKey(key);
  const verificationStr = "verification_token";
  const encryptVerifyRes = await encryptData(verificationStr, key);
  if (encryptVerifyRes.isErr()) {
    await clearDerivedKey();
    return err(encryptVerifyRes.error);
  }
  await setSessionItem(
    SESSION_KEY_VERIFICATION_IV,
    encryptVerifyRes.value.iv,
  );
  await setSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
    encryptVerifyRes.value.ciphertext,
  );
  await setSessionUnlocked(true);
  notifyBackground({ type: MSG_USER_ACTIVITY });

  return ok({
    key,
    saltBase64,
    updatedGithubConfig,
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
