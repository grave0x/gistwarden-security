import {
  createBaseVaultItem,
  getVaultItemFallbackName,
  logger,
  type Folder,
  type VaultItem,
  VaultItemType,
  VaultListSchema,
} from "@gistwarden/domain";
import { APP_NAME } from "@/core/constants.ts";
import { parseCSV } from "@/core/csv-parser.ts";
import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { safeParseUrl } from "@/core/domain-utils.ts";
import type { ImportResult, ImportStrategy } from "../import-export-types.ts";

function extractDomain(urlStr: string): string {
  return safeParseUrl(urlStr).map((u) => u.hostname).unwrapOr(urlStr);
}

export const browserCsvImportStrategy: ImportStrategy = {
  id: "browser_csv",
  nameKey: "import_option_browser",
  subKey: "import_option_browser_sub",
  extension: ".csv",
  parseAndValidate(
    csvString: string,
    existingItems: VaultItem[],
    existingFolders: Folder[] = [],
  ): Result<ImportResult, TranslationKey> {
    logger.vault.info(`[${APP_NAME} CSV Import] Bắt đầu đọc file CSV trình duyệt...`);
    const rows = parseCSV(csvString);
    if (rows.length < 2) {
      return err("vault_import_csv_error_fail");
    }

    const headers = rows[0].map((h) =>
      h.trim().toLowerCase().replace(/['"]/g, "")
    );
    const urlIdx = headers.indexOf("url");
    const usernameIdx = headers.indexOf("username");
    const passwordIdx = headers.indexOf("password");
    const nameIdx = headers.indexOf("name");

    let noteIdx = headers.indexOf("note");
    if (noteIdx === -1) {
      noteIdx = headers.indexOf("notes");
    }

    if (urlIdx === -1 || usernameIdx === -1 || passwordIdx === -1) {
      return err("import_error_browser_invalid");
    }

    const newVaultItems: VaultItem[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

      const urlVal = row[urlIdx] || "";
      const usernameVal = row[usernameIdx] || "";
      const passwordVal = row[passwordIdx] || "";
      let nameVal = nameIdx !== -1 ? row[nameIdx] : "";
      const noteVal = noteIdx !== -1 ? row[noteIdx] : "";

      if (!urlVal && !usernameVal && !passwordVal) {
        continue;
      }

      if (!nameVal) {
        nameVal = extractDomain(urlVal);
      }

      const uris = urlVal ? [{ uri: urlVal, match: null }] : [];

      const base = createBaseVaultItem({
        name: nameVal,
        notes: noteVal,
        fallbackName: getVaultItemFallbackName(VaultItemType.Login),
      });

      newVaultItems.push({
        ...base,
        type: VaultItemType.Login,
        login: {
          username: usernameVal,
          password: passwordVal,
          totp: "",
          uris,
          fido2Credentials: [],
          passwordRevisionDate: null,
          passwordHistory: [],
        },
      });
    }

    logger.vault.info(`[${APP_NAME} CSV Import] Bắt đầu kiểm tra và lưu...`);
    const combinedItems = [...existingItems, ...newVaultItems];
    const validatedListResult = VaultListSchema.safeParse(combinedItems);
    if (!validatedListResult.success) {
      return err("storage_error");
    }

    return ok({
      importedCount: newVaultItems.length,
      combinedItems: validatedListResult.data,
      combinedFolders: existingFolders,
    });
  },
};
