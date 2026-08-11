import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { DownloadIcon } from "@/icons/svg/index.ts";

export const ExportCsvArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <DownloadIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_export_csv")}</h1>
        </div>
        <p class="hero-lead">{t("guide_exp_csv_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_exp_csv_step1_title")}</h4>
            <p>{t("guide_exp_csv_step1_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_exp_csv_step2_title")}</h4>
            <p>{t("guide_exp_csv_step2_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_exp_csv_step3_title")}</h4>
            <ul>
              <li>
                <strong>Browser CSV</strong>: {t("guide_exp_csv_step3_browser")}
              </li>
              <li>
                <strong>Bitwarden CSV</strong>:{" "}
                {t("guide_exp_csv_step3_bitwarden")}
              </li>
            </ul>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">4</span>
          <div class="step-content">
            <h4>{t("guide_exp_csv_step4_title")}</h4>
            <p>{t("guide_exp_csv_step4_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
