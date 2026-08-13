import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  MSG_USER_ACTIVITY,
  SESSION_KEY_DERIVED_KEY,
  sessionManager,
} from "@gistwarden/domain";
import {
  addPasswordHistoryItem,
  clearPasswordHistory,
  DEFAULT_EXCLUDED_DOMAINS,
  DEFAULT_PIN_CONFIG,
  type GeneratedPasswordHistoryItem,
  getActiveVaultMode,
  getPasswordHistory,
  getSessionItem,
  type PinUnlockConfig,
  removeSessionItem,
  resetAccountSettings,
  setSessionItem,
  updateAccountSettings,
  updateExtensionSettings,
  type VaultMode,
  type VaultTimeoutAction,
  type VaultTimeoutValue,
} from "@gistwarden/repository";

import { notifyBackground } from "./messaging.ts";

export {
  DEFAULT_EXCLUDED_DOMAINS,
  DEFAULT_PIN_CONFIG,
  type GeneratedPasswordHistoryItem,
  type PinUnlockConfig,
};

export async function persistSessionKey(key: CryptoKey | null): Promise<void> {
  sessionManager.setKey(key);
  if (key) {
    const raw = await crypto.subtle.exportKey("raw", key);
    const base64 = arrayBufferToBase64(raw);
    await setSessionItem(SESSION_KEY_DERIVED_KEY, base64);
  } else {
    await removeSessionItem(SESSION_KEY_DERIVED_KEY);
  }
}

export async function restoreSessionKeyFromStorage(): Promise<CryptoKey | null> {
  const currentKey = sessionManager.getKey();
  if (currentKey) return currentKey;

  const base64Res = await getSessionItem(SESSION_KEY_DERIVED_KEY);
  const base64 = base64Res.isOk() ? base64Res.value : null;
  if (typeof base64 === "string" && base64) {
    const bufferRes = base64ToArrayBuffer(base64);
    if (bufferRes.isErr()) return null;
    const buffer = bufferRes.value;
    try {
      const importedKey = await crypto.subtle.importKey(
        "raw",
        buffer,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
      );
      sessionManager.setKey(importedKey);
      return importedKey;
    } catch (e) {
      console.error("[Crypto] Failed to import key from session storage:", e);
      return null;
    }
  }
  return null;
}

export function recordUserActivity(): void {
  notifyBackground({ type: MSG_USER_ACTIVITY });
}

export async function updateSessionTimeoutUseCase(
  timeout: VaultTimeoutValue,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateExtensionSettings({
    vaultTimeout: timeout,
    vaultTimeoutAction: action,
  });
  recordUserActivity();
}

export async function setSessionStorageUseCase(
  key: string,
  value: string,
): Promise<void> {
  await setSessionItem(key, value);
}

export async function removeSessionStorageUseCase(
  key: string | string[],
): Promise<void> {
  await removeSessionItem(key);
}

export async function updateAccountSettingsUseCase(
  newSettings: Parameters<typeof updateAccountSettings>[0],
  vaultMode?: VaultMode,
) {
  const mode = vaultMode ?? (await getActiveVaultMode());
  return await updateAccountSettings(newSettings, mode);
}

export async function updateExtensionSettingsUseCase(
  newSettings: Parameters<typeof updateExtensionSettings>[0],
) {
  return await updateExtensionSettings(newSettings);
}

export async function resetAccountSettingsUseCase(vaultMode?: VaultMode) {
  const mode = vaultMode ?? (await getActiveVaultMode());
  return await resetAccountSettings(mode);
}

export async function addPasswordHistoryItemUseCase(
  item: GeneratedPasswordHistoryItem,
  mode?: VaultMode,
) {
  const activeMode = mode ?? (await getActiveVaultMode());
  return await addPasswordHistoryItem(item, activeMode);
}

export async function getPasswordHistoryUseCase() {
  return await getPasswordHistory();
}

export async function clearPasswordHistoryUseCase() {
  return await clearPasswordHistory();
}
