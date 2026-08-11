import type { TranslationKey } from "@gistwarden/domain";
import { type Component, createSignal, For, Show } from "solid-js";
import { t } from "@/core/i18n.ts";

export interface SwaggerEndpointResponse {
  readonly status: number;
  readonly badgeClass: "s2xx" | "s4xx" | "s5xx";
  readonly titleKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly examplePayload?: string;
}

export interface SwaggerEndpointDef {
  readonly id: string;
  readonly method: "POST" | "GET" | "DELETE" | "PUT";
  readonly path: string;
  readonly summaryKey: TranslationKey;
  readonly descriptionKey: TranslationKey;
  readonly headers?: readonly {
    readonly name: string;
    readonly value: string;
  }[];
  readonly requestBodyExample?: string;
  readonly responses: readonly SwaggerEndpointResponse[];
}

const ENDPOINTS_SPEC: readonly SwaggerEndpointDef[] = [
  {
    id: "register",
    method: "POST",
    path: "/auth/register",
    summaryKey: "swagger_ep_register_summary",
    descriptionKey: "swagger_ep_register_desc",
    headers: [{ name: "Content-Type", value: "application/json" }],
    requestBodyExample: JSON.stringify(
      {
        username: "admin_user",
        password: "server_account_password_123",
      },
      null,
      2,
    ),
    responses: [
      {
        status: 200,
        badgeClass: "s2xx",
        titleKey: "swagger_res_201_title",
        descriptionKey: "swagger_res_201_desc",
        examplePayload: JSON.stringify(
          {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            username: "admin_user",
          },
          null,
          2,
        ),
      },
      {
        status: 400,
        badgeClass: "s4xx",
        titleKey: "swagger_res_400_title",
        descriptionKey: "swagger_res_400_desc",
        examplePayload: JSON.stringify(
          {
            error: "bad_request",
            message: "Password must be at least 8 chars",
          },
          null,
          2,
        ),
      },
      {
        status: 409,
        badgeClass: "s4xx",
        titleKey: "swagger_res_409_title",
        descriptionKey: "swagger_res_409_desc",
        examplePayload: JSON.stringify(
          {
            error: "user_already_exists",
            message: "Username 'admin_user' is taken",
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "login",
    method: "POST",
    path: "/auth/login",
    summaryKey: "swagger_ep_login_summary",
    descriptionKey: "swagger_ep_login_desc",
    headers: [{ name: "Content-Type", value: "application/json" }],
    requestBodyExample: JSON.stringify(
      {
        username: "admin_user",
        password: "server_account_password_123",
      },
      null,
      2,
    ),
    responses: [
      {
        status: 200,
        badgeClass: "s2xx",
        titleKey: "swagger_res_200_login_title",
        descriptionKey: "swagger_res_200_login_desc",
        examplePayload: JSON.stringify(
          {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            username: "admin_user",
          },
          null,
          2,
        ),
      },
      {
        status: 401,
        badgeClass: "s4xx",
        titleKey: "swagger_res_401_login_title",
        descriptionKey: "swagger_res_401_login_desc",
        examplePayload: JSON.stringify(
          {
            error: "invalid_credentials",
            message: "Invalid username or password",
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "user",
    method: "GET",
    path: "/user",
    summaryKey: "swagger_ep_user_summary",
    descriptionKey: "swagger_ep_user_desc",
    headers: [{ name: "Authorization", value: "Bearer <accessToken>" }],
    responses: [
      {
        status: 200,
        badgeClass: "s2xx",
        titleKey: "swagger_res_200_login_title",
        descriptionKey: "swagger_res_200_login_desc",
        examplePayload: JSON.stringify(
          {
            username: "admin_user",
            avatarUrl: "https://example.com/avatar.png",
          },
          null,
          2,
        ),
      },
      {
        status: 401,
        badgeClass: "s4xx",
        titleKey: "swagger_res_401_token_title",
        descriptionKey: "swagger_res_401_token_desc",
        examplePayload: JSON.stringify(
          {
            error: "unauthorized",
            message: "Access token is invalid or expired",
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "get_vault",
    method: "GET",
    path: "/vault",
    summaryKey: "swagger_ep_get_vault_summary",
    descriptionKey: "swagger_ep_get_vault_desc",
    headers: [{ name: "Authorization", value: "Bearer <accessToken>" }],
    responses: [
      {
        status: 200,
        badgeClass: "s2xx",
        titleKey: "swagger_res_200_get_vault_title",
        descriptionKey: "swagger_res_200_get_vault_desc",
        examplePayload: JSON.stringify(
          {
            salt: "b7/dhGcRsT76ZEo+YkgXrQ==",
            iv: "LigBFLdYeIQ8FVH7",
            ciphertext: "6ap779GbnKndWfa6oGevQA...",
          },
          null,
          2,
        ),
      },
      {
        status: 401,
        badgeClass: "s4xx",
        titleKey: "swagger_res_401_token_title",
        descriptionKey: "swagger_res_401_token_desc",
        examplePayload: JSON.stringify(
          { error: "unauthorized", message: "Invalid or expired access token" },
          null,
          2,
        ),
      },
      {
        status: 404,
        badgeClass: "s4xx",
        titleKey: "swagger_res_404_title",
        descriptionKey: "swagger_res_404_desc",
        examplePayload: JSON.stringify(
          {
            error: "vault_not_found",
            message: "No vault exists for this account yet",
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "post_vault",
    method: "POST",
    path: "/vault",
    summaryKey: "swagger_ep_post_vault_summary",
    descriptionKey: "swagger_ep_post_vault_desc",
    headers: [
      { name: "Authorization", value: "Bearer <accessToken>" },
      { name: "Content-Type", value: "application/json" },
    ],
    requestBodyExample: JSON.stringify(
      {
        salt: "b7/dhGcRsT76ZEo+YkgXrQ==",
        iv: "LigBFLdYeIQ8FVH7",
        ciphertext: "6ap779GbnKndWfa6oGevQA...",
      },
      null,
      2,
    ),
    responses: [
      {
        status: 200,
        badgeClass: "s2xx",
        titleKey: "swagger_res_200_post_vault_title",
        descriptionKey: "swagger_res_200_post_vault_desc",
        examplePayload: JSON.stringify(
          {
            success: true,
          },
          null,
          2,
        ),
      },
      {
        status: 401,
        badgeClass: "s4xx",
        titleKey: "swagger_res_401_expired_title",
        descriptionKey: "swagger_res_401_expired_desc",
      },
      {
        status: 413,
        badgeClass: "s4xx",
        titleKey: "swagger_res_413_title",
        descriptionKey: "swagger_res_413_desc",
        examplePayload: JSON.stringify(
          {
            error: "payload_too_large",
            message: "Vault size exceeds server 10MB limit",
          },
          null,
          2,
        ),
      },
    ],
  },
  {
    id: "delete_vault",
    method: "DELETE",
    path: "/vault",
    summaryKey: "swagger_ep_delete_vault_summary",
    descriptionKey: "swagger_ep_delete_vault_desc",
    headers: [{ name: "Authorization", value: "Bearer <accessToken>" }],
    responses: [
      {
        status: 200,
        badgeClass: "s2xx",
        titleKey: "swagger_res_200_delete_vault_title",
        descriptionKey: "swagger_res_200_delete_vault_desc",
        examplePayload: JSON.stringify({ success: true }, null, 2),
      },
      {
        status: 401,
        badgeClass: "s4xx",
        titleKey: "swagger_res_401_unauthorized_title",
        descriptionKey: "swagger_res_401_unauthorized_desc",
      },
    ],
  },
];

export const SwaggerApiGuide: Component = () => {
  const [expandedId, setExpandedId] = createSignal<string | null>(null);

  const toggleExpand = (
    id: string,
    e: MouseEvent & { currentTarget: HTMLElement },
  ) => {
    const isOpening = expandedId() !== id;
    setExpandedId((prev) => (prev === id ? null : id));

    if (isOpening && e.currentTarget instanceof HTMLElement) {
      const targetEl = e.currentTarget.parentElement ?? e.currentTarget;
      setTimeout(() => {
        const mainEl = document.querySelector(".guide-main-content");
        if (mainEl instanceof HTMLElement) {
          const targetTop = targetEl.getBoundingClientRect().top;
          const mainTop = mainEl.getBoundingClientRect().top;
          const offsetPosition = targetTop - mainTop + mainEl.scrollTop - 70;
          mainEl.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
        }
        targetEl.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  };

  return (
    <div class="swagger-ui-wrapper">
      <div class="swagger-header-card">
        <div>
          <strong>{t("swagger_explorer_title")}</strong>
          <div class="swagger-header-url">
            {t("swagger_base_url_label")}:{" "}
            <code>https://&lt;domain_or_ip&gt;</code> (vd:{" "}
            <code>http://localhost:3000</code>)
          </div>
        </div>
        <span class="swagger-spec-badge">OAS v3.0</span>
      </div>

      <For each={ENDPOINTS_SPEC}>
        {(endpoint) => {
          const isExpanded = () => expandedId() === endpoint.id;
          const methodClass = endpoint.method.toLowerCase();

          return (
            <div
              class={`swagger-endpoint-item ${isExpanded() ? "expanded" : ""}`}
            >
              <div
                class="swagger-endpoint-header"
                onClick={(e) => toggleExpand(endpoint.id, e)}
              >
                <div class="swagger-endpoint-left">
                  <span class={`swagger-method-badge ${methodClass}`}>
                    {endpoint.method}
                  </span>
                  <span class="swagger-endpoint-path">{endpoint.path}</span>
                  <span class="swagger-endpoint-summary">
                    {t(endpoint.summaryKey)}
                  </span>
                </div>
                <span class="swagger-toggle-btn">
                  <span
                    class={`swagger-chevron-icon ${isExpanded() ? "open" : ""}`}
                  >
                    ▶
                  </span>
                  {isExpanded() ? t("swagger_collapse") : t("swagger_expand")}
                </span>
              </div>

              <div class="swagger-endpoint-body-wrapper">
                <div class="swagger-endpoint-body">
                  <p class="swagger-endpoint-desc">
                    {t(endpoint.descriptionKey)}
                  </p>

                  <Show when={endpoint.headers && endpoint.headers.length > 0}>
                    <div>
                      <div class="swagger-section-title">Request Headers</div>
                      <For each={endpoint.headers}>
                        {(h) => (
                          <div class="swagger-header-item">
                            <code>{h.name}</code>: <span>{h.value}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>

                  <Show when={endpoint.requestBodyExample}>
                    <div>
                      <div class="swagger-section-title">
                        {t("swagger_request_body_title")}
                      </div>
                      <pre class="swagger-code-block">
                        <code>{endpoint.requestBodyExample}</code>
                      </pre>
                    </div>
                  </Show>

                  <div>
                    <div class="swagger-section-title">
                      {t("swagger_responses_title")}
                    </div>
                    <div class="swagger-responses-list">
                      <For each={endpoint.responses}>
                        {(res) => (
                          <div class="swagger-response-row">
                            <div class="swagger-response-header">
                              <span
                                class={`swagger-status-badge ${res.badgeClass}`}
                              >
                                HTTP {res.status}
                              </span>
                              <strong class="swagger-response-title">
                                {t(res.titleKey)}
                              </strong>
                            </div>
                            <div class="swagger-response-desc">
                              {t(res.descriptionKey)}
                            </div>
                            <Show when={res.examplePayload}>
                              <pre class="swagger-code-block swagger-code-block-mt">
                                <code>{res.examplePayload}</code>
                              </pre>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
};
