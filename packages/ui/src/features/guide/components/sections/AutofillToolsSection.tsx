import { type Component, Match, Switch } from "solid-js";
import { AutofillUsageArticle } from "@/features/guide/components/articles/AutofillUsageArticle.tsx";
import { PasswordGeneratorArticle } from "@/features/guide/components/articles/PasswordGeneratorArticle.tsx";
import { PasswordHistoryArticle } from "@/features/guide/components/articles/PasswordHistoryArticle.tsx";

export interface GuideSectionProps {
  readonly route: string;
}

export const AutofillToolsSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "autofill-usage";

  return (
    <div class="guide-section-wrapper">
      <Switch fallback={<AutofillUsageArticle />}>
        <Match when={subRoute() === "autofill-usage"}>
          <AutofillUsageArticle />
        </Match>
        <Match when={subRoute() === "password-generator"}>
          <PasswordGeneratorArticle />
        </Match>
        <Match when={subRoute() === "password-history"}>
          <PasswordHistoryArticle />
        </Match>
      </Switch>
    </div>
  );
};
