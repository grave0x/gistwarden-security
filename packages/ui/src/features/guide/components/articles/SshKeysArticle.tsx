import type { Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import { SshKeyIcon } from "@/icons/svg/index.ts";

export const SshKeysArticle: Component = () => {
  return (
    <div class="guide-article">
      <div class="article-hero">
        <div class="hero-header-row">
          <SshKeyIcon size={32} class="hero-icon" />
          <h1>{t("guide_item_ssh_keys")}</h1>
        </div>
        <p class="hero-lead">{t("guide_vm_ssh_lead")}</p>
      </div>

      <div class="guide-card">
        <h3>{t("guide_vm_ssh_card_title")}</h3>
        <p>{t("guide_vm_ssh_card_desc")}</p>
      </div>
    </div>
  );
};
