import type { Folder, VaultItem } from "@gistwarden/domain";
import { FolderSchema, VaultItemSchema } from "@gistwarden/domain";
import type { Result } from "neverthrow";

import { z } from "zod";
import type { TranslationKey } from "@/core/i18n.ts";

export const ImportResultSchema = z
  .object({
    importedCount: z.number(),
    combinedItems: z.array(VaultItemSchema),
    combinedFolders: z.array(FolderSchema),
  })
  .readonly();
export type ImportResult = z.infer<typeof ImportResultSchema>;

export const ExportResultSchema = z
  .object({
    fileName: z.string(),
    fileContent: z.string(),
    mimeType: z.string(),
  })
  .readonly();
export type ExportResult = z.infer<typeof ExportResultSchema>;

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

export interface ExportStrategy {
  readonly id: string;
  readonly nameKey: TranslationKey;
  readonly subKey: TranslationKey;
  readonly extension: ".json" | ".csv";
  readonly mimeType: string;
  export(items: VaultItem[], folders?: Folder[]): ExportResult;
}
