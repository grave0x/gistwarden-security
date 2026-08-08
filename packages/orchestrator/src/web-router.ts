import {
  checkDataBreachRoute,
  checkHIBPRoute,
  deleteGistRoute,
  downloadFromGistRoute,
  fido2HeartbeatRoute,
  startGithubOauthRoute,
  uploadToGistRoute,
  userActivityRoute,
  validateTokenRoute,
} from "./messaging-contracts.ts";
import { registerInMemoryRoute } from "./messaging.ts";
import { checkEmailBreachUseCase, checkPasswordHIBPUseCase } from "./report-usecases.ts";
import {
  deleteGistUseCase,
  downloadFromGistUseCase,
  startGithubOauthUseCase,
  uploadToGistUseCase,
  validateTokenUseCase,
} from "./sync-usecases.ts";
import type { SimpleSuccessResponse } from "@gistwarden/repository";

export function initializeWebRoutes(): void {
  // Auth & Activity routes
  registerInMemoryRoute(fido2HeartbeatRoute, (): SimpleSuccessResponse => {
    return { success: true };
  });

  registerInMemoryRoute(userActivityRoute, async (): Promise<SimpleSuccessResponse> => {
    return { success: true };
  });

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
  registerInMemoryRoute(uploadToGistRoute, uploadToGistUseCase);
  registerInMemoryRoute(deleteGistRoute, deleteGistUseCase);
  registerInMemoryRoute(downloadFromGistRoute, downloadFromGistUseCase);
  registerInMemoryRoute(validateTokenRoute, validateTokenUseCase);
  registerInMemoryRoute(startGithubOauthRoute, startGithubOauthUseCase);
}
