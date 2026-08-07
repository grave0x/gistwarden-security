import { err, ok, Result } from "neverthrow";
import type { TranslationKey } from "@gistwarden/domain";

let autoClearTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * Ghi chuỗi văn bản vào bộ nhớ tạm (clipboard) một cách an toàn.
 * Tự động xóa clipboard sau timeoutMs (mặc định 30 giây).
 */
export async function writeClipboardText(
  text: string,
  timeoutMs = 30000,
): Promise<Result<void, TranslationKey>> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    !navigator.clipboard.writeText
  ) {
    return err("clipboard_copy_failed");
  }

  try {
    await navigator.clipboard.writeText(text);

    if (autoClearTimerId !== null) {
      clearTimeout(autoClearTimerId);
    }

    autoClearTimerId = setTimeout(async () => {
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          navigator.clipboard.readText
        ) {
          const currentText = await navigator.clipboard.readText();
          if (currentText === text) {
            await navigator.clipboard.writeText("");
          }
        }
      } catch {
        // Ignore clipboard clear permission errors
      }
      autoClearTimerId = null;
    }, timeoutMs);

    return ok();
  } catch (e) {
    console.warn("[Clipboard] Failed to write text to clipboard:", e);
    return err("clipboard_copy_failed");
  }
}
