import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MAIN_TS_PATH = "platform-web/src/main.ts";
const importToAdd = `import {
  crystalStatusLabel,
  gameStatusLabel,
  settlementLabel,
  settlementReasonLabel,
} from "./ui/labels.js";
`;

export function transformUiLabelSource(source) {
  let next = source;
  next = addUiLabelImport(next);
  for (const name of ["crystalStatusLabel", "gameStatusLabel", "settlementLabel", "settlementReasonLabel"]) {
    next = removeFunctionBlock(next, name);
  }
  return next;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  const file = readFileSync(MAIN_TS_PATH, "utf8");
  const next = transformUiLabelSource(file);
  if (next === file) {
    console.log("No UI-label extraction changes were needed.");
  } else if (dryRun) {
    console.log(`UI-label extraction codemod would update ${MAIN_TS_PATH}.`);
    console.log(`Line delta: ${lineCount(next) - lineCount(file)}`);
  } else {
    writeFileSync(MAIN_TS_PATH, next);
    console.log(`Updated ${MAIN_TS_PATH}. Line delta: ${lineCount(next) - lineCount(file)}`);
  }
}

function addUiLabelImport(source) {
  if (source.includes("./ui/labels.js")) return source;
  return source.replace(/} from "\.\.\/\.\.\/dist\/game-core\/index\.js";\n/, (match) => `${match}${importToAdd}\n`);
}

function removeFunctionBlock(source, name) {
  const startIndex = source.indexOf(`function ${name}(`);
  if (startIndex < 0) return source;
  const bodyStart = source.indexOf("{", startIndex);
  if (bodyStart < 0) throw new Error(`Cannot find body for function ${name}`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      const endIndex = source[index + 1] === "\n" ? index + 2 : index + 1;
      return trimExtraBlankLines(`${source.slice(0, startIndex)}${source.slice(endIndex)}`);
    }
  }

  throw new Error(`Cannot find end of function ${name}`);
}

function trimExtraBlankLines(source) {
  return source.replace(/\n{3,}/g, "\n\n");
}

function lineCount(source) {
  return source.split(/\r?\n/).length;
}
