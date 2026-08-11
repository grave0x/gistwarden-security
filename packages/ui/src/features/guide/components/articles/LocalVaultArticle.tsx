import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import {
  DownloadIcon,
  LockIcon,
  ShieldAlertIcon,
  SyncIcon,
} from "@/icons/svg/index.ts";

export const LocalVaultArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <LockIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_local_vault")}</h1>
        </div>
        <p class="hero-lead">{t("guide_start_local_lead")}</p>
      </div>

      {/* Warning 1: General Local Storage Warning */}
      <div class="warning-callout-box mb-16">
        <ShieldAlertIcon size={24} class="warning-icon" />
        <div class="warning-content">
          <h4>{t("guide_start_local_warn_title")}</h4>
          <p>{t("guide_start_local_warn_desc")}</p>
        </div>
      </div>

      {/* Warning 2: CRITICAL FIDO2 Passkey Warning */}
      <div class="warning-callout-box mb-24">
        <ShieldAlertIcon size={24} class="warning-icon" />
        <div class="warning-content">
          <h4>{t("guide_start_local_passkey_warn_title")}</h4>
          <p>{t("guide_start_local_passkey_warn_desc")}</p>
        </div>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>
            <LockIcon size={18} /> {t("guide_start_local_card1_title")}
          </h3>
          <p>{t("guide_start_local_card1_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>
            <ShieldAlertIcon size={18} /> {t("guide_start_local_card2_title")}
          </h3>
          <p>{t("guide_start_local_card2_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>
            <DownloadIcon size={18} /> {t("guide_start_local_card3_title")}
          </h3>
          <p>{t("guide_start_local_card3_desc")}</p>
        </div>
        <div class="guide-card">
          <h3>
            <SyncIcon size={18} /> {t("guide_start_local_card4_title")}
          </h3>
          <p>{t("guide_start_local_card4_desc")}</p>
        </div>
      </div>
    </div>
  );
};
