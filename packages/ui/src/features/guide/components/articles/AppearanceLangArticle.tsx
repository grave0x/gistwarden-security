import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { PaletteIcon } from "@/icons/svg/index.ts";

export const AppearanceLangArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <PaletteIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_appearance_lang")}</h1>
        </div>
        <p class="hero-lead">{t("guide_app_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>{t("guide_app_theme_title")}</h3>
          <p>{t("guide_app_theme_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_app_lang_title")}</h3>
          <p>{t("guide_app_lang_desc")}</p>
        </div>
      </div>
    </div>
  );
};
