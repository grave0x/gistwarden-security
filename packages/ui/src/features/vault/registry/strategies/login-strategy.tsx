import { type Component, Show } from "solid-js";
import {
  isLoginItem,
  type LoginVaultItem,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { getDomainFromItem } from "@/core/domain-utils.ts";
import { t } from "@/core/i18n.ts";
import Favicon from "@/components/ui/Favicon.tsx";
import { GlobeIcon } from "@/icons/svg/index.ts";
import LoginDetailFields from "@/features/vault/item-detail/LoginDetailFields.tsx";
import LoginEditFields from "@/features/vault/item-edit/LoginEditFields.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";
import type {
  CopyMenuProps,
  DetailComponentProps,
  EditComponentProps,
  VaultItemStrategy,
} from "../vault-item-types.ts";

export const LoginCopyMenu: Component<CopyMenuProps> = (props) => {
  const loginItem = (): LoginVaultItem | null =>
    isLoginItem(props.item) ? props.item : null;

  return (
    <Show when={loginItem()}>
      {(item) => (
        <>
          <Show when={item().login.username}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(item().login.username || "", "username", e)
              }
            >
              {t("detail_copy_username")}
            </div>
          </Show>
          <Show when={item().login.password}>
            <div
              class="dropdown-item"
              onClick={(e) =>
                props.onCopyText(item().login.password || "", "password", e)
              }
            >
              {t("detail_copy_password")}
            </div>
          </Show>
          <Show when={item().login.totp}>
            <div
              class="dropdown-item"
              onClick={(e) => props.onCopyTotpDirect(props.item, e)}
            >
              {t("detail_copy_totp")}
            </div>
          </Show>
        </>
      )}
    </Show>
  );
};

export const loginStrategy: VaultItemStrategy = {
  type: VaultItemType.Login,
  getTypeName: () => t("vault_item_login"),
  getAddTitle: () => t("edit_title_add_login"),
  getEditTitle: () => t("edit_title_edit_login"),
  getDetailTitle: () => t("detail_title_login"),
  getToastMsg: (isEdit: boolean) =>
    isEdit ? t("edit_toast_updated_login") : t("edit_toast_created_login"),
  renderIcon: (item: VaultItem) => {
    const domain = getDomainFromItem(item);
    return (
      <Show when={domain} fallback={<GlobeIcon />}>
        {(dom) => <Favicon domain={dom()} fallback={<GlobeIcon />} />}
      </Show>
    );
  },
  getSubtitle: (item: VaultItem) => {
    if (isLoginItem(item)) {
      return item.login.username || t("vault_no_username");
    }
    return "";
  },
  populateFormState: (item: VaultItem, state: ItemEditFormState) => {
    if (isLoginItem(item)) {
      const login = item.login;
      state.username = login.username ?? "";
      state.password = login.password ?? "";
      state.uris = login.uris && login.uris.length > 0
        ? login.uris.map((u) => ({ uri: u.uri, match: u.match ?? null }))
        : [{ uri: "", match: null }];
      state.totpSecret = login.totp ?? "";
      state.fidoCredentials = login.fido2Credentials ?? [];
    }
  },
  mapToPayload: (
    validatedForm: ItemEditFormState,
    selectedItem?: VaultItem | null,
  ) => {
    const originalLogin = selectedItem && isLoginItem(selectedItem)
      ? selectedItem.login
      : null;

    let revDate = originalLogin?.passwordRevisionDate ?? null;
    let history = originalLogin?.passwordHistory ?? [];

    const newPassword = validatedForm.password.trim();
    const oldPassword = originalLogin?.password ?? "";

    if (originalLogin && newPassword !== oldPassword) {
      revDate = new Date().toISOString();
      if (oldPassword) {
        history = [
          { lastUsedDate: new Date().toISOString(), password: oldPassword },
          ...(history || []),
        ].slice(0, 5);
      }
    }

    const mappedUris = validatedForm.uris
      .map((u) => ({
        uri: u.uri.trim(),
        match: u.match ?? null,
      }))
      .filter((u) => u.uri);

    return {
      login: {
        username: validatedForm.username.trim(),
        password: newPassword,
        totp: validatedForm.totpSecret.trim(),
        uris: mappedUris,
        fido2Credentials: validatedForm.fidoCredentials,
        passwordRevisionDate: revDate,
        passwordHistory: history,
      },
    };
  },
  DetailComponent: (props: DetailComponentProps) => {
    const loginItem = (): LoginVaultItem | null =>
      isLoginItem(props.item) ? props.item : null;
    return (
      <Show when={loginItem()}>
        {(item) => <LoginDetailFields item={item()} onCopy={props.onCopy} />}
      </Show>
    );
  },
  EditComponent: (props: EditComponentProps) => {
    return (
      <LoginEditFields
        formState={props.formState}
        updateForm={props.updateForm}
        onDeleteFido={props.onDeleteFido ?? (() => {})}
        scanning={props.scanning ?? false}
        onScanQr={props.onScanQr ?? (() => {})}
      />
    );
  },
  renderCopyMenu: LoginCopyMenu,
};
