import { type Component, Match, Switch } from "solid-js";
import { AppearanceLangArticle } from "@/features/guide/components/articles/AppearanceLangArticle.tsx";
import { FaqTroubleshootingArticle } from "@/features/guide/components/articles/FaqTroubleshootingArticle.tsx";
import { SecurityReportsArticle } from "@/features/guide/components/articles/SecurityReportsArticle.tsx";

export interface GuideSectionProps {
  readonly route: string;
}

export const ReportsSettingsSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "security-reports";

  return (
    <div class="guide-section-wrapper">
      <Switch fallback={<SecurityReportsArticle />}>
        <Match when={subRoute() === "security-reports"}>
          <SecurityReportsArticle />
        </Match>
        <Match when={subRoute() === "appearance-lang"}>
          <AppearanceLangArticle />
        </Match>
        <Match when={subRoute() === "faq-troubleshooting"}>
          <FaqTroubleshootingArticle />
        </Match>
      </Switch>
    </div>
  );
};
