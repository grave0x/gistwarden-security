import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { AutofillIcon } from "@/icons/svg/index.ts";

export const AutofillUsageArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <AutofillIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_autofill_usage")}</h1>
        </div>
        <p class="hero-lead">{t("guide_auto_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>{t("guide_auto_card1_title")}</h3>
          <p>{t("guide_auto_card1_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_auto_card2_title")}</h3>
          <p>{t("guide_auto_card2_desc")}</p>
        </div>
      </div>
    </div>
  );
};
