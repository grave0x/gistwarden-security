import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import {
  AutofillIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GithubIcon,
  GlobeIcon,
  InfoIcon,
  KeyIcon,
  LockIcon,
  Shield2FAIcon,
  ShieldAlertIcon,
  SyncIcon,
} from "@/icons/svg/index.ts";
import Button from "@/components/ui/Button.tsx";

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

      <Show when={subRoute() === "download-extension"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <DownloadIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_download_extension")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_dl_ext_lead")}
            </p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>
                <GlobeIcon size={18} /> {t("guide_dl_ext_firefox_title")}
              </h3>
              <p>{t("guide_dl_ext_firefox_desc")}</p>
              <div class="mt-16">
                <Button
                  variant="primary"
                  onClick={() =>
                    window.open(
                      "https://addons.mozilla.org/en-US/firefox/addon/gistwarden/",
                      "_blank",
                    )}
                >
                  <ExternalLinkIcon size={14} /> {t("guide_dl_ext_btn")}
                </Button>
              </div>
            </div>

            <div class="guide-card">
              <h3>
                <GlobeIcon size={18} /> {t("guide_dl_ext_edge_title")}
              </h3>
              <p>{t("guide_dl_ext_edge_desc")}</p>
              <div class="mt-16">
                <Button
                  variant="primary"
                  onClick={() =>
                    window.open(
                      "https://microsoftedge.microsoft.com/addons/detail/gistwarden/gcbibgbakekbbeeibgaeciiikbdlfndl",
                      "_blank",
                    )}
                >
                  <ExternalLinkIcon size={14} /> {t("guide_dl_ext_btn")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "web-version"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <GlobeIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_web_version")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_web_ver_lead")}
            </p>
            <div class="mt-16">
              <Button
                variant="primary"
                onClick={() =>
                  window.open(
                    "https://uongsuadaubung.github.io/gistwarden/",
                    "_blank",
                  )}
              >
                <ExternalLinkIcon size={14} /> {t("guide_web_ver_btn")}
              </Button>
            </div>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>
                <GlobeIcon size={18} /> {t("guide_web_ver_advantages_title")}
              </h3>
              <p>{t("guide_web_ver_advantages_desc")}</p>
            </div>
          </div>

          <div class="section-title mt-24">
            <h2>{t("guide_web_ver_limits_title")}</h2>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>
                <AutofillIcon size={18} /> {t("guide_web_ver_limit_autofill_title")}
              </h3>
              <p>{t("guide_web_ver_limit_autofill_desc")}</p>
            </div>

            <div class="guide-card">
              <h3>
                <Shield2FAIcon size={18} /> {t("guide_web_ver_limit_passkey_title")}
              </h3>
              <p>{t("guide_web_ver_limit_passkey_desc")}</p>
            </div>

            <div class="guide-card">
              <h3>
                <LockIcon size={18} /> {t("guide_web_ver_limit_capture_title")}
              </h3>
              <p>{t("guide_web_ver_limit_capture_desc")}</p>
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
                  src={getAssetUrl("images/gist/1.select exprire time.png")}
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
                  src={getAssetUrl("images/gist/2.make sure selected gist.png")}
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
                  src={getAssetUrl("images/gist/3.create generate button.png")}
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
                  src={getAssetUrl("images/gist/4.copy and save token.png")}
                  alt="Copy and Save Token"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "local-vault"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <LockIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_local_vault")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_start_local_lead")}
            </p>
          </div>

          {/* Warning 1: General Local Storage Warning */}
          <div class="warning-callout-box mb-16">
            <ShieldAlertIcon size={24} class="warning-icon" />
            <div class="warning-content">
              <h4>{t("guide_start_local_warn_title")}</h4>
              <p>{t("guide_start_local_warn_desc")}</p>
            </div>
          </div>

          {/* Warning 2: CRITICAL FIDO2 Passkey Warning */}
          <div class="warning-callout-box mb-24">
            <ShieldAlertIcon size={24} class="warning-icon" />
            <div class="warning-content">
              <h4>{t("guide_start_local_passkey_warn_title")}</h4>
              <p>{t("guide_start_local_passkey_warn_desc")}</p>
            </div>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3><LockIcon size={18} /> {t("guide_start_local_card1_title")}</h3>
              <p>{t("guide_start_local_card1_desc")}</p>
            </div>
            <div class="guide-card">
              <h3><ShieldAlertIcon size={18} /> {t("guide_start_local_card2_title")}</h3>
              <p>{t("guide_start_local_card2_desc")}</p>
            </div>
            <div class="guide-card">
              <h3><DownloadIcon size={18} /> {t("guide_start_local_card3_title")}</h3>
              <p>{t("guide_start_local_card3_desc")}</p>
            </div>
            <div class="guide-card">
              <h3><SyncIcon size={18} /> {t("guide_start_local_card4_title")}</h3>
              <p>{t("guide_start_local_card4_desc")}</p>
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
                <div class="step-guide-container mt-12">
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

                <div class="warning-callout-box mt-16">
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
