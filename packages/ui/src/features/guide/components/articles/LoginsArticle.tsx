import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { GlobeIcon } from "@/icons/svg/index.ts";

export const LoginsArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <GlobeIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_logins")}</h1>
        </div>
        <p class="hero-lead">{t("guide_vm_logins_lead")}</p>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>{t("guide_vm_logins_card1_title")}</h3>
          <ul>
            <li>{t("guide_vm_logins_card1_item1")}</li>
            <li>{t("guide_vm_logins_card1_item2")}</li>
            <li>{t("guide_vm_logins_card1_item3")}</li>
            <li>{t("guide_vm_logins_card1_item4")}</li>
            <li>{t("guide_vm_logins_card1_item5")}</li>
          </ul>
        </div>
        <div class="guide-card">
          <h3>{t("guide_vm_logins_card2_title")}</h3>
          <p>{t("guide_vm_logins_card2_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_vm_logins_card3_title")}</h3>
          <p>{t("guide_vm_logins_card3_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>{t("guide_vm_logins_card4_title")}</h3>
          <p>{t("guide_vm_logins_card4_desc")}</p>
        </div>
      </div>
    </div>
  );
};
