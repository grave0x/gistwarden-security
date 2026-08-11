import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { SyncIcon } from "@/icons/svg/index.ts";

export const GistSyncArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <SyncIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_gist_sync")}</h1>
        </div>
        <p class="hero-lead">{t("guide_sync_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>{t("guide_sync_card1_title")}</h3>
          <p>{t("guide_sync_card1_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_sync_card2_title")}</h3>
          <p>{t("guide_sync_card2_desc")}</p>
        </div>
      </div>
    </div>
  );
};
