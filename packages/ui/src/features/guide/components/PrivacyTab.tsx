import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";

export const PrivacyTab: Component = () => {
  return (
    <section class="tab-panel fade-in">
      <div class="panel-header">
        <h2>🔒 {t("guide_privacy_title")}</h2>
        <p>{t("guide_privacy_subtitle")}</p>
      </div>

      <div class="features-detailed-grid">
        {/* Section 1 */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper sync-icon-bg">🛡️</div>
          <div class="feature-content">
            <h3>{t("guide_privacy_sec1_title")}</h3>
            <p>{t("guide_privacy_sec1_desc")}</p>
          </div>
        </div>

        {/* Section 2 */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper collect-icon-bg">🚫</div>
          <div class="feature-content">
            <h3>{t("guide_privacy_sec2_title")}</h3>
            <p>{t("guide_privacy_sec2_desc")}</p>
          </div>
        </div>

        {/* Section 3 */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper offline-icon-bg">🔐</div>
          <div class="feature-content">
            <h3>{t("guide_privacy_sec3_title")}</h3>
            <p>{t("guide_privacy_sec3_desc")}</p>
          </div>
        </div>

        {/* Section 4 */}
        <div class="feature-detail-card">
          <div class="feature-icon-wrapper sync-icon-bg">👤</div>
          <div class="feature-content">
            <h3>{t("guide_privacy_sec4_title")}</h3>
            <p>{t("guide_privacy_sec4_desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyTab;
