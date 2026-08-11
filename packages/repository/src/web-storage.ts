import { logger, type TranslationKey } from "@gistwarden/domain";
import { err, ok, type Result } from "neverthrow";

export function hasWebLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function hasWebSessionStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

export async function getWebLocalItem(
  key: string,
): Promise<Result<unknown, TranslationKey>> {
  if (!hasWebLocalStorage()) {
    return err("storage_error");
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return ok(null);
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return ok(parsed);
    } catch {
      return ok(raw);
    }
  } catch (e) {
    logger.storage.error(`Failed to get web local item '${key}':`, e);
    return err("storage_error");
  }
}

export async function setWebLocalItem(
  key: string,
  value: unknown,
): Promise<Result<void, TranslationKey>> {
  if (!hasWebLocalStorage()) {
    return err("storage_error");
  }
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return ok();
  } catch (e) {
    logger.storage.error(`Failed to set web local item '${key}':`, e);
    return err("storage_error");
  }
}

export async function removeWebLocalItem(
  keys: string | string[],
): Promise<Result<void, TranslationKey>> {
  if (!hasWebLocalStorage()) {
    return err("storage_error");
  }
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      window.localStorage.removeItem(key);
    }
    return ok();
  } catch (e) {
    logger.storage.error("Failed to remove web local item:", e);
    return err("storage_error");
  }
}

export async function getWebSessionItem(
  key: string,
): Promise<Result<unknown, TranslationKey>> {
  if (!hasWebSessionStorage()) {
    return err("storage_error");
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) {
      return ok(null);
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return ok(parsed);
    } catch {
      return ok(raw);
    }
  } catch (e) {
    logger.storage.error(`Failed to get web session item '${key}':`, e);
    return err("storage_error");
  }
}

export async function setWebSessionItem(
  key: string,
  value: unknown,
): Promise<Result<void, TranslationKey>> {
  if (!hasWebSessionStorage()) {
    return err("storage_error");
  }
  try {
    const serialized = JSON.stringify(value);
    window.sessionStorage.setItem(key, serialized);
    return ok();
  } catch (e) {
    logger.storage.error(`Failed to set web session item '${key}':`, e);
    return err("storage_error");
  }
}

export async function getWebSessionItems(
  keys: string[],
): Promise<Result<Record<string, unknown>, TranslationKey>> {
  if (!hasWebSessionStorage()) {
    return err("storage_error");
  }
  try {
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const raw = window.sessionStorage.getItem(key);
      if (raw !== null) {
        try {
          result[key] = JSON.parse(raw);
        } catch {
          result[key] = raw;
        }
      }
    }
    return ok(result);
  } catch {
    return err("storage_error");
  }
}

export async function setWebSessionItems(
  items: Record<string, unknown>,
): Promise<Result<void, TranslationKey>> {
  if (!hasWebSessionStorage()) {
    return err("storage_error");
  }
  try {
    for (const [key, val] of Object.entries(items)) {
      window.sessionStorage.setItem(key, JSON.stringify(val));
    }
    return ok();
  } catch {
    return err("storage_error");
  }
}

export async function removeWebSessionItem(
  keys: string | string[],
): Promise<Result<void, TranslationKey>> {
  if (!hasWebSessionStorage()) {
    return err("storage_error");
  }
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      window.sessionStorage.removeItem(key);
    }
    return ok();
  } catch {
    return err("storage_error");
  }
}
