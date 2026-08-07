import { type Component, Show } from "solid-js";
import {
  isSecureNoteItem,
  type SecureNoteVaultItem,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import { NoteIcon } from "@/icons/svg/index.ts";
import NoteDetailFields from "@/features/vault/item-detail/NoteDetailFields.tsx";
import NoteEditFields from "@/features/vault/item-edit/NoteEditFields.tsx";
import type {
  CopyMenuProps,
  DetailComponentProps,
  EditComponentProps,
  VaultItemStrategy,
} from "../vault-item-types.ts";

export const NoteCopyMenu: Component<CopyMenuProps> = (props) => {
  return (
    <Show when={props.item.notes}>
      <div
        class="dropdown-item"
        onClick={(e) => props.onCopyText(props.item.notes || "", "notes", e)}
      >
        {t("vault_copy_notes")}
      </div>
    </Show>
  );
};

export const noteStrategy: VaultItemStrategy = {
  type: VaultItemType.SecureNote,
  getAddTitle: () => t("edit_title_add_note"),
  getEditTitle: () => t("edit_title_edit_note"),
  getDetailTitle: () => t("detail_title_note"),
  getToastMsg: (isEdit: boolean) =>
    isEdit ? t("edit_toast_updated_note") : t("edit_toast_created_note"),
  renderIcon: (_item: VaultItem) => {
    return <NoteIcon />;
  },
  getSubtitle: (_item: VaultItem) => {
    return "";
  },
  DetailComponent: (props: DetailComponentProps) => {
    const noteItem = (): SecureNoteVaultItem | null =>
      isSecureNoteItem(props.item) ? props.item : null;
    return (
      <Show when={noteItem()}>
        {(item) => <NoteDetailFields item={item()} />}
      </Show>
    );
  },
  EditComponent: (props: EditComponentProps) => {
    return (
      <NoteEditFields
        formState={props.formState}
        updateForm={props.updateForm}
      />
    );
  },
  renderCopyMenu: NoteCopyMenu,
};
