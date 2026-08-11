import { type Component, Match, Switch } from "solid-js";
import { AutoLockArticle } from "@/features/guide/components/articles/AutoLockArticle.tsx";
import { DownloadExtensionArticle } from "@/features/guide/components/articles/DownloadExtensionArticle.tsx";
import { GithubGistArticle } from "@/features/guide/components/articles/GithubGistArticle.tsx";
import { LocalVaultArticle } from "@/features/guide/components/articles/LocalVaultArticle.tsx";
import { MasterPasswordArticle } from "@/features/guide/components/articles/MasterPasswordArticle.tsx";
import { OverviewArticle } from "@/features/guide/components/articles/OverviewArticle.tsx";
import { SelfHostedServerArticle } from "@/features/guide/components/articles/SelfHostedServerArticle.tsx";
import { WebVersionArticle } from "@/features/guide/components/articles/WebVersionArticle.tsx";

export interface GuideSectionProps {
  readonly route: string;
}

export const GettingStartedSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "overview";

  return (
    <div class="guide-section-wrapper">
      <Switch fallback={<OverviewArticle />}>
        <Match when={subRoute() === "overview"}>
          <OverviewArticle />
        </Match>
        <Match when={subRoute() === "download-extension"}>
          <DownloadExtensionArticle />
        </Match>
        <Match when={subRoute() === "web-version"}>
          <WebVersionArticle />
        </Match>
        <Match when={subRoute() === "master-password"}>
          <MasterPasswordArticle />
        </Match>
        <Match when={subRoute() === "github-gist"}>
          <GithubGistArticle />
        </Match>
        <Match when={subRoute() === "self-hosted-server"}>
          <SelfHostedServerArticle />
        </Match>
        <Match when={subRoute() === "local-vault"}>
          <LocalVaultArticle />
        </Match>
        <Match when={subRoute() === "auto-lock"}>
          <AutoLockArticle />
        </Match>
      </Switch>
    </div>
  );
};
