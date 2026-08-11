import {
  base64ToArrayBuffer,
  computeHmac,
  decryptData,
  deriveKey,
  encryptData,
  type Folder,
  generateSalt,
  importAesGcmKey,
  logger,
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import { getSyncProvider } from "@gistwarden/network";
import {
  checkVaultConfiguredUseCase,
  clearDerivedKey,
  createNewVaultUseCase,
  downloadVaultRoute,
  getOrDeriveKey,
  getSessionKey,
  lockSessionUseCase,
  logoutSessionUseCase,
  setDerivedKey,
  validateSecurityConfigUseCase,
} from "@gistwarden/orchestrator";
import {
  DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG,
  DEFAULT_PIN_CONFIG,
  GistPayloadSchema,
  getAccountSettings,
  getSyncToken,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { reconcile } from "solid-js/store";
import {
  MSG_USER_ACTIVITY,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_PENDING_SYNC_TOKEN,
  SESSION_KEY_VERIFICATION_CIPHERTEXT,
  SESSION_KEY_VERIFICATION_IV,
} from "@/core/constants.ts";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeJsonParse } from "@/core/json-utils.ts";
import { notifyBackground, sendBackgroundMessage } from "@/core/messaging.ts";
import { navigate } from "@/core/navigation.ts";
import { sessionManager } from "@/core/session-manager.ts";
import {
  persistSessionKey,
  updateSessionTimeoutUseCase,
} from "@/core/session-usecases.ts";
import {
  getSessionItem,
  removeSessionItem,
  setSessionItem,
  setSessionUnlocked,
  updateAccountSettings,
  updateExtensionSettings,
} from "@/core/storage.ts";
import type {
  VaultTimeoutAction,
  VaultTimeoutValue,
} from "@/core/storage-schemas.ts";
import {
  accountStore,
  applyVaultPayloadToStore,
  resetAccountStore,
  resetUiStore,
  setAccountStore,
  setSettingsStore,
  settingsStore,
  setUiStore,
  uiStore,
} from "@/core/store.ts";
import { View } from "@/core/types.ts";

export interface SetupUnlockedSessionOptions {
  targetView?: View;
  selectedItem?: VaultItem;
}

async function setupUnlockedSession(
  key: CryptoKey,
  vaultPayload: VaultPayload,
  options?: SetupUnlockedSessionOptions,
): Promise<Result<void, TranslationKey>> {
  await setDerivedKey(key);
  const verificationStr = "verification_token";
  const encryptVerifyRes = await encryptData(verificationStr, key);
  if (encryptVerifyRes.isErr()) {
    clearDerivedKey();
    return err(encryptVerifyRes.error);
  }
  const { iv: vIv, ciphertext: vCiphertext } = encryptVerifyRes.value;
  const setIvRes = await setSessionItem(SESSION_KEY_VERIFICATION_IV, vIv);
  if (setIvRes.isErr()) return err(setIvRes.error);

  const setCipherRes = await setSessionItem(
    SESSION_KEY_VERIFICATION_CIPHERTEXT,
    vCiphertext,
  );
  if (setCipherRes.isErr()) return err(setCipherRes.error);

  await setSessionUnlocked(true);

  const finalToken = await getSyncToken(settingsStore.vaultMode);
  const targetView = options?.targetView;
  const selectedItem = options?.selectedItem;
  const finalView =
    targetView ||
    (uiStore.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault);

  applyVaultPayloadToStore({
    folders: vaultPayload.folders || [],
    items: vaultPayload.items || [],
    trash: vaultPayload.trash || [],
  });
  setAccountStore({
    syncToken: finalToken || undefined,
    vaultConfigured: true,
    isLocked: false,
    sessionUnlocked: true,
    hasUnlockedInSession: true,
  });
  setUiStore("selectedItem", selectedItem || null);
  navigate(finalView);
  notifyBackground({ type: MSG_USER_ACTIVITY });
  return ok();
}

async function resolveEncryptedVaultContent(): Promise<
  Result<{ content: string; salt?: string }, TranslationKey>
> {
  let content = "";

  const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
  if (typeof cachedVal === "string" && cachedVal) {
    content = cachedVal;
  } else {
    const sendResult = await sendBackgroundMessage(downloadVaultRoute, {
      mode: settingsStore.vaultMode,
    });
    if (sendResult.isErr()) {
      return err(sendResult.error);
    }
    if (!sendResult.value.success) {
      return err(sendResult.value.error || "messaging_error_send_failed");
    }
    content = sendResult.value.content || "";
  }

  let salt: string | undefined;
  if (content) {
    const payloadJsonRes = safeJsonParse(content);
    if (payloadJsonRes.isOk()) {
      const payloadResult = GistPayloadSchema.safeParse(payloadJsonRes.value);
      if (payloadResult.success && payloadResult.data.salt) {
        salt = payloadResult.data.salt;
      }
    }
  }

  return ok({ content, salt });
}

export async function createNewVault(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const activeSyncToken = accountStore.syncToken;
  const activeSyncConfig = accountStore.syncConfig;
  const res = await createNewVaultUseCase({
    password,
    syncToken: activeSyncToken,
    syncConfig: activeSyncConfig,
    masterPasswordConfig: accountStore.masterPasswordConfig,
    vaultMode: settingsStore.vaultMode,
  });

  if (res.isErr()) {
    return err(res.error);
  }

  const { key, updatedSyncConfig, updatedMpConfig, encryptedVaultPayload } =
    res.value;

  setAccountStore("masterPasswordConfig", updatedMpConfig);
  if (updatedSyncConfig) {
    setAccountStore("syncConfig", updatedSyncConfig);
  }

  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, encryptedVaultPayload);

  return await setupUnlockedSession(key, { folders: [], items: [], trash: [] });
}

export async function fetchEncryptedVaultContent(): Promise<
  Result<string | null, TranslationKey>
> {
  const cachedRes = await getSessionItem(SESSION_KEY_ENCRYPTED_VAULT);
  const cachedVal = cachedRes.isOk() ? cachedRes.value : null;
  if (typeof cachedVal === "string" && cachedVal) {
    return ok(cachedVal);
  }

  const sendResult = await sendBackgroundMessage(downloadVaultRoute, {
    mode: settingsStore.vaultMode,
  });
  if (sendResult.isOk()) {
    if (sendResult.value.success && sendResult.value.content) {
      const content = sendResult.value.content;
      await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, content);
      return ok(content);
    }
    if (
      !sendResult.value.success &&
      sendResult.value.error === "network_error_unauthorized"
    ) {
      return err("network_error_unauthorized");
    }
  } else if (sendResult.error === "network_error_unauthorized") {
    return err("network_error_unauthorized");
  }

  return ok(null);
}

export async function decryptVaultPayload(
  content: string,
  key: CryptoKey,
): Promise<
  Result<
    VaultPayload & {
      targetView: View;
      selectedItem?: VaultItem;
    },
    TranslationKey
  >
> {
  const payloadJsonRes = safeJsonParse(content);
  if (payloadJsonRes.isErr()) {
    return err(payloadJsonRes.error);
  }
  const payloadResult = GistPayloadSchema.safeParse(payloadJsonRes.value);
  if (!payloadResult.success) {
    return err("storage_error");
  }
  const payload = payloadResult.data;

  const decryptRes = await decryptData(payload.ciphertext, payload.iv, key);
  if (decryptRes.isErr()) {
    const errMsg = decryptRes.error;
    if (
      errMsg.includes("OperationError") ||
      errMsg === "login_error_wrong_mp"
    ) {
      return err("login_error_wrong_mp");
    }
    return err(errMsg);
  }

  const itemsJsonRes = safeJsonParse(decryptRes.value);
  if (itemsJsonRes.isErr()) {
    return err(itemsJsonRes.error);
  }

  let folders: Folder[] = [];
  let items: VaultItem[] = [];
  let trash: TrashVaultItem[] = [];

  const rawVal = itemsJsonRes.value;
  if (Array.isArray(rawVal)) {
    const itemsResult = VaultListSchema.safeParse(rawVal);
    if (!itemsResult.success) return err("storage_error");
    items = itemsResult.data;
  } else {
    const payloadResult = VaultPayloadSchema.safeParse(rawVal);
    if (!payloadResult.success) return err("storage_error");
    folders = payloadResult.data.folders || [];
    items = payloadResult.data.items;
    trash = payloadResult.data.trash || [];
  }

  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("itemId");
  let targetView =
    uiStore.view === View.Fido2Prompt ? View.Fido2Prompt : View.Vault;
  let selectedItem;

  if (itemId && uiStore.view !== View.Fido2Prompt) {
    const foundItem = items.find((i: VaultItem) => i.id === itemId);
    if (foundItem) {
      selectedItem = foundItem;
      targetView = View.ItemDetail;
    }
  }

  return ok({ folders, items, trash, targetView, selectedItem });
}

export async function verifyMasterPasswordSecurity(): Promise<
  Result<{ attempts: number; salt: string }, TranslationKey>
> {
  const accSettingsRes = await getAccountSettings(settingsStore.vaultMode);
  if (accSettingsRes.isErr()) return err(accSettingsRes.error);
  const accSettings = accSettingsRes.value;
  const config =
    accSettings.masterPasswordConfig || DEFAULT_MASTER_PASSWORD_SECURITY_CONFIG;
  const secSalt = config.salt;

  if (secSalt) {
    await validateSecurityConfigUseCase(settingsStore.vaultMode, secSalt);
    const updatedAccRes = await getAccountSettings(settingsStore.vaultMode);
    const updatedConfig = updatedAccRes.isOk()
      ? updatedAccRes.value.masterPasswordConfig
      : config;

    const now = Date.now();
    if (now < updatedConfig.lockoutUntil) {
      return err("login_error_mp_cooldown");
    }
    return ok({ attempts: updatedConfig.failedAttempts, salt: secSalt });
  }

  return ok({ attempts: config.failedAttempts, salt: secSalt });
}

export async function recordMasterPasswordFailure(
  currentAttempts: number,
  salt: string,
): Promise<void> {
  const nextAttempts = currentAttempts + 1;
  const penaltySeconds = 2 ** nextAttempts;
  const lockoutUntil = Date.now() + penaltySeconds * 1000;
  const secSalt = salt || generateSalt().toBase64();
  const macRes = await computeHmac(`${nextAttempts}:${lockoutUntil}`, secSalt);
  const failedMac = macRes.isOk() ? macRes.value : "";

  const updatedConfig = {
    salt: secSalt,
    failedAttempts: nextAttempts,
    lockoutUntil,
    failedMac,
  };

  setAccountStore("masterPasswordConfig", updatedConfig);
  await updateAccountSettings(
    { masterPasswordConfig: updatedConfig },
    settingsStore.vaultMode,
  );
  await new Promise((r) => setTimeout(r, 600));
}

export async function resetMasterPasswordSecurity(salt: string): Promise<void> {
  const secSalt = salt || generateSalt().toBase64();
  const resetMacRes = await computeHmac("0:0", secSalt);
  const resetMac = resetMacRes.isOk() ? resetMacRes.value : "";
  const resetConfig = {
    salt: secSalt,
    failedAttempts: 0,
    lockoutUntil: 0,
    failedMac: resetMac,
  };
  setAccountStore("masterPasswordConfig", resetConfig);
  await updateAccountSettings(
    { masterPasswordConfig: resetConfig },
    settingsStore.vaultMode,
  );
}

export async function unlock(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const secRes = await verifyMasterPasswordSecurity();
  if (secRes.isErr()) {
    return err(secRes.error);
  }
  const { attempts, salt: secSalt } = secRes.value;

  const accSettingsRes = await getAccountSettings(settingsStore.vaultMode);
  if (accSettingsRes.isErr()) {
    await recordMasterPasswordFailure(attempts, secSalt);
    return err(accSettingsRes.error);
  }
  const accSettings = accSettingsRes.value;
  let syncConfig = accSettings.syncConfig;
  let saltBase64 = accSettings.masterPasswordConfig.salt;
  clearDerivedKey();

  // A. Đọc cache hoặc tải Encrypted Vault content trước để trích xuất Salt từ Remote/Local Vault (nếu có)
  const vaultRes = await resolveEncryptedVaultContent();
  let existingVaultContent = "";
  if (vaultRes.isOk()) {
    existingVaultContent = vaultRes.value.content || "";
    const extractedSalt = vaultRes.value.salt;
    if (extractedSalt && extractedSalt !== saltBase64) {
      saltBase64 = extractedSalt;
      const updatedMpConfig = {
        ...accSettings.masterPasswordConfig,
        salt: saltBase64,
      };
      await updateAccountSettings(
        { masterPasswordConfig: updatedMpConfig },
        settingsStore.vaultMode,
      );
      setAccountStore("masterPasswordConfig", updatedMpConfig);
    }
  }

  const notFoundErrorKey: TranslationKey = vaultRes.isErr()
    ? vaultRes.error
    : "vault_error_not_found";

  // B. Nếu chưa có salt (cả cục bộ lẫn remote), trả về lỗi không tìm thấy Vault
  if (!saltBase64) {
    clearDerivedKey();
    return err(notFoundErrorKey);
  }

  // C. Derive Key từ Password và Salt mới nhất
  const keyRes = await getOrDeriveKey(password, saltBase64);
  if (keyRes.isErr()) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
    return err(keyRes.error);
  }
  const key = keyRes.value;
  if (!key) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
    return err("login_error_wrong_mp");
  }

  // D. Giải mã Két sắt trước để đảm bảo Master Password nhập vào là chính xác
  if (!existingVaultContent) {
    clearDerivedKey();
    return err(notFoundErrorKey);
  }

  const decryptVaultRes = await decryptVaultPayload(existingVaultContent, key);
  if (decryptVaultRes.isErr()) {
    clearDerivedKey();
    await recordMasterPasswordFailure(attempts, saltBase64 || secSalt);
    return err(decryptVaultRes.error);
  }

  // E. Giải mã / Kiểm tra Token GitHub (nếu có)
  if (syncConfig.syncTokenEncrypted && syncConfig.syncTokenIv) {
    const decryptTokenRes = await decryptData(
      syncConfig.syncTokenEncrypted,
      syncConfig.syncTokenIv,
      key,
    );
    if (decryptTokenRes.isErr()) {
      logger.storage.warn(
        "Failed to decrypt syncToken with current key, clearing invalid encrypted token config",
      );
      const clearedSyncConfig = {
        ...syncConfig,
        syncTokenEncrypted: "",
        syncTokenIv: "",
      };
      await updateAccountSettings(
        { syncConfig: clearedSyncConfig },
        settingsStore.vaultMode,
      );
      setAccountStore("syncConfig", clearedSyncConfig);
      syncConfig = clearedSyncConfig;
    }
  }

  // Check provider configuration
  const isReady = await checkVaultConfiguredUseCase(settingsStore.vaultMode, {
    ...accSettings,
    syncConfig,
  });
  setAccountStore("vaultConfigured", isReady);

  // F. Onboarding token mã hóa nếu đang có pending token
  const activeToken = await getSyncToken(settingsStore.vaultMode);
  if (
    activeToken &&
    (!syncConfig.syncTokenEncrypted || !syncConfig.syncTokenIv)
  ) {
    const encryptRes = await encryptData(activeToken, key);
    if (encryptRes.isOk()) {
      const updatedSyncConfig = {
        ...syncConfig,
        syncTokenEncrypted: encryptRes.value.ciphertext,
        syncTokenIv: encryptRes.value.iv,
      };
      await updateAccountSettings(
        { syncConfig: updatedSyncConfig },
        settingsStore.vaultMode,
      );
      setAccountStore("syncConfig", updatedSyncConfig);
      await removeSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN);
    }
  }

  await resetMasterPasswordSecurity(saltBase64);

  const { folders, items, trash, targetView, selectedItem } =
    decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingVaultContent);
  return await setupUnlockedSession(
    key,
    { folders, items, trash },
    { targetView, selectedItem },
  );
}

export async function unlockVaultWithKey(
  key: CryptoKey,
): Promise<Result<void, TranslationKey>> {
  const _provider = getSyncProvider(settingsStore.vaultMode);

  await persistSessionKey(key);

  const isReady = await checkVaultConfiguredUseCase(settingsStore.vaultMode);
  if (!isReady) {
    sessionManager.clearKey();
    return err("login_error_invalid_token");
  }

  const vaultRes = await resolveEncryptedVaultContent();
  if (vaultRes.isErr()) {
    sessionManager.clearKey();
    return err(vaultRes.error);
  }
  const { content: existingVaultContent } = vaultRes.value;
  if (!existingVaultContent) {
    sessionManager.clearKey();
    return err(
      settingsStore.vaultMode === "local_storage"
        ? "vault_error_not_found"
        : "github_error_gist_not_found",
    );
  }

  const decryptVaultRes = await decryptVaultPayload(existingVaultContent, key);
  if (decryptVaultRes.isErr()) {
    sessionManager.clearKey();
    return err(decryptVaultRes.error);
  }

  const { folders, items, trash, targetView, selectedItem } =
    decryptVaultRes.value;
  await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, existingVaultContent);
  return await setupUnlockedSession(
    key,
    { folders, items, trash },
    { targetView, selectedItem },
  );
}

export async function unlockVaultWithMasterPassword(
  password: string,
): Promise<Result<void, TranslationKey>> {
  const _provider = getSyncProvider(settingsStore.vaultMode);

  const secRes = await verifyMasterPasswordSecurity();
  if (secRes.isErr()) {
    return err(secRes.error);
  }
  const { attempts, salt: secSalt } = secRes.value;

  const accSettingsRes = await getAccountSettings(settingsStore.vaultMode);
  if (accSettingsRes.isErr()) {
    await recordMasterPasswordFailure(attempts, secSalt);
    return err(accSettingsRes.error);
  }
  const accSettings = accSettingsRes.value;
  const saltBase64 = accSettings.masterPasswordConfig.salt;
  if (!saltBase64) {
    sessionManager.clearKey();
    await recordMasterPasswordFailure(attempts, secSalt);
    return err("login_error_wrong_mp");
  }

  const keyRes = await getOrDeriveKey(password, saltBase64);
  if (keyRes.isErr()) {
    sessionManager.clearKey();
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err(keyRes.error);
  }

  const isReady = await checkVaultConfiguredUseCase(
    settingsStore.vaultMode,
    accSettings,
  );
  if (!isReady) {
    sessionManager.clearKey();
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err("login_error_invalid_token");
  }

  const unlockRes = await unlockVaultWithKey(keyRes.value);
  if (unlockRes.isErr()) {
    await recordMasterPasswordFailure(attempts, saltBase64);
    return err(unlockRes.error);
  }

  await resetMasterPasswordSecurity(saltBase64);
  return ok();
}

async function clearPinUnlockState(): Promise<void> {
  setAccountStore("pinConfig", DEFAULT_PIN_CONFIG);
  setSettingsStore("requireMasterPasswordOnRestart", true);
  await updateAccountSettings(
    { pinConfig: DEFAULT_PIN_CONFIG },
    settingsStore.vaultMode,
  );
  await updateExtensionSettings({ requireMasterPasswordOnRestart: true });
}

async function handlePinFailure(
  attempts: number,
): Promise<Result<void, TranslationKey>> {
  if (attempts >= 3) {
    await clearPinUnlockState();
    await lockVaultSession();
    return err("login_error_pin_max_attempts_reached");
  }
  if (attempts === 1) {
    return err("login_error_wrong_pin_2_left");
  }
  return err("login_error_wrong_pin_1_left");
}

export async function unlockVaultWithPin(
  pin: string,
): Promise<Result<void, TranslationKey>> {
  const config = accountStore.pinConfig;
  if (!config.enabled || !config.value || !config.iv || !config.salt) {
    return err("login_error_wrong_pin");
  }

  const accSettingsRes = await getAccountSettings(settingsStore.vaultMode);
  const currentConfig = accSettingsRes.isOk()
    ? accSettingsRes.value.pinConfig
    : config;

  if (!currentConfig.enabled || !currentConfig.value || !currentConfig.salt) {
    return err("login_error_wrong_pin");
  }

  // 1. Integrity check: Verify failedMac
  const expectedMacRes = await computeHmac(
    String(currentConfig.failedAttempts),
    currentConfig.salt,
  );
  const expectedMac = expectedMacRes.isOk() ? expectedMacRes.value : "";

  if (!currentConfig.failedMac || currentConfig.failedMac !== expectedMac) {
    await clearPinUnlockState();
    await lockVaultSession();
    return err("login_error_pin_tampered");
  }

  // 2. Lockout check
  if (currentConfig.failedAttempts >= 3) {
    await clearPinUnlockState();
    await lockVaultSession();
    return err("login_error_pin_max_attempts_reached");
  }

  // 3. Eager write: Increment attempts and compute new MAC before testing cryptographic decryption
  const nextAttempts = currentConfig.failedAttempts + 1;
  const nextMacRes = await computeHmac(
    String(nextAttempts),
    currentConfig.salt,
  );
  const nextMac = nextMacRes.isOk() ? nextMacRes.value : "";

  const updatedConfig = {
    ...currentConfig,
    failedAttempts: nextAttempts,
    failedMac: nextMac,
  };

  setAccountStore("pinConfig", updatedConfig);
  await updateAccountSettings(
    { pinConfig: updatedConfig },
    settingsStore.vaultMode,
  );

  // 4. Test PIN decryption
  const saltBufferRes = base64ToArrayBuffer(currentConfig.salt);
  if (saltBufferRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const pinKeyRes = await deriveKey(pin, new Uint8Array(saltBufferRes.value));
  if (pinKeyRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const decryptRes = await decryptData(
    currentConfig.value,
    currentConfig.iv,
    pinKeyRes.value,
  );
  if (decryptRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const bufferRes = base64ToArrayBuffer(decryptRes.value);
  if (bufferRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  const importRes = await importAesGcmKey(
    bufferRes.value,
    "login_error_wrong_pin",
  );
  if (importRes.isErr()) {
    return await handlePinFailure(nextAttempts);
  }

  // 5. Success! Reset failedAttempts to 0
  const resetMacRes = await computeHmac("0", currentConfig.salt);
  const resetMac = resetMacRes.isOk() ? resetMacRes.value : "";
  const resetConfig = {
    ...currentConfig,
    failedAttempts: 0,
    failedMac: resetMac,
  };
  setAccountStore("pinConfig", resetConfig);
  await updateAccountSettings(
    { pinConfig: resetConfig },
    settingsStore.vaultMode,
  );

  return await unlockVaultWithKey(importRes.value);
}

export async function lockVaultSession(): Promise<void> {
  await lockSessionUseCase();

  setAccountStore({
    folders: [],
    vaultItems: [],
    trashItems: [],
    syncToken: "",
    isLocked: true,
    sessionUnlocked: false,
  });
  setUiStore({
    view: uiStore.view === View.Fido2Prompt ? View.Fido2Prompt : View.Login,
    selectedItem: null,
  });
}

export async function logoutVaultSession(): Promise<void> {
  await logoutSessionUseCase(settingsStore.vaultMode);

  resetAccountStore();
  resetUiStore();
}

export async function lock(): Promise<void> {
  await lockVaultSession();
}

export async function logout(): Promise<void> {
  await logoutVaultSession();
}

export async function acceptWelcome() {
  await updateExtensionSettings({ welcomeAccepted: true });
  setSettingsStore("welcomeAccepted", true);
  setUiStore("view", View.Login);
}

export async function reloadVaultItems(): Promise<void> {
  const key = await getSessionKey();
  if (!key || !accountStore.masterPasswordConfig.salt || accountStore.isLocked)
    return;

  const contentRes = await fetchEncryptedVaultContent();
  if (contentRes.isErr() || !contentRes.value) return;

  const decryptVaultRes = await decryptVaultPayload(contentRes.value, key);
  if (decryptVaultRes.isErr()) return;

  const { items, trash } = decryptVaultRes.value;
  setAccountStore("vaultItems", reconcile(items));
  setAccountStore("trashItems", reconcile(trash));
}

export async function updateSessionTimeout(
  timeout: VaultTimeoutValue,
  action: VaultTimeoutAction,
): Promise<void> {
  await updateSessionTimeoutUseCase(timeout, action);
}
