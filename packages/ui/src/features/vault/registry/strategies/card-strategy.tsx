import { type Component, Show } from "solid-js";
import {
  type CardVaultItem,
  isCardItem,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import CardBrandIcon from "@/components/ui/CardBrandIcon.tsx";
import CardDetailFields from "@/features/vault/item-detail/CardDetailFields.tsx";
import CardEditFields from "@/features/vault/item-edit/CardEditFields.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";
import type {
  CopyMenuProps,
  DetailComponentProps,
  EditComponentProps,
  VaultItemStrategy,
} from "../vault-item-types.ts";

export const CardCopyMenu: Component<CopyMenuProps> = (props) => {
  const cardItem = (): CardVaultItem | null =>
    isCardItem(props.item) ? props.item : null;

  return (
    <Show when={cardItem()}>
      {(item) => (
        <>
          <Show when={item().card.number}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(
                  item().card.number || "",
                  t("detail_copy_card_number"),
                  e,
                )
              }
            >
              {t("detail_copy_card_number")}
            </div>
          </Show>
          <Show when={item().card.code}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(
                  item().card.code || "",
                  t("detail_copy_card_code"),
                  e,
                )
              }
            >
              {t("detail_copy_card_code")}
            </div>
          </Show>
        </>
      )}
    </Show>
  );
};

export const cardStrategy: VaultItemStrategy = {
  type: VaultItemType.Card,
  getAddTitle: () => t("edit_title_add_card"),
  getEditTitle: () => t("edit_title_edit_card"),
  getDetailTitle: () => t("detail_title_card"),
  getToastMsg: (isEdit: boolean) =>
    isEdit ? t("edit_toast_updated_card") : t("edit_toast_created_card"),
  renderIcon: (item: VaultItem) => {
    const brand = isCardItem(item) ? item.card.brand : "";
    return <CardBrandIcon brand={brand} />;
  },
  getSubtitle: (item: VaultItem) => {
    if (isCardItem(item)) {
      const brand = item.card.brand || "Card";
      const number = item.card.number || "";
      const last4 = number.length > 4 ? number.slice(-4) : number;
      return `${brand}${last4 ? `, *${last4}` : ""}`;
    }
    return "";
  },
  populateFormState: (item: VaultItem, state: ItemEditFormState) => {
    if (isCardItem(item)) {
      const card = item.card;
      state.cardholderName = card.cardholderName ?? "";
      state.cardNumber = card.number ?? "";
      state.cardBrand = card.brand ?? "";
      state.cardExpMonth = card.expMonth ?? "";
      state.cardExpYear = card.expYear ?? "";
      state.cardCode = card.code ?? "";
    }
  },
  mapToPayload: (validatedForm: ItemEditFormState) => {
    return {
      card: {
        cardholderName: validatedForm.cardholderName.trim(),
        brand: validatedForm.cardBrand,
        number: validatedForm.cardNumber.trim(),
        expMonth: validatedForm.cardExpMonth,
        expYear: validatedForm.cardExpYear.trim(),
        code: validatedForm.cardCode.trim(),
      },
    };
  },
  DetailComponent: (props: DetailComponentProps) => {
    const cardItem = (): CardVaultItem | null =>
      isCardItem(props.item) ? props.item : null;
    return (
      <Show when={cardItem()}>
        {(item) => <CardDetailFields item={item()} onCopy={props.onCopy} />}
      </Show>
    );
  },
  EditComponent: (props: EditComponentProps) => {
    return (
      <CardEditFields
        formState={props.formState}
        updateForm={props.updateForm}
      />
    );
  },
  renderCopyMenu: CardCopyMenu,
};
