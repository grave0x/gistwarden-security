import type { Folder, VaultItem } from "@gistwarden/domain";
import { browserCsvExportStrategy } from "./strategies/browser-csv-export-strategy.ts";
import { bitwardenCsvExportStrategy } from "./strategies/bitwarden-csv-export-strategy.ts";

export function exportToBrowserCsv(items: VaultItem[]): string {
  return browserCsvExportStrategy.export(items).fileContent;
}

export function exportToBitwardenCsv(
  items: VaultItem[],
  folders: Folder[] = [],
): string {
  return bitwardenCsvExportStrategy.export(items, folders).fileContent;
}
