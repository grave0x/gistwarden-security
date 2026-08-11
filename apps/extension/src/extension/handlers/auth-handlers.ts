import {
  fido2HeartbeatRoute,
  processPendingUnapprovedCredentialsUseCase,
  userActivityRoute,
} from "@gistwarden/orchestrator";
import type { SimpleSuccessResponse } from "@gistwarden/repository";
import { updateTimeoutAlarm } from "@/extension/background-alarms.ts";
import { syncLockStateBadge } from "@/extension/background-badge.ts";
import type { MessageRouter } from "@/extension/message-router.ts";

export function handleFido2Heartbeat(): SimpleSuccessResponse {
  console.debug("[Background] Heartbeat received");
  return { success: true };
}

export async function handleUserActivity(): Promise<SimpleSuccessResponse> {
  await Promise.all([
    updateTimeoutAlarm(),
    syncLockStateBadge(),
    processPendingUnapprovedCredentialsUseCase(),
  ]);
  return { success: true };
}

export function registerAuthRoutes(router: MessageRouter): void {
  router
    .register(fido2HeartbeatRoute, handleFido2Heartbeat)
    .register(userActivityRoute, handleUserActivity);
}
