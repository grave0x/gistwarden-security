import fs from "fs";
import path from "path";
import {
  LANG_MATRIX,
  readmeData,
  type SupportedLang,
  type I18nText,
} from "./readme_content";

function getLang(textObj: I18nText, lang: SupportedLang): string {
  return textObj[lang] ?? textObj["en"];
}

function generateMarkdown(lang: SupportedLang): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${getLang(readmeData.title, lang)}`);
  lines.push("");

  // Badges
  const badgesStr = readmeData.badges
    .map((b) => `[![${b.label}](${b.badgeUrl})](${b.targetUrl})`)
    .join("\n");
  lines.push(badgesStr);
  lines.push("");

  // Intro
  lines.push(getLang(readmeData.intro.p1, lang));
  lines.push("");
  lines.push(getLang(readmeData.intro.p2, lang));
  lines.push("");
  lines.push("---");
  lines.push("");

  // Key Features
  lines.push(`## ${getLang(readmeData.keyFeaturesTitle, lang)}`);
  lines.push("");
  readmeData.features.forEach((feat, idx) => {
    lines.push(`### ${idx + 1}. ${feat.icon} ${getLang(feat.title, lang)}`);
    lines.push("");
    feat.descriptionBulletPoints.forEach((pt) => {
      lines.push(`- ${getLang(pt, lang)}`);
    });
    lines.push("");
  });
  lines.push("---");
  lines.push("");

  // Security Architecture
  lines.push(`## ${getLang(readmeData.securityTitle, lang)}`);
  lines.push("");
  readmeData.securitySections.forEach((sec) => {
    lines.push(`### ${sec.icon} ${getLang(sec.title, lang)}`);
    lines.push("");
    sec.paragraphs.forEach((p) => {
      lines.push(getLang(p, lang));
      lines.push("");
    });
    if (sec.bulletPoints) {
      sec.bulletPoints.forEach((bp) => {
        lines.push(`- ${getLang(bp, lang)}`);
      });
      lines.push("");
    }
  });
  lines.push("---");
  lines.push("");

  // Installation Guide
  lines.push(`## ${getLang(readmeData.installationTitle, lang)}`);
  lines.push("");
  lines.push(getLang(readmeData.installationIntro, lang));
  lines.push("");
  readmeData.installationBrowsers.forEach((b) => {
    lines.push(`### ${getLang(b.title, lang)}`);
    lines.push("");
    if (b.steps) {
      b.steps.forEach((st, idx) => {
        lines.push(`${idx + 1}. ${getLang(st, lang)}`);
      });
      lines.push("");
    }
    if (b.methods) {
      b.methods.forEach((m) => {
        lines.push(`#### ${getLang(m.title, lang)}`);
        lines.push("");
        m.steps.forEach((st, idx) => {
          lines.push(`${idx + 1}. ${getLang(st, lang)}`);
        });
        lines.push("");
      });
    }
  });
  lines.push("---");
  lines.push("");

  // Token Guide
  lines.push(`## ${getLang(readmeData.tokenTitle, lang)}`);
  lines.push("");
  lines.push(getLang(readmeData.tokenIntro, lang));
  lines.push("");
  readmeData.tokenSteps.forEach((st, idx) => {
    lines.push(`${idx + 1}. ${getLang(st, lang)}`);
  });
  lines.push("");
  lines.push(`> [!WARNING]`);
  lines.push(`> **${getLang(readmeData.tokenWarning.title, lang)}:** ${getLang(readmeData.tokenWarning.content, lang)}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Development Commands
  lines.push(`## ${getLang(readmeData.devCommandsTitle, lang)}`);
  lines.push("");
  lines.push(getLang(readmeData.devCommandsIntro, lang));
  lines.push("");
  readmeData.commands.forEach((cmd) => {
    lines.push(`### ${getLang(cmd.title, lang)}`);
    lines.push("");
    lines.push(getLang(cmd.description, lang));
    lines.push("");
    lines.push("```bash");
    lines.push(cmd.command);
    lines.push("```");
    lines.push("");
  });

  return lines.join("\n").trim() + "\n";
}

const rootDir = process.cwd();

// Dynamic loop across all supported languages defined in LANG_MATRIX
for (const [langKey, meta] of Object.entries(LANG_MATRIX)) {
  const lang = langKey as SupportedLang;
  const outputPath = path.resolve(rootDir, meta.fileName);
  const markdownContent = generateMarkdown(lang);
  fs.writeFileSync(outputPath, markdownContent, "utf-8");
  console.log(`✓ Successfully generated ${meta.fileName} (${meta.label} ${meta.flag})`);
}
