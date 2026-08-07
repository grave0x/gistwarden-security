import type { Folder, VaultItem } from "@gistwarden/domain";
import type { Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export interface ImportResult {
  importedCount: number;
  combinedItems: VaultItem[];
  combinedFolders: Folder[];
}

export interface ImportStrategy {
  readonly id: string;
  readonly nameKey: TranslationKey;
  readonly subKey: TranslationKey;
  readonly extension: ".json" | ".csv";
  parseAndValidate(
    content: string,
    existingItems: VaultItem[],
    existingFolders?: Folder[],
  ): Result<ImportResult, TranslationKey>;
}

export interface ExportResult {
  fileName: string;
  fileContent: string;
  mimeType: string;
}

export interface ExportStrategy {
  readonly id: string;
  readonly nameKey: TranslationKey;
  readonly subKey: TranslationKey;
  readonly extension: ".json" | ".csv";
  readonly mimeType: string;
  export(items: VaultItem[], folders?: Folder[]): ExportResult;
}
