import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { APP_NAME } from "@/core/constants.ts";
import { GeneratorIcon, IdentityIcon, Shield2FAIcon, ShieldIcon, SyncIcon } from "@/icons/svg/index.ts";

export interface GuideSectionProps {
  readonly route: string;
}

export const PasskeyAuthSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "passkey-concept";

  return (
    <div class="guide-section-wrapper">
      <Show when={subRoute() === "passkey-concept"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <GeneratorIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_passkey_concept")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_passkey_concept_lead")}
            </p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>{t("guide_passkey_concept_card1_title")}</h3>
              <p>
                {t("guide_passkey_concept_card1_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_passkey_concept_card2_title")}</h3>
              <p>
                {t("guide_passkey_concept_card2_desc")}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "passkey-register"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <ShieldIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_passkey_register")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_pk_reg_desc")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_pk_reg_step1_title")}</h4>
                <p>
                  {t("guide_pk_reg_step1_desc")}
                </p>
                <img
                  src="images/passkey/1 select create pk.jpg"
                  alt="Select Create Passkey"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_pk_reg_step2_title")}</h4>
                <p>
                  {t("guide_pk_reg_step2_desc")}
                </p>
                <img
                  src="images/passkey/2 select account to store pk.jpg"
                  alt="Select Account to Store Passkey"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_pk_reg_step3_title")}</h4>
                <p>
                  {t("guide_pk_reg_step3_desc")}
                </p>
                <img
                  src="images/passkey/3 pk saved.jpg"
                  alt="Passkey Saved Successfully"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "passkey-login"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <IdentityIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_passkey_login")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_pk_login_desc")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_pk_login_step1_title")}</h4>
                <p>
                  {t("guide_pk_login_step1_desc")}
                </p>
                <img
                  src="images/passkey/4 click login with pk.jpg"
                  alt="Click Login with Passkey"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_pk_login_step2_title")}</h4>
                <p>
                  {t("guide_pk_login_step2_desc")}
                </p>
                <img
                  src="images/passkey/5 select your account.jpg"
                  alt="Select Passkey Account"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "totp-authenticator"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <Shield2FAIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_totp_authenticator")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_totp_step1_desc")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_totp_step1_title")}</h4>
                <p>
                  {t("guide_totp_step1_desc")}
                </p>
                <img
                  src="images/totp/1. click icon scan if page show qr.jpg"
                  alt="Scan QR Code for TOTP"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_totp_step2_title")}</h4>
                <p>
                  {t("guide_totp_step2_desc")}
                </p>
                <img
                  src="images/totp/2 save and copy otp.jpg"
                  alt="Save and Copy OTP"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "google-migration"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <SyncIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_google_migration")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_passkey_gmig_lead")}
            </p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_passkey_gmig_step1_title")}</h4>
                <p>
                  {t("guide_passkey_gmig_step1_desc")}
                </p>
                <img
                  src="images/google-migration/1.main interface.jpg"
                  alt="Google Authenticator Main Interface"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_passkey_gmig_step2_title")}</h4>
                <p>
                  {t("guide_passkey_gmig_step2_desc")}
                </p>
                <img
                  src="images/google-migration/2. press menu button.png"
                  alt="Press Menu Button"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_passkey_gmig_step3_title")}</h4>
                <p>
                  {t("guide_passkey_gmig_step3_desc")}
                </p>
                <img
                  src="images/google-migration/3. select export codes.png"
                  alt="Select Export Codes"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>{t("guide_passkey_gmig_step4_title")}</h4>
                <p>
                  {t("guide_passkey_gmig_step4_desc")}
                </p>
                <img
                  src="images/google-migration/4. select codes.png"
                  alt="Select Account Codes"
                  class="step-image"
                />
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">5</span>
              <div class="step-content">
                <h4>{t("guide_passkey_gmig_step5_title")}</h4>
                <p>
                  {t("guide_passkey_gmig_step5_desc")}
                </p>
                <img
                  src="images/google-migration/5. use this qr .png"
                  alt="Scan Migration QR Code"
                  class="step-image"
                />
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
