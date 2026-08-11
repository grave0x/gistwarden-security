import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { LockIcon, ShieldAlertIcon } from "@/icons/svg/index.ts";

export const AutoLockArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <LockIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_auto_lock")}</h1>
        </div>
        <p class="hero-lead">{t("guide_start_lock_lead")}</p>
      </div>

      <div class="step-guide-container">
        <div class="step-box">
          <span class="step-number">1</span>
          <div class="step-content">
            <h4>{t("guide_start_lock_step1_title")}</h4>
            <p>{t("guide_start_lock_step1_desc")}</p>
          </div>
        </div>

        <div class="step-box">
          <span class="step-number">2</span>
          <div class="step-content">
            <h4>{t("guide_start_lock_step2_title")}</h4>
            <p>{t("guide_start_lock_step2_desc")}</p>
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
  );
};
