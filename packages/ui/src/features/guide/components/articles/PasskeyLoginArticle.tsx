import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import { IdentityIcon } from "@/icons/svg/index.ts";

export const PasskeyLoginArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <IdentityIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_passkey_login")}</h1>
        </div>
        <p class="hero-lead">{t("guide_pk_login_desc")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_pk_login_step1_title")}</h4>
            <p>{t("guide_pk_login_step1_desc")}</p>
            <img
              src={getAssetUrl("images/passkey/4 click login with pk.jpg")}
              alt="Click Login with Passkey"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_pk_login_step2_title")}</h4>
            <p>{t("guide_pk_login_step2_desc")}</p>
            <img
              src={getAssetUrl("images/passkey/5 select your account.jpg")}
              alt="Select Passkey Account"
              class="step-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
