import {
  isSshKeyItem,
  type SshKeyVaultItem,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import SshKeyDetailFields from "@/features/vault/item-detail/SshKeyDetailFields.tsx";
import SshKeyEditFields from "@/features/vault/item-edit/SshKeyEditFields.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";
import { SshKeyIcon } from "@/icons/svg/index.ts";
import type {
  CopyMenuProps,
  DetailComponentProps,
  EditComponentProps,
  VaultItemStrategy,
} from "../vault-item-types.ts";

export const SshKeyCopyMenu: Component<CopyMenuProps> = (props) => {
  const sshItem = (): SshKeyVaultItem | null =>
    isSshKeyItem(props.item) ? props.item : null;

  return (
    <Show when={sshItem()}>
      {(item) => (
        <>
          <Show when={item().sshKey.privateKey}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(
                  item().sshKey.privateKey || "",
                  t("detail_copy_ssh_private_key"),
                  e,
                )
              }
            >
              {t("detail_copy_ssh_private_key")}
            </div>
          </Show>
          <Show when={item().sshKey.publicKey}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(
                  item().sshKey.publicKey || "",
                  t("detail_copy_ssh_public_key"),
                  e,
                )
              }
            >
              {t("detail_copy_ssh_public_key")}
            </div>
          </Show>
          <Show when={item().sshKey.keyFingerprint}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(
                  item().sshKey.keyFingerprint || "",
                  t("detail_copy_ssh_fingerprint"),
                  e,
                )
              }
            >
              {t("detail_copy_ssh_fingerprint")}
            </div>
          </Show>
        </>
      )}
    </Show>
  );
};

export const sshKeyStrategy: VaultItemStrategy = {
  type: VaultItemType.SshKey,
  getTypeName: () => t("vault_item_ssh_key"),
  getAddTitle: () => t("edit_title_add_ssh_key"),
  getEditTitle: () => t("edit_title_edit_ssh_key"),
  getDetailTitle: () => t("detail_title_ssh_key"),
  getToastMsg: (isEdit: boolean) =>
    isEdit ? t("edit_toast_updated_ssh_key") : t("edit_toast_created_ssh_key"),
  renderIcon: (_item: VaultItem) => {
    return <SshKeyIcon />;
  },
  getSubtitle: (item: VaultItem) => {
    if (isSshKeyItem(item)) {
      return item.sshKey.keyFingerprint || "SSH Key";
    }
    return "";
  },
  populateFormState: (item: VaultItem, state: ItemEditFormState) => {
    if (isSshKeyItem(item)) {
      const ssh = item.sshKey;
      state.sshPrivateKey = ssh.privateKey ?? "";
      state.sshPublicKey = ssh.publicKey ?? "";
      state.sshFingerprint = ssh.keyFingerprint ?? "";
    }
  },
  mapToPayload: (validatedForm: ItemEditFormState) => {
    return {
      sshKey: {
        privateKey: validatedForm.sshPrivateKey.trim(),
        publicKey: validatedForm.sshPublicKey.trim(),
        keyFingerprint: validatedForm.sshFingerprint.trim(),
      },
    };
  },
  DetailComponent: (props: DetailComponentProps) => {
    const sshItem = (): SshKeyVaultItem | null =>
      isSshKeyItem(props.item) ? props.item : null;
    return (
      <Show when={sshItem()}>
        {(item) => <SshKeyDetailFields item={item()} onCopy={props.onCopy} />}
      </Show>
    );
  },
  EditComponent: (props: EditComponentProps) => {
    return (
      <SshKeyEditFields
        formState={props.formState}
        updateForm={props.updateForm}
      />
    );
  },
  renderCopyMenu: SshKeyCopyMenu,
};
