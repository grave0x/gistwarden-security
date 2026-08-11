import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { GeneratorIcon } from "@/icons/svg/index.ts";

export const PasswordGeneratorArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <GeneratorIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_password_generator")}</h1>
        </div>
        <p class="hero-lead">{t("guide_pwdgen_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_pwdgen_step1_title")}</h4>
            <p>{t("guide_pwdgen_step1_desc")}</p>
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
            <p>{t("guide_pwdgen_step3_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">4</span>
          <div class="step-content">
            <h4>{t("guide_pwdgen_step4_title")}</h4>
            <p>{t("guide_pwdgen_step4_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
