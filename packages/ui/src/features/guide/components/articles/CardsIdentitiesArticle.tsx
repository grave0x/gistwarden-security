import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { CardIcon } from "@/icons/svg/index.ts";

export const CardsIdentitiesArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <CardIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_cards_identities")}</h1>
        </div>
        <p class="hero-lead">{t("guide_vm_cards_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>{t("guide_vm_cards_card1_title")}</h3>
          <p>{t("guide_vm_cards_card1_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_vm_cards_card2_title")}</h3>
          <p>{t("guide_vm_cards_card2_desc")}</p>
        </div>
      </div>
    </div>
  );
};
