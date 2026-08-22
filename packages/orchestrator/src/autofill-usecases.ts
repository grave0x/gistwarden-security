import {
  type CheckAutofillSuggestionResponse,
  filterMatchingDomainItems,
  getBaseDomain,
  getDomainFromItem,
  isLoginItem,
  MSG_SHOW_NOTIFICATION_BAR,
  type SaveActionPayload,
  SaveActionPayloadSchema,
  STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
  VaultItemType,
} from "@gistwarden/domain";
import {
  DEFAULT_EXCLUDED_DOMAINS,
  getActiveVaultMode,
  getExtensionSettings,
  getLocalItem,
  removeLocalItem,
  setLocalItem,
} from "@gistwarden/repository";
import { z } from "zod";
import { sendMessageToTab } from "./messaging.ts";
import { pendingNotificationManager } from "./pending-notification-manager.ts";
import {
  batchSavePayloads,
  getDecryptedVaultItems,
} from "./vault-mutation-usecases.ts";
import { vaultSecurityContext } from "./vault-security-state.ts";

const SubmittedCredentialsSchema = z
  .object({
    domain: z.string(),
    url: z.string(),
    username: z.string(),
    password: z.string(),
  })
  .readonly();

export function isDomainExcluded(
  domainOrUrl: string,
  excludedList?: readonly string[],
): boolean {
  if (!domainOrUrl) return false;
  const list =
    excludedList && excludedList.length > 0
      ? excludedList
      : DEFAULT_EXCLUDED_DOMAINS;
  const normalized = domainOrUrl.toLowerCase().trim();
  return list.some((ex) => {
    const cleanEx = ex
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!cleanEx) return false;
    return normalized.includes(cleanEx) || cleanEx.includes(normalized);
  });
}

export async function processSubmittedCredentialsUseCase(
  rawCreds: unknown,
  tabId: number,
): Promise<void> {
  const parseRes = SubmittedCredentialsSchema.safeParse(rawCreds);
  if (!parseRes.success) return;
  const creds = parseRes.data;

  const cleanPassword = creds.password.trim();
  if (!cleanPassword) return;

  if (/^\d{6}$/.test(cleanPassword)) return;

  const settingsRes = await getExtensionSettings();
  const excludedList = settingsRes.isOk()
    ? settingsRes.value.excludedDomains
    : DEFAULT_EXCLUDED_DOMAINS;

  const domain = creds.domain || getBaseDomain(creds.url);
  if (
    isDomainExcluded(domain, excludedList) ||
    isDomainExcluded(creds.url, excludedList)
  ) {
    return;
  }

  const key = await vaultSecurityContext.getKey();
  const vaultData = key ? await getDecryptedVaultItems(key) : null;
  const items = vaultData ? vaultData.items : [];
  const normalizedUser = creds.username.toLowerCase().trim();

  const domainItems = items.filter((item) => {
    if (!isLoginItem(item)) return false;
    const itemDomain = getDomainFromItem(item);
    if (!itemDomain) return false;
    return getBaseDomain(itemDomain) === domain;
  });

  const matchingUserItem = domainItems.find((item) => {
    if (!isLoginItem(item)) return false;
    return (item.login.username || "").toLowerCase().trim() === normalizedUser;
  });

  let notificationPayload: unknown = null;

  if (matchingUserItem && isLoginItem(matchingUserItem)) {
    if (matchingUserItem.login.password === creds.password) {
      return;
    }
    notificationPayload = {
      actionType: "update",
      domain,
      username: creds.username,
      password: creds.password,
      itemId: matchingUserItem.id,
    };
  } else {
    notificationPayload = {
      actionType: "add",
      domain,
      username: creds.username,
      password: creds.password,
    };
  }

  await pendingNotificationManager.setTabNotification(tabId, {
    payload: notificationPayload,
    timestamp: Date.now(),
  });
  await pendingNotificationManager.setGlobalNotification({
    payload: notificationPayload,
    timestamp: Date.now(),
    domain,
  });

  setTimeout(async () => {
    const currentPending =
      await pendingNotificationManager.getTabNotification(tabId);
    if (currentPending && currentPending.payload === notificationPayload) {
      sendMessageToTab(tabId, {
        type: MSG_SHOW_NOTIFICATION_BAR,
        payload: notificationPayload,
      });
    }
  }, 300);
}

let isProcessingPendingQueue = false;

export async function processPendingUnapprovedCredentialsUseCase(): Promise<void> {
  if (isProcessingPendingQueue) return;
  isProcessingPendingQueue = true;

  const pendingRes = await getLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS);
  if (
    pendingRes.isErr() ||
    !Array.isArray(pendingRes.value) ||
    pendingRes.value.length === 0
  ) {
    isProcessingPendingQueue = false;
    return;
  }
  const pendingItems = pendingRes.value;

  await removeLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS);
  await pendingNotificationManager.clearAll();

  const key = await vaultSecurityContext.getKey();
  const vaultData = key ? await getDecryptedVaultItems(key) : null;
  if (!vaultData) {
    isProcessingPendingQueue = false;
    return;
  }

  const validPayloads: SaveActionPayload[] = [];

  for (const rawItem of pendingItems) {
    const parsed = SaveActionPayloadSchema.safeParse(rawItem);
    if (parsed.success) {
      validPayloads.push(parsed.data);
    }
  }

  if (validPayloads.length > 0) {
    const activeMode = await getActiveVaultMode();
    await batchSavePayloads(vaultData, validPayloads, activeMode);
  }

  isProcessingPendingQueue = false;
}

export async function saveCredentialActionUseCase(
  rawPayload: unknown,
): Promise<boolean> {
  const parseRes = SaveActionPayloadSchema.safeParse(rawPayload);
  if (!parseRes.success) return false;
  const payload = parseRes.data;

  const key = await vaultSecurityContext.getKey();
  const vaultData = key ? await getDecryptedVaultItems(key) : null;
  if (!vaultData) {
    const rawPendingRes = await getLocalItem(
      STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
    );
    const rawPending = rawPendingRes.isOk() ? rawPendingRes.value : null;
    const pendingList: unknown[] = Array.isArray(rawPending) ? rawPending : [];
    pendingList.push(payload);
    await setLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS, pendingList);

    return true;
  }

  const rawPendingRes = await getLocalItem(
    STORAGE_KEY_UNAPPROVED_PENDING_LOGINS,
  );
  const rawPending = rawPendingRes.isOk() ? rawPendingRes.value : null;
  await removeLocalItem(STORAGE_KEY_UNAPPROVED_PENDING_LOGINS);

  const pendingList: unknown[] = Array.isArray(rawPending) ? rawPending : [];
  pendingList.push(payload);

  const validPayloads: SaveActionPayload[] = [];
  for (const rawItem of pendingList) {
    const pRes = SaveActionPayloadSchema.safeParse(rawItem);
    if (pRes.success) {
      validPayloads.push(pRes.data);
    }
  }

  const activeMode = await getActiveVaultMode();
  return await batchSavePayloads(vaultData, validPayloads, activeMode);
}

export async function checkAutofillSuggestionUseCase(
  domainStr?: string,
): Promise<CheckAutofillSuggestionResponse> {
  if (!domainStr) {
    return { success: false, reason: "invalid_domain" };
  }

  const settingsRes = await getExtensionSettings();
  const excludedList = settingsRes.isOk()
    ? settingsRes.value.excludedDomains
    : DEFAULT_EXCLUDED_DOMAINS;

  if (isDomainExcluded(domainStr, excludedList)) {
    return { success: false, reason: "excluded_domain" };
  }

  const key = await vaultSecurityContext.getKey();
  const vaultData = key ? await getDecryptedVaultItems(key) : null;
  if (!vaultData) {
    return { success: false, reason: "locked" };
  }

  const matches = filterMatchingDomainItems(
    vaultData.items,
    domainStr,
    VaultItemType.Login,
  );

  const matchingAccounts = matches.filter(isLoginItem).map((m) => ({
    itemId: m.id,
    name: m.name,
    username: m.login.username || "",
    password: m.login.password || "",
    totp: m.login.totp || "",
    fields: m.fields || [],
  }));

  const bestMatch = matchingAccounts[0];
  if (matchingAccounts.length === 0 || !bestMatch) {
    return { success: false, reason: "no_matches" };
  }

  return {
    success: true,
    payload: {
      actionType: "autofill",
      domain: domainStr,
      username: bestMatch.username,
      password: bestMatch.password,
      totp: bestMatch.totp,
      fields: bestMatch.fields,
      accounts: matchingAccounts,
    },
  };
}
