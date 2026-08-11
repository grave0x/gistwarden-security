import type { Component } from "solid-js";
import Button from "@/components/ui/Button.tsx";
import { t } from "@/core/i18n.ts";
import {
  AutofillIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LockIcon,
  Shield2FAIcon,
} from "@/icons/svg/index.ts";

export const WebVersionArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <GlobeIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_web_version")}</h1>
        </div>
        <p class="hero-lead">{t("guide_web_ver_lead")}</p>
        <div class="mt-16">
          <Button
            variant="primary"
            onClick={() =>
              window.open(
                "https://uongsuadaubung.github.io/gistwarden/",
                "_blank",
              )
            }
          >
            <ExternalLinkIcon size={14} /> {t("guide_web_ver_btn")}
          </Button>
        </div>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>
            <GlobeIcon size={18} /> {t("guide_web_ver_advantages_title")}
          </h3>
          <p>{t("guide_web_ver_advantages_desc")}</p>
        </div>
      </div>

      <div class="section-title mt-24">
        <h2>{t("guide_web_ver_limits_title")}</h2>
      </div>

      <div class="article-cards-grid">
        <div class="guide-card">
          <h3>
            <AutofillIcon size={18} /> {t("guide_web_ver_limit_autofill_title")}
          </h3>
          <p>{t("guide_web_ver_limit_autofill_desc")}</p>
        </div>

        <div class="guide-card">
          <h3>
            <Shield2FAIcon size={18} /> {t("guide_web_ver_limit_passkey_title")}
          </h3>
          <p>{t("guide_web_ver_limit_passkey_desc")}</p>
        </div>

        <div class="guide-card">
          <h3>
            <LockIcon size={18} /> {t("guide_web_ver_limit_capture_title")}
          </h3>
          <p>{t("guide_web_ver_limit_capture_desc")}</p>
        </div>
      </div>
    </div>
  );
};
