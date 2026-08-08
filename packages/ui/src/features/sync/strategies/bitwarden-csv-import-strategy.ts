import {
  asFolderId,
  createBaseVaultItem,
  getVaultItemFallbackName,
  logger,
  type Folder,
  type VaultField,
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

export const bitwardenCsvImportStrategy: ImportStrategy = {
  id: "bitwarden_csv",
  nameKey: "import_option_bitwarden_csv",
  subKey: "import_option_bitwarden_csv_sub",
  extension: ".csv",
  parseAndValidate(
    csvString: string,
    existingItems: VaultItem[],
    existingFolders: Folder[] = [],
  ): Result<ImportResult, TranslationKey> {
    logger.vault.info(`[${APP_NAME} CSV Import] Bắt đầu đọc file Bitwarden CSV...`);
    const rows = parseCSV(csvString);
    if (rows.length < 2) {
      return err("vault_import_csv_error_fail");
    }

    const headers = rows[0].map((h) =>
      h.trim().toLowerCase().replace(/['"]/g, "")
    );

    const folderIdx = headers.indexOf("folder");
    const typeIdx = headers.indexOf("type");
    const nameIdx = headers.indexOf("name");
    const notesIdx = headers.indexOf("notes");
    const favoriteIdx = headers.indexOf("favorite");
    const repromptIdx = headers.indexOf("reprompt");
    const fieldsIdx = headers.indexOf("fields");
    const uriIdx = headers.indexOf("login_uri");
    const usernameIdx = headers.indexOf("login_username");
    const passwordIdx = headers.indexOf("login_password");
    const totpIdx = headers.indexOf("login_totp");

    if (
      typeIdx === -1 ||
      nameIdx === -1 ||
      (uriIdx === -1 && usernameIdx === -1 && passwordIdx === -1)
    ) {
      return err("import_error_bitwarden_invalid");
    }

    const newVaultItems: VaultItem[] = [];
    const folderMap = new Map<string, Folder>();
    for (const f of existingFolders) {
      folderMap.set(f.name.toLowerCase().trim(), f);
    }
    const combinedFolders: Folder[] = [...existingFolders];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

      const folderNameVal = folderIdx !== -1 ? (row[folderIdx] || "").trim() : "";
      let folderIdVal: string | null = null;

      if (folderNameVal) {
        const key = folderNameVal.toLowerCase();
        let existingFolder = folderMap.get(key);
        if (!existingFolder) {
          existingFolder = {
            id: asFolderId(crypto.randomUUID()),
            name: folderNameVal,
          };
          folderMap.set(key, existingFolder);
          combinedFolders.push(existingFolder);
        }
        folderIdVal = existingFolder.id;
      }

      const typeVal = (row[typeIdx] || "").trim().toLowerCase();
      const nameVal = row[nameIdx] || "";
      const notesVal = notesIdx !== -1 ? row[notesIdx] : "";
      const favoriteVal = favoriteIdx !== -1
        ? (row[favoriteIdx] === "1" || row[favoriteIdx] === "true")
        : false;
      const repromptVal = repromptIdx !== -1
        ? (row[repromptIdx] === "1" || row[repromptIdx] === "true" ? 1 : 0)
        : 0;

      const customFields: VaultField[] = [];
      if (fieldsIdx !== -1 && row[fieldsIdx]) {
        const fieldsStr = row[fieldsIdx];
        const lines = fieldsStr.split(/\r?\n/);
        for (const line of lines) {
          const colonIdx = line.indexOf(":");
          if (colonIdx > 0) {
            customFields.push({
              name: line.slice(0, colonIdx).trim(),
              value: line.slice(colonIdx + 1).trim(),
              type: 0,
            });
          }
        }
      }

      const uriVal = uriIdx !== -1 ? row[uriIdx] : "";
      const usernameVal = usernameIdx !== -1 ? row[usernameIdx] : "";
      const passwordVal = passwordIdx !== -1 ? row[passwordIdx] : "";
      const totpVal = totpIdx !== -1 ? row[totpIdx] : "";
      const uris = uriVal ? [{ uri: uriVal, match: null }] : [];

      const base = createBaseVaultItem({
        folderId: folderIdVal,
        name: nameVal,
        notes: notesVal,
        favorite: favoriteVal,
        reprompt: repromptVal,
        fields: customFields,
        fallbackName: typeVal === "note" || typeVal === "securenote"
          ? getVaultItemFallbackName(VaultItemType.SecureNote)
          : extractDomain(uriVal) || getVaultItemFallbackName(VaultItemType.Login),
      });

      if (typeVal === "note" || typeVal === "securenote") {
        newVaultItems.push({
          ...base,
          type: VaultItemType.SecureNote,
        });
      } else {
        newVaultItems.push({
          ...base,
          type: VaultItemType.Login,
          login: {
            username: usernameVal,
            password: passwordVal,
            totp: totpVal,
            uris,
            fido2Credentials: [],
            passwordRevisionDate: null,
            passwordHistory: [],
          },
        });
      }
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
      combinedFolders,
    });
  },
};
