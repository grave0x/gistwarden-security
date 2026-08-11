import fs from "node:fs";
import path from "node:path";
import generate from "@babel/generator";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

const rootDir = process.cwd();
const i18nSchemaPath = path.resolve(rootDir, "packages/domain/src/i18n.ts");
const viLocalePath = path.resolve(rootDir, "packages/domain/src/locales/vi.ts");
const enLocalePath = path.resolve(rootDir, "packages/domain/src/locales/en.ts");

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (
        file !== "node_modules" &&
        file !== "dist" &&
        file !== ".git" &&
        file !== "build"
      ) {
        getAllSourceFiles(filePath, fileList);
      }
    } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      if (
        !filePath.endsWith("i18n.ts") &&
        !filePath.endsWith("vi.ts") &&
        !filePath.endsWith("en.ts")
      ) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function cleanFileAST(filePath: string, unusedKeysSet: Set<string>) {
  const code = fs.readFileSync(filePath, "utf-8");
  const ast = parse(code, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  let removedCount = 0;

  traverse(ast, {
    ObjectProperty(pathNode) {
      let keyName = "";
      if (t.isIdentifier(pathNode.node.key)) {
        keyName = pathNode.node.key.name;
      } else if (t.isStringLiteral(pathNode.node.key)) {
        keyName = pathNode.node.key.value;
      }

      if (keyName && unusedKeysSet.has(keyName)) {
        pathNode.remove();
        removedCount++;
      }
    },
  });

  const output = generate(ast, { retainLines: false }, code);
  fs.writeFileSync(filePath, output.code, "utf-8");
  console.log(
    `  Removed ${removedCount} properties from ${path.basename(filePath)}.`,
  );
}

function runCleaner() {
  console.log("🔍 Scanning codebase for unused i18n keys...");

  // First fix orphaned lines in vi.ts & en.ts before parsing if any exist
  for (const fileP of [viLocalePath, enLocalePath]) {
    const content = fs.readFileSync(fileP, "utf-8");
    const fixedContent = content.replace(
      /github_error_rate_limit:\s*\n\s*"[^"]*",?\s*\n\s*"Warning:[^"]*",?/g,
      'github_error_rate_limit:\n    "GitHub API rate limit exceeded. Please try again in a few minutes.",',
    );
    fs.writeFileSync(fileP, fixedContent, "utf-8");
  }

  // Parse keys defined in i18nSchema in i18n.ts
  const schemaContent = fs.readFileSync(i18nSchemaPath, "utf-8");
  const keyRegex = /^\s*([a-zA-Z0-9_]+):\s*z\./gm;
  const keys: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = keyRegex.exec(schemaContent)) !== null) {
    if (match[1]) {
      keys.push(match[1]);
    }
  }

  const sourceFiles = [
    ...getAllSourceFiles(path.resolve(rootDir, "packages")),
    ...getAllSourceFiles(path.resolve(rootDir, "apps")),
  ];

  const sourceContentCombined = sourceFiles
    .map((f) => fs.readFileSync(f, "utf-8"))
    .join("\n");

  const unusedKeys = keys.filter((key) => !sourceContentCombined.includes(key));
  console.log(`📊 Total keys in schema: ${keys.length}`);
  console.log(`🧹 Found ${unusedKeys.length} unused keys.`);

  if (unusedKeys.length === 0) {
    console.log("✨ No unused keys to remove!");
    return;
  }

  const unusedSet = new Set(unusedKeys);

  console.log("🧼 Cleaning files AST...");
  cleanFileAST(i18nSchemaPath, unusedSet);
  cleanFileAST(viLocalePath, unusedSet);
  cleanFileAST(enLocalePath, unusedSet);

  console.log(
    `✅ Successfully cleaned unused i18n keys from i18n.ts, vi.ts, and en.ts!`,
  );
}

runCleaner();
