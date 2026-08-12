import { logger } from "@gistwarden/domain";
import { type Component, createEffect, createSignal, Show } from "solid-js";
import BaseSlideModal from "@/components/ui/BaseSlideModal.tsx";
import Button from "@/components/ui/Button.tsx";
import Input from "@/components/ui/Input.tsx";
import { t } from "@/core/i18n.ts";
import { isExtension } from "@/core/runtime.ts";
import { GlobeIcon, SyncIcon } from "@/icons/svg/index.ts";

export interface ServerConfigModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialUrl?: string;
  readonly onSave: (serverUrl: string) => void;
}

export const ServerConfigModal: Component<ServerConfigModalProps> = (props) => {
  const [serverUrl, setServerUrl] = createSignal("");
  const [isTesting, setIsTesting] = createSignal(false);
  const [isTestedSuccess, setIsTestedSuccess] = createSignal(false);
  const [testStatus, setTestStatus] = createSignal<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  createEffect(() => {
    if (props.isOpen) {
      const initial = props.initialUrl || "";
      setServerUrl(initial);
      setTestStatus(null);
      setIsTestedSuccess(Boolean(initial));
    }
  });

  const handleTestConnection = async () => {
    const rawUrl = serverUrl().trim();
    if (!rawUrl) {
      setTestStatus({
        type: "error",
        message: t("server_config_error_url_required"),
      });
      setIsTestedSuccess(false);
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    const targetUrl = rawUrl.replace(/\/+$/, "");

    try {
      // 1. Dynamic Host Permission Request on Extension
      if (
        isExtension() &&
        typeof chrome !== "undefined" &&
        chrome?.permissions
      ) {
        try {
          const parsed = new URL(targetUrl);
          const origin = `${parsed.origin}/*`;
          const hasPerm = await chrome.permissions.contains({
            origins: [origin],
          });
          if (!hasPerm) {
            const granted = await chrome.permissions.request({
              origins: [origin],
            });
            if (!granted) {
              setTestStatus({
                type: "error",
                message: t("server_config_test_failed"),
              });
              setIsTestedSuccess(false);
              setIsTesting(false);
              return;
            }
          }
        } catch (permissionErr) {
          logger.network.warn(
            "[ServerConfigModal] Permission request failed or invalid URL pattern:",
            permissionErr,
          );
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${targetUrl}/user`, {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        signal: controller.signal,
      }).catch((fetchErr) => {
        logger.network.warn(
          "[ServerConfigModal] Test connection fetch failed:",
          fetchErr,
        );
        return null;
      });

      clearTimeout(timeoutId);

      // Server returns response (e.g. 200 or 401 Unauthorized -> server is alive!)
      if (response && (response.status === 200 || response.status === 401)) {
        setIsTestedSuccess(true);
        setTestStatus({
          type: "success",
          message: t("server_config_test_success"),
        });
      } else {
        setIsTestedSuccess(false);
        setTestStatus({
          type: "error",
          message: t("server_config_test_failed"),
        });
      }
    } catch (err) {
      logger.network.error(
        "[ServerConfigModal] Unexpected test connection error:",
        err,
      );
      setIsTestedSuccess(false);
      setTestStatus({
        type: "error",
        message: t("server_config_test_failed"),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const finalUrl = serverUrl().trim().replace(/\/+$/, "");
    if (!finalUrl) {
      setTestStatus({
        type: "error",
        message: t("server_config_error_url_required"),
      });
      return;
    }
    props.onSave(finalUrl);
    props.onClose();
  };

  return (
    <BaseSlideModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={
        <div class="align-center gap-8">
          <GlobeIcon size={18} />
          <span>{t("server_config_modal_title")}</span>
        </div>
      }
      usePortal
    >
      <div class="p-16">
        <div class="form-group mb-16">
          <label for="modal-server-url" class="mb-6">
            {t("login_self_hosted_server_url")}
          </label>
          <Input
            id="modal-server-url"
            type="text"
            placeholder="http://localhost:3000"
            value={serverUrl()}
            onInput={(e) => {
              setServerUrl(e.currentTarget.value);
              setIsTestedSuccess(false);
            }}
          />
        </div>

        <Show when={testStatus()}>
          {(status) => (
            <div
              class={`alert ${
                status().type === "success" ? "alert-success" : "alert-danger"
              } mb-16`}
            >
              {status().message}
            </div>
          )}
        </Show>

        <div class="d-flex align-items-center gap-8 mt-20">
          <Button
            type="button"
            variant="primary"
            class="flex-1"
            onClick={handleSave}
            disabled={!isTestedSuccess()}
          >
            {t("server_config_btn_save")}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTesting()}
          >
            <Show when={isTesting()} fallback={<SyncIcon size={14} />}>
              <span class="spinner-border spinner-border-sm" />
            </Show>
            <span>{t("server_config_btn_test")}</span>
          </Button>
        </div>
      </div>
    </BaseSlideModal>
  );
};

export default ServerConfigModal;
