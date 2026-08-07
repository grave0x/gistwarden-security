import { type Component, Show } from "solid-js";
import { VaultItemType } from "@gistwarden/domain";
import type { VaultItem, VaultItemId } from "@gistwarden/domain";
import { CopyIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";
import { getVaultItemStrategy } from "@/features/vault/registry/vault-item-registry.ts";

interface VaultItemCopyMenuProps {
  item: VaultItem;
  activeMenuId: VaultItemId | "";
  onToggleMenu: (itemId: VaultItemId, e: MouseEvent) => void;

  onCopyText: (text: string, type: string, e: MouseEvent) => void;
  onCopyTotpDirect: (item: VaultItem, e: MouseEvent) => void;
}



export const VaultItemCopyMenu: Component<VaultItemCopyMenuProps> = (
  props,
) => {
  const strategy = () => getVaultItemStrategy(props.item.type);
  const isNotes = () => props.item.type === VaultItemType.SecureNote;

  return (
    <>
      {/* Copy Button Trigger */}
      <button
        class="action-btn"
        title={isNotes() ? t("vault_copy_notes") : t("vault_copy_options")}
        onClick={(e) => {
          if (isNotes()) {
            props.onCopyText(
              props.item.notes || "",
              t("edit_type_note"),
              e,
            );
          } else {
            props.onToggleMenu(props.item.id, e);
          }
        }}
      >
        <CopyIcon />
      </button>

      {/* Copy Options Menu Overlay */}
      <Show when={props.activeMenuId === props.item.id}>
        <div class="copy-dropdown" onClick={(e) => e.stopPropagation()}>
          {strategy().renderCopyMenu?.({
            item: props.item,
            onCopyText: props.onCopyText,
            onCopyTotpDirect: props.onCopyTotpDirect,
          })}
        </div>
      </Show>
    </>
  );
};
