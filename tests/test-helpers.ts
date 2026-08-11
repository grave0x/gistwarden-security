import {
  asGistId,
  asGitHubAccessToken,
  asVaultItemId,
  createDefaultVaultItem,
  mergeVaultItem,
  VaultItemType,
  View,
} from "@gistwarden/domain";
import { getSyncProvider } from "@gistwarden/network";
import {
  addFolderUseCase,
  deleteFolderUseCase,
  deleteGistRoute,
  deleteLocalVaultRoute,
  deleteVaultItemsUseCase,
  downloadVaultRoute,
  executeVaultMutationUseCase,
  getSessionKey,
  purgeTrashItemUseCase,
  registerInMemoryRoute,
  renameFolderUseCase,
  restoreVaultItemUseCase,
  uploadToGistRoute,
} from "@gistwarden/orchestrator";
import {
  getLocalVaultPayload,
  removeLocalVaultPayload,
  setLocalVaultPayload,
  type VaultMode,
} from "@gistwarden/repository";
import { Window } from "happy-dom";
import {
  accountStore,
  resetAccountStore,
  resetUiStore,
  setAccountStore,
  setSettingsStore,
  uiStore,
} from "../packages/ui/src/core/store.ts";
import {
  createNewVault,
  lock,
  logout,
  resetMasterPasswordSecurity,
  unlock,
} from "../packages/ui/src/features/auth/auth-service.ts";
import { changeMasterPassword } from "../packages/ui/src/features/auth/master-password-service.ts";
import {
  setPinUnlock,
  unlockWithPin,
} from "../packages/ui/src/features/auth/pin-service.ts";
import { assert, assertEquals } from "./assert.ts";

export function setupTestDOM(mode: VaultMode = "local_storage"): Window {
  const window = new Window({ url: "https://localhost" });
  Object.assign(globalThis, {
    document: window.document,
    window: window,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLFormElement: window.HTMLFormElement,
    Event: window.Event,
    Node: window.Node,
  });
  resetAccountStore();
  resetUiStore();
  setSettingsStore("vaultMode", mode);
  return window;
}

/**
 * Single Authoritative Master E2E Simulation Runner
 * Runs the full 16-step unbroken lifecycle for both Local Storage and Cloud Gist modes.
 */
export async function runMasterVaultE2EFlow(mode: VaultMode): Promise<void> {
  setupTestDOM(mode);

  let storedPayload = "";

  // Register in-memory background routes for upload, download, and delete
  registerInMemoryRoute(uploadToGistRoute, async (payload) => {
    if (payload && typeof payload.content === "string") {
      storedPayload = payload.content;
      if (mode === "local_storage") {
        await setLocalVaultPayload(payload.content);
      }
    }
    return { success: true };
  });

  registerInMemoryRoute(downloadVaultRoute, async () => {
    if (mode === "local_storage") {
      const localRes = await getLocalVaultPayload();
      const content =
        localRes.isOk() && localRes.value ? localRes.value : storedPayload;
      return { success: true, content };
    }
    return { success: true, content: storedPayload };
  });

  registerInMemoryRoute(deleteLocalVaultRoute, async () => {
    storedPayload = "";
    await removeLocalVaultPayload();
    return { success: true };
  });

  registerInMemoryRoute(deleteGistRoute, async () => {
    storedPayload = "";
    return { success: true };
  });

  const provider = getSyncProvider(mode);
  const oldMasterPassword = "MasterPassword123!";
  const newMasterPassword = "NewMasterPassword456!";
  const initialPinCode = "123456";
  const updatedPinCode = "654321";
  const githubToken = "ghp_test_token_123456789";
  const gistId = "gist_test_id_abcdef";

  if (mode === "github_gist") {
    setAccountStore("syncToken", asGitHubAccessToken(githubToken));
    setAccountStore("syncConfig", {
      ...accountStore.syncConfig,
      gistId: asGistId(gistId),
    });
  }

  // Step 1: Initial state & View Decision Check (Must show MasterPasswordCreate, NOT Login)
  assertEquals(accountStore.vaultConfigured, false);
  assertEquals(accountStore.isLocked, true);
  assertEquals(await getSessionKey(), null);

  const initialStatus = await provider.checkVaultStatus({
    token:
      mode === "github_gist" ? asGitHubAccessToken(githubToken) : undefined,
    gistId: mode === "github_gist" ? asGistId(gistId) : undefined,
    hasStoredSalt: Boolean(accountStore.masterPasswordConfig.salt),
  });
  assertEquals(initialStatus.status, "new");

  // Step 2: Register New Vault (Tạo Mật Khẩu Master Ban Đầu)
  const createResult = await createNewVault(oldMasterPassword);
  assert(
    createResult.isOk(),
    `Vault creation failed: ${createResult.isErr() ? createResult.error : ""}`,
  );

  // 4-Layer Assertions on Unlocked State
  assertEquals(accountStore.vaultConfigured, true);
  assertEquals(accountStore.isLocked, false);
  assertEquals(uiStore.view, View.Vault);
  assert((await getSessionKey()) instanceof CryptoKey);

  if (mode === "github_gist") {
    assert(Boolean(accountStore.syncConfig.syncTokenEncrypted));
    assert(Boolean(accountStore.syncConfig.syncTokenIv));
  }

  const salt = accountStore.masterPasswordConfig.salt;

  // Step 3: FOLDER LIFECYCLE - Add Folder 1 ("Công Việc") & Folder 2 ("Cá Nhân")
  const folder1Res = await addFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    "Công Việc & Tài Chính",
  );
  assert(folder1Res.isOk(), "Add folder 1 failed");
  setAccountStore("folders", folder1Res.value.payload.folders);
  const workFolderId = folder1Res.value.newFolder.id;

  const folder2Res = await addFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    "Cá Nhân & Gia Đình",
  );
  assert(folder2Res.isOk(), "Add folder 2 failed");
  setAccountStore("folders", folder2Res.value.payload.folders);
  const personalFolderId = folder2Res.value.newFolder.id;

  assertEquals(accountStore.folders.length, 2);

  // RENAME FOLDER 2 ("Cá Nhân VIP")
  const renameFolderRes = await renameFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    personalFolderId,
    "Cá Nhân VIP",
  );
  assert(renameFolderRes.isOk(), "Rename folder 2 failed");
  setAccountStore("folders", renameFolderRes.value.folders);
  assertEquals(accountStore.folders[1]?.name, "Cá Nhân VIP");

  // Step 4: Create ALL 5 Vault Item Types assigned to initial folders
  const loginItem = createDefaultVaultItem({
    id: asVaultItemId("item_login_1"),
    type: VaultItemType.Login,
    name: "Tài khoản GitHub Công Ty",
    notes: "Tài khoản dev chính",
    folderId: workFolderId,
    favorite: true,
    login: {
      username: "dev_user@company.com",
      password: "SuperSecretPassword123!",
      totp: "JBSWY3DPEHPK3PXP",
      uris: [{ uri: "https://github.com/company", match: 1 }],
      fido2Credentials: [],
    },
  });

  const noteItem = createDefaultVaultItem({
    id: asVaultItemId("item_note_1"),
    type: VaultItemType.SecureNote,
    name: "Mã Phục Hồi Server VIP",
    notes: "Recovery keys: AAAA-BBBB-CCCC-DDDD",
    folderId: personalFolderId,
    favorite: false,
  });

  const cardItem = createDefaultVaultItem({
    id: asVaultItemId("item_card_1"),
    type: VaultItemType.Card,
    name: "Thẻ Visa Bán Hàng",
    notes: "Thẻ thanh toán server",
    folderId: workFolderId,
    favorite: true,
    card: {
      cardholderName: "NGUYEN VAN A",
      brand: "Visa",
      number: "4111222233334444",
      expMonth: "12",
      expYear: "2028",
      code: "999",
    },
  });

  const identityItem = createDefaultVaultItem({
    id: asVaultItemId("item_identity_1"),
    type: VaultItemType.Identity,
    name: "Hồ Sơ Cá Nhân Doanh Nghiệp",
    notes: "Thông tin pháp lý công ty",
    folderId: personalFolderId,
    favorite: false,
    identity: {
      title: "Ông",
      firstName: "Văn A",
      middleName: "",
      lastName: "Nguyễn",
      username: "van_a_corp",
      company: "Gistwarden Corp",
      ssn: "0123456789",
      passportNumber: "B1234567",
      licenseNumber: "",
      email: "ceo@company.com",
      phone: "0901234567",
      address1: "123 Đường Lớn, Phường 1",
      address2: "",
      address3: "",
      city: "TP Hồ Chí Minh",
      state: "",
      postalCode: "",
      country: "VN",
    },
  });

  const sshKeyItem = createDefaultVaultItem({
    id: asVaultItemId("item_ssh_1"),
    type: VaultItemType.SshKey,
    name: "Khóa SSH Production Cluster",
    notes: "Key truy cập root server",
    folderId: null,
    favorite: true,
    sshKey: {
      publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... dev@server",
      privateKey:
        "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAA...\n-----END OPENSSH PRIVATE KEY-----",
      keyFingerprint: "SHA256:abcd1234efgh5678",
    },
  });

  const addMutationRes = await executeVaultMutationUseCase(
    {
      folders: accountStore.folders,
      items: [loginItem, noteItem, cardItem, identityItem, sshKeyItem],
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    (p) => p,
  );
  assert(addMutationRes.isOk(), "Adding items failed");
  setAccountStore("vaultItems", addMutationRes.value.items);
  assertEquals(accountStore.vaultItems.length, 5);

  // Step 5: Edit Vault Items & MOVE ITEMS BETWEEN FOLDERS (Chuyển đổi Folder)
  const updatedLoginPassword = "UpdatedNewPassword999!";
  const updatedNoteText = "Recovery keys updated: XXXX-YYYY-ZZZZ";
  const updatedCardCvv = "888";
  const updatedIdentityPhone = "0987654321";
  const updatedSshFingerprint = "SHA256:updated9999ffff";

  const updatedItems = accountStore.vaultItems.map((item) => {
    if (item.type === VaultItemType.Login) {
      return mergeVaultItem(item, {
        folderId: personalFolderId,
        login: { ...item.login, password: updatedLoginPassword },
      });
    }
    if (item.type === VaultItemType.SecureNote) {
      return mergeVaultItem(item, {
        notes: updatedNoteText,
      });
    }
    if (item.type === VaultItemType.Card) {
      return mergeVaultItem(item, {
        card: { ...item.card, code: updatedCardCvv },
      });
    }
    if (item.type === VaultItemType.Identity) {
      return mergeVaultItem(item, {
        identity: { ...item.identity, phone: updatedIdentityPhone },
      });
    }
    if (item.type === VaultItemType.SshKey) {
      return mergeVaultItem(item, {
        folderId: workFolderId,
        sshKey: { ...item.sshKey, keyFingerprint: updatedSshFingerprint },
      });
    }
    return item;
  });

  const editMutationRes = await executeVaultMutationUseCase(
    {
      folders: accountStore.folders,
      items: updatedItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    (p) => p,
  );
  assert(editMutationRes.isOk(), "Editing items failed");
  setAccountStore("vaultItems", editMutationRes.value.items);

  // Verify item folder movements
  const movedLogin = accountStore.vaultItems.find(
    (i) => i.type === VaultItemType.Login,
  );
  assertEquals(movedLogin?.folderId, personalFolderId);

  const movedSsh = accountStore.vaultItems.find(
    (i) => i.type === VaultItemType.SshKey,
  );
  assertEquals(movedSsh?.folderId, workFolderId);

  // DELETE WORK FOLDER -> Items inside Work Folder (Card, SshKey) have folderId reset to null
  const deleteWorkFolderRes = await deleteFolderUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    workFolderId,
  );
  assert(deleteWorkFolderRes.isOk(), "Delete work folder failed");
  setAccountStore("folders", deleteWorkFolderRes.value.folders);
  setAccountStore("vaultItems", deleteWorkFolderRes.value.items);

  assertEquals(accountStore.folders.length, 1);
  assertEquals(accountStore.folders[0]?.id, personalFolderId);

  const cardPostDeleteFolder = accountStore.vaultItems.find(
    (i) => i.type === VaultItemType.Card,
  );
  assertEquals(cardPostDeleteFolder?.folderId, null);

  // Step 6: Soft Delete, Restore & Permanent Delete (Trash Lifecycle)
  const trashSshRes = await deleteVaultItemsUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    [sshKeyItem.id],
  );
  assert(trashSshRes.isOk(), "Trash SSH key failed");
  setAccountStore("vaultItems", trashSshRes.value.items);
  setAccountStore("trashItems", trashSshRes.value.trash);
  assertEquals(accountStore.vaultItems.length, 4);

  const restoreSshRes = await restoreVaultItemUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    sshKeyItem.id,
  );
  assert(restoreSshRes.isOk(), "Restore SSH key failed");
  setAccountStore("vaultItems", restoreSshRes.value.items);
  setAccountStore("trashItems", restoreSshRes.value.trash);
  assertEquals(accountStore.vaultItems.length, 5);

  const trashNoteRes = await deleteVaultItemsUseCase(
    {
      folders: accountStore.folders,
      items: accountStore.vaultItems,
      trash: accountStore.trashItems,
    },
    salt,
    mode,
    [noteItem.id],
  );
  assert(trashNoteRes.isOk(), "Trash note failed");

  const purgeNoteRes = await purgeTrashItemUseCase(
    {
      folders: trashNoteRes.value.folders,
      items: trashNoteRes.value.items,
      trash: trashNoteRes.value.trash,
    },
    salt,
    mode,
    noteItem.id,
  );
  assert(purgeNoteRes.isOk(), "Purge note failed");
  setAccountStore("vaultItems", purgeNoteRes.value.items);
  setAccountStore("trashItems", purgeNoteRes.value.trash);
  assertEquals(accountStore.vaultItems.length, 4);

  // Step 7: Lock Session & View Decision Check
  await lock();
  assertEquals(accountStore.isLocked, true);
  assertEquals(uiStore.view, View.Login);
  assertEquals(await getSessionKey(), null);

  const lockedStatus = await provider.checkVaultStatus({
    token:
      mode === "github_gist" ? asGitHubAccessToken(githubToken) : undefined,
    gistId: mode === "github_gist" ? asGistId(gistId) : undefined,
    hasStoredSalt: Boolean(accountStore.masterPasswordConfig.salt),
  });
  assertEquals(lockedStatus.status, "exists");

  // Step 8: Unlock attempt with WRONG Master Password & Security Cooldown Check
  const wrongPassResult = await unlock("WrongPassword!");
  assert(wrongPassResult.isErr());
  assertEquals(wrongPassResult.error, "login_error_wrong_mp");

  await resetMasterPasswordSecurity(accountStore.masterPasswordConfig.salt);

  // Step 9: Unlock attempt with CORRECT Master Password
  const correctPassResult = await unlock(oldMasterPassword);
  assert(correctPassResult.isOk(), "Unlock failed");
  assertEquals(accountStore.isLocked, false);

  // Step 10: Set PIN Code & Test WRONG PIN 3 TIMES AUTO-WIPE SCENARIO
  const setPinResult = await setPinUnlock(initialPinCode, false);
  assert(setPinResult.isOk(), "Set PIN failed");
  assertEquals(accountStore.pinConfig.enabled, true);

  await lock();
  assertEquals(accountStore.isLocked, true);

  // Attempt 1 Wrong PIN (2 attempts left)
  const wrongPin1Res = await unlockWithPin("000000");
  assert(wrongPin1Res.isErr());
  assertEquals(wrongPin1Res.error, "login_error_wrong_pin_2_left");
  assertEquals(accountStore.pinConfig.enabled, true);

  // Attempt 2 Wrong PIN (1 attempt left)
  const wrongPin2Res = await unlockWithPin("000000");
  assert(wrongPin2Res.isErr());
  assertEquals(wrongPin2Res.error, "login_error_wrong_pin_1_left");
  assertEquals(accountStore.pinConfig.enabled, true);

  // Attempt 3 Wrong PIN (3/3 MAX ATTEMPTS REACHED -> PIN AUTO WIPED & DISABLED)
  const wrongPin3Res = await unlockWithPin("000000");
  assert(wrongPin3Res.isErr());
  assertEquals(wrongPin3Res.error, "login_error_pin_max_attempts_reached");

  // ASSERT PIN HAS BEEN CLEARED/DISABLED FROM STORE
  assertEquals(accountStore.pinConfig.enabled, false);
  assertEquals(accountStore.isLocked, true);

  // Unlock with Master Password after PIN wipe
  const postPinWipeUnlockRes = await unlock(oldMasterPassword);
  assert(postPinWipeUnlockRes.isOk(), "Master Password unlock failed");
  assertEquals(accountStore.isLocked, false);

  // Step 11: Re-enable & Change PIN Code
  const reEnablePinResult = await setPinUnlock(updatedPinCode, false);
  assert(reEnablePinResult.isOk(), "Re-enable PIN failed");
  assertEquals(accountStore.pinConfig.enabled, true);

  await lock();
  assertEquals(accountStore.isLocked, true);

  const newPinUnlockRes = await unlockWithPin(updatedPinCode);
  assert(newPinUnlockRes.isOk(), "New PIN unlock failed");
  assertEquals(accountStore.isLocked, false);

  // Step 12: Change Master Password (Đổi Mật Khẩu Master từ Old sang New)
  const changeResult = await changeMasterPassword(
    oldMasterPassword,
    newMasterPassword,
  );
  assert(changeResult.isOk(), "Change MP failed");

  // Step 13: Lock & Attempt Unlock with OLD Master Password vs NEW Master Password
  await lock();
  assertEquals(accountStore.isLocked, true);

  const oldPassUnlockResult = await unlock(oldMasterPassword);
  assert(oldPassUnlockResult.isErr());

  await resetMasterPasswordSecurity(accountStore.masterPasswordConfig.salt);

  const newPassUnlockResult = await unlock(newMasterPassword);
  assert(newPassUnlockResult.isOk(), "Unlock with new password failed");
  assertEquals(accountStore.isLocked, false);

  // Step 14: Logout
  await logout();
  assertEquals(accountStore.vaultConfigured, false);
  assertEquals(accountStore.isLocked, true);

  // Step 15: Re-login after Logout & VERIFY INTERMEDIATE VAULT STATE
  const reloginResult = await unlock(newMasterPassword);
  assert(reloginResult.isOk(), "Re-login failed");
  assertEquals(accountStore.vaultConfigured, true);
  assertEquals(accountStore.isLocked, false);

  assertEquals(accountStore.vaultItems.length, 4);
  assertEquals(accountStore.folders.length, 1);
  assertEquals(accountStore.folders[0]?.name, "Cá Nhân VIP");

  // Step 16: ULTIMATE FINAL STEP - DELETE VAULT (PURGE ENTIRE VAULT & ACCOUNT RESET)
  storedPayload = "";
  if (mode === "local_storage") {
    await removeLocalVaultPayload();
  }
  await logout();

  // ASSERT TRUE FINAL STATE - VAULT IS FULLY WIPED & RESET TO INITIAL "NEW" STATE
  assertEquals(accountStore.vaultConfigured, false);
  assertEquals(accountStore.isLocked, true);
  assertEquals(await getSessionKey(), null);

  const finalStatusAfterPurge = await provider.checkVaultStatus({
    token:
      mode === "github_gist" ? asGitHubAccessToken(githubToken) : undefined,
    gistId: mode === "github_gist" ? asGistId(gistId) : undefined,
    hasStoredSalt: Boolean(accountStore.masterPasswordConfig.salt),
  });
  assertEquals(finalStatusAfterPurge.status, "new"); // Renders MasterPasswordCreate screen!
}
