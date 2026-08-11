import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { SwaggerApiGuide } from "@/features/guide/components/SwaggerApiGuide.tsx";
import { GlobeIcon, ShieldAlertIcon } from "@/icons/svg/index.ts";

export const SelfHostedServerArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <GlobeIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_self_hosted_server")}</h1>
        </div>
        <p class="hero-lead">{t("guide_start_self_hosted_lead")}</p>
      </div>

      <div class="warning-callout-box mb-24">
        <ShieldAlertIcon size={24} class="warning-icon" />
        <div class="warning-content">
          <h4>{t("guide_start_self_hosted_note_title")}</h4>
          <p>{t("guide_start_self_hosted_note_desc")}</p>
        </div>
      </div>

      <h3 class="mb-12">Swagger / OpenAPI Interactive API Specification</h3>
      <SwaggerApiGuide />

      <h3 class="mb-16">{t("guide_start_self_hosted_app_title")}</h3>
      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_start_self_hosted_step1_title")}</h4>
            <p>{t("guide_start_self_hosted_step1_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_start_self_hosted_step2_title")}</h4>
            <p>{t("guide_start_self_hosted_step2_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_start_self_hosted_step3_title")}</h4>
            <p>{t("guide_start_self_hosted_step3_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">4</span>
          <div class="step-content">
            <h4>{t("guide_start_self_hosted_step4_title")}</h4>
            <p>{t("guide_start_self_hosted_step4_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
