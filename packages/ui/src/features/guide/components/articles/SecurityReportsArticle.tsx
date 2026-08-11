import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import {
  GaugeIcon,
  GlobeUnlockIcon,
  RepeatKeyIcon,
  ReportsIcon,
  Shield2FAIcon,
  ShieldAlertIcon,
} from "@/icons/svg/index.ts";

export const SecurityReportsArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <ReportsIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_security_reports")}</h1>
        </div>
        <p class="hero-lead">{t("guide_report_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">
            <ShieldAlertIcon size={18} />
          </span>
          <div class="step-content">
            <h4>{t("guide_report_step1_title")}</h4>
            <p>{t("guide_report_step1_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">
            <RepeatKeyIcon size={18} />
          </span>
          <div class="step-content">
            <h4>{t("guide_report_step2_title")}</h4>
            <p>{t("guide_report_step2_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">
            <GaugeIcon size={18} />
          </span>
          <div class="step-content">
            <h4>{t("guide_report_step3_title")}</h4>
            <p>{t("guide_report_step3_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">
            <GlobeUnlockIcon size={18} />
          </span>
          <div class="step-content">
            <h4>{t("guide_report_step4_title")}</h4>
            <p>{t("guide_report_step4_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">
            <Shield2FAIcon size={18} />
          </span>
          <div class="step-content">
            <h4>{t("guide_report_step5_title")}</h4>
            <p>{t("guide_report_step5_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
