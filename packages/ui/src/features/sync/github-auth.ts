import { setupGithubUseCase } from "@gistwarden/orchestrator";
import { accountStore, setAccountStore } from "@/core/store.ts";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export async function setupGithub(
  token: string,
): Promise<Result<void, TranslationKey>> {
  const result = await setupGithubUseCase({
    token,
    currentGistId: accountStore.githubConfig.gistId,
  });

  if (result.isErr()) {
    return err(result.error);
  }

  const { githubConfig } = result.value;

  setAccountStore({
    githubConfig,
    githubToken: token,
    githubConfigured: true,
  });

  return ok();
}
