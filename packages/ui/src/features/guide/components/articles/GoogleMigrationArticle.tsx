import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import { SyncIcon } from "@/icons/svg/index.ts";

export const GoogleMigrationArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <SyncIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_google_migration")}</h1>
        </div>
        <p class="hero-lead">{t("guide_passkey_gmig_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_passkey_gmig_step1_title")}</h4>
            <p>{t("guide_passkey_gmig_step1_desc")}</p>
            <img
              src={getAssetUrl("images/google-migration/1.main interface.jpg")}
              alt="Google Authenticator Main Interface"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_passkey_gmig_step2_title")}</h4>
            <p>{t("guide_passkey_gmig_step2_desc")}</p>
            <img
              src={getAssetUrl(
                "images/google-migration/2. press menu button.png",
              )}
              alt="Press Menu Button"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_passkey_gmig_step3_title")}</h4>
            <p>{t("guide_passkey_gmig_step3_desc")}</p>
            <img
              src={getAssetUrl(
                "images/google-migration/3. select export codes.png",
              )}
              alt="Select Export Codes"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">4</span>
          <div class="step-content">
            <h4>{t("guide_passkey_gmig_step4_title")}</h4>
            <p>{t("guide_passkey_gmig_step4_desc")}</p>
            <img
              src={getAssetUrl("images/google-migration/4. select codes.png")}
              alt="Select Account Codes"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">5</span>
          <div class="step-content">
            <h4>{t("guide_passkey_gmig_step5_title")}</h4>
            <p>{t("guide_passkey_gmig_step5_desc")}</p>
            <img
              src={getAssetUrl("images/google-migration/5. use this qr .png")}
              alt="Scan Migration QR Code"
              class="step-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
