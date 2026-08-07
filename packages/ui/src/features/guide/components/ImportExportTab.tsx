import { type Component, createSignal, Show } from "solid-js";
import { t } from "@/core/i18n.ts";
import { getAssetUrl } from "@/core/runtime.ts";

type IeSubTab = "google" | "bitwarden" | "export";

export const ImportExportTab: Component = () => {
  const [activeSubTab, setActiveSubTab] = createSignal<IeSubTab>("google");

  const heroImage = getAssetUrl("images/guide_hero.png");
  const imgGoogleStep1 = getAssetUrl(
    "images/google-migration/1.main interface.jpg",
  );
  const imgGoogleStep2 = getAssetUrl(
    "images/google-migration/2. press menu button.png",
  );
  const imgGoogleStep3 = getAssetUrl(
    "images/google-migration/3. select export codes.png",
  );
  const imgGoogleStep4 = getAssetUrl(
    "images/google-migration/4. select codes.png",
  );
  const imgGoogleStep5 = getAssetUrl(
    "images/google-migration/5. use this qr .png",
  );

  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>🔄 {t("guide_ie_title")}</h2>
        <p>{t("guide_ie_subtitle")}</p>
      </div>

      {/* Sub-tab Selector */}
      <div class="sub-tab-selector">
        <button
          class={`sub-tab-btn ${activeSubTab() === "google" ? "active" : ""}`}
          onClick={() => setActiveSubTab("google")}
        >
          {t("guide_ie_subtab_google")}
        </button>
        <button
          class={`sub-tab-btn ${
            activeSubTab() === "bitwarden" ? "active" : ""
          }`}
          onClick={() => setActiveSubTab("bitwarden")}
        >
          {t("guide_ie_subtab_bitwarden")}
        </button>
        <button
          class={`sub-tab-btn ${activeSubTab() === "export" ? "active" : ""}`}
          onClick={() => setActiveSubTab("export")}
        >
          {t("guide_ie_subtab_export")}
        </button>
      </div>

      <div class="features-detailed-grid">
        {/* Sub-tab 1: Google Authenticator Migration */}
        <Show when={activeSubTab() === "google"}>
          <div class="feature-detail-card fade-in">
            <div class="feature-icon-wrapper sync-icon-bg">🔑</div>
            <div class="feature-content">
              <h3>{t("guide_ie_google_title")}</h3>
              <p>{t("guide_ie_google_desc")}</p>
              <ul class="feature-bullets">
                {/* Step 1 */}
                <li>
                  <strong>{t("guide_ie_google_step1_title")}</strong>
                  <br />
                  {t("guide_ie_google_step1_desc")}
                  <div class="tutorial-image-container">
                    <div class="image-wrapper">
                      <img
                        src={imgGoogleStep1}
                        alt="Google Authenticator Main Interface"
                        class="tutorial-img"
                        onerror={(e) => {
                          const img = e.currentTarget;
                          if (img instanceof HTMLImageElement) {
                            img.src = heroImage;
                            img.style.opacity = "0.3";
                          }
                        }}
                      />
                    </div>
                  </div>
                </li>

                {/* Step 2 */}
                <li>
                  <strong>{t("guide_ie_google_step2_title")}</strong>
                  <br />
                  {t("guide_ie_google_step2_desc")}
                  <div class="tutorial-image-container">
                    <div class="image-wrapper">
                      <img
                        src={imgGoogleStep2}
                        alt="Press Menu Button"
                        class="tutorial-img"
                        onerror={(e) => {
                          const img = e.currentTarget;
                          if (img instanceof HTMLImageElement) {
                            img.src = heroImage;
                            img.style.opacity = "0.3";
                          }
                        }}
                      />
                    </div>
                    <div class="image-wrapper">
                      <img
                        src={imgGoogleStep3}
                        alt="Select Transfer Codes"
                        class="tutorial-img"
                        onerror={(e) => {
                          const img = e.currentTarget;
                          if (img instanceof HTMLImageElement) {
                            img.src = heroImage;
                            img.style.opacity = "0.3";
                          }
                        }}
                      />
                    </div>
                  </div>
                </li>

                {/* Step 3 */}
                <li>
                  <strong>{t("guide_ie_google_step3_title")}</strong>
                  <br />
                  {t("guide_ie_google_step3_desc")}
                  <div class="tutorial-image-container">
                    <div class="image-wrapper">
                      <img
                        src={imgGoogleStep4}
                        alt="Select Codes to Export"
                        class="tutorial-img"
                        onerror={(e) => {
                          const img = e.currentTarget;
                          if (img instanceof HTMLImageElement) {
                            img.src = heroImage;
                            img.style.opacity = "0.3";
                          }
                        }}
                      />
                    </div>
                  </div>
                </li>

                {/* Step 4 */}
                <li>
                  <strong>{t("guide_ie_google_step4_title")}</strong>
                  <br />
                  {t("guide_ie_google_step4_desc")}
                  <div class="tutorial-image-container">
                    <div class="image-wrapper">
                      <img
                        src={imgGoogleStep5}
                        alt="Export QR Code"
                        class="tutorial-img"
                        onerror={(e) => {
                          const img = e.currentTarget;
                          if (img instanceof HTMLImageElement) {
                            img.src = heroImage;
                            img.style.opacity = "0.3";
                          }
                        }}
                      />
                    </div>
                  </div>
                </li>

                {/* Step 5 */}
                <li>
                  <strong>{t("guide_ie_google_step5_title")}</strong>
                  <br />
                  {t("guide_ie_google_step5_desc")}
                </li>
              </ul>
            </div>
          </div>
        </Show>

        {/* Sub-tab 2: Bitwarden Import */}
        <Show when={activeSubTab() === "bitwarden"}>
          <div class="feature-detail-card fade-in">
            <div class="feature-icon-wrapper sync-icon-bg">📥</div>
            <div class="feature-content">
              <h3>{t("guide_ie_import_title")}</h3>
              <ul class="feature-bullets">
                <li>
                  <strong>{t("guide_ie_import_step1_title")}</strong>
                  <br />
                  {t("guide_ie_import_step1_desc")}
                </li>
                <li>
                  <strong>{t("guide_ie_import_step2_title")}</strong>
                  <br />
                  {t("guide_ie_import_step2_desc")}
                </li>
                <li>
                  <strong>{t("guide_ie_import_step3_title")}</strong>
                  <br />
                  {t("guide_ie_import_step3_desc")}
                </li>
              </ul>
            </div>
          </div>
        </Show>

        {/* Sub-tab 3: Export */}
        <Show when={activeSubTab() === "export"}>
          <div class="feature-detail-card fade-in">
            <div class="feature-icon-wrapper offline-icon-bg">📤</div>
            <div class="feature-content">
              <h3>{t("guide_ie_export_title")}</h3>
              <p>{t("guide_ie_export_desc")}</p>
              <ul class="feature-bullets">
                <li>{t("guide_ie_export_step1")}</li>
                <li>{t("guide_ie_export_step2")}</li>
                <li>{t("guide_ie_export_step3")}</li>
              </ul>
            </div>
          </div>
        </Show>
      </div>
    </section>
  );
};

export default ImportExportTab;
