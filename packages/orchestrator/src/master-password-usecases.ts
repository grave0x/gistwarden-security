import {
  deriveKey,
  encryptData,
  generateSalt,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  type TranslationKey,
  type VaultItem,
} from "@gistwarden/domain";
import {
  DEFAULT_PIN_CONFIG,
  getGithubToken,
  type GithubConfig,
  type MasterPasswordSecurityConfig,
  setSessionItem,
  updateAccountSettings,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { setDerivedKey, verifyMasterPassword } from "./crypto-usecases.ts";
import { syncVaultToGist } from "./vault-sync-usecase.ts";

export interface ChangeMasterPasswordOptions {
  currentPass: string;
  newPass: string;
  vaultItems: VaultItem[];
  currentGithubConfig: GithubConfig;
  currentMpConfig: MasterPasswordSecurityConfig;
}

export interface ChangeMasterPasswordResult {
  newKey: CryptoKey;
  updatedGithubConfig: GithubConfig;
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

  const githubToken = await getGithubToken();
  const updatedMpConfig: MasterPasswordSecurityConfig = {
    ...options.currentMpConfig,
    salt: newSaltBase64,
  };

  let updatedGithubConfig = options.currentGithubConfig;
  if (githubToken) {
    const encryptTokenResult = await encryptData(githubToken, newKey);
    if (encryptTokenResult.isErr()) {
      return err(encryptTokenResult.error);
    }
    const { iv, ciphertext } = encryptTokenResult.value;
    updatedGithubConfig = {
      ...options.currentGithubConfig,
      githubTokenEncrypted: ciphertext,
      githubTokenIv: iv,
    };
  }

  await updateAccountSettings({
    githubConfig: updatedGithubConfig,
    masterPasswordConfig: updatedMpConfig,
    pinConfig: DEFAULT_PIN_CONFIG,
  });

  return ok({
    newKey,
    updatedGithubConfig,
    updatedMpConfig,
  });
}
