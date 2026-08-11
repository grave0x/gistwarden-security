import {
  getVaultItemFallbackName,
  type VaultItem,
  type VaultItemType,
} from "@gistwarden/domain";
import { t } from "@/core/i18n.ts";
import { navigate } from "@/core/navigation.ts";
import { View } from "@/core/types.ts";
import { confirm, setGlobalLoading, showToast } from "@/core/ui-service.ts";
import {
  getVaultItemStrategy,
  getVaultItemTypeLabel as registryGetTypeLabel,
} from "@/features/vault/registry/vault-item-registry.ts";
import { deleteItem } from "@/features/vault/vault-service.ts";

export { getVaultItemFallbackName };

export const getVaultItemTypeLabel = registryGetTypeLabel;

export const getVaultItemTitle = (type: VaultItemType, isEdit = false) => {
  const strategy = getVaultItemStrategy(type);
  return isEdit ? strategy.getEditTitle() : strategy.getAddTitle();
};

export const getVaultItemToastMsg = (type: VaultItemType, isEdit = false) => {
  return getVaultItemStrategy(type).getToastMsg(isEdit);
};

export const getVaultItemDetailTitle = (type: VaultItemType | undefined) => {
  return getVaultItemStrategy(type).getDetailTitle();
};

export const deleteVaultItemWithConfirm = async (
  item: VaultItem,
  onSuccess?: () => void,
) => {
  const confirmed = await confirm(
    t("edit_confirm_delete_title"),
    t("edit_confirm_delete_msg", { name: item.name }),
    "danger",
  );
  if (!confirmed) return false;

  setGlobalLoading(true);
  const res = await deleteItem(item.id);
  setGlobalLoading(false);

  if (res.isOk()) {
    showToast(t("toast_success"), "success");
    if (onSuccess) {
      onSuccess();
    } else {
      navigate(View.Vault);
    }
    return true;
  } else {
    showToast(t(res.error), "error");
    return false;
  }
};
