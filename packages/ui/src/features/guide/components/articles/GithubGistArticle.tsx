import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";
import { GithubIcon, ShieldAlertIcon } from "@/icons/svg/index.ts";

export const GithubGistArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <GithubIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_github_gist")}</h1>
        </div>
        <p class="hero-lead">{t("guide_token_desc")}</p>
      </div>

      <div class="warning-callout-box">
        <ShieldAlertIcon size={24} class="warning-icon" />
        <div class="warning-content">
          <h4>{t("guide_token_important_note")}</h4>
          <p>{t("guide_token_note_desc")}</p>
        </div>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_token_step1_title")}</h4>
            <p>{t("guide_token_step1_desc")}</p>
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
            <p>{t("guide_token_step2_desc")}</p>
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
            <p>{t("guide_token_step3_desc")}</p>
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
            <p>{t("guide_token_step4_desc")}</p>
            <img
              src={getAssetUrl("images/gist/4.copy and save token.png")}
              alt="Copy and Save Token"
              class="step-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
