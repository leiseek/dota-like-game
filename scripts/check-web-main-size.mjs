import { readFileSync } from "node:fs";

const MAIN_TS_PATH = "platform-web/src/main.ts";
const MAX_MAIN_TS_LINES = 1150;

const lineCount = readFileSync(MAIN_TS_PATH, "utf8").split(/\r?\n/).length;

if (lineCount > MAX_MAIN_TS_LINES) {
  console.error(
    [
      `Web adapter boundary violation: ${MAIN_TS_PATH} has ${lineCount} lines, max is ${MAX_MAIN_TS_LINES}.`,
      "Do not keep adding gameplay, VFX, profile data, or UI panels directly to main.ts.",
      "Move new Web code into focused modules under platform-web/src/ and import it from the adapter.",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`Web adapter boundary OK: ${MAIN_TS_PATH} has ${lineCount}/${MAX_MAIN_TS_LINES} lines.`);
