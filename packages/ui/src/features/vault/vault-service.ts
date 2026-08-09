import {
  addFolderUseCase,
  clearVaultUseCase,
  deleteFolderUseCase,
  deleteVaultItemsUseCase,
  executeVaultMutationUseCase,
  getDecryptedVaultItems,
  moveVaultItemsToFolderUseCase,
  purgeAllTrashUseCase,
  purgeTrashItemUseCase,
  renameFolderUseCase,
  restoreVaultItemUseCase,
  saveItemUseCase,
} from "@gistwarden/orchestrator";

import {
  accountStore,
  applyVaultPayloadToStore,
  setAccountStore,
  settingsStore,
} from "@/core/store.ts";
import {
  type Folder,
  type FolderId,
  type TrashVaultItem,
  type VaultItem,
  type VaultItemId,
  type VaultPayload,
} from "@gistwarden/domain";


import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

import { handleGlobalApiError } from "@/core/ui-service.ts";

/**
 * Architectural Decision:
 * Each vault mutation function explicitly invokes `getOrBuildCurrentPayloadAndSalt()`
 * and `handleGlobalApiError(res.error)` inline rather than using an abstract HOF wrapper.
 * This explicit pattern prioritizes code readability, clear call stacks, and direct
 * control flow traceability over generic abstraction wrappers.
 */
async function getOrBuildCurrentPayloadAndSalt(): Promise<{
  payload: VaultPayload;
  salt: string;
}> {
  const decrypted = await getDecryptedVaultItems();
  const salt = accountStore.masterPasswordConfig.salt || decrypted?.salt || "";
  const payload: VaultPayload = decrypted || {
    folders: accountStore.folders || [],
    items: accountStore.vaultItems || [],
    trash: accountStore.trashItems || [],
  };
  return { payload, salt };
}

export async function persistAndReconcileVault(
  items: VaultItem[],
  trashItems: TrashVaultItem[] = accountStore.trashItems || [],
  folders: Folder[] = accountStore.folders || [],
): Promise<Result<VaultItem[], TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await executeVaultMutationUseCase(
    { ...payload, items, trash: trashItems, folders },
    salt,
    settingsStore.vaultMode,
    (p) => ({ ...p, items, trash: trashItems, folders }),
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok(res.value.items);
}

export async function addFolder(
  name: string,
): Promise<Result<Folder, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await addFolderUseCase(payload, salt, settingsStore.vaultMode, name);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value.payload);
  return ok(res.value.newFolder);
}

export async function renameFolder(
  id: FolderId,
  newName: string,
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await renameFolderUseCase(payload, salt, settingsStore.vaultMode, id, newName);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function deleteFolder(
  id: FolderId,
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await deleteFolderUseCase(payload, salt, settingsStore.vaultMode, id);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function saveItem(
  item: Partial<VaultItem>,
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await saveItemUseCase(payload, salt, settingsStore.vaultMode, item);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function deleteItem(
  id: VaultItemId,
): Promise<Result<void, TranslationKey>> {
  return await deleteVaultItems([id]);
}

export async function deleteVaultItems(
  ids: VaultItemId[],
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await deleteVaultItemsUseCase(payload, salt, settingsStore.vaultMode, ids);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function moveVaultItemsToFolder(
  ids: VaultItemId[],
  folderId: FolderId | null,
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await moveVaultItemsToFolderUseCase(payload, salt, settingsStore.vaultMode, ids, folderId);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function restoreVaultItem(
  id: VaultItemId,
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await restoreVaultItemUseCase(payload, salt, settingsStore.vaultMode, id);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function purgeTrashItem(
  id: VaultItemId,
): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await purgeTrashItemUseCase(payload, salt, settingsStore.vaultMode, id);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function purgeAllTrash(): Promise<Result<void, TranslationKey>> {
  const { payload, salt } = await getOrBuildCurrentPayloadAndSalt();
  const res = await purgeAllTrashUseCase(payload, salt, settingsStore.vaultMode);
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }
  applyVaultPayloadToStore(res.value);
  return ok();
}

export async function clearVault(): Promise<Result<void, TranslationKey>> {
  const res = await clearVaultUseCase(
    settingsStore.vaultMode,
    accountStore.gistId,
  );
  if (res.isErr()) {
    handleGlobalApiError(res.error);
    return err(res.error);
  }

  setAccountStore({
    gistId: "",
    vaultItems: [],
    lastSync: 0,
  });
  return ok();
}
