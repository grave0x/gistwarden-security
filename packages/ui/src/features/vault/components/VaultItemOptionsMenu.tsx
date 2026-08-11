import type { VaultItem, VaultItemId } from "@gistwarden/domain";
import { type Component, createEffect, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { openItem } from "@/core/navigation.ts";
import { View } from "@/core/types.ts";
import { MoreVerticalIcon } from "@/icons/svg/index.ts";

interface VaultItemOptionsMenuProps {
  item: VaultItem;
  activeOptionsMenuId: VaultItemId | "";
  contextMenuPos?: { x: number; y: number } | null;

  onToggleOptionsMenu: (itemId: VaultItemId, e: MouseEvent) => void;
  onSelectFromMenu?: (itemId: VaultItemId, e: MouseEvent) => void;
  onFavoriteItem: (item: VaultItem, e: MouseEvent) => void;
  onCloneItem: (item: VaultItem, e: MouseEvent) => void;
  onDeleteItem: (item: VaultItem, e: MouseEvent) => void;
}

export const VaultItemOptionsMenu: Component<VaultItemOptionsMenuProps> = (
  props,
) => {
  let menuRef: HTMLDivElement | undefined;

  createEffect(() => {
    const pos = props.contextMenuPos;
    const el = menuRef;
    if (pos && el && props.activeOptionsMenuId === props.item.id) {
      const windowWidth =
        typeof window !== "undefined" ? window.innerWidth : 400;
      const windowHeight =
        typeof window !== "undefined" ? window.innerHeight : 600;
      const x = Math.max(10, Math.min(pos.x, windowWidth - 160));
      const y = Math.max(10, Math.min(pos.y, windowHeight - 200));
      el.style.setProperty("--menu-x", `${x}px`);
      el.style.setProperty("--menu-y", `${y}px`);
    }
  });

  return (
    <>
      {/* Item Options Toggle Button */}
      <button
        class="action-btn"
        onClick={(e) => props.onToggleOptionsMenu(props.item.id, e)}
        title={t("vault_menu_more")}
      >
        <MoreVerticalIcon />
      </button>

      {/* Options Dropdown Overlay */}
      <Show when={props.activeOptionsMenuId === props.item.id}>
        <div
          ref={menuRef}
          class={`options-dropdown ${props.contextMenuPos ? "fixed-pos" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            class="dropdown-item"
            onClick={(e) => {
              e.stopPropagation();
              props.onSelectFromMenu?.(props.item.id, e);
            }}
          >
            {t("vault_menu_select")}
          </div>
          <div
            class="dropdown-item"
            onClick={(e) => props.onFavoriteItem(props.item, e)}
          >
            {props.item.favorite
              ? t("vault_menu_unfavorite")
              : t("vault_menu_favorites")}
          </div>
          <div
            class="dropdown-item"
            onClick={(e) => {
              e.stopPropagation();
              openItem(props.item, View.ItemEdit);
            }}
          >
            {t("btn_edit")}
          </div>
          <div
            class="dropdown-item"
            onClick={(e) => props.onCloneItem(props.item, e)}
          >
            {t("btn_clone")}
          </div>
          <div
            class="dropdown-item text-danger"
            onClick={(e) => props.onDeleteItem(props.item, e)}
          >
            {t("btn_delete")}
          </div>
        </div>
      </Show>
    </>
  );
};
