import { type Component, Match, Switch } from "solid-js";
import { CardsIdentitiesArticle } from "@/features/guide/components/articles/CardsIdentitiesArticle.tsx";
import { CustomFieldsArticle } from "@/features/guide/components/articles/CustomFieldsArticle.tsx";
import { FoldersTrashArticle } from "@/features/guide/components/articles/FoldersTrashArticle.tsx";
import { LoginsArticle } from "@/features/guide/components/articles/LoginsArticle.tsx";
import { SecureNotesArticle } from "@/features/guide/components/articles/SecureNotesArticle.tsx";
import { SshKeysArticle } from "@/features/guide/components/articles/SshKeysArticle.tsx";

export interface GuideSectionProps {
  readonly route: string;
}

export const VaultManagementSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "logins";

  return (
    <div class="guide-section-wrapper">
      <Switch fallback={<LoginsArticle />}>
        <Match when={subRoute() === "logins"}>
          <LoginsArticle />
        </Match>
        <Match when={subRoute() === "secure-notes"}>
          <SecureNotesArticle />
        </Match>
        <Match when={subRoute() === "cards-identities"}>
          <CardsIdentitiesArticle />
        </Match>
        <Match when={subRoute() === "ssh-keys"}>
          <SshKeysArticle />
        </Match>
        <Match when={subRoute() === "custom-fields"}>
          <CustomFieldsArticle />
        </Match>
        <Match when={subRoute() === "folders-trash"}>
          <FoldersTrashArticle />
        </Match>
      </Switch>
    </div>
  );
};
