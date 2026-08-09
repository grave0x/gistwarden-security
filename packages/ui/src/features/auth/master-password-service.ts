import { changeMasterPasswordUseCase } from "@gistwarden/orchestrator";
import { DEFAULT_PIN_CONFIG } from "@gistwarden/repository";
import { accountStore, setAccountStore, settingsStore } from "@/core/store.ts";
import { err, ok, type Result } from "neverthrow";
import type { TranslationKey } from "@/core/i18n.ts";

export async function changeMasterPassword(
  currentPass: string,
  newPass: string,
): Promise<Result<void, TranslationKey>> {
  const res = await changeMasterPasswordUseCase({
    currentPass,
    newPass,
    vaultItems: accountStore.vaultItems,
    currentGithubConfig: accountStore.githubConfig,
    currentMpConfig: accountStore.masterPasswordConfig,
    vaultMode: settingsStore.vaultMode,
  });

  if (res.isErr()) {
    return err(res.error);
  }

  const { updatedGithubConfig, updatedMpConfig } = res.value;

  setAccountStore({
    githubConfig: updatedGithubConfig,
    masterPasswordConfig: updatedMpConfig,
    pinConfig: DEFAULT_PIN_CONFIG,
  });

  return ok();
}
