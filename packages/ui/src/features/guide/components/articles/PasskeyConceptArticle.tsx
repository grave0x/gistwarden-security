import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { GeneratorIcon } from "@/icons/svg/index.ts";

export const PasskeyConceptArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <GeneratorIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_passkey_concept")}</h1>
        </div>
        <p class="hero-lead">{t("guide_passkey_concept_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>{t("guide_passkey_concept_card1_title")}</h3>
          <p>{t("guide_passkey_concept_card1_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_passkey_concept_card2_title")}</h3>
          <p>{t("guide_passkey_concept_card2_desc")}</p>
        </div>
      </div>
    </div>
  );
};
