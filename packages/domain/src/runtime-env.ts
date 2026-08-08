export type AppPlatform = "extension" | "web";

export function isExtension(): boolean {
  return (
    typeof chrome !== "undefined" &&
    !!chrome.runtime &&
    !!chrome.runtime.id
  );
}

export function isWeb(): boolean {
  return !isExtension();
}

export function getPlatform(): AppPlatform {
  return isExtension() ? "extension" : "web";
}
