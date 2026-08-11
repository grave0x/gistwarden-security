import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { DownloadIcon } from "@/icons/svg/index.ts";

export const ExportJsonArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <DownloadIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_export_json")}</h1>
        </div>
        <p class="hero-lead">{t("guide_exp_json_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_exp_json_step1_title")}</h4>
            <p>{t("guide_exp_json_step1_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_exp_json_step2_title")}</h4>
            <p>{t("guide_exp_json_step2_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_exp_json_step3_title")}</h4>
            <p>{t("guide_exp_json_step3_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
