import type { ExportStrategy, ImportStrategy } from "./import-export-types.ts";
import { bitwardenCsvExportStrategy } from "./strategies/bitwarden-csv-export-strategy.ts";
import { bitwardenCsvImportStrategy } from "./strategies/bitwarden-csv-import-strategy.ts";
import { browserCsvExportStrategy } from "./strategies/browser-csv-export-strategy.ts";
import { browserCsvImportStrategy } from "./strategies/browser-csv-import-strategy.ts";
import { jsonExportStrategy } from "./strategies/json-export-strategy.ts";
import { jsonImportStrategy } from "./strategies/json-import-strategy.ts";

export const importRegistry = {
  json: jsonImportStrategy,
  bitwarden_csv: bitwardenCsvImportStrategy,
  browser_csv: browserCsvImportStrategy,
  bitwarden: bitwardenCsvImportStrategy,
  browser: browserCsvImportStrategy,
} satisfies Record<string, ImportStrategy>;

export const exportRegistry = {
  json: jsonExportStrategy,
  bitwarden_csv: bitwardenCsvExportStrategy,
  browser_csv: browserCsvExportStrategy,
  bitwarden: bitwardenCsvExportStrategy,
  browser: browserCsvExportStrategy,
} satisfies Record<string, ExportStrategy>;

function isImportKey(key: string): key is keyof typeof importRegistry {
  return key in importRegistry;
}

function isExportKey(key: string): key is keyof typeof exportRegistry {
  return key in exportRegistry;
}

export function getImportStrategy(id: string): ImportStrategy {
  const normalizedId = id.toLowerCase().trim();
  if (isImportKey(normalizedId)) {
    return importRegistry[normalizedId];
  }
  return jsonImportStrategy;
}

export function getExportStrategy(id: string): ExportStrategy {
  const normalizedId = id.toLowerCase().trim();
  if (isExportKey(normalizedId)) {
    return exportRegistry[normalizedId];
  }
  return jsonExportStrategy;
}

export function getAllImportStrategies(): ImportStrategy[] {
  return [
    browserCsvImportStrategy,
    bitwardenCsvImportStrategy,
    jsonImportStrategy,
  ];
}

export function getAllExportStrategies(): ExportStrategy[] {
  return [
    browserCsvExportStrategy,
    bitwardenCsvExportStrategy,
    jsonExportStrategy,
  ];
}
