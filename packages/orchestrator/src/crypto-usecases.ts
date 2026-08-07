import {
  base64ToArrayBuffer,
  decryptData,
  deriveKey,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
  type TranslationKey,
} from "@gistwarden/domain";
import { getAccountSettings, getSessionItem } from "@gistwarden/repository";
import { err, ok, Result } from "neverthrow";
import { vaultSecurityContext } from "./vault-security-state.ts";

export {
  LockedVaultState,
  SessionExpiredVaultState,
  UnlockedVaultState,
  VaultSecurityContext,
  vaultSecurityContext,
} from "./vault-security-state.ts";

export async function clearDerivedKey(): Promise<void> {
  await vaultSecurityContext.lock();
}

export async function setDerivedKey(key: CryptoKey | null): Promise<void> {
  if (key) {
    await vaultSecurityContext.setUnlockedKey(key);
  } else {
    await vaultSecurityContext.lock();
  }
}

export async function getOrDeriveKey(
  password: string,
  saltBase64: string,
): Promise<Result<CryptoKey, TranslationKey>> {
  const saltBufferRes = base64ToArrayBuffer(saltBase64);
  if (saltBufferRes.isErr()) return err(saltBufferRes.error);
  const salt = new Uint8Array(saltBufferRes.value);

  const deriveRes = await deriveKey(password, salt);
  if (deriveRes.isErr()) {
    return err(deriveRes.error);
  }
  const key = deriveRes.value;
  await vaultSecurityContext.setUnlockedKey(key);

  return ok(key);
}

export async function getSessionKey(): Promise<CryptoKey | null> {
  return await vaultSecurityContext.getKey();
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  const ivRes = await getSessionItem(SESSION_KEY_VERIFICATION_IV);
  const ciphertextRes = await getSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
  );
  const ivB64 = ivRes.isOk() ? ivRes.value : null;
  const ciphertextB64 = ciphertextRes.isOk() ? ciphertextRes.value : null;
  const settingsRes = await getAccountSettings();
  if (settingsRes.isErr()) {
    return false;
  }
  const saltBase64 = settingsRes.value.masterPasswordConfig.salt;
  if (
    typeof ivB64 !== "string" ||
    typeof ciphertextB64 !== "string" ||
    !saltBase64
  ) {
    return false;
  }

  const saltBufferRes = base64ToArrayBuffer(saltBase64);
  if (saltBufferRes.isErr()) return false;
  const salt = new Uint8Array(saltBufferRes.value);
  const deriveRes = await deriveKey(password, salt);
  if (deriveRes.isErr()) return false;
  const key = deriveRes.value;

  const decryptedRes = await decryptData(ciphertextB64, ivB64, key);
  if (decryptedRes.isErr()) return false;

  return decryptedRes.value === "verification_token";
}
