import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { KeyIcon } from "@/icons/svg/index.ts";

export const MasterPasswordArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <KeyIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_master_password")}</h1>
        </div>
        <p class="hero-lead">{t("guide_start_mp_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_start_mp_step1_title")}</h4>
            <p>{t("guide_start_mp_step1_desc")}</p>
          </div>
        </div>
        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_start_mp_step2_title")}</h4>
            <p>{t("guide_start_mp_step2_desc")}</p>
          </div>
        </div>
        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_start_mp_step3_title")}</h4>
            <p>{t("guide_start_mp_step3_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
