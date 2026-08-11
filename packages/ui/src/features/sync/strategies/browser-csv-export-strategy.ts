import type { Folder, VaultItem } from "@gistwarden/domain";
import { VaultItemType } from "@gistwarden/domain";
import Papa from "papaparse";
import { APP_NAME } from "@/core/constants.ts";
import type { ExportResult, ExportStrategy } from "../import-export-types.ts";

export const browserCsvExportStrategy = {
  id: "browser_csv",
  nameKey: "export_option_browser",
  subKey: "export_option_browser_sub",
  extension: ".csv",
  mimeType: "text/csv",
  export(items: VaultItem[], _folders: Folder[] = []): ExportResult {
    const rows: string[][] = [["name", "url", "username", "password", "note"]];

    for (const item of items) {
      if (item.type === VaultItemType.Login) {
        const uri = item.login.uris?.[0]?.uri || "";
        const username = item.login.username || "";
        const password = item.login.password || "";
        rows.push([item.name || "", uri, username, password, item.notes || ""]);
      }
    }

    const fileContent = Papa.unparse(rows);
    const fileName = `${APP_NAME.toLowerCase()}_browser_export_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return {
      fileName,
      fileContent,
      mimeType: "text/csv",
    };
  },
} satisfies ExportStrategy;
