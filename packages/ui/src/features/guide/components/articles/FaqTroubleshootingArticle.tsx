import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import {
  GithubIcon,
  QuestionIcon,
  ShieldIcon,
  SyncIcon,
} from "@/icons/svg/index.ts";

export const FaqTroubleshootingArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <QuestionIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_faq_troubleshooting")}</h1>
        </div>
        <p class="hero-lead">{t("guide_faq_subtitle")}</p>
      </div>

      <div class="faq-container">
        <div class="faq-item">
          <h4>
            <ShieldIcon size={20} />
            {t("guide_faq_q1_title")}
          </h4>
          <p>{t("guide_faq_q1_desc")}</p>
        </div>
        <div class="faq-item">
          <h4>
            <QuestionIcon size={20} />
            {t("guide_faq_q2_title")}
          </h4>
          <p>{t("guide_faq_q2_desc")}</p>
        </div>
        <div class="faq-item">
          <h4>
            <SyncIcon size={20} />
            {t("guide_faq_q3_title")}
          </h4>
          <p>{t("guide_faq_q3_desc")}</p>
        </div>
        <div class="faq-item">
          <h4>
            <GithubIcon size={20} />
            {t("guide_faq_q4_title")}
          </h4>
          <p>{t("guide_faq_q4_desc")}</p>
        </div>
      </div>
    </div>
  );
};
