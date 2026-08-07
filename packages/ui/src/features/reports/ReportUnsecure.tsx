import { type Component, createMemo } from "solid-js";
import { isLoginItem, type LoginVaultItem, View } from "@gistwarden/domain";
import { accountStore } from "@/core/store.ts";
import { navigate, selectItem } from "@/core/navigation.ts";
import { t } from "@/core/i18n.ts";
import { saveItem } from "@/features/vault/vault-service.ts";
import { setGlobalLoading } from "@gistwarden/ui";
import { ReportLayout } from "./components/ReportLayout.tsx";

export const ReportUnsecure: Component = () => {
  const unsecureItems = createMemo<LoginVaultItem[]>(() => {
    const items = (accountStore.vaultItems || []).filter(isLoginItem);
    return items.filter((item) => {
      const uris = item.login?.uris || [];
      return uris.some((u) =>
        u.uri && u.uri.trim().toLowerCase().startsWith("http://")
      );
    });
  });

  const handleUpgradeHttps = async (item: LoginVaultItem) => {
    if (!item.login?.uris) return;

    setGlobalLoading(true);
    try {
      const updatedUris = item.login.uris.map((u) => {
        if (u.uri && u.uri.trim().toLowerCase().startsWith("http://")) {
          return {
            ...u,
            uri: u.uri.replace(/^http:\/\//i, "https://"),
          };
        }
        return u;
      });

      const updatedItem: LoginVaultItem = {
        ...item,
        revisionDate: new Date().toISOString(),
        login: {
          ...item.login,
          uris: updatedUris,
        },
      };

      await saveItem(updatedItem);
    } catch (err) {
      console.error("[ReportUnsecure] Upgrade to HTTPS failed:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleEditItem = (item: LoginVaultItem) => {
    selectItem(item);
    navigate(View.ItemEdit);
  };

  return (
    <ReportLayout<LoginVaultItem>
      titleKey="report_unsecure_title"
      descKey="report_unsecure_desc"
      itemCount={unsecureItems().length}
      items={unsecureItems()}
      cleanMsgKey="report_unsecure_clean_msg"
      renderItem={(item) => (
        <div class="item-row flex-between align-center">
          <div class="item-info">
            <div class="fw-bold">{item.name}</div>
            <div
              class="text-muted text-sm font-monospace"
              title={item.login.uris?.[0]?.uri || ""}
            >
              {item.login.uris?.[0]?.uri || t("report_no_uri")}
            </div>
          </div>
          <div class="item-actions">
            <button
              class="btn btn-outline-primary btn-sm"
              onClick={() => handleUpgradeHttps(item)}
            >
              {t("report_unsecure_btn_upgrade")}
            </button>
            <button
              class="btn btn-secondary btn-sm"
              onClick={() => handleEditItem(item)}
            >
              {t("btn_edit")}
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default ReportUnsecure;
