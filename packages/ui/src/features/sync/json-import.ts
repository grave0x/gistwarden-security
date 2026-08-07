import type { Folder, VaultItem } from "@gistwarden/domain";
import { jsonImportStrategy } from "./strategies/json-import-strategy.ts";

export function parseAndValidateImportJson(
  jsonString: string,
  existingItems: VaultItem[],
  existingFolders: Folder[] = [],
) {
  return jsonImportStrategy.parseAndValidate(
    jsonString,
    existingItems,
    existingFolders,
  );
}
