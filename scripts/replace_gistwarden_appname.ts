import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const viPath = join(__dirname, "../packages/domain/src/locales/vi.ts");
const enPath = join(__dirname, "../packages/domain/src/locales/en.ts");

for (const filePath of [viPath, enPath]) {
  let content = readFileSync(filePath, "utf-8");

  // Replace GistWarden and Gistwarden (except where it's part of URLs/routes like gistwarden.uongsuadaubung.workers.dev)
  content = content.replace(/\bGistWarden\b/g, "{APP_NAME}");
  content = content.replace(/\bGistwarden\b/g, "{APP_NAME}");

  writeFileSync(filePath, content, "utf-8");
  console.log(`✅ Replaced GistWarden -> {APP_NAME} in ${filePath}`);
}

console.log("🎉 Replacement completed!");
