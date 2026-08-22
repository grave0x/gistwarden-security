import {
  asVaultItemId,
  FieldType,
  filterMatchingDomainItems,
  isLoginItem,
  type LoginVaultItem,
  UriMatchMode,
  type VaultItem,
  VaultItemType,
} from "@gistwarden/domain";
import { Window } from "happy-dom";
import { performAutofill } from "../apps/extension/src/extension/autofill-core.ts";
import { assert, assertEquals, test } from "./assert.ts";

function setupDOM(html: string, url = "https://example.com/login") {
  const window = new Window({ url });
  window.document.body.innerHTML = html;

  Object.assign(globalThis, {
    document: window.document,
    window: window,
    HTMLElement: window.HTMLElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    HTMLSelectElement: window.HTMLSelectElement,
    HTMLFormElement: window.HTMLFormElement,
    Event: window.Event,
    Node: window.Node,
  });

  return window.document;
}

function createMockLoginItem(
  id: string,
  name: string,
  uris: { uri: string; match?: UriMatchMode | null }[],
  username = "test_user",
  password = "test_password",
  fields: Array<{
    name: string;
    value: string;
    type?: FieldType;
    linkedId?: number | null;
  }> = [],
): LoginVaultItem {
  return {
    id: asVaultItemId(id),
    type: VaultItemType.Login,
    name,
    favorite: false,
    reprompt: 0,
    fields: fields.map((f) => ({
      name: f.name,
      value: f.value,
      type: f.type ?? FieldType.Text,
      linkedId: f.linkedId ?? null,
    })),
    creationDate: new Date().toISOString(),
    revisionDate: new Date().toISOString(),
    login: {
      username,
      password,
      uris,
    },
  };
}

test("Integration - StartsWith Domain Matching + Linked, Checkbox, Text & Hidden Autofill", () => {
  const currentUrl =
    "https://auth.internal.corp/v2/sso/login?redirect_uri=dashboard";
  const doc = setupDOM(
    `
    <form id="sso_form">
      <input type="text" name="login_principal" id="login_principal" />
      <input type="password" name="credential_secret" id="credential_secret" />
      <input type="checkbox" name="remember_device" id="remember_device" />
      <input type="text" name="tenant_id" id="tenant_id" />
      <input type="password" name="sec_pin" id="sec_pin" />
    </form>
  `,
    currentUrl,
  );

  const vaultItems: VaultItem[] = [
    createMockLoginItem(
      "item-startswith-match",
      "SSO Corporate Account",
      [
        {
          uri: "https://auth.internal.corp/v2/sso/login",
          match: UriMatchMode.StartsWith,
        },
      ],
      "alice_corp",
      "AliceSecret#2026",
      [
        {
          name: "login_principal",
          type: FieldType.Linked,
          value: "username",
        },
        {
          name: "credential_secret",
          type: FieldType.Linked,
          value: "password",
        },
        {
          name: "remember_device",
          type: FieldType.Boolean,
          value: "true",
        },
        {
          name: "tenant_id",
          type: FieldType.Text,
          value: "TENANT_CORP_01",
        },
        {
          name: "sec_pin",
          type: FieldType.Hidden,
          value: "998877",
        },
      ],
    ),
    createMockLoginItem(
      "item-host-mismatch",
      "Other Subdomain Item",
      [
        {
          uri: "https://other.internal.corp",
          match: UriMatchMode.Host,
        },
      ],
      "other_user",
      "other_pass",
    ),
    createMockLoginItem(
      "item-never-match",
      "Never Match Item",
      [
        {
          uri: "https://auth.internal.corp/v2/sso/login",
          match: UriMatchMode.Never,
        },
      ],
      "never_user",
      "never_pass",
    ),
  ];

  // 1. Match against current URL
  const matched = filterMatchingDomainItems(
    vaultItems,
    currentUrl,
    VaultItemType.Login,
  );
  assertEquals(
    matched.length,
    1,
    "Only StartsWith item should match current URL",
  );
  const targetItem = matched[0];
  assert(targetItem && isLoginItem(targetItem));
  assertEquals(targetItem.id, asVaultItemId("item-startswith-match"));

  // 2. Perform Autofill with matched item's credentials and custom fields
  const autofillSuccess = performAutofill(
    targetItem.login.username,
    targetItem.login.password,
    false,
    targetItem.fields,
  );
  assertEquals(autofillSuccess, true);

  // 3. Assert all DOM inputs received values according to custom field rules
  const userEl = doc.getElementById(
    "login_principal",
  ) as HTMLInputElement | null;
  const passEl = doc.getElementById(
    "credential_secret",
  ) as HTMLInputElement | null;
  const cbEl = doc.getElementById("remember_device") as HTMLInputElement | null;
  const tenantEl = doc.getElementById("tenant_id") as HTMLInputElement | null;
  const pinEl = doc.getElementById("sec_pin") as HTMLInputElement | null;

  assertEquals(userEl?.value, "alice_corp");
  assertEquals(passEl?.value, "AliceSecret#2026");
  assertEquals(cbEl?.checked, true);
  assertEquals(tenantEl?.value, "TENANT_CORP_01");
  assertEquals(pinEl?.value, "998877");
});

test("Integration - Exact Match Sorting Priority over Base Domain + Autofill", () => {
  const currentUrl = "https://portal.bank.com.vn/ebank/login";
  const doc = setupDOM(
    `
    <form id="bank_login">
      <input type="text" name="username" id="username" />
      <input type="password" name="password" id="password" />
    </form>
  `,
    currentUrl,
  );

  const vaultItems: VaultItem[] = [
    createMockLoginItem(
      "item-base-domain",
      "General Bank Item",
      [{ uri: "https://bank.com.vn", match: UriMatchMode.Domain }],
      "general_user",
      "general_pass",
    ),
    createMockLoginItem(
      "item-exact-match",
      "EBank Specific Account",
      [
        {
          uri: "https://portal.bank.com.vn/ebank/login",
          match: UriMatchMode.Exact,
        },
      ],
      "vip_ebank_user",
      "vip_ebank_pass",
    ),
  ];

  // 1. Domain matching should find both, but rank Exact Match first!
  const matched = filterMatchingDomainItems(
    vaultItems,
    currentUrl,
    VaultItemType.Login,
  );
  assertEquals(matched.length, 2);
  const bestMatch = matched[0];
  assert(bestMatch && isLoginItem(bestMatch));
  assertEquals(
    bestMatch.id,
    asVaultItemId("item-exact-match"),
    "Exact match item must be prioritized at index 0",
  );

  // 2. Autofill with prioritized best match
  const success = performAutofill(
    bestMatch.login.username,
    bestMatch.login.password,
    false,
    bestMatch.fields,
  );
  assertEquals(success, true);

  const userEl = doc.getElementById("username") as HTMLInputElement | null;
  const passEl = doc.getElementById("password") as HTMLInputElement | null;
  assertEquals(userEl?.value, "vip_ebank_user");
  assertEquals(passEl?.value, "vip_ebank_pass");
});

test("Integration - Host Match Isolation prevents Cross-Subdomain Autofill", () => {
  const currentUrl = "https://admin.console.cloud.io/login";
  const doc = setupDOM(
    `
    <form id="cloud_login">
      <input type="text" name="username" id="username" />
      <input type="password" name="password" id="password" />
    </form>
  `,
    currentUrl,
  );

  const vaultItems: VaultItem[] = [
    createMockLoginItem(
      "item-client-host",
      "Customer Portal",
      [{ uri: "https://client.console.cloud.io", match: UriMatchMode.Host }],
      "client_user",
      "client_pass",
    ),
    createMockLoginItem(
      "item-admin-host",
      "Admin Portal",
      [{ uri: "https://admin.console.cloud.io", match: UriMatchMode.Host }],
      "admin_super_user",
      "admin_secret_key",
    ),
  ];

  // 1. Host match ensures only the admin portal item matches
  const matched = filterMatchingDomainItems(
    vaultItems,
    currentUrl,
    VaultItemType.Login,
  );
  assertEquals(matched.length, 1);
  const adminItem = matched[0];
  assert(adminItem && isLoginItem(adminItem));
  assertEquals(adminItem.id, asVaultItemId("item-admin-host"));

  // 2. Perform Autofill
  const success = performAutofill(
    adminItem.login.username,
    adminItem.login.password,
    false,
    adminItem.fields,
  );
  assertEquals(success, true);

  const userEl = doc.getElementById("username") as HTMLInputElement | null;
  const passEl = doc.getElementById("password") as HTMLInputElement | null;
  assertEquals(userEl?.value, "admin_super_user");
  assertEquals(passEl?.value, "admin_secret_key");
});

test("Integration - Dynamic Regex Domain Match + Multi-Input Autofill", () => {
  const currentUrl = "https://node-42.cluster.devops.net:9443/login";
  const doc = setupDOM(
    `
    <form id="devops_node_form">
      <input type="text" name="devops_user" id="devops_user" />
      <input type="password" name="devops_pass" id="devops_pass" />
      <input type="text" name="cluster_node_tag" id="cluster_node_tag" />
      <input type="checkbox" name="cluster_ssl_confirm" id="cluster_ssl_confirm" />
    </form>
  `,
    currentUrl,
  );

  const vaultItems: VaultItem[] = [
    createMockLoginItem(
      "item-cluster-regex",
      "DevOps Dynamic Cluster Node",
      [
        {
          uri: "^https:\\/\\/node-\\d+\\.cluster\\.devops\\.net:\\d+\\/login$",
          match: UriMatchMode.Regex,
        },
      ],
      "devops_deployer",
      "k8s_cluster_token_99",
      [
        {
          name: "devops_user",
          type: FieldType.Linked,
          value: "username",
        },
        {
          name: "devops_pass",
          type: FieldType.Linked,
          value: "password",
        },
        {
          name: "cluster_node_tag",
          type: FieldType.Text,
          value: "CLUSTER_EU_WEST",
        },
        {
          name: "cluster_ssl_confirm",
          type: FieldType.Boolean,
          value: "1",
        },
      ],
    ),
  ];

  // 1. Match via dynamic regex
  const matched = filterMatchingDomainItems(
    vaultItems,
    currentUrl,
    VaultItemType.Login,
  );
  assertEquals(matched.length, 1);
  const nodeItem = matched[0];
  assert(nodeItem && isLoginItem(nodeItem));
  assertEquals(nodeItem.id, asVaultItemId("item-cluster-regex"));

  // 2. Perform Autofill
  const success = performAutofill(
    nodeItem.login.username,
    nodeItem.login.password,
    false,
    nodeItem.fields,
  );
  assertEquals(success, true);

  const userEl = doc.getElementById("devops_user") as HTMLInputElement | null;
  const passEl = doc.getElementById("devops_pass") as HTMLInputElement | null;
  const tagEl = doc.getElementById(
    "cluster_node_tag",
  ) as HTMLInputElement | null;
  const sslCb = doc.getElementById(
    "cluster_ssl_confirm",
  ) as HTMLInputElement | null;

  assertEquals(userEl?.value, "devops_deployer");
  assertEquals(passEl?.value, "k8s_cluster_token_99");
  assertEquals(tagEl?.value, "CLUSTER_EU_WEST");
  assertEquals(sslCb?.checked, true);
});

test("Integration - Never Match blocks matching and keeps form untouched", () => {
  const currentUrl = "https://sensitive.finance.gov/login";
  const doc = setupDOM(
    `
    <form id="gov_form">
      <input type="text" name="username" id="username" />
      <input type="password" name="password" id="password" />
    </form>
  `,
    currentUrl,
  );

  const vaultItems: VaultItem[] = [
    createMockLoginItem(
      "item-never-finance",
      "Sensitive Gov Portal",
      [
        {
          uri: "https://sensitive.finance.gov/login",
          match: UriMatchMode.Never,
        },
      ],
      "finance_officer",
      "top_secret_pass",
    ),
  ];

  // 1. Domain match engine must return 0 results
  const matched = filterMatchingDomainItems(
    vaultItems,
    currentUrl,
    VaultItemType.Login,
  );
  assertEquals(matched.length, 0, "Item with Never mode must yield 0 matches");

  // Form remains clean and unfilled
  const userEl = doc.getElementById("username") as HTMLInputElement | null;
  const passEl = doc.getElementById("password") as HTMLInputElement | null;
  assertEquals(userEl?.value, "");
  assertEquals(passEl?.value, "");
});

test("Integration - Checkbox Uncheck on Autofill for Matched Base Domain", () => {
  const currentUrl = "https://app.shop.co.uk/checkout";
  const doc = setupDOM(
    `
    <form id="checkout_form">
      <input type="text" name="customer_email" id="customer_email" />
      <input type="password" name="account_pwd" id="account_pwd" />
      <input type="checkbox" name="opt_in_marketing" id="opt_in_marketing" checked />
    </form>
  `,
    currentUrl,
  );

  const vaultItems: VaultItem[] = [
    createMockLoginItem(
      "item-shop-uk",
      "UK Shop Account",
      [{ uri: "https://shop.co.uk", match: UriMatchMode.Domain }],
      "buyer@shop.co.uk",
      "ShopPass#2026",
      [
        {
          name: "customer_email",
          type: FieldType.Linked,
          value: "username",
        },
        {
          name: "account_pwd",
          type: FieldType.Linked,
          value: "password",
        },
        {
          name: "opt_in_marketing",
          type: FieldType.Boolean,
          value: "false", // Uncheck previously checked marketing box
        },
      ],
    ),
  ];

  // 1. Base domain matches .co.uk subdomains
  const matched = filterMatchingDomainItems(
    vaultItems,
    currentUrl,
    VaultItemType.Login,
  );
  assertEquals(matched.length, 1);

  const shopItem = matched[0];
  assert(shopItem && isLoginItem(shopItem));

  // 2. Perform Autofill
  const success = performAutofill(
    shopItem.login.username,
    shopItem.login.password,
    false,
    shopItem.fields,
  );
  assertEquals(success, true);

  const emailEl = doc.getElementById(
    "customer_email",
  ) as HTMLInputElement | null;
  const pwdEl = doc.getElementById("account_pwd") as HTMLInputElement | null;
  const optInCb = doc.getElementById(
    "opt_in_marketing",
  ) as HTMLInputElement | null;

  assertEquals(emailEl?.value, "buyer@shop.co.uk");
  assertEquals(pwdEl?.value, "ShopPass#2026");
  assertEquals(
    optInCb?.checked,
    false,
    "Checkbox should be unchecked by value 'false'",
  );
});

test("Integration - Single Vault Item with 2 Different URIs matches and autofills both sites", () => {
  // A single Vault item holding credentials for both Google and YouTube
  const multiUriItem = createMockLoginItem(
    "item-unified-google",
    "Google & YouTube SSO",
    [
      { uri: "https://google.com", match: UriMatchMode.Domain },
      { uri: "https://youtube.com", match: UriMatchMode.Domain },
    ],
    "universal_admin@gmail.com",
    "UniversalPass#2026",
    [
      {
        name: "account_handle",
        type: FieldType.Linked,
        value: "username",
      },
      {
        name: "secret_token",
        type: FieldType.Linked,
        value: "password",
      },
      {
        name: "trust_device",
        type: FieldType.Boolean,
        value: "true",
      },
      {
        name: "dept_code",
        type: FieldType.Text,
        value: "MEDIA_CORP",
      },
    ],
  );

  const vault: VaultItem[] = [multiUriItem];

  // ==========================================
  // SITE 1: Testing on accounts.google.com
  // ==========================================
  const url1 = "https://accounts.google.com/signin/v2/identifier";
  const doc1 = setupDOM(
    `
    <form id="google_form">
      <input type="text" name="account_handle" id="account_handle" />
      <input type="password" name="secret_token" id="secret_token" />
      <input type="checkbox" name="trust_device" id="trust_device" />
      <input type="text" name="dept_code" id="dept_code" />
    </form>
  `,
    url1,
  );

  const match1 = filterMatchingDomainItems(vault, url1, VaultItemType.Login);
  assertEquals(match1.length, 1, "Single item should match Site 1 (Google)");
  const item1 = match1[0];
  assert(item1 && isLoginItem(item1));
  assertEquals(item1.id, asVaultItemId("item-unified-google"));

  const success1 = performAutofill(
    item1.login.username,
    item1.login.password,
    false,
    item1.fields,
  );
  assertEquals(success1, true, "Autofill should succeed on Site 1");

  const userEl1 = doc1.getElementById(
    "account_handle",
  ) as HTMLInputElement | null;
  const passEl1 = doc1.getElementById(
    "secret_token",
  ) as HTMLInputElement | null;
  const cbEl1 = doc1.getElementById("trust_device") as HTMLInputElement | null;
  const deptEl1 = doc1.getElementById("dept_code") as HTMLInputElement | null;

  assertEquals(userEl1?.value, "universal_admin@gmail.com");
  assertEquals(passEl1?.value, "UniversalPass#2026");
  assertEquals(cbEl1?.checked, true);
  assertEquals(deptEl1?.value, "MEDIA_CORP");

  // ==========================================
  // SITE 2: Testing on www.youtube.com
  // ==========================================
  const url2 = "https://www.youtube.com/signin/web";
  const doc2 = setupDOM(
    `
    <form id="youtube_form">
      <input type="text" name="account_handle" id="yt_user" />
      <input type="password" name="secret_token" id="yt_pass" />
      <input type="checkbox" name="trust_device" id="yt_stay_signed_in" />
      <input type="text" name="dept_code" id="yt_dept" />
    </form>
  `,
    url2,
  );

  const match2 = filterMatchingDomainItems(vault, url2, VaultItemType.Login);
  assertEquals(
    match2.length,
    1,
    "The SAME single item should match Site 2 (YouTube)",
  );
  const item2 = match2[0];
  assert(item2 && isLoginItem(item2));
  assertEquals(item2.id, asVaultItemId("item-unified-google"));

  const success2 = performAutofill(
    item2.login.username,
    item2.login.password,
    false,
    item2.fields,
  );
  assertEquals(success2, true, "Autofill should succeed on Site 2");

  const userEl2 = doc2.getElementById("yt_user") as HTMLInputElement | null;
  const passEl2 = doc2.getElementById("yt_pass") as HTMLInputElement | null;
  const cbEl2 = doc2.getElementById(
    "yt_stay_signed_in",
  ) as HTMLInputElement | null;
  const deptEl2 = doc2.getElementById("yt_dept") as HTMLInputElement | null;

  assertEquals(userEl2?.value, "universal_admin@gmail.com");
  assertEquals(passEl2?.value, "UniversalPass#2026");
  assertEquals(cbEl2?.checked, true);
  assertEquals(deptEl2?.value, "MEDIA_CORP");

  // ==========================================
  // SITE 3: Testing on unrelated site (Facebook)
  // ==========================================
  const url3 = "https://facebook.com/login";
  const doc3 = setupDOM(
    `
    <form id="fb_form">
      <input type="text" name="username" id="fb_user" />
      <input type="password" name="password" id="fb_pass" />
    </form>
  `,
    url3,
  );

  const match3 = filterMatchingDomainItems(vault, url3, VaultItemType.Login);
  assertEquals(match3.length, 0, "Unrelated site (Facebook) must NOT match");

  const userEl3 = doc3.getElementById("fb_user") as HTMLInputElement | null;
  const passEl3 = doc3.getElementById("fb_pass") as HTMLInputElement | null;
  assertEquals(userEl3?.value, "", "Form on unrelated site remains empty");
  assertEquals(passEl3?.value, "", "Form on unrelated site remains empty");
});

test("Integration - Single Vault with 2 different match modes and site-specific custom fields (Field 1 on Site A, Field 2 on Site B)", () => {
  // A single Vault item with 2 distinct URIs having 2 DIFFERENT match detection modes:
  // URI 1: Exact mode for legacy auth portal
  // URI 2: Host mode for modern cloud portal
  // Custom Fields:
  // - field_a_token & field_a_remember (Only exist on Site A)
  // - field_b_tenant & field_b_agree (Only exist on Site B)
  // - legacy_user_field (Linked to username on Site A)
  // - modern_user_field (Linked to username on Site B)
  const dualModeVaultItem = createMockLoginItem(
    "item-hybrid-enterprise",
    "Enterprise Hybrid SSO",
    [
      {
        uri: "https://auth.company.com/v1/legacy",
        match: UriMatchMode.Exact,
      },
      {
        uri: "https://portal.company.com",
        match: UriMatchMode.Host,
      },
    ],
    "hybrid_worker@company.com",
    "HybridSecret#2026",
    [
      // Fields specific to Site A (Legacy Portal)
      {
        name: "legacy_user_field",
        type: FieldType.Linked,
        value: "username",
      },
      {
        name: "field_a_token",
        type: FieldType.Text,
        value: "LEGACY_V1_TOKEN",
      },
      {
        name: "field_a_remember",
        type: FieldType.Boolean,
        value: "true",
      },

      // Fields specific to Site B (Modern Portal)
      {
        name: "modern_user_field",
        type: FieldType.Linked,
        value: "username",
      },
      {
        name: "field_b_tenant",
        type: FieldType.Text,
        value: "TENANT_MODERN_PORTAL",
      },
      {
        name: "field_b_agree",
        type: FieldType.Boolean,
        value: "false", // Should uncheck checkbox on site B
      },
    ],
  );

  const vault: VaultItem[] = [dualModeVaultItem];

  // =========================================================================
  // SCENARIO A: Visiting Site A (Exact match mode on https://auth.company.com/v1/legacy)
  // =========================================================================
  const siteAUrl = "https://auth.company.com/v1/legacy";
  const docA = setupDOM(
    `
    <form id="legacy_form">
      <input type="text" name="legacy_user_field" id="legacy_user_field" />
      <input type="password" name="password" id="legacy_pass" />
      <input type="text" name="field_a_token" id="field_a_token" />
      <input type="checkbox" name="field_a_remember" id="field_a_remember" />
    </form>
  `,
    siteAUrl,
  );

  // 1. Verify Site A matches
  const matchA = filterMatchingDomainItems(
    vault,
    siteAUrl,
    VaultItemType.Login,
  );
  assertEquals(matchA.length, 1, "Site A matches via Exact mode");
  const itemA = matchA[0];
  assert(itemA && isLoginItem(itemA));
  assertEquals(itemA.id, asVaultItemId("item-hybrid-enterprise"));

  // 2. Execute Autofill on Site A
  const successA = performAutofill(
    itemA.login.username,
    itemA.login.password,
    false,
    itemA.fields,
  );
  assertEquals(successA, true);

  // 3. Verify Site A fields are filled correctly and Site B fields did not cause any errors
  const userA = docA.getElementById(
    "legacy_user_field",
  ) as HTMLInputElement | null;
  const passA = docA.getElementById("legacy_pass") as HTMLInputElement | null;
  const tokenA = docA.getElementById(
    "field_a_token",
  ) as HTMLInputElement | null;
  const remA = docA.getElementById(
    "field_a_remember",
  ) as HTMLInputElement | null;

  assertEquals(userA?.value, "hybrid_worker@company.com");
  assertEquals(passA?.value, "HybridSecret#2026");
  assertEquals(tokenA?.value, "LEGACY_V1_TOKEN");
  assertEquals(remA?.checked, true);

  // =========================================================================
  // SCENARIO B: Visiting Site B (Host match mode on https://portal.company.com/app/signin)
  // =========================================================================
  const siteBUrl = "https://portal.company.com/app/signin";
  const docB = setupDOM(
    `
    <form id="modern_form">
      <input type="text" name="modern_user_field" id="modern_user_field" />
      <input type="password" name="password" id="modern_pass" />
      <input type="text" name="field_b_tenant" id="field_b_tenant" />
      <input type="checkbox" name="field_b_agree" id="field_b_agree" checked />
    </form>
  `,
    siteBUrl,
  );

  // 1. Verify Site B matches
  const matchB = filterMatchingDomainItems(
    vault,
    siteBUrl,
    VaultItemType.Login,
  );
  assertEquals(matchB.length, 1, "Site B matches via Host mode");
  const itemB = matchB[0];
  assert(itemB && isLoginItem(itemB));
  assertEquals(itemB.id, asVaultItemId("item-hybrid-enterprise"));

  // 2. Execute Autofill on Site B
  const successB = performAutofill(
    itemB.login.username,
    itemB.login.password,
    false,
    itemB.fields,
  );
  assertEquals(successB, true);

  // 3. Verify Site B fields are filled correctly and Site A fields did not interfere
  const userB = docB.getElementById(
    "modern_user_field",
  ) as HTMLInputElement | null;
  const passB = docB.getElementById("modern_pass") as HTMLInputElement | null;
  const tenantB = docB.getElementById(
    "field_b_tenant",
  ) as HTMLInputElement | null;
  const agreeB = docB.getElementById(
    "field_b_agree",
  ) as HTMLInputElement | null;

  assertEquals(userB?.value, "hybrid_worker@company.com");
  assertEquals(passB?.value, "HybridSecret#2026");
  assertEquals(tenantB?.value, "TENANT_MODERN_PORTAL");
  assertEquals(
    agreeB?.checked,
    false,
    "Site B checkbox should be unchecked by field_b_agree = 'false'",
  );

  // =========================================================================
  // SCENARIO C: Visiting an unauthorized subpath on auth.company.com
  // (https://auth.company.com/v2/new-login does NOT match URI 1 because URI 1 is Exact!)
  // =========================================================================
  const siteCUrl = "https://auth.company.com/v2/new-login";
  const docC = setupDOM(
    `
    <form id="other_form">
      <input type="text" name="username" id="userC" />
      <input type="password" name="password" id="passC" />
    </form>
  `,
    siteCUrl,
  );

  const matchC = filterMatchingDomainItems(
    vault,
    siteCUrl,
    VaultItemType.Login,
  );
  assertEquals(
    matchC.length,
    0,
    "Site C must NOT match because URI 1 is Exact mode and URI 2 is a different host",
  );

  const userC = docC.getElementById("userC") as HTMLInputElement | null;
  const passC = docC.getElementById("passC") as HTMLInputElement | null;
  assertEquals(userC?.value, "");
  assertEquals(passC?.value, "");
});
