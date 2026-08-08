import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import {
  GaugeIcon,
  GithubIcon,
  GlobeUnlockIcon,
  PaletteIcon,
  QuestionIcon,
  RepeatKeyIcon,
  ReportsIcon,
  Shield2FAIcon,
  ShieldAlertIcon,
  ShieldIcon,
  SyncIcon,
} from "@/icons/svg/index.ts";

export interface GuideSectionProps {
  readonly route: string;
}

export const ReportsSettingsSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "security-reports";

  return (
    <div class="guide-section-wrapper">
      <Show when={subRoute() === "security-reports"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <ReportsIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_security_reports")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_report_lead")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">
                <ShieldAlertIcon size={18} />
              </span>
              <div class="step-content">
                <h4>{t("guide_report_step1_title")}</h4>
                <p>
                  {t("guide_report_step1_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">
                <RepeatKeyIcon size={18} />
              </span>
              <div class="step-content">
                <h4>{t("guide_report_step2_title")}</h4>
                <p>
                  {t("guide_report_step2_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">
                <GaugeIcon size={18} />
              </span>
              <div class="step-content">
                <h4>{t("guide_report_step3_title")}</h4>
                <p>
                  {t("guide_report_step3_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">
                <GlobeUnlockIcon size={18} />
              </span>
              <div class="step-content">
                <h4>{t("guide_report_step4_title")}</h4>
                <p>
                  {t("guide_report_step4_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">
                <Shield2FAIcon size={18} />
              </span>
              <div class="step-content">
                <h4>{t("guide_report_step5_title")}</h4>
                <p>
                  {t("guide_report_step5_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "appearance-lang"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <PaletteIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_appearance_lang")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_app_lead")}
            </p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>{t("guide_app_theme_title")}</h3>
              <p>
                {t("guide_app_theme_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_app_lang_title")}</h3>
              <p>
                {t("guide_app_lang_desc")}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "faq-troubleshooting"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <QuestionIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_faq_troubleshooting")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_faq_subtitle")}
            </p>
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
      </Show>
    </div>
  );
};
