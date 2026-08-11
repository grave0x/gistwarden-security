import { type Component, Match, Switch } from "solid-js";
import { GoogleMigrationArticle } from "@/features/guide/components/articles/GoogleMigrationArticle.tsx";
import { PasskeyConceptArticle } from "@/features/guide/components/articles/PasskeyConceptArticle.tsx";
import { PasskeyLoginArticle } from "@/features/guide/components/articles/PasskeyLoginArticle.tsx";
import { PasskeyRegisterArticle } from "@/features/guide/components/articles/PasskeyRegisterArticle.tsx";
import { TotpAuthenticatorArticle } from "@/features/guide/components/articles/TotpAuthenticatorArticle.tsx";

export interface GuideSectionProps {
  readonly route: string;
}

export const PasskeyAuthSection: Component<GuideSectionProps> = (props) => {
  const subRoute = () => props.route.split("/")[1] || "passkey-concept";

  return (
    <div class="guide-section-wrapper">
      <Switch fallback={<PasskeyConceptArticle />}>
        <Match when={subRoute() === "passkey-concept"}>
          <PasskeyConceptArticle />
        </Match>
        <Match when={subRoute() === "passkey-register"}>
          <PasskeyRegisterArticle />
        </Match>
        <Match when={subRoute() === "passkey-login"}>
          <PasskeyLoginArticle />
        </Match>
        <Match when={subRoute() === "totp-authenticator"}>
          <TotpAuthenticatorArticle />
        </Match>
        <Match when={subRoute() === "google-migration"}>
          <GoogleMigrationArticle />
        </Match>
      </Switch>
    </div>
  );
};
