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

      <div class="guide-card">
        <h3>{t("guide_vm_fields_card_title")}</h3>
        <ul>
          <li>{t("guide_vm_fields_item1")}</li>
          <li>{t("guide_vm_fields_item2")}</li>
          <li>{t("guide_vm_fields_item3")}</li>
          <li>{t("guide_vm_fields_item4")}</li>
        </ul>
      </div>
    </div>
  );
};
