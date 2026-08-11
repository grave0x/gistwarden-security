import type { Component } from "solid-js";
import Button from "@/components/ui/Button.tsx";
import { t } from "@/core/i18n.ts";
import {
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
} from "@/icons/svg/index.ts";

export const DownloadExtensionArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <DownloadIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_download_extension")}</h1>
        </div>
        <p class="hero-lead">{t("guide_dl_ext_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>
            <GlobeIcon size={18} /> {t("guide_dl_ext_firefox_title")}
          </h3>
          <p>{t("guide_dl_ext_firefox_desc")}</p>
          <div class="mt-16">
            <Button
              variant="primary"
              onClick={() =>
                window.open(
                  "https://addons.mozilla.org/en-US/firefox/addon/gistwarden/",
                  "_blank",
                )
              }
            >
              <ExternalLinkIcon size={14} /> {t("guide_dl_ext_btn")}
            </Button>
          </div>
        </div>

        <div class="guide-card">
          <h3>
            <GlobeIcon size={18} /> {t("guide_dl_ext_edge_title")}
          </h3>
          <p>{t("guide_dl_ext_edge_desc")}</p>
          <div class="mt-16">
            <Button
              variant="primary"
              onClick={() =>
                window.open(
                  "https://microsoftedge.microsoft.com/addons/detail/gistwarden/gcbibgbakekbbeeibgaeciiikbdlfndl",
                  "_blank",
                )
              }
            >
              <ExternalLinkIcon size={14} /> {t("guide_dl_ext_btn")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
