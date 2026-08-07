import { Show } from "solid-js";
import {
  type IdentityVaultItem,
  isIdentityItem,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import { IdentityIcon } from "@/icons/svg/index.ts";
import IdentityDetailFields from "@/features/vault/item-detail/IdentityDetailFields.tsx";
import IdentityEditFields from "@/features/vault/item-edit/IdentityEditFields.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";
import type {
  DetailComponentProps,
  EditComponentProps,
  VaultItemStrategy,
} from "../vault-item-types.ts";

export const identityStrategy: VaultItemStrategy = {
  type: VaultItemType.Identity,
  getTypeName: () => t("vault_item_identity"),
  getAddTitle: () => t("edit_title_add_identity"),
  getEditTitle: () => t("edit_title_edit_identity"),
  getDetailTitle: () => t("detail_title_identity"),
  getToastMsg: (isEdit: boolean) =>
    isEdit ? t("edit_toast_updated_identity") : t("edit_toast_created_identity"),
  renderIcon: (_item: VaultItem) => {
    return <IdentityIcon />;
  },
  getSubtitle: (item: VaultItem) => {
    if (isIdentityItem(item)) {
      const parts = [
        item.identity.title,
        item.identity.firstName,
        item.identity.middleName,
        item.identity.lastName,
      ].filter(Boolean);
      return parts.join(" ") || "Identity";
    }
    return "";
  },
  populateFormState: (item: VaultItem, state: ItemEditFormState) => {
    if (isIdentityItem(item)) {
      const id = item.identity;
      state.identityTitle = id.title ?? "";
      state.firstName = id.firstName ?? "";
      state.middleName = id.middleName ?? "";
      state.lastName = id.lastName ?? "";
      state.identityUsername = id.username ?? "";
      state.company = id.company ?? "";
      state.ssn = id.ssn ?? "";
      state.passportNumber = id.passportNumber ?? "";
      state.licenseNumber = id.licenseNumber ?? "";
      state.email = id.email ?? "";
      state.phone = id.phone ?? "";
      state.address1 = id.address1 ?? "";
      state.address2 = id.address2 ?? "";
      state.address3 = id.address3 ?? "";
      state.city = id.city ?? "";
      state.state = id.state ?? "";
      state.postalCode = id.postalCode ?? "";
      state.country = id.country ?? "";
    }
  },
  mapToPayload: (validatedForm: ItemEditFormState) => {
    return {
      identity: {
        title: validatedForm.identityTitle.trim(),
        firstName: validatedForm.firstName.trim(),
        middleName: validatedForm.middleName.trim(),
        lastName: validatedForm.lastName.trim(),
        username: validatedForm.identityUsername.trim(),
        company: validatedForm.company.trim(),
        ssn: validatedForm.ssn.trim(),
        passportNumber: validatedForm.passportNumber.trim(),
        licenseNumber: validatedForm.licenseNumber.trim(),
        email: validatedForm.email.trim(),
        phone: validatedForm.phone.trim(),
        address1: validatedForm.address1.trim(),
        address2: validatedForm.address2.trim(),
        address3: validatedForm.address3.trim(),
        city: validatedForm.city.trim(),
        state: validatedForm.state.trim(),
        postalCode: validatedForm.postalCode.trim(),
        country: validatedForm.country.trim(),
      },
    };
  },
  DetailComponent: (props: DetailComponentProps) => {
    const identityItem = (): IdentityVaultItem | null =>
      isIdentityItem(props.item) ? props.item : null;
    return (
      <Show when={identityItem()}>
        {(item) => <IdentityDetailFields item={item()} onCopy={props.onCopy} />}
      </Show>
    );
  },
  EditComponent: (props: EditComponentProps) => {
    return (
      <IdentityEditFields
        formState={props.formState}
        updateForm={props.updateForm}
      />
    );
  },
};
