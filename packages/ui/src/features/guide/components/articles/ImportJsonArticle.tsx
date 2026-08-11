import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { UploadIcon } from "@/icons/svg/index.ts";

export const ImportJsonArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <UploadIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_import_json")}</h1>
        </div>
        <p class="hero-lead">{t("guide_imp_json_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_imp_json_step1_title")}</h4>
            <p>{t("guide_imp_json_step1_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_imp_json_step2_title")}</h4>
            <p>{t("guide_imp_json_step2_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_imp_json_step3_title")}</h4>
            <p>{t("guide_imp_json_step3_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">4</span>
          <div class="step-content">
            <h4>{t("guide_imp_json_step4_title")}</h4>
            <p>{t("guide_imp_json_step4_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">5</span>
          <div class="step-content">
            <h4>{t("guide_imp_json_step5_title")}</h4>
            <p>{t("guide_imp_json_step5_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
