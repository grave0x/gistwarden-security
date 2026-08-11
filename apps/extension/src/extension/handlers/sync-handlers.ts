import {
  deleteGistRoute,
  deleteVaultUseCase,
  downloadVaultRoute,
  downloadVaultUseCase,
  startGithubOauthRoute,
  startGithubOauthUseCase,
  uploadToGistRoute,
  uploadVaultUseCase,
  validateTokenRoute,
  validateTokenUseCase,
} from "@gistwarden/orchestrator";
import type { MessageRouter } from "@/extension/message-router.ts";

export function registerSyncRoutes(router: MessageRouter): void {
  router
    .register(uploadToGistRoute, uploadVaultUseCase)
    .register(deleteGistRoute, deleteVaultUseCase)
    .register(downloadVaultRoute, downloadVaultUseCase)
    .register(validateTokenRoute, validateTokenUseCase)
    .register(startGithubOauthRoute, startGithubOauthUseCase);
}
