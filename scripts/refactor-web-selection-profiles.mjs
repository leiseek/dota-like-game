import { readFileSync, writeFileSync } from "node:fs";

const MAIN_TS_PATH = "platform-web/src/main.ts";
const DRY_RUN = process.argv.includes("--dry-run");

const importToAdd = `import {
  enemyName,
  enemyProfile,
  heroName,
  heroProfile,
  statusBadgeFor,
  statusEffectName,
  type EnemyStatusBadge,
} from "./profiles/selection-profiles.js";
`;

const file = readFileSync(MAIN_TS_PATH, "utf8");
let next = file;

next = addSelectionProfileImport(next);
next = removeSelectionProfileTypeAliases(next);
next = removeStaticProfileBlocks(next);
next = removeLocalSelectionProfileHelpers(next);
next = replaceStatusLabelLookups(next);

if (next === file) {
  console.log("No selection-profile extraction changes were needed.");
  process.exit(0);
}

if (DRY_RUN) {
  console.log("Selection-profile extraction codemod would update platform-web/src/main.ts.");
  console.log(`Line delta: ${lineCount(next) - lineCount(file)}`);
  process.exit(0);
}

writeFileSync(MAIN_TS_PATH, next);
console.log(`Updated ${MAIN_TS_PATH}. Line delta: ${lineCount(next) - lineCount(file)}`);

function addSelectionProfileImport(source) {
  if (source.includes("./profiles/selection-profiles.js")) return source;
  return source.replace(/} from "\.\.\/\.\.\/dist\/game-core\/index\.js";\n/, (match) => `${match}${importToAdd}\n`);
}

function removeSelectionProfileTypeAliases(source) {
  return source
    .replace(/^type EnemyStatusBadge = Readonly<\{ text: string; color: string \}>;\n/m, "")
    .replace(/^type SelectionProfile = Readonly<\{ role: string; summary: string; special: string; tips: string \}>;\n/m, "");
}

function removeStaticProfileBlocks(source) {
  let output = source;
  output = removeConstBlock(output, "HERO_DISPLAY_NAMES");
  output = removeConstBlock(output, "ENEMY_DISPLAY_NAMES");
  output = removeConstBlock(output, "HERO_PROFILES");
  output = removeConstBlock(output, "ENEMY_PROFILES");
  output = removeConstBlock(output, "STATUS_LABELS");
  return output;
}

function removeLocalSelectionProfileHelpers(source) {
  let output = source;
  output = removeFunctionBlock(output, "heroName");
  output = removeFunctionBlock(output, "enemyName");
  output = removeFunctionBlock(output, "heroProfile");
  output = removeFunctionBlock(output, "enemyProfile");
  output = removeFunctionBlock(output, "statusEffectName");
  return output;
}

function replaceStatusLabelLookups(source) {
  return source.replace(/const badge = STATUS_LABELS\[statusEffect\.type\];/g, "const badge = statusBadgeFor(statusEffect.type);");
}

function removeConstBlock(source, name) {
  const startToken = `const ${name}`;
  const startIndex = source.indexOf(startToken);
  if (startIndex < 0) return source;

  const assignmentIndex = source.indexOf("=", startIndex);
  if (assignmentIndex < 0) throw new Error(`Cannot find assignment for ${name}`);

  let depth = 0;
  let endIndex = -1;
  for (let index = assignmentIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{" || char === "[") depth += 1;
    if (char === "}" || char === "]") depth -= 1;
    if (depth === 0 && source.slice(index, index + 2) === ";\n") {
      endIndex = index + 2;
      break;
    }
  }

  if (endIndex < 0) throw new Error(`Cannot find end of const block ${name}`);
  return trimExtraBlankLines(`${source.slice(0, startIndex)}${source.slice(endIndex)}`);
}

function removeFunctionBlock(source, name) {
  const startToken = `function ${name}(`;
  const startIndex = source.indexOf(startToken);
  if (startIndex < 0) return source;

  const bodyStart = source.indexOf("{", startIndex);
  if (bodyStart < 0) throw new Error(`Cannot find body for function ${name}`);

  let depth = 0;
  let endIndex = -1;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      endIndex = index + 1;
      if (source[endIndex] === "\n") endIndex += 1;
      break;
    }
  }

  if (endIndex < 0) throw new Error(`Cannot find end of function ${name}`);
  return trimExtraBlankLines(`${source.slice(0, startIndex)}${source.slice(endIndex)}`);
}

function trimExtraBlankLines(source) {
  return source.replace(/\n{3,}/g, "\n\n");
}

function lineCount(source) {
  return source.split(/\r?\n/).length;
}
