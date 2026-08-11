import { type Component, Match, Switch } from "solid-js";
import { ExportCsvArticle } from "@/features/guide/components/articles/ExportCsvArticle.tsx";
import { ExportJsonArticle } from "@/features/guide/components/articles/ExportJsonArticle.tsx";
import { GistSyncArticle } from "@/features/guide/components/articles/GistSyncArticle.tsx";
import { ImportCsvArticle } from "@/features/guide/components/articles/ImportCsvArticle.tsx";
import { ImportJsonArticle } from "@/features/guide/components/articles/ImportJsonArticle.tsx";

export interface GuideSectionProps {
  readonly route: string;
}

export const SyncDataSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "gist-sync";

  return (
    <div class="guide-section-wrapper">
      <Switch fallback={<GistSyncArticle />}>
        <Match when={subRoute() === "gist-sync"}>
          <GistSyncArticle />
        </Match>
        <Match when={subRoute() === "import-csv"}>
          <ImportCsvArticle />
        </Match>
        <Match when={subRoute() === "import-json"}>
          <ImportJsonArticle />
        </Match>
        <Match when={subRoute() === "export-csv"}>
          <ExportCsvArticle />
        </Match>
        <Match when={subRoute() === "export-json"}>
          <ExportJsonArticle />
        </Match>
      </Switch>
    </div>
  );
};
