import {
  asVaultItemId,
  type LoginVaultItem,
  UriMatchMode,
  type VaultItemId,
  VaultItemType,
} from "@gistwarden/domain";
import {
  filterMatchingDomainItems,
  isMatchingDomain,
  isSingleUriMatch,
} from "../packages/domain/mod.ts";
import { assert, assertEquals, test } from "./assert.ts";

function createMockLoginItem(
  id: VaultItemId,
  name: string,
  uris?: { uri: string; match?: UriMatchMode | null }[],
): LoginVaultItem {
  return {
    id: asVaultItemId(id),

    type: VaultItemType.Login,
    name,
    favorite: false,
    reprompt: 0,
    fields: [],
    creationDate: new Date().toISOString(),
    revisionDate: new Date().toISOString(),
    login: {
      username: "user",
      password: "password123",
      uris: uris || [],
    },
  };
}

test("Vault Domain Matching - Strictly uses item.login.uris, ignores item.name", () => {
  const noUriItem = createMockLoginItem(asVaultItemId("1"), "panel.io", []);
  assertEquals(
    isMatchingDomain(noUriItem, "panel.io"),
    false,
    "Item without URIs must NOT match domain even if item.name equals domain",
  );

  const linkedinItem = createMockLoginItem(
    asVaultItemId("2"),
    "My Linkedin",
    [],
  );
  assertEquals(
    isMatchingDomain(linkedinItem, "https://site.in"),
    false,
    "Item without URIs must NOT match site.in",
  );

  const githubItem = createMockLoginItem(asVaultItemId("3"), "panel.io", [
    { uri: "https://github.com" },
  ]);

  assertEquals(
    isMatchingDomain(githubItem, "panel.io"),
    false,
    "Item with URI set to github.com must NOT match panel.io regardless of item.name",
  );
});

test("Vault Domain Matching - Single URI Match Engine (isSingleUriMatch)", () => {
  // 1. UriMatchMode.Domain (0 - Default Base Domain)
  assertEquals(
    isSingleUriMatch(
      "https://app.example.com/login",
      "login.example.com",
      UriMatchMode.Domain,
    ),
    true,
    "Base domain match mode should match subdomains of same eTLD+1",
  );
  assertEquals(
    isSingleUriMatch(
      "https://app.example.com/login",
      "otherdomain.com",
      UriMatchMode.Domain,
    ),
    false,
    "Base domain match mode should fail for different base domain",
  );

  // 2. UriMatchMode.Host (1 - Host)
  assertEquals(
    isSingleUriMatch(
      "https://sub.example.com/page",
      "sub.example.com",
      UriMatchMode.Host,
    ),
    true,
    "Host mode should match exact host",
  );
  assertEquals(
    isSingleUriMatch(
      "https://sub.example.com/page",
      "app.example.com",
      UriMatchMode.Host,
    ),
    false,
    "Host mode should fail when subdomains differ",
  );

  // 3. UriMatchMode.StartsWith (2 - StartsWith)
  assertEquals(
    isSingleUriMatch(
      "https://example.com/app",
      "https://example.com/app/dashboard",
      UriMatchMode.StartsWith,
    ),
    true,
    "StartsWith mode should match when current URL starts with stored URI",
  );
  assertEquals(
    isSingleUriMatch(
      "https://example.com/app",
      "https://example.com/other",
      UriMatchMode.StartsWith,
    ),
    false,
    "StartsWith mode should fail when prefix does not match",
  );

  // 4. UriMatchMode.Exact (3 - Exact)
  assertEquals(
    isSingleUriMatch(
      "https://example.com/login?id=1",
      "https://example.com/login?id=1",
      UriMatchMode.Exact,
    ),
    true,
    "Exact mode should match exact URL string",
  );
  assertEquals(
    isSingleUriMatch(
      "https://EXAMPLE.COM/login?ID=1",
      "https://example.com/login?id=1",
      UriMatchMode.Exact,
    ),
    true,
    "Exact mode should match case-insensitively",
  );
  assertEquals(
    isSingleUriMatch(
      "https://example.com/login?id=1",
      "https://example.com/login?id=2",
      UriMatchMode.Exact,
    ),
    false,
    "Exact mode should fail if URL differs",
  );

  // 5. UriMatchMode.Regex (4 - Regex)
  assertEquals(
    isSingleUriMatch(
      "^https://.*\\.example\\.com$",
      "https://admin.example.com",
      UriMatchMode.Regex,
    ),
    true,
    "Regex mode should match valid regular expression pattern",
  );
  assertEquals(
    isSingleUriMatch(
      "^https://.*\\.example\\.com$",
      "https://example.org",
      UriMatchMode.Regex,
    ),
    false,
    "Regex mode should fail if pattern does not match",
  );
  assertEquals(
    isSingleUriMatch(
      "a".repeat(251),
      "https://admin.example.com",
      UriMatchMode.Regex,
    ),
    false,
    "Regex mode should return false for excessively long pattern to prevent ReDoS",
  );

  // 6. UriMatchMode.Never (5 - Never)
  assertEquals(
    isSingleUriMatch(
      "https://example.com",
      "https://example.com",
      UriMatchMode.Never,
    ),
    false,
    "Never mode must always return false",
  );
});

test("Vault Domain Matching - Vault item with multiple URIs and custom match policies", () => {
  const itemWithPolicies = createMockLoginItem(
    asVaultItemId("item-1"),
    "Multi-URI Item",
    [
      { uri: "https://never-match.com", match: UriMatchMode.Never },
      { uri: "https://exact.com/login", match: UriMatchMode.Exact },
      { uri: "https://host.example.com", match: UriMatchMode.Host },
    ],
  );

  // Never match URI
  assertEquals(isMatchingDomain(itemWithPolicies, "never-match.com"), false);

  // Exact match URI
  assertEquals(
    isMatchingDomain(itemWithPolicies, "https://exact.com/login"),
    true,
  );
  assertEquals(
    isMatchingDomain(itemWithPolicies, "https://exact.com/other"),
    false,
  );

  // Host match URI
  assertEquals(isMatchingDomain(itemWithPolicies, "host.example.com"), true);
  assertEquals(isMatchingDomain(itemWithPolicies, "other.example.com"), false);
});

test("Vault Domain Matching - filterMatchingDomainItems strictly matches by URI and sorts exact matches first", () => {
  const items = [
    createMockLoginItem(asVaultItemId("1"), "panel.io", []), // No URI
    createMockLoginItem(asVaultItemId("2"), "Base Match Item", [
      {
        uri: "https://sub.panel.io",
      },
    ]), // Base domain match
    createMockLoginItem(asVaultItemId("3"), "Exact Host Match Item", [
      {
        uri: "https://panel.io",
      },
    ]), // Exact host match
  ];

  const matched = filterMatchingDomainItems(items, "panel.io");

  // Only item 2 and item 3 are returned, and item 3 (exact host match) is sorted first
  assertEquals(matched.length, 2);
  assert(matched[0]);
  assert(matched[1]);
  assertEquals(matched[0].id, asVaultItemId("3"));
  assertEquals(matched[1].id, asVaultItemId("2"));
});

test("Vault Domain Matching - Detailed Base Domain edge cases (multi-part TLDs, ports, IPs, localhost)", () => {
  // Multi-part country code TLD (.com.vn, .co.uk)
  assertEquals(
    isSingleUriMatch(
      "https://portal.bank.com.vn/ebank",
      "https://sso.bank.com.vn/login",
      UriMatchMode.Domain,
    ),
    true,
    "Domain mode matches subdomains of .com.vn",
  );
  assertEquals(
    isSingleUriMatch(
      "https://portal.bank.com.vn/ebank",
      "https://otherbank.com.vn",
      UriMatchMode.Domain,
    ),
    false,
    "Domain mode fails for different .com.vn domain",
  );
  assertEquals(
    isSingleUriMatch(
      "https://sub.service.co.uk",
      "https://api.service.co.uk",
      UriMatchMode.Domain,
    ),
    true,
    "Domain mode matches subdomains of .co.uk",
  );

  // IP addresses & Localhost
  assertEquals(
    isSingleUriMatch(
      "http://192.168.1.100:8080/admin",
      "http://192.168.1.100:8080/login",
      UriMatchMode.Domain,
    ),
    true,
    "Domain mode matches IP addresses",
  );
  assertEquals(
    isSingleUriMatch(
      "http://localhost:3000/app",
      "http://localhost:3000/login",
      UriMatchMode.Domain,
    ),
    true,
    "Domain mode matches localhost",
  );
});

test("Vault Domain Matching - Detailed Host match edge cases (subdomain separation and port matching)", () => {
  // Different subdomains should not match in Host mode
  assertEquals(
    isSingleUriMatch(
      "https://auth.company.com/login",
      "https://auth.company.com/v2/login",
      UriMatchMode.Host,
    ),
    true,
    "Host mode matches exact same host across different paths",
  );
  assertEquals(
    isSingleUriMatch(
      "https://auth.company.com",
      "https://dashboard.company.com",
      UriMatchMode.Host,
    ),
    false,
    "Host mode strictly rejects different subdomain of same domain",
  );
  assertEquals(
    isSingleUriMatch(
      "https://gitlab.corp.local:8443/login",
      "https://gitlab.corp.local:8443/oauth",
      UriMatchMode.Host,
    ),
    true,
    "Host mode matches custom port host",
  );
});

test("Vault Domain Matching - Detailed StartsWith edge cases (path hierarchy and query parameters)", () => {
  const baseUri = "https://aws.amazon.com/console/home";

  // URL starts with baseUri
  assertEquals(
    isSingleUriMatch(
      baseUri,
      "https://aws.amazon.com/console/home?region=us-east-1",
      UriMatchMode.StartsWith,
    ),
    true,
    "StartsWith matches URL with additional query params",
  );
  assertEquals(
    isSingleUriMatch(
      baseUri,
      "https://aws.amazon.com/console/home/dashboard",
      UriMatchMode.StartsWith,
    ),
    true,
    "StartsWith matches URL with subpaths",
  );

  // URL does not start with baseUri
  assertEquals(
    isSingleUriMatch(
      baseUri,
      "https://aws.amazon.com/billing",
      UriMatchMode.StartsWith,
    ),
    false,
    "StartsWith rejects different path",
  );
  assertEquals(
    isSingleUriMatch(
      baseUri,
      "http://aws.amazon.com/console/home",
      UriMatchMode.StartsWith,
    ),
    false,
    "StartsWith rejects protocol mismatch (http vs https)",
  );
});

test("Vault Domain Matching - Detailed Exact match edge cases (exact URL, case sensitivity, queries)", () => {
  const exactUri = "https://id.atlassian.com/login?application=jira";

  assertEquals(
    isSingleUriMatch(
      exactUri,
      "https://id.atlassian.com/login?application=jira",
      UriMatchMode.Exact,
    ),
    true,
    "Exact matches identical URL",
  );
  assertEquals(
    isSingleUriMatch(
      exactUri,
      "https://ID.ATLASSIAN.COM/login?application=jira",
      UriMatchMode.Exact,
    ),
    true,
    "Exact matches case-insensitively",
  );
  assertEquals(
    isSingleUriMatch(
      exactUri,
      "https://id.atlassian.com/login?application=confluence",
      UriMatchMode.Exact,
    ),
    false,
    "Exact rejects different query param",
  );
  assertEquals(
    isSingleUriMatch(
      exactUri,
      "https://id.atlassian.com/login",
      UriMatchMode.Exact,
    ),
    false,
    "Exact rejects URL without query params",
  );
});

test("Vault Domain Matching - Detailed Regex edge cases (wildcards, invalid syntax safety, ReDoS limit)", () => {
  // Wildcard subdomains
  const regexUri = "^https:\\/\\/[a-z0-9-]+\\.internal\\.mycorp\\.net(\\/.*)?$";

  assertEquals(
    isSingleUriMatch(
      regexUri,
      "https://auth-node-1.internal.mycorp.net/login",
      UriMatchMode.Regex,
    ),
    true,
    "Regex matches compliant internal node URL",
  );
  assertEquals(
    isSingleUriMatch(
      regexUri,
      "https://external.mycorp.net/login",
      UriMatchMode.Regex,
    ),
    false,
    "Regex rejects non-matching domain structure",
  );

  // Invalid regex string safety (must not throw error, returns false safely)
  const invalidRegex = "[a-z(invalid[syntax";
  assertEquals(
    isSingleUriMatch(invalidRegex, "https://example.com", UriMatchMode.Regex),
    false,
    "Regex safely returns false for malformed regex syntax",
  );

  // ReDoS prevention limit (>250 chars)
  const longPattern = "a".repeat(251);
  assertEquals(
    isSingleUriMatch(longPattern, "https://example.com", UriMatchMode.Regex),
    false,
    "Regex returns false for pattern exceeding safety length threshold",
  );
});

test("Vault Domain Matching - Detailed Never match edge cases and item-level isolation", () => {
  const item = createMockLoginItem(asVaultItemId("never-item"), "Never Item", [
    {
      uri: "https://secure.banking.com/login",
      match: UriMatchMode.Never,
    },
    {
      uri: "https://secure.banking.com/help",
      match: UriMatchMode.Exact,
    },
  ]);

  // The Never-mode URI never matches
  assertEquals(
    isMatchingDomain(item, "https://secure.banking.com/login"),
    false,
    "Never mode prevents autofill matching completely on login URL",
  );

  // The second URI on the same item with Exact mode matches correctly
  assertEquals(
    isMatchingDomain(item, "https://secure.banking.com/help"),
    true,
    "Other URI on the same item with valid mode still matches",
  );
});

test("Vault Domain Matching - Fallback to Default / Override Match Strategy", () => {
  // Item with match: null (default detection mode)
  const itemDefault = createMockLoginItem(
    asVaultItemId("default-match-item"),
    "Default Match Item",
    [{ uri: "https://sub.portal.com/login", match: null }],
  );

  // 1. When overrideDefaultMode is omitted, defaults to UriMatchMode.Domain
  assertEquals(
    isMatchingDomain(itemDefault, "https://other.portal.com/page"),
    true,
    "Defaults to Base Domain matching when match is null",
  );

  // 2. When overrideDefaultMode is UriMatchMode.Host
  assertEquals(
    isMatchingDomain(
      itemDefault,
      "https://other.portal.com/page",
      UriMatchMode.Host,
    ),
    false,
    "Respects overrideDefaultMode = Host and rejects different subdomain",
  );

  // 3. When overrideDefaultMode is UriMatchMode.Exact
  assertEquals(
    isMatchingDomain(
      itemDefault,
      "https://sub.portal.com/login",
      UriMatchMode.Exact,
    ),
    true,
    "Respects overrideDefaultMode = Exact for exact URL",
  );
  assertEquals(
    isMatchingDomain(
      itemDefault,
      "https://sub.portal.com/login?extra=1",
      UriMatchMode.Exact,
    ),
    false,
    "Respects overrideDefaultMode = Exact and rejects URL with extra params",
  );
});
