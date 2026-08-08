import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { GithubIcon, InfoIcon, KeyIcon, LockIcon, ShieldAlertIcon, SyncIcon } from "@/icons/svg/index.ts";

export interface GuideSectionProps {
  readonly route: string;
}

export const GettingStartedSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "overview";

  return (
    <div class="guide-section-wrapper">
      <Show when={subRoute() === "overview"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <InfoIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_overview")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_start_ov_lead")}
            </p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3><LockIcon size={18} /> {t("guide_start_ov_card1_title")}</h3>
              <p>
                {t("guide_start_ov_card1_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3><SyncIcon size={18} /> {t("guide_start_ov_card2_title")}</h3>
              <p>
                {t("guide_start_ov_card2_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3><KeyIcon size={18} /> {t("guide_start_ov_card3_title")}</h3>
              <p>
                {t("guide_start_ov_card3_desc")}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "master-password"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <KeyIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_master_password")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_start_mp_lead")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_start_mp_step1_title")}</h4>
                <p>
                  {t("guide_start_mp_step1_desc")}
                </p>
              </div>
            </div>
            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_start_mp_step2_title")}</h4>
                <p>
                  {t("guide_start_mp_step2_desc")}
                </p>
              </div>
            </div>
            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_start_mp_step3_title")}</h4>
                <p>
                  {t("guide_start_mp_step3_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "github-gist"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <GithubIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_github_gist")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_token_desc")}
            </p>
          </div>

          <div class="warning-callout-box">
            <ShieldAlertIcon size={24} class="warning-icon" />
            <div class="warning-content">
              <h4>{t("guide_token_important_note")}</h4>
              <p>
                {t("guide_token_note_desc")}
              </p>
            </div>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_token_step1_title")}</h4>
                <p>
                  {t("guide_token_step1_desc")}
                </p>
                <img
                  src="images/gist/1.select exprire time.png"
                  alt="Select Expiration Time"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_token_step2_title")}</h4>
                <p>
                  {t("guide_token_step2_desc")}
                </p>
                <img
                  src="images/gist/2.make sure selected gist.png"
                  alt="Select Gist Scope"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_token_step3_title")}</h4>
                <p>
                  {t("guide_token_step3_desc")}
                </p>
                <img
                  src="images/gist/3.create generate button.png"
                  alt="Generate Token Button"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>{t("guide_token_step4_title")}</h4>
                <p>
                  {t("guide_token_step4_desc")}
                </p>
                <img
                  src="images/gist/4.copy and save token.png"
                  alt="Copy and Save Token"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "auto-lock"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <LockIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_auto_lock")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_start_lock_lead")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_start_lock_step1_title")}</h4>
                <p>
                  {t("guide_start_lock_step1_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_start_lock_step2_title")}</h4>
                <p>
                  {t("guide_start_lock_step2_desc")}
                </p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_start_lock_step3_title")}</h4>
                <ul>
                  <li>{t("guide_start_lock_step3_lock")}</li>
                  <li>{t("guide_start_lock_step3_logout")}</li>
                </ul>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>{t("guide_start_pin_title")}</h4>
                <p>{t("guide_start_pin_lead")}</p>
                <div class="step-guide-container" style={{ "margin-top": "12px" }}>
                  <div class="step-box">
                    <span class="step-number">a</span>
                    <div class="step-content">
                      <h4>{t("guide_start_pin_step1_title")}</h4>
                      <p>{t("guide_start_pin_step1_desc")}</p>
                    </div>
                  </div>
                  <div class="step-box">
                    <span class="step-number">b</span>
                    <div class="step-content">
                      <h4>{t("guide_start_pin_step2_title")}</h4>
                      <p>{t("guide_start_pin_step2_desc")}</p>
                    </div>
                  </div>
                  <div class="step-box">
                    <span class="step-number">c</span>
                    <div class="step-content">
                      <h4>{t("guide_start_pin_step3_title")}</h4>
                      <p>{t("guide_start_pin_step3_desc")}</p>
                    </div>
                  </div>
                </div>

                <div class="warning-callout-box" style={{ "margin-top": "16px" }}>
                  <ShieldAlertIcon size={20} class="warning-icon" />
                  <div class="warning-content">
                    <h4>{t("guide_start_pin_note_title")}</h4>
                    <p>{t("guide_start_pin_note_desc")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
