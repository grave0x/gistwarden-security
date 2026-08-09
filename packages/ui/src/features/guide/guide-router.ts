import { createSignal, onCleanup, type Component } from "solid-js";
import { type TranslationKey } from "@gistwarden/domain";
import type { IconProps } from "@/icons/svg/types.ts";
import { isExtension, isWeb } from "@/core/runtime.ts";
import {
  AutofillIcon,
  CardIcon,
  CloseIcon,
  DownloadIcon,
  FolderIcon,
  GeneratorIcon,
  GithubIcon,
  GlobeIcon,
  IdentityIcon,
  InfoIcon,
  KeyIcon,
  ListIcon,
  LockIcon,
  NoteIcon,
  PaletteIcon,
  QuestionIcon,
  ReportsIcon,
  SettingsIcon,
  Shield2FAIcon,
  ShieldIcon,
  SshKeyIcon,
  SyncIcon,
  UploadIcon,
  VaultIcon,
} from "@/icons/svg/index.ts";

export const DEFAULT_GUIDE_ROUTE = "getting-started/overview";

export interface GuideCategoryDef {
  readonly id: string;
  readonly titleKey: TranslationKey;
  readonly icon: Component<IconProps>;
  readonly items: readonly {
    readonly id: string;
    readonly titleKey: TranslationKey;
    readonly route: string;
    readonly icon: Component<IconProps>;
  }[];
}

export const GUIDE_STRUCTURE: readonly GuideCategoryDef[] = [
  {
    id: "getting-started",
    titleKey: "guide_nav_getting_started",
    icon: VaultIcon,
    items: [
      {
        id: "overview",
        titleKey: "guide_item_overview",
        route: "getting-started/overview",
        icon: InfoIcon,
      },
      ...(isWeb()
        ? [
            {
              id: "download-extension",
              titleKey: "guide_item_download_extension" as const,
              route: "getting-started/download-extension",
              icon: DownloadIcon,
            },
          ]
        : []),
      {
        id: "master-password",
        titleKey: "guide_item_master_password",
        route: "getting-started/master-password",
        icon: KeyIcon,
      },
      {
        id: "github-gist",
        titleKey: "guide_item_github_gist",
        route: "getting-started/github-gist",
        icon: GithubIcon,
      },
      {
        id: "local-vault",
        titleKey: "guide_item_local_vault",
        route: "getting-started/local-vault",
        icon: LockIcon,
      },
      {
        id: "auto-lock",
        titleKey: "guide_item_auto_lock",
        route: "getting-started/auto-lock",
        icon: LockIcon,
      },
    ],
  },
  {
    id: "vault-management",
    titleKey: "guide_nav_vault_management",
    icon: KeyIcon,
    items: [
      {
        id: "logins",
        titleKey: "guide_item_logins",
        route: "vault-management/logins",
        icon: GlobeIcon,
      },
      {
        id: "secure-notes",
        titleKey: "guide_item_secure_notes",
        route: "vault-management/secure-notes",
        icon: NoteIcon,
      },
      {
        id: "cards-identities",
        titleKey: "guide_item_cards_identities",
        route: "vault-management/cards-identities",
        icon: CardIcon,
      },
      {
        id: "ssh-keys",
        titleKey: "guide_item_ssh_keys",
        route: "vault-management/ssh-keys",
        icon: SshKeyIcon,
      },
      {
        id: "custom-fields",
        titleKey: "guide_item_custom_fields",
        route: "vault-management/custom-fields",
        icon: SettingsIcon,
      },
      {
        id: "folders-trash",
        titleKey: "guide_item_folders_trash",
        route: "vault-management/folders-trash",
        icon: FolderIcon,
      },
    ],
  },
  {
    id: "passkey-auth",
    titleKey: "guide_nav_passkey_auth",
    icon: Shield2FAIcon,
    items: [
      {
        id: "passkey-concept",
        titleKey: "guide_item_passkey_concept",
        route: "passkey-auth/passkey-concept",
        icon: GeneratorIcon,
      },
      {
        id: "passkey-register",
        titleKey: "guide_item_passkey_register",
        route: "passkey-auth/passkey-register",
        icon: ShieldIcon,
      },
      {
        id: "passkey-login",
        titleKey: "guide_item_passkey_login",
        route: "passkey-auth/passkey-login",
        icon: IdentityIcon,
      },
      {
        id: "totp-authenticator",
        titleKey: "guide_item_totp_authenticator",
        route: "passkey-auth/totp-authenticator",
        icon: Shield2FAIcon,
      },
      {
        id: "google-migration",
        titleKey: "guide_item_google_migration",
        route: "passkey-auth/google-migration",
        icon: SyncIcon,
      },
    ],
  },
  {
    id: "autofill-tools",
    titleKey: "guide_nav_autofill_tools",
    icon: AutofillIcon,
    items: [
      {
        id: "autofill-usage",
        titleKey: "guide_item_autofill_usage",
        route: "autofill-tools/autofill-usage",
        icon: AutofillIcon,
      },
      {
        id: "password-generator",
        titleKey: "guide_item_password_generator",
        route: "autofill-tools/password-generator",
        icon: GeneratorIcon,
      },
      {
        id: "password-history",
        titleKey: "guide_item_password_history",
        route: "autofill-tools/password-history",
        icon: ListIcon,
      },
    ],
  },
  {
    id: "sync-data",
    titleKey: "guide_nav_sync_data",
    icon: SyncIcon,
    items: [
      {
        id: "gist-sync",
        titleKey: "guide_item_gist_sync",
        route: "sync-data/gist-sync",
        icon: SyncIcon,
      },
      {
        id: "import-csv",
        titleKey: "guide_item_import_csv",
        route: "sync-data/import-csv",
        icon: UploadIcon,
      },
      {
        id: "import-json",
        titleKey: "guide_item_import_json",
        route: "sync-data/import-json",
        icon: UploadIcon,
      },
      {
        id: "export-csv",
        titleKey: "guide_item_export_csv",
        route: "sync-data/export-csv",
        icon: DownloadIcon,
      },
      {
        id: "export-json",
        titleKey: "guide_item_export_json",
        route: "sync-data/export-json",
        icon: DownloadIcon,
      },
    ],
  },
  {
    id: "reports-settings",
    titleKey: "guide_nav_reports_settings",
    icon: ReportsIcon,
    items: [
      {
        id: "security-reports",
        titleKey: "guide_item_security_reports",
        route: "reports-settings/security-reports",
        icon: ReportsIcon,
      },
      {
        id: "appearance-lang",
        titleKey: "guide_item_appearance_lang",
        route: "reports-settings/appearance-lang",
        icon: PaletteIcon,
      },
      {
        id: "faq-troubleshooting",
        titleKey: "guide_item_faq_troubleshooting",
        route: "reports-settings/faq-troubleshooting",
        icon: QuestionIcon,
      },
    ],
  },
];

export function getRouteFromHash(): string {
  let hash = window.location.hash.replace(/^#\/?/, "").trim();
  if (hash.startsWith("guide/")) {
    hash = hash.substring(6).trim();
  } else if (hash === "guide") {
    hash = "";
  }
  if (!hash) return DEFAULT_GUIDE_ROUTE;

  const validRoutes = GUIDE_STRUCTURE.flatMap((cat) =>
    cat.items.map((item) => item.route)
  );

  if (validRoutes.includes(hash)) {
    return hash;
  }

  // Fallback matching category root
  const matchedCategory = GUIDE_STRUCTURE.find((cat) => cat.id === hash);
  if (matchedCategory && matchedCategory.items[0]) {
    return matchedCategory.items[0].route;
  }

  return DEFAULT_GUIDE_ROUTE;
}

export function navigateGuide(route: string): void {
  if (isExtension()) {
    window.location.hash = `#${route}`;
  } else {
    window.location.hash = `#/guide/${route}`;
  }
}

export function useGuideRoute() {
  const [currentRoute, setCurrentRoute] = createSignal<string>(
    getRouteFromHash(),
  );

  const handleHashChange = () => {
    setCurrentRoute(getRouteFromHash());
  };

  window.addEventListener("hashchange", handleHashChange);
  onCleanup(() => {
    window.removeEventListener("hashchange", handleHashChange);
  });

  return {
    route: currentRoute,
    navigate: navigateGuide,
  };
}
