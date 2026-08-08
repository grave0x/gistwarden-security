import Papa from "papaparse";
import type { Folder, VaultItem } from "@gistwarden/domain";
import { VaultItemType } from "@gistwarden/domain";
import { APP_NAME } from "@/core/constants.ts";
import type { ExportResult, ExportStrategy } from "../import-export-types.ts";

export const bitwardenCsvExportStrategy = {
  id: "bitwarden_csv",
  nameKey: "export_option_bitwarden_csv",
  subKey: "export_option_bitwarden_csv_sub",
  extension: ".csv",
  mimeType: "text/csv",
  export(items: VaultItem[], folders: Folder[] = []): ExportResult {
    const folderMap = new Map<string, string>();
    for (const f of folders) {
      folderMap.set(f.id, f.name);
    }

    const rows: string[][] = [
      [
        "folder",
        "favorite",
        "type",
        "name",
        "notes",
        "fields",
        "reprompt",
        "archivedDate",
        "login_uri",
        "login_username",
        "login_password",
        "login_totp",
      ],
    ];

    for (const item of items) {
      if (
        item.type === VaultItemType.Login ||
        item.type === VaultItemType.SecureNote
      ) {
        const typeStr = item.type === VaultItemType.Login ? "login" : "note";
        const favoriteStr = item.favorite ? "1" : "0";
        const repromptStr = item.reprompt ? "1" : "0";
        const folderName = (item.folderId && folderMap.get(item.folderId)) || "";

        const fieldsStr = item.fields
          ? item.fields.map((f) => `${f.name || ""}:${f.value || ""}`).join("\n")
          : "";

        let uri = "";
        let username = "";
        let password = "";
        let totp = "";

        if (item.type === VaultItemType.Login) {
          uri = item.login.uris?.[0]?.uri || "";
          username = item.login.username || "";
          password = item.login.password || "";
          totp = item.login.totp || "";
        }

        rows.push([
          folderName,
          favoriteStr,
          typeStr,
          item.name || "",
          item.notes || "",
          fieldsStr,
          repromptStr,
          "",
          uri,
          username,
          password,
          totp,
        ]);
      }
    }

    const fileContent = Papa.unparse(rows);
    const fileName = `${APP_NAME.toLowerCase()}_bitwarden_export_${
      new Date().toISOString().slice(0, 10)
    }.csv`;

    return {
      fileName,
      fileContent,
      mimeType: "text/csv",
    };
  },
} satisfies ExportStrategy;
