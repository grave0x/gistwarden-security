import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { AutofillIcon, GeneratorIcon, ListIcon } from "@/icons/svg/index.ts";

export interface GuideSectionProps {
  readonly route: string;
}

export const AutofillToolsSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "autofill-usage";

  return (
    <div class="guide-section-wrapper">
      <Show when={subRoute() === "autofill-usage"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <AutofillIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_autofill_usage")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_auto_lead")}
            </p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>{t("guide_auto_card1_title")}</h3>
              <p>
                {t("guide_auto_card1_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_auto_card2_title")}</h3>
              <p>
                {t("guide_auto_card2_desc")}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "password-generator"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <GeneratorIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_password_generator")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_pwdgen_lead")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_pwdgen_step1_title")}</h4>
                <p>
                  {t("guide_pwdgen_step1_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_pwdgen_step2_title")}</h4>
                <ul>
                  <li>{t("guide_pwdgen_step2_length")}</li>
                  <li>{t("guide_pwdgen_step2_charset")}</li>
                  <li>{t("guide_pwdgen_step2_ambiguous")}</li>
                </ul>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_pwdgen_step3_title")}</h4>
                <p>
                  {t("guide_pwdgen_step3_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>{t("guide_pwdgen_step4_title")}</h4>
                <p>
                  {t("guide_pwdgen_step4_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "password-history"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <ListIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_password_history")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_hist_lead")}
            </p>
          </div>

          <div class="guide-card">
            <h3>{t("guide_hist_card_title")}</h3>
            <p>
              {t("guide_hist_card_desc")}
            </p>
          </div>
        </div>
      </Show>
    </div>
  );
};
