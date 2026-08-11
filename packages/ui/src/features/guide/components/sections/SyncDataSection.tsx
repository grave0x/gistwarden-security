import { type Component, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { DownloadIcon, SyncIcon, UploadIcon } from "@/icons/svg/index.ts";

export interface GuideSectionProps {
  readonly route: string;
}

export const SyncDataSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "gist-sync";

  return (
    <div class="guide-section-wrapper">
      <Show when={subRoute() === "gist-sync"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <SyncIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_gist_sync")}</h1>
            </div>
            <p class="hero-lead">{t("guide_sync_lead")}</p>
          </div>

          <div class="article-cards-grid">
            <div class="guide-card">
              <h3>{t("guide_sync_card1_title")}</h3>
              <p>{t("guide_sync_card1_desc")}</p>
            </div>
            <div class="guide-card">
              <h3>{t("guide_sync_card2_title")}</h3>
              <p>{t("guide_sync_card2_desc")}</p>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "import-csv"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <UploadIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_import_csv")}</h1>
            </div>
            <p class="hero-lead">{t("guide_imp_csv_lead")}</p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_imp_csv_step1_title")}</h4>
                <p>{t("guide_imp_csv_step1_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_imp_csv_step2_title")}</h4>
                <p>{t("guide_imp_csv_step2_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_imp_csv_step3_title")}</h4>
                <p>{t("guide_imp_csv_step3_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "import-json"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <UploadIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_import_json")}</h1>
            </div>
            <p class="hero-lead">{t("guide_imp_json_lead")}</p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_imp_json_step1_title")}</h4>
                <p>{t("guide_imp_json_step1_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_imp_json_step2_title")}</h4>
                <p>{t("guide_imp_json_step2_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_imp_json_step3_title")}</h4>
                <p>{t("guide_imp_json_step3_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>{t("guide_imp_json_step4_title")}</h4>
                <p>{t("guide_imp_json_step4_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">5</span>
              <div class="step-content">
                <h4>{t("guide_imp_json_step5_title")}</h4>
                <p>{t("guide_imp_json_step5_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "export-csv"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <DownloadIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_export_csv")}</h1>
            </div>
            <p class="hero-lead">{t("guide_exp_csv_lead")}</p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_exp_csv_step1_title")}</h4>
                <p>{t("guide_exp_csv_step1_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_exp_csv_step2_title")}</h4>
                <p>{t("guide_exp_csv_step2_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_exp_csv_step3_title")}</h4>
                <ul>
                  <li>
                    <strong>Browser CSV</strong>:{" "}
                    {t("guide_exp_csv_step3_browser")}
                  </li>
                  <li>
                    <strong>Bitwarden CSV</strong>:{" "}
                    {t("guide_exp_csv_step3_bitwarden")}
                  </li>
                </ul>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">4</span>
              <div class="step-content">
                <h4>{t("guide_exp_csv_step4_title")}</h4>
                <p>{t("guide_exp_csv_step4_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={subRoute() === "export-json"}>
        <div class="guide-article">
          <div class="article-hero">
            <div class="hero-header-row">
              <DownloadIcon size={32} class="hero-icon" />
              <h1>{t("guide_item_export_json")}</h1>
            </div>
            <p class="hero-lead">{t("guide_exp_json_lead")}</p>
          </div>

          <div class="step-guide-container">
            <div class="step-box">
              <span class="step-number">1</span>
              <div class="step-content">
                <h4>{t("guide_exp_json_step1_title")}</h4>
                <p>{t("guide_exp_json_step1_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">2</span>
              <div class="step-content">
                <h4>{t("guide_exp_json_step2_title")}</h4>
                <p>{t("guide_exp_json_step2_desc")}</p>
              </div>
            </div>

            <div class="step-box">
              <span class="step-number">3</span>
              <div class="step-content">
                <h4>{t("guide_exp_json_step3_title")}</h4>
                <p>{t("guide_exp_json_step3_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
