import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { ListIcon } from "@/icons/svg/index.ts";

export const PasswordHistoryArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <ListIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_password_history")}</h1>
        </div>
        <p class="hero-lead">{t("guide_hist_lead")}</p>
      </div>

      <div class="guide-card">
        <h3>{t("guide_hist_card_title")}</h3>
        <p>{t("guide_hist_card_desc")}</p>
      </div>
    </div>
  );
};
