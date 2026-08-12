import type { VaultMode } from "@gistwarden/repository";
import { alert, confirm } from "@gistwarden/ui";
import { t } from "@/core/i18n.ts";
import { accountStore } from "@/core/store.ts";
import { logout } from "./auth-service.ts";

export interface ForgotMasterPasswordOptions {
  readonly onOpenResetLocalModal?: () => void;
}

const FORGOT_MASTER_PASSWORD_STRATEGIES: Record<
  VaultMode,
  (options?: ForgotMasterPasswordOptions) => Promise<void>
> = {
  github_gist: async () => {
    const gistId = accountStore.gistId;
    if (
      await confirm(
        t("login_forgot_password_title"),
        t("login_forgot_password_msg"),
        "danger",
      )
    ) {
      if (gistId) {
        window.open(`https://gist.github.com/${gistId}`, "_blank");
      }
      logout();
    }
  },
  local_storage: async (options) => {
    if (options?.onOpenResetLocalModal) {
      options.onOpenResetLocalModal();
    }
  },
  self_hosted_server: async () => {
    await alert(
      t("login_self_hosted_forgot_mp_title"),
      t("login_self_hosted_forgot_mp_msg"),
      "warning",
    );
  },
};

const FORGOT_ACCOUNT_PASSWORD_STRATEGIES: Record<
  VaultMode,
  () => Promise<void>
> = {
  github_gist: async () => {
    window.open("https://github.com/password_reset", "_blank");
  },
  local_storage: async () => {
    // Local storage mode does not have a remote account login password
  },
  self_hosted_server: async () => {
    await alert(
      t("login_self_hosted_forgot_password_title"),
      t("login_self_hosted_forgot_password_msg"),
      "warning",
    );
  },
};

export async function handleForgotMasterPassword(
  mode: VaultMode,
  options?: ForgotMasterPasswordOptions,
): Promise<void> {
  const strategy = FORGOT_MASTER_PASSWORD_STRATEGIES[mode];
  if (strategy) {
    await strategy(options);
  }
}

export async function handleForgotAccountPassword(
  mode: VaultMode,
): Promise<void> {
  const strategy = FORGOT_ACCOUNT_PASSWORD_STRATEGIES[mode];
  if (strategy) {
    await strategy();
  }
}
