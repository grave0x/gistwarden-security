import {
  asGistId,
  asGitHubAccessToken,
  decryptData,
  encryptData,
  type Folder,
  SESSION_KEY_ENCRYPTED_VAULT,
  SESSION_KEY_PENDING_SYNC_TOKEN,
  type SyncStatusResult,
  safeJsonParse,
  type TranslationKey,
  type TrashVaultItem,
  type VaultItem,
  VaultListSchema,
  type VaultPayload,
  VaultPayloadSchema,
} from "@gistwarden/domain";
import { launchGithubOauthFlow, validateToken } from "@gistwarden/network";
import {
  type AccountSettings,
  type DeleteGistMsg,
  type DownloadFromGistMsg,
  type DownloadGistResponse,
  EncryptedPayloadSchema,
  getAccountSettings,
  getExtensionSettings,
  getSyncToken,
  resetAccountSettings,
  type StartGithubOauthMsg,
  type StartGithubOauthResponse,
  type SyncActionResponse,
  setSessionItem,
  type UploadToGistMsg,
  updateAccountSettings,
  type ValidateTokenMsg,
  type ValidateTokenResponse,
  type VaultMode,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { sendBackgroundMessage } from "./messaging.ts";
import {
  downloadVaultRoute,
  uploadToGistRoute,
} from "./messaging-contracts.ts";
import { getSyncProvider } from "./sync-provider-registry.ts";
import { checkVaultConfiguredUseCase } from "./vault-auth-usecases.ts";

// ----------------------------------------------------
// Vault Payload Merge Engine
// ----------------------------------------------------

function parseTimestamp(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function mergeFolders(
  localFolders: readonly Folder[],
  remoteFolders: readonly Folder[],
): Folder[] {
  const folderMap = new Map<string, Folder>();
  for (const f of localFolders) {
    if (f.id && f.name) {
      folderMap.set(f.id, f);
    }
  }
  for (const f of remoteFolders) {
    if (f.id && f.name && !folderMap.has(f.id)) {
      folderMap.set(f.id, f);
    }
  }
  return Array.from(folderMap.values());
}

export function mergeVaultItems(
  localItems: readonly VaultItem[],
  remoteItems: readonly VaultItem[],
  lastSyncTimestamp: number,
): VaultItem[] {
  const itemMap = new Map<string, VaultItem>();
  const localMap = new Map<string, VaultItem>();

  for (const localItem of localItems) {
    localMap.set(localItem.id, localItem);
  }

  for (const remoteItem of remoteItems) {
    const localItem = localMap.get(remoteItem.id);

    if (localItem) {
      const localRevTime = parseTimestamp(localItem.revisionDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      if (localRevTime >= remoteRevTime) {
        itemMap.set(localItem.id, localItem);
      } else {
        itemMap.set(remoteItem.id, remoteItem);
      }
    } else {
      const remoteCreationTime = parseTimestamp(remoteItem.creationDate);
      const remoteRevTime = parseTimestamp(remoteItem.revisionDate);

      if (
        lastSyncTimestamp === 0 ||
        remoteCreationTime > lastSyncTimestamp ||
        remoteRevTime > lastSyncTimestamp
      ) {
        itemMap.set(remoteItem.id, remoteItem);
      }
    }
  }

  for (const localItem of localItems) {
    if (!itemMap.has(localItem.id)) {
      const remoteItem = remoteItems.find((r) => r.id === localItem.id);

      if (!remoteItem) {
        const localCreationTime = parseTimestamp(localItem.creationDate);
        const localRevTime = parseTimestamp(localItem.revisionDate);
        if (
          lastSyncTimestamp === 0 ||
          localCreationTime > lastSyncTimestamp ||
          localRevTime > lastSyncTimestamp
        ) {
          itemMap.set(localItem.id, localItem);
        }
      }
    }
  }

  return Array.from(itemMap.values());
}

export function mergeVaultPayload(
  localPayload: Partial<VaultPayload>,
  remotePayload: Partial<VaultPayload>,
  lastSyncTimestamp: number,
): VaultPayload {
  const localTrash = localPayload.trash || [];
  const remoteTrash = remotePayload.trash || [];

  const mergedFolders =
    localPayload.folders !== undefined
      ? localPayload.folders
      : mergeFolders(localPayload.folders || [], remotePayload.folders || []);

  const trashMap = new Map<string, TrashVaultItem>();
  for (const tItem of [...localTrash, ...remoteTrash]) {
    const existing = trashMap.get(tItem.item.id);
    if (!existing) {
      trashMap.set(tItem.item.id, tItem);
    } else {
      const existingDelTime = parseTimestamp(existing.deletedDate);
      const newDelTime = parseTimestamp(tItem.deletedDate);
      if (newDelTime >= existingDelTime) {
        trashMap.set(tItem.item.id, tItem);
      }
    }
  }

  const candidateItems = mergeVaultItems(
    localPayload.items || [],
    remotePayload.items || [],
    lastSyncTimestamp,
  );

  const finalItems: VaultItem[] = [];
  for (const item of candidateItems) {
    const trashEntry = trashMap.get(item.id);
    if (trashEntry) {
      const delTime = parseTimestamp(trashEntry.deletedDate);
      const revTime = parseTimestamp(item.revisionDate);
      if (delTime >= revTime) {
        continue;
      } else {
        trashMap.delete(item.id);
      }
    }
    finalItems.push(item);
  }

  return {
    folders: mergedFolders,
    items: finalItems,
    trash: Array.from(trashMap.values()),
  };
}

// ----------------------------------------------------
// Remote Vault Fetch & Merge Use Cases
// ----------------------------------------------------

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
    if (sendResult.error === "provider_error_not_found") {
      await resetAccountSettings(options.vaultMode);
    }
    return err(sendResult.error);
  }
  if (!sendResult.value.success) {
    const errorMsg = sendResult.value.error;
    if (errorMsg === "provider_error_not_found") {
      await resetAccountSettings(options.vaultMode);
    }
    return err(errorMsg || "messaging_error_send_failed");
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

// ----------------------------------------------------
// Sync Messaging Route Handlers
// ----------------------------------------------------

export async function uploadVaultUseCase(
  payload: UploadToGistMsg,
): Promise<SyncActionResponse> {
  const vaultMode = payload.mode;
  const provider = getSyncProvider(vaultMode);

  if (!(await checkVaultConfiguredUseCase(vaultMode))) {
    return { success: false, error: "provider_error_missing_token" };
  }

  const token = await getSyncToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const syncConfig = settingsRes.isOk()
    ? settingsRes.value.syncConfig
    : undefined;
  const res = await provider.upload(payload.content || "", {
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
    gistId: syncConfig?.gistId,
    username: syncConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && syncConfig && gistId !== syncConfig.gistId) {
      await updateAccountSettings(
        {
          syncConfig: { ...syncConfig, gistId },
          lastSync: Date.now(),
        },
        vaultMode,
      );
    } else {
      await updateAccountSettings({ lastSync: Date.now() }, vaultMode);
    }
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function deleteVaultUseCase(
  payload: DeleteGistMsg,
): Promise<SyncActionResponse> {
  const extRes = await getExtensionSettings();
  const vaultMode = extRes.isOk() ? extRes.value.vaultMode : "github_gist";
  const provider = getSyncProvider(vaultMode);

  const token = await getSyncToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const syncConfig = settingsRes.isOk()
    ? settingsRes.value.syncConfig
    : undefined;
  const gistId = payload.content ? asGistId(payload.content) : undefined;
  const res = await provider.delete(gistId, {
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
  });
  if (res.isOk()) {
    return { success: true };
  }
  return { success: false, error: res.error };
}

export async function downloadVaultUseCase(
  payload: DownloadFromGistMsg,
): Promise<DownloadGistResponse> {
  const vaultMode = payload.mode;
  const provider = getSyncProvider(vaultMode);

  const token = await getSyncToken(vaultMode);
  const settingsRes = await getAccountSettings(vaultMode);
  const settings = settingsRes.isOk() ? settingsRes.value : null;
  const syncConfig = settings?.syncConfig;

  const res = await provider.download({
    token: token || undefined,
    serverUrl: syncConfig?.serverUrl,
    gistId: syncConfig?.gistId,
    username: syncConfig?.username,
  });

  if (res.isOk()) {
    const gistId = res.value.gistId;
    if (gistId && syncConfig && gistId !== syncConfig.gistId) {
      await updateAccountSettings(
        {
          syncConfig: { ...syncConfig, gistId },
          lastSync: Date.now(),
        },
        vaultMode,
      );
    } else if (settings) {
      await updateAccountSettings({ lastSync: Date.now() }, vaultMode);
    }
    return { success: true, content: res.value.content || "" };
  }
  return { success: false, error: res.error };
}

export async function validateTokenUseCase(
  payload: ValidateTokenMsg,
): Promise<ValidateTokenResponse> {
  if (!payload.token) {
    return { success: false, error: "login_error_invalid_token" };
  }
  const res = await validateToken(payload.token);
  if (res.isOk()) {
    return {
      success: true,
      username: res.value.username,
      avatarUrl: res.value.avatarUrl,
    };
  }
  return { success: false, error: res.error };
}

export async function startGithubOauthUseCase(
  payload: StartGithubOauthMsg,
): Promise<StartGithubOauthResponse> {
  const clientId = payload.content || "";
  const oauthRes = await launchGithubOauthFlow(clientId);
  if (oauthRes.isOk()) {
    await setSessionItem(SESSION_KEY_PENDING_SYNC_TOKEN, oauthRes.value);
    return { success: true, token: oauthRes.value };
  }
  return { success: false, error: oauthRes.error };
}

export async function checkVaultStatusUseCase(
  mode: VaultMode,
  acc: AccountSettings | null,
  syncToken?: string,
): Promise<SyncStatusResult> {
  const provider = getSyncProvider(mode);
  const retrievedToken = await getSyncToken(mode);
  const activeToken =
    retrievedToken || (syncToken ? asGitHubAccessToken(syncToken) : undefined);

  const activeSyncConfig = acc?.syncConfig;
  return await provider.checkVaultStatus({
    token: activeToken,
    serverUrl: activeSyncConfig?.serverUrl || undefined,
    gistId: activeSyncConfig?.gistId || undefined,
    hasStoredSalt: Boolean(acc?.masterPasswordConfig.salt),
  });
}
