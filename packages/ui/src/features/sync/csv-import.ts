import type { Folder, VaultItem } from "@gistwarden/domain";
import { browserCsvImportStrategy } from "./strategies/browser-csv-import-strategy.ts";
import { bitwardenCsvImportStrategy } from "./strategies/bitwarden-csv-import-strategy.ts";

export function parseAndValidateBrowserCsv(
  csvString: string,
  existingItems: VaultItem[],
) {
  return browserCsvImportStrategy.parseAndValidate(csvString, existingItems);
}

export function parseAndValidateBitwardenCsv(
  csvString: string,
  existingItems: VaultItem[],
  existingFolders: Folder[] = [],
) {
  return bitwardenCsvImportStrategy.parseAndValidate(
    csvString,
    existingItems,
    existingFolders,
  );
}
