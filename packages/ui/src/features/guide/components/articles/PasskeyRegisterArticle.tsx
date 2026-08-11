import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import { ShieldIcon } from "@/icons/svg/index.ts";

export const PasskeyRegisterArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <ShieldIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_passkey_register")}</h1>
        </div>
        <p class="hero-lead">{t("guide_pk_reg_desc")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_pk_reg_step1_title")}</h4>
            <p>{t("guide_pk_reg_step1_desc")}</p>
            <img
              src={getAssetUrl("images/passkey/1 select create pk.jpg")}
              alt="Select Create Passkey"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_pk_reg_step2_title")}</h4>
            <p>{t("guide_pk_reg_step2_desc")}</p>
            <img
              src={getAssetUrl(
                "images/passkey/2 select account to store pk.jpg",
              )}
              alt="Select Account to Store Passkey"
              class="step-image"
            />
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">3</span>
          <div class="step-content">
            <h4>{t("guide_pk_reg_step3_title")}</h4>
            <p>{t("guide_pk_reg_step3_desc")}</p>
            <img
              src={getAssetUrl("images/passkey/3 pk saved.jpg")}
              alt="Passkey Saved Successfully"
              class="step-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
