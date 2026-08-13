import {
  LOCAL_STORAGE_KEY_THEME,
  STORE_KEY_CONFIRM_MODAL,
  STORE_KEY_GLOBAL_LOADING,
  STORE_KEY_GLOBAL_LOADING_TEXT,
  STORE_KEY_REPROMPT_MODAL,
  STORE_KEY_TOAST_MESSAGE,
  STORE_KEY_TOAST_TYPE,
  SupportLanguage,
  type TranslationKey,
} from "@gistwarden/domain";
import { syncTimeOffsetUseCase } from "@gistwarden/orchestrator";
import {
  type ConfirmType,
  setLocalItem,
  type ToastType,
  updateExtensionSettings,
} from "@gistwarden/repository";
import { err, ok, type Result } from "neverthrow";
import { writeClipboardText } from "@/core/clipboard-utils.ts";
import { setLanguage, t } from "@/core/i18n.ts";
import { setSettingsStore, setUiStore, uiStore } from "@/core/store.ts";

import { logout } from "@/features/auth/auth-service.ts";

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function handleGlobalApiError(errorKey?: TranslationKey): boolean {
  if (errorKey === "network_error_unauthorized") {
    showToast(t("network_error_unauthorized"), "error");
    setTimeout(async () => {
      await logout();
      if (
        typeof window !== "undefined" &&
        window.location.search.includes("mode=fido2-prompt")
      ) {
        window.close();
      }
    }, 1500);
    return true;
  }
  return false;
}

export function showToast(message: string, type: ToastType = "success") {
  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  setUiStore({
    [STORE_KEY_TOAST_MESSAGE]: message,
    [STORE_KEY_TOAST_TYPE]: type,
  });
  toastTimeoutId = setTimeout(() => {
    setUiStore(STORE_KEY_TOAST_MESSAGE, "");
  }, 2000);
}

export async function copyToClipboardWithMessage(
  text: string,
  successMessageKey: TranslationKey = "detail_copied",
) {
  if (!text) return;
  const copyRes = await writeClipboardText(text);

  if (copyRes.isErr()) {
    showToast(t(copyRes.error), "error");
    return;
  }

  showToast(t(successMessageKey), "success");
}

export function setGlobalLoading(val: boolean, text = "") {
  setUiStore({
    [STORE_KEY_GLOBAL_LOADING]: val,
    [STORE_KEY_GLOBAL_LOADING_TEXT]: text,
  });
}

export function confirm(
  title: string,
  message: string,
  type: ConfirmType = "info",
  hideCancel = false,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setUiStore(STORE_KEY_CONFIRM_MODAL, {
      isOpen: true,
      title,
      message,
      type,
      hideCancel,
      resolve,
    });
  });
}

export function alert(
  title: string,
  message: string,
  type: ConfirmType = "warning",
): Promise<boolean> {
  return confirm(title, message, type, true);
}

export function resolveConfirm(result: boolean) {
  const modal = uiStore.confirmModal;
  if (modal.resolve) {
    modal.resolve(result);
  }
  setUiStore(STORE_KEY_CONFIRM_MODAL, {
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    hideCancel: false,
    resolve: null,
  });
}

export function requestReprompt(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    setUiStore(STORE_KEY_REPROMPT_MODAL, {
      isOpen: true,
      resolve,
    });
  });
}

export function resolveReprompt(success: boolean) {
  const modal = uiStore.repromptModal;
  if (modal.resolve) {
    modal.resolve(success);
  }
  setUiStore(STORE_KEY_REPROMPT_MODAL, {
    isOpen: false,
    resolve: null,
  });
}

export async function updateLanguage(lang: "en" | "vi") {
  setSettingsStore("language", lang);
  setLanguage(lang === "vi" ? SupportLanguage.Vi : SupportLanguage.En);
  await updateExtensionSettings({ language: lang });
}

export async function updateTheme(newTheme: "dark" | "light") {
  setSettingsStore("theme", newTheme);
  if (newTheme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  await setLocalItem(LOCAL_STORAGE_KEY_THEME, newTheme);
}

export async function syncTimeOffset(): Promise<Result<void, TranslationKey>> {
  const syncRes = await syncTimeOffsetUseCase();
  if (syncRes.isOk()) {
    console.log(`[Store] Time sync successful. Offset: ${syncRes.value}ms`);
    setSettingsStore("timeOffset", syncRes.value);
    return ok();
  }
  return err(syncRes.error);
}
