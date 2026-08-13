import en from "../packages/domain/src/locales/en.ts";
import vi from "../packages/domain/src/locales/vi.ts";

interface InvalidPlaceholderIssue {
  readonly lang: string;
  readonly key: string;
  readonly placeholder: string;
}

function checkValidPlaceholders(
  langName: string,
  dict: Record<string, string>,
): InvalidPlaceholderIssue[] {
  const issues: InvalidPlaceholderIssue[] = [];
  const validKeys = new Set(Object.keys(dict));

  // Dynamic parameter placeholders that are passed at runtime (not translation keys)
  const runtimeParams = new Set([
    "brand",
    "id",
    "mode",
    "count",
    "ver",
    "theme",
    "rp",
    "user",
    "index",
    "date",
    "score",
    "email",
    "progress",
    "name",
    "url",
    "path",
    "settings_header",
    "settings_vault_options_label",
    "settings_account_security",
    "folder_management_title",
    "trash_title",
    "nav_generator",
    "settings_tools_google_auth",
    "vault_options_import",
    "vault_options_export",
  ]);

  for (const [key, text] of Object.entries(dict)) {
    if (typeof text !== "string") continue;

    const matches = text.match(/\{([^}]+)\}/g);
    if (!matches) continue;

    for (const match of matches) {
      const paramName = match.slice(1, -1).trim();

      // Check if placeholder is neither a valid translation key nor a valid runtime parameter
      if (!validKeys.has(paramName) && !runtimeParams.has(paramName)) {
        issues.push({
          lang: langName,
          key,
          placeholder: match,
        });
      }
    }
  }

  return issues;
}

console.log(
  "🔍 Verifying all i18n placeholders against valid translation keys...\n",
);

const viIssues = checkValidPlaceholders("VI", vi as Record<string, string>);
const enIssues = checkValidPlaceholders("EN", en as Record<string, string>);

const allIssues = [...viIssues, ...enIssues];

if (allIssues.length === 0) {
  console.log("✅ All placeholders in translation files are valid!");
} else {
  console.log(`❌ Found ${allIssues.length} invalid placeholders:\n`);
  allIssues.forEach((issue, idx) => {
    console.log(
      `[${idx + 1}] [${issue.lang}] Key "${issue.key}" contains non-existent placeholder: ${issue.placeholder}`,
    );
  });
}
