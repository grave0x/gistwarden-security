import { describe, expect, test } from "bun:test";
import {
  LockedVaultState,
  SessionExpiredVaultState,
  UnlockedVaultState,
  VaultSecurityContext,
} from "@gistwarden/orchestrator";

describe("VaultSecurityState Pattern", () => {
  test("Locked state denies key access and rejects secured executions", async () => {
    const locked = new LockedVaultState();
    expect(locked.status).toBe("locked");
    expect(await locked.getKey()).toBeNull();

    const res = await locked.executeSecured(async (_key) => "secret_data");
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBe("login_title_locked");
    }
  });

  test("Unlocked state provides key and executes secured closures polymorphically", async () => {
    const mockKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    const unlocked = new UnlockedVaultState(mockKey);
    expect(unlocked.status).toBe("unlocked");
    expect(await unlocked.getKey()).toBe(mockKey);

    const res = await unlocked.executeSecured(async (key) => {
      expect(key).toBe(mockKey);
      return "unlocked_success";
    });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toBe("unlocked_success");
    }
  });

  test("SessionExpired state denotes expired session and rejects operations", async () => {
    const expired = new SessionExpiredVaultState();
    expect(expired.status).toBe("expired");
    expect(await expired.getKey()).toBeNull();

    const res = await expired.executeSecured(async () => "data");
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBe("login_title_locked");
    }
  });

  test("VaultSecurityContext transitions between Locked, Unlocked, and Expired states cleanly", async () => {
    const ctx = new VaultSecurityContext();
    expect(ctx.currentStatus).toBe("locked");

    const mockKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );

    await ctx.setUnlockedKey(mockKey);
    expect(ctx.currentStatus).toBe("unlocked");
    expect(await ctx.getKey()).toBe(mockKey);

    await ctx.expireSession();
    expect(ctx.currentStatus).toBe("expired");

    await ctx.lock();
    expect(ctx.currentStatus).toBe("locked");
  });
});
