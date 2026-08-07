import type { ExportStrategy, ImportStrategy } from "./import-export-types.ts";
import { jsonImportStrategy } from "./strategies/json-import-strategy.ts";
import { bitwardenCsvImportStrategy } from "./strategies/bitwarden-csv-import-strategy.ts";
import { browserCsvImportStrategy } from "./strategies/browser-csv-import-strategy.ts";

import { jsonExportStrategy } from "./strategies/json-export-strategy.ts";
import { bitwardenCsvExportStrategy } from "./strategies/bitwarden-csv-export-strategy.ts";
import { browserCsvExportStrategy } from "./strategies/browser-csv-export-strategy.ts";

export const importRegistry: Record<string, ImportStrategy> = {
  json: jsonImportStrategy,
  bitwarden_csv: bitwardenCsvImportStrategy,
  browser_csv: browserCsvImportStrategy,
  bitwarden: bitwardenCsvImportStrategy,
  browser: browserCsvImportStrategy,
};

export const exportRegistry: Record<string, ExportStrategy> = {
  json: jsonExportStrategy,
  bitwarden_csv: bitwardenCsvExportStrategy,
  browser_csv: browserCsvExportStrategy,
  bitwarden: bitwardenCsvExportStrategy,
  browser: browserCsvExportStrategy,
};

export function getImportStrategy(id: string): ImportStrategy {
  const normalizedId = id.toLowerCase().trim();
  if (normalizedId in importRegistry) {
    return importRegistry[normalizedId];
  }
  return jsonImportStrategy;
}

export function getExportStrategy(id: string): ExportStrategy {
  const normalizedId = id.toLowerCase().trim();
  if (normalizedId in exportRegistry) {
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
