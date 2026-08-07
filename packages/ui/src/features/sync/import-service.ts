import { accountStore } from "@/core/store.ts";
import { APP_NAME } from "@/core/constants.ts";
import { type TranslationKey } from "@/core/i18n.ts";
import { err, ok, Result } from "neverthrow";
import { persistAndReconcileVault } from "@/features/vault/vault-service.ts";
import { getImportStrategy } from "./import-export-registry.ts";

export async function importVaultData(
  content: string,
  formatId: string,
): Promise<Result<number, TranslationKey>> {
  const strategy = getImportStrategy(formatId);
  const importRes = strategy.parseAndValidate(
    content,
    accountStore.vaultItems,
    accountStore.folders,
  );
  if (importRes.isErr()) {
    return err(importRes.error);
  }
  const importVal = importRes.value;

  console.log(`[${APP_NAME} Import] Đang tải lên Gist...`);
  const res = await persistAndReconcileVault(
    importVal.combinedItems,
    accountStore.trashItems,
    importVal.combinedFolders,
  );
  if (res.isErr()) {
    return err(res.error);
  }

  console.log(`[${APP_NAME} Import] Import HOÀN TẤT thành công!`);
  return ok(importVal.importedCount);
}

export async function importJsonData(
  jsonString: string,
): Promise<Result<number, TranslationKey>> {
  return importVaultData(jsonString, "json");
}

export async function importCsvData(
  csvString: string,
  type: "browser" | "bitwarden",
): Promise<Result<number, TranslationKey>> {
  return importVaultData(csvString, type);
}
