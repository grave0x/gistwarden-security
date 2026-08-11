import {
  type AppPlatform,
  getPlatform,
  isExtension,
  isWeb,
} from "@gistwarden/domain";

export { type AppPlatform, getPlatform, isExtension, isWeb };

/**
 * Utility functions for interacting with the Chrome extension runtime.
 * Provides safe fallbacks for environments outside the extension.
 */

export function hasRuntime(): boolean {
  return typeof chrome !== "undefined" && !!chrome.runtime;
}

/**
 * Get the fully qualified URL for a resource path inside the extension.
 * Falls back to returning the path as-is if chrome.runtime is unavailable.
 */
export function getAssetUrl(path: string): string {
  if (!hasRuntime() || !chrome.runtime.getURL) {
    const cleanPath = path.replace(/^\//, "");
    return `./${cleanPath}`;
  }
  return chrome.runtime.getURL(path);
}

declare const APP_VERSION: string | undefined;

/**
 * Get the application version from the extension manifest or build definition.
 * Falls back to "1.0.0" if unavailable.
 */
export function getAppVersion(): string {
  if (hasRuntime() && chrome.runtime.getManifest) {
    const ver = chrome.runtime.getManifest().version;
    if (ver) return ver;
  }
  if (typeof APP_VERSION !== "undefined" && APP_VERSION) {
    return APP_VERSION;
  }
  return "1.0.0";
}

/**
 * Get the extension ID.
 * Falls back to an empty string if unavailable.
 */
export function getExtensionId(): string {
  if (!hasRuntime()) {
    return "";
  }
  return chrome.runtime.id || "";
}

/**
 * Check if running under Firefox browser environment.
 */
export function isFirefox(): boolean {
  return (
    typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox")
  );
}

/**
 * Check if running under Microsoft Edge browser environment.
 */
export function isEdge(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator.userAgent.includes("Edg/") ||
      navigator.userAgent.includes("Edge"))
  );
}
