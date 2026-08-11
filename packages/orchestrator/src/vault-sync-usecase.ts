import {
  decryptData,
  encryptData,
  type Folder,
  SESSION_KEY_ENCRYPTED_VAULT,
  safeJsonParse,
  type TranslationKey,
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import {
  EncryptedPayloadSchema,
  setSessionItem,
  updateAccountSettings,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { sendBackgroundMessage } from "./messaging.ts";
import {
  downloadVaultRoute,
  uploadToGistRoute,
} from "./messaging-contracts.ts";
import { mergeVaultPayload } from "./vault-merge-usecase.ts";

export async function fetchAndMergeRemoteVaultUseCase(
  localItems: VaultItem[],
  localTrash: TrashVaultItem[],
  key: CryptoKey,
  options: {
    vaultMode: VaultMode;
    folders?: Folder[];
    lastSync?: number;
  },
): Promise<Result<VaultPayload, TranslationKey>> {
  const localFolders = options.folders || [];
  const lastSync = options.lastSync || 0;

  const sendResult = await sendBackgroundMessage(downloadVaultRoute, {
    mode: options.vaultMode,
  });
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    return err(sendResult.value.error || "messaging_error_send_failed");
  }
  const rawContent = sendResult.value.content || "";
  if (!rawContent) {
    return ok({ folders: localFolders, items: localItems, trash: localTrash });
  }

  const parseJsonRes = safeJsonParse(rawContent || "{}");
  const payloadParse = EncryptedPayloadSchema.safeParse(
    parseJsonRes.isOk() ? parseJsonRes.value : {},
  );
  const payload = payloadParse.success ? payloadParse.data : {};

  const { ciphertext, iv } = payload;
  if (!ciphertext || !iv) {
    return ok({ folders: localFolders, items: localItems, trash: localTrash });
  }

  const decryptRes = await decryptData(ciphertext, iv, key);
  if (decryptRes.isErr()) {
    return err("sync_error_remote_password_changed");
  }

  const parseVaultRes = safeJsonParse(decryptRes.value);
  if (parseVaultRes.isErr()) {
    return err("sync_error_corrupted_payload");
  }

  let remoteFolders: Folder[] = [];
  let remoteItems: VaultItem[] = [];
  let remoteTrash: TrashVaultItem[] = [];

  const rawVal = parseVaultRes.value;
  if (Array.isArray(rawVal)) {
    const remoteVaultParse = VaultListSchema.safeParse(rawVal);
    if (!remoteVaultParse.success) {
      return err("sync_error_invalid_format");
    }
    remoteItems = remoteVaultParse.data;
  } else {
    const remoteVaultParse = VaultPayloadSchema.safeParse(rawVal);
    if (!remoteVaultParse.success) {
      return err("sync_error_invalid_format");
    }
    remoteFolders = remoteVaultParse.data.folders || [];
    remoteItems = remoteVaultParse.data.items;
    remoteTrash = remoteVaultParse.data.trash || [];
  }

  const merged = mergeVaultPayload(
    { folders: localFolders, items: localItems, trash: localTrash },
    { folders: remoteFolders, items: remoteItems, trash: remoteTrash },
    lastSync,
  );
  return ok(merged);
}

export async function syncVaultToGist(
  items: VaultItem[],
  key: CryptoKey,
  salt: string,
  options: {
    vaultMode: VaultMode;
    trashItems?: TrashVaultItem[];
    folders?: Folder[];
    lastSync?: number;
    skipRemoteMerge?: boolean;
  },
): Promise<Result<VaultItem[], TranslationKey>> {
  const trashItems = options.trashItems || [];
  const folders = options.folders || [];
  const parsedResult = VaultListSchema.safeParse(items);
  if (!parsedResult.success) {
    return err("storage_error");
  }
  const validatedList = parsedResult.data;

  let finalPayloadToSave: VaultPayload = {
    folders,
    items: validatedList,
    trash: trashItems,
  };

  if (!options.skipRemoteMerge) {
    const mergeResult = await fetchAndMergeRemoteVaultUseCase(
      validatedList,
      trashItems,
      key,
      { vaultMode: options.vaultMode, folders, lastSync: options.lastSync },
    );
    if (mergeResult.isErr()) {
      return err(mergeResult.error);
    }
    finalPayloadToSave = mergeResult.value;
  }

  const payloadObject = {
    folders: finalPayloadToSave.folders,
    items: finalPayloadToSave.items,
    trash: finalPayloadToSave.trash,
  };

  const encryptRes = await encryptData(JSON.stringify(payloadObject), key);
  if (encryptRes.isErr()) {
    return err("storage_error");
  }
  const encrypted = encryptRes.value;
  const payload = JSON.stringify({
    salt,
    iv: encrypted.iv,
    ciphertext: encrypted.ciphertext,
  });

  if (typeof payload === "string") {
    const payloadBytes = new TextEncoder().encode(payload).byteLength;
    const maxGistBytes = 10 * 1024 * 1024;
    if (payloadBytes > maxGistBytes) {
      return err("network_error_payload_too_large");
    }
    const warnThresholdBytes = 9 * 1024 * 1024;
    if (payloadBytes >= warnThresholdBytes) {
      const sizeMB = (payloadBytes / (1024 * 1024)).toFixed(1);
      console.warn(`[Sync] Vault Gist size near limit: ${sizeMB} MB`);
    }
  }

  const sendResult = await sendBackgroundMessage(uploadToGistRoute, {
    content: payload,
    mode: options.vaultMode,
  });
  if (sendResult.isErr()) {
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    return err(sendResult.value.error || "messaging_error_send_failed");
  }

  const setRes = await setSessionItem(SESSION_KEY_ENCRYPTED_VAULT, payload);
  if (setRes.isErr()) {
    return err(setRes.error);
  }

  const now = Date.now();
  await updateAccountSettings({ lastSync: now }, options.vaultMode);

  return ok(finalPayloadToSave.items);
}
