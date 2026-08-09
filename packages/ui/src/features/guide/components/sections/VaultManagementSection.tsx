import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { CardIcon, FolderIcon, GlobeIcon, NoteIcon, SettingsIcon, SshKeyIcon } from "@/icons/svg/index.ts";

export interface GuideSectionProps {
  readonly route: string;
}

export const VaultManagementSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "logins";

  return (
    <div class="guide-section-wrapper">
      <Show when={subRoute() === "logins"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <GlobeIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_logins")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_vm_logins_lead")}
            </p>
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
              <p>
                {t("guide_vm_logins_card2_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_vm_logins_card3_title")}</h3>
              <p>
                {t("guide_vm_logins_card3_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_vm_logins_card4_title")}</h3>
              <p>
                {t("guide_vm_logins_card4_desc")}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "secure-notes"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <NoteIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_secure_notes")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_vm_notes_lead")}
            </p>
          </div>

          <div class="guide-card">
            <h3>{t("guide_vm_notes_card_title")}</h3>
            <p>
              {t("guide_vm_notes_card_desc")}
            </p>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "cards-identities"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <CardIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_cards_identities")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_vm_cards_lead")}
            </p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>{t("guide_vm_cards_card1_title")}</h3>
              <p>
                {t("guide_vm_cards_card1_desc")}
              </p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_vm_cards_card2_title")}</h3>
              <p>
                {t("guide_vm_cards_card2_desc")}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "ssh-keys"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <SshKeyIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_ssh_keys")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_vm_ssh_lead")}
            </p>
          </div>

          <div class="guide-card">
            <h3>{t("guide_vm_ssh_card_title")}</h3>
            <p>
              {t("guide_vm_ssh_card_desc")}
            </p>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "custom-fields"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <SettingsIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_custom_fields")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_vm_fields_lead")}
            </p>
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
      </Show>

      <Show when={subRoute() === "folders-trash"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <FolderIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_folders_trash")}</h1>
            </div>
            <p class="hero-lead">
              {t("guide_vm_folders_lead")}
            </p>
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
      </Show>
    </div>
  );
};
