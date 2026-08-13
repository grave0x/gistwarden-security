import type { VaultItem } from "@gistwarden/domain";
import {
  SESSION_KEY_LAST_SELECTED_ITEM_ID,
  SESSION_KEY_LAST_VIEW,
  STORE_KEY_SELECTED_ITEM,
  View,
} from "@gistwarden/domain";
import {
  removeSessionStorageUseCase,
  setSessionStorageUseCase,
} from "@gistwarden/orchestrator";
import { getPathView, getViewPath } from "@/core/router.ts";
import { setUiStore } from "@/core/store.ts";
import { requestReprompt } from "./ui-service.ts";

type NavigatorFn = (to: string, options?: { replace?: boolean }) => void;

export class NavigationManager {
  private activeNavigator: NavigatorFn | null = null;

  public setNavigator(navigator: NavigatorFn): void {
    this.activeNavigator = navigator;
  }

  public getNavigator(): NavigatorFn | null {
    return this.activeNavigator;
  }

  public navigate(to: string): void {
    if (this.activeNavigator) {
      this.activeNavigator(to);
    }
  }
}

export const navigationManager = new NavigationManager();

export function setActiveNavigator(navigator: NavigatorFn): void {
  navigationManager.setNavigator(navigator);
}

export function navigatePath(newPath: string): void {
  const targetView = getPathView(newPath);
  setUiStore("view", targetView);

  navigationManager.navigate(newPath);

  const skipViews = [View.Login, View.Welcome, View.Fido2Prompt];
  if (!skipViews.includes(targetView)) {
    void setSessionStorageUseCase(SESSION_KEY_LAST_VIEW, targetView);
    if (targetView !== View.ItemDetail && targetView !== View.ItemEdit) {
      void removeSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID);
    }
  }
}

export function navigate(newView: View): void {
  const targetPath = getViewPath(newView);
  navigatePath(targetPath);
}

function setCurrentSelectedItem(
  item: VaultItem | null,
  targetView: View = View.ItemDetail,
): void {
  setUiStore(STORE_KEY_SELECTED_ITEM, item);
  if (item) {
    navigate(targetView);
    void setSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID, item.id);
  } else {
    void removeSessionStorageUseCase(SESSION_KEY_LAST_SELECTED_ITEM_ID);
  }
}

export function selectItem(
  item: VaultItem | null,
  targetView: View = View.ItemDetail,
): void {
  setCurrentSelectedItem(item, targetView);
}

export async function openItem(
  item: VaultItem,
  targetView: View = View.ItemDetail,
): Promise<void> {
  if (item.reprompt === 1) {
    const authorized = await requestReprompt();
    if (!authorized) return;
  }
  setCurrentSelectedItem(item, targetView);
}
