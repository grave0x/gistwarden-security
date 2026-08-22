import type { TranslationKey } from "@gistwarden/domain";
import { err, ok, type Result } from "neverthrow";
import {
  persistSessionKey,
  restoreSessionKeyFromStorage,
} from "./session-usecases.ts";

export type SecurityStatus = "locked" | "unlocked" | "expired";

export interface VaultSecurityState {
  readonly status: SecurityStatus;
  getKey(): Promise<CryptoKey | null>;
  executeSecured<T>(
    fn: (key: CryptoKey) => Promise<T>,
  ): Promise<Result<T, TranslationKey>>;
}

export class LockedVaultState implements VaultSecurityState {
  readonly status: SecurityStatus = "locked";

  async getKey(): Promise<CryptoKey | null> {
    return null;
  }

  async executeSecured<T>(
    _fn: (key: CryptoKey) => Promise<T>,
  ): Promise<Result<T, TranslationKey>> {
    return err("login_title_locked");
  }
}

export class UnlockedVaultState implements VaultSecurityState {
  readonly status: SecurityStatus = "unlocked";

  constructor(private key: CryptoKey) {}

  async getKey(): Promise<CryptoKey | null> {
    return this.key;
  }

  async executeSecured<T>(
    fn: (key: CryptoKey) => Promise<T>,
  ): Promise<Result<T, TranslationKey>> {
    try {
      const res = await fn(this.key);
      return ok(res);
    } catch (e) {
      console.error("[VaultSecurityState] Execute secured error:", e);
      return err("storage_error");
    }
  }
}

export class SessionExpiredVaultState implements VaultSecurityState {
  readonly status: SecurityStatus = "expired";

  async getKey(): Promise<CryptoKey | null> {
    return null;
  }

  async executeSecured<T>(
    _fn: (key: CryptoKey) => Promise<T>,
  ): Promise<Result<T, TranslationKey>> {
    return err("login_title_locked");
  }
}

/**
 * VaultSecurityContext - State Pattern Context for Vault Security State.
 * Manages transitions between Locked, Unlocked, and Expired states.
 */
export class VaultSecurityContext {
  private state: VaultSecurityState = new LockedVaultState();

  get currentStatus(): SecurityStatus {
    return this.state.status;
  }

  getState(): VaultSecurityState {
    return this.state;
  }

  async lock(): Promise<void> {
    this.state = new LockedVaultState();
    await persistSessionKey(null);
  }

  async setUnlockedKey(key: CryptoKey): Promise<void> {
    this.state = new UnlockedVaultState(key);
    await persistSessionKey(key);
  }

  async expireSession(): Promise<void> {
    this.state = new SessionExpiredVaultState();
    await persistSessionKey(null);
  }

  /**
   * Explicit command to restore session key from persistent/session storage.
   */
  async restoreSession(): Promise<CryptoKey | null> {
    const restoredKey = await restoreSessionKeyFromStorage();
    if (restoredKey) {
      this.state = new UnlockedVaultState(restoredKey);
      return restoredKey;
    }
    return null;
  }

  /**
   * Pure query for current key (with automated lazy restore if needed).
   */
  async getKey(): Promise<CryptoKey | null> {
    const key = await this.state.getKey();
    if (key) return key;

    return await this.restoreSession();
  }

  /**
   * Delegates secured execution polymorphically to current state object.
   */
  async executeSecured<T>(
    fn: (key: CryptoKey) => Promise<T>,
  ): Promise<Result<T, TranslationKey>> {
    // If state is not unlocked, try to restore before delegating
    if (this.state.status !== "unlocked") {
      await this.restoreSession();
    }
    return this.state.executeSecured(fn);
  }
}

export const vaultSecurityContext = new VaultSecurityContext();
