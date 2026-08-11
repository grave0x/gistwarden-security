import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { FolderIcon } from "@/icons/svg/index.ts";

export const FoldersTrashArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <FolderIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_folders_trash")}</h1>
        </div>
        <p class="hero-lead">{t("guide_vm_folders_lead")}</p>
      </div>

      <div class="step-section-group">
        <h3>{t("guide_vm_folders_sec1_title")}</h3>
        <div class="step-guide-container">
          <div class="step-box">
            <span class="step-number">1</span>
            <div class="step-content">
              <h4>{t("guide_vm_folders_step1_title")}</h4>
              <p>{t("guide_vm_folders_step1_desc")}</p>
            </div>
          </div>
          <div class="step-box">
            <span class="step-number">2</span>
            <div class="step-content">
              <h4>{t("guide_vm_folders_step2_title")}</h4>
              <p>{t("guide_vm_folders_step2_desc")}</p>
            </div>
          </div>
          <div class="step-box">
            <span class="step-number">3</span>
            <div class="step-content">
              <h4>{t("guide_vm_folders_step3_title")}</h4>
              <p>{t("guide_vm_folders_step3_desc")}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="step-section-group">
        <h3>{t("guide_vm_trash_sec2_title")}</h3>
        <div class="step-guide-container">
          <div class="step-box">
            <span class="step-number">1</span>
            <div class="step-content">
              <h4>{t("guide_vm_trash_step1_title")}</h4>
              <p>{t("guide_vm_trash_step1_desc")}</p>
            </div>
          </div>
          <div class="step-box">
            <span class="step-number">2</span>
            <div class="step-content">
              <h4>{t("guide_vm_trash_step2_title")}</h4>
              <p>{t("guide_vm_trash_step2_desc")}</p>
            </div>
          </div>
          <div class="step-box">
            <span class="step-number">3</span>
            <div class="step-content">
              <h4>{t("guide_vm_trash_step3_title")}</h4>
              <p>{t("guide_vm_trash_step3_desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
