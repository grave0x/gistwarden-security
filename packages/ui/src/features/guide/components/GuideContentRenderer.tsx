import { type Component, createEffect, Match, Switch } from "solid-js";
import { GettingStartedSection } from "@/features/guide/components/sections/GettingStartedSection.tsx";
import { VaultManagementSection } from "@/features/guide/components/sections/VaultManagementSection.tsx";
import { PasskeyAuthSection } from "@/features/guide/components/sections/PasskeyAuthSection.tsx";
import { AutofillToolsSection } from "@/features/guide/components/sections/AutofillToolsSection.tsx";
import { SyncDataSection } from "@/features/guide/components/sections/SyncDataSection.tsx";
import { ReportsSettingsSection } from "@/features/guide/components/sections/ReportsSettingsSection.tsx";

export interface GuideContentRendererProps {
  readonly route: string;
}

export const GuideContentRenderer: Component<GuideContentRendererProps> = (
  props,
) => {
  const mainCategory = () => props.route.split("/")[0] || "getting-started";

  createEffect(() => {
    const _r = props.route;
    const mainEl = document.querySelector(".guide-main-content");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  });

  return (
    <div class="guide-content-area">
      <Switch fallback={<GettingStartedSection route={props.route} />}>
        <Match when={mainCategory() === "getting-started"}>
          <GettingStartedSection route={props.route} />
        </Match>
        <Match when={mainCategory() === "vault-management"}>
          <VaultManagementSection route={props.route} />
        </Match>
        <Match when={mainCategory() === "passkey-auth"}>
          <PasskeyAuthSection route={props.route} />
        </Match>
        <Match when={mainCategory() === "autofill-tools"}>
          <AutofillToolsSection route={props.route} />
        </Match>
        <Match when={mainCategory() === "sync-data"}>
          <SyncDataSection route={props.route} />
        </Match>
        <Match when={mainCategory() === "reports-settings"}>
          <ReportsSettingsSection route={props.route} />
        </Match>
      </Switch>
    </div>
  );
};
