import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { InfoIcon, KeyIcon, LockIcon, SyncIcon } from "@/icons/svg/index.ts";

export const OverviewArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <InfoIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_overview")}</h1>
        </div>
        <p class="hero-lead">{t("guide_start_ov_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>
            <LockIcon size={18} /> {t("guide_start_ov_card1_title")}
          </h3>
          <p>{t("guide_start_ov_card1_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>
            <SyncIcon size={18} /> {t("guide_start_ov_card2_title")}
          </h3>
          <p>{t("guide_start_ov_card2_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>
            <KeyIcon size={18} /> {t("guide_start_ov_card3_title")}
          </h3>
          <p>{t("guide_start_ov_card3_desc")}</p>
        </div>
      </div>
    </div>
  );
};
