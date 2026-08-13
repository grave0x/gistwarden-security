import { registerInMemoryRoute } from "./messaging.ts";
import type { SimpleSuccessResponse } from "./messaging-contracts.ts";
import {
  checkDataBreachRoute,
  checkHIBPRoute,
  deleteGistRoute,
  deleteLocalVaultRoute,
  downloadFromLocalRoute,
  downloadVaultRoute,
  fido2HeartbeatRoute,
  startGithubOauthRoute,
  uploadToGistRoute,
  uploadToLocalRoute,
  userActivityRoute,
  validateTokenRoute,
} from "./messaging-contracts.ts";
import {
  checkEmailBreachUseCase,
  checkPasswordHIBPUseCase,
} from "./report-usecases.ts";
import {
  deleteVaultUseCase,
  downloadVaultUseCase,
  startGithubOauthUseCase,
  uploadVaultUseCase,
  validateTokenUseCase,
} from "./sync-usecases.ts";

export function initializeWebRoutes(): void {
  // Auth & Activity routes
  registerInMemoryRoute(fido2HeartbeatRoute, (): SimpleSuccessResponse => {
    return { success: true };
  });

  registerInMemoryRoute(
    userActivityRoute,
    async (): Promise<SimpleSuccessResponse> => {
      return { success: true };
    },
  );

  // Report routes
  registerInMemoryRoute(checkHIBPRoute, async (payload) => {
    const res = await checkPasswordHIBPUseCase(payload.password);
    return {
      success: !res.errorKey,
      count: res.count,
      errorKey: res.errorKey,
    };
  });

  registerInMemoryRoute(checkDataBreachRoute, async (payload) => {
    return await checkEmailBreachUseCase(payload.email);
  });

  // Sync routes
  registerInMemoryRoute(uploadToGistRoute, uploadVaultUseCase);
  registerInMemoryRoute(deleteGistRoute, deleteVaultUseCase);
  registerInMemoryRoute(downloadVaultRoute, downloadVaultUseCase);
  registerInMemoryRoute(uploadToLocalRoute, uploadVaultUseCase);
  registerInMemoryRoute(deleteLocalVaultRoute, deleteVaultUseCase);
  registerInMemoryRoute(downloadFromLocalRoute, downloadVaultUseCase);
  registerInMemoryRoute(validateTokenRoute, validateTokenUseCase);
  registerInMemoryRoute(startGithubOauthRoute, startGithubOauthUseCase);
}
