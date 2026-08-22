import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { SettingsIcon } from "@/icons/svg/index.ts";

export const CustomFieldsArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <SettingsIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_custom_fields")}</h1>
        </div>
        <p class="hero-lead">{t("guide_vm_fields_lead")}</p>
      </div>

      <div class="article-section">
        <h2 class="section-heading">{t("guide_vm_fields_card_title")}</h2>
        <div class="article-cards-grid">
          <div class="guide-card">
            <h3>{t("guide_vm_fields_type_text_title")}</h3>
            <p>{t("guide_vm_fields_type_text_desc")}</p>
          </div>
          <div class="guide-card">
            <h3>{t("guide_vm_fields_type_hidden_title")}</h3>
            <p>{t("guide_vm_fields_type_hidden_desc")}</p>
          </div>
          <div class="guide-card">
            <h3>{t("guide_vm_fields_type_checkbox_title")}</h3>
            <p>{t("guide_vm_fields_type_checkbox_desc")}</p>
          </div>
          <div class="guide-card">
            <h3>{t("guide_vm_fields_type_linked_title")}</h3>
            <p>{t("guide_vm_fields_type_linked_desc")}</p>
          </div>
        </div>
      </div>

      <div class="step-section-group">
        <h3>{t("guide_vm_fields_linked_guide_title")}</h3>
        <div class="step-guide-container">
          <div class="step-box">
            <span class="step-number">1</span>
            <div class="step-content">
              <h4>{t("guide_vm_fields_linked_step1_title")}</h4>
              <p>{t("guide_vm_fields_linked_step1_desc")}</p>
            </div>
          </div>
          <div class="step-box">
            <span class="step-number">2</span>
            <div class="step-content">
              <h4>{t("guide_vm_fields_linked_step2_title")}</h4>
              <p>{t("guide_vm_fields_linked_step2_desc")}</p>
            </div>
          </div>
          <div class="step-box">
            <span class="step-number">3</span>
            <div class="step-content">
              <h4>{t("guide_vm_fields_linked_step3_title")}</h4>
              <p>{t("guide_vm_fields_linked_step3_desc")}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="article-section">
        <div class="guide-card">
          <h3>{t("guide_vm_fields_matching_title")}</h3>
          <p>{t("guide_vm_fields_matching_desc")}</p>
        </div>
      </div>
    </div>
  );
};
