import { type Component, onCleanup, onMount, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { getAppVersion, getAssetUrl, isWeb } from "@/core/runtime.ts";
import { accountStore, settingsStore } from "@/core/store.ts";
import { init, updateLanguage } from "@gistwarden/ui";
import Button from "@/components/ui/Button.tsx";
import Select from "@/components/ui/Select.tsx";
import { useGuideRoute } from "@/features/guide/guide-router.ts";
import { GuideTreeSidebar } from "@/features/guide/components/GuideTreeSidebar.tsx";
import { GuideContentRenderer } from "@/features/guide/components/GuideContentRenderer.tsx";
import { ArrowLeftIcon, ExternalLinkIcon, GlobeIcon } from "@/icons/svg/index.ts";
import { navigate as navigateApp } from "@/core/navigation.ts";
import { View } from "@gistwarden/domain";

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
];

export const Guide: Component = () => {
  const { route, navigate } = useGuideRoute();

  onMount(async () => {
    document.body.classList.add("guide-body-native");
    await init();
  });

  onCleanup(() => {
    document.body.classList.remove("guide-body-native");
  });

  const handleLangChange = (val: "en" | "vi") => {
    updateLanguage(val);
  };

  const handleOpenGist = () => {
    if (accountStore.gistId) {
      window.open(`https://gist.github.com/${accountStore.gistId}`, "_blank");
    } else {
      window.open("https://gist.github.com/", "_blank");
    }
  };

  return (
    <Show when={accountStore.isLoaded && settingsStore.isLoaded}>
      <div class="guide-wrapper">
        {/* Top Header Bar */}
        <header class="guide-header">
          <div class="guide-header-left">
            <Show when={isWeb()}>
              <button
                type="button"
                class="guide-back-btn"
                title="Quay về Vault"
                onClick={() => navigateApp(View.Vault)}
              >
                <ArrowLeftIcon size={18} />
              </button>
            </Show>
            <div class="logo-area">
              <img
                src={getAssetUrl("icons/icon-48.png")}
                alt={`${APP_NAME} Logo`}
                class="logo"
              />
              <div class="brand">
                <h1>{APP_NAME}</h1>
                <span class="badge">v{getAppVersion()}</span>
              </div>
            </div>
          </div>

          <div class="header-controls">
            {/* Language Selector */}
            <div class="lang-selector">
              <GlobeIcon size={14} />
              <Select
                value={settingsStore.language}
                onChange={(e) => {
                  const val = e.currentTarget.value;
                  if (val === "en" || val === "vi") {
                    handleLangChange(val);
                  }
                }}
                options={LANG_OPTIONS}
              />
            </div>

            <Button
              variant="secondary"
              onClick={handleOpenGist}
            >
              <ExternalLinkIcon size={14} /> {t("settings_open_gist_title")}
            </Button>
          </div>
        </header>

        {/* Main Guide Body */}
        <div class="guide-container">
          {/* Expandable Accordion Tree Sidebar */}
          <GuideTreeSidebar
            currentRoute={route()}
            onNavigate={navigate}
          />

          {/* Router Content Renderer */}
          <main class="guide-main-content">
            <GuideContentRenderer route={route()} />
          </main>
        </div>
      </div>
    </Show>
  );
};

export default Guide;
