import { setupGithubUseCase } from "@gistwarden/orchestrator";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";
import { accountStore, setAccountStore } from "@/core/store.ts";

export async function setupGithub(
  token: string,
): Promise<Result<void, TranslationKey>> {
  const result = await setupGithubUseCase({
    token,
    currentGistId: accountStore.syncConfig.gistId,
  });

  if (result.isErr()) {
    return err(result.error);
  }

  const { syncConfig } = result.value;

  setAccountStore({
    syncConfig,
    syncToken: token,
    vaultConfigured: true,
  });

  return ok();
}
