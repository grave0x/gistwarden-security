import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import { Shield2FAIcon } from "@/icons/svg/index.ts";

export const TotpAuthenticatorArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <Shield2FAIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_totp_authenticator")}</h1>
        </div>
        <p class="hero-lead">{t("guide_totp_step1_desc")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_totp_step1_title")}</h4>
            <p>{t("guide_totp_step1_desc")}</p>
            <img
              src={getAssetUrl(
                "images/totp/1. click icon scan if page show qr.jpg",
              )}
              alt="Scan QR Code for TOTP"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_totp_step2_title")}</h4>
            <p>{t("guide_totp_step2_desc")}</p>
            <img
              src={getAssetUrl("images/totp/2 save and copy otp.jpg")}
              alt="Save and Copy OTP"
              class="step-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
