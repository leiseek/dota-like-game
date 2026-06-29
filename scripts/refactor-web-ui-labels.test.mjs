import assert from "node:assert/strict";
import test from "node:test";

import { transformUiLabelSource } from "./refactor-web-ui-labels.mjs";

test("UI label codemod extracts duplicated label helpers", () => {
  const input = `import {
  type GameState,
} from "../../dist/game-core/index.js";

function syncUi(gameState: GameState): string {
  return gameState.settlement.isComplete ? settlementLabel(gameState.settlement) : gameStatusLabel(gameState.status);
}

function crystalStatusLabel(status: GameState["crystal"]["status"]): string {
  switch (status) {
    case "safe":
      return "安全";
    case "carried":
      return "被携带";
  }
}

function gameStatusLabel(status: GameState["status"]): string {
  switch (status) {
    case "ready":
      return "待开始";
    case "running":
      return "战斗中";
  }
}

function settlementLabel(settlement: GameState["settlement"]): string {
  return `${settlement.outcome === "victory" ? "胜利" : "失败"}`;
}

function setText(id: string, text: string): void {
  document.getElementById(id)!.textContent = text;
}

function settlementReasonLabel(reason: GameState["settlement"]["reason"]): string {
  switch (reason) {
    case "none":
      return "无";
    case "all-waves-cleared":
      return "清完全部波次";
  }
}
`;

  const output = transformUiLabelSource(input);

  assert.match(output, /from "\.\/ui\/labels\.js";/);
  assert.match(output, /crystalStatusLabel,/);
  assert.match(output, /gameStatusLabel,/);
  assert.match(output, /settlementLabel,/);
  assert.match(output, /settlementReasonLabel,/);
  assert.doesNotMatch(output, /function crystalStatusLabel/);
  assert.doesNotMatch(output, /function gameStatusLabel/);
  assert.doesNotMatch(output, /function settlementLabel/);
  assert.doesNotMatch(output, /function settlementReasonLabel/);
  assert.match(output, /function syncUi/);
  assert.match(output, /function setText/);
});

test("UI label codemod is idempotent after extraction", () => {
  const input = `import {
  type GameState,
} from "../../dist/game-core/index.js";
import {
  crystalStatusLabel,
  gameStatusLabel,
  settlementLabel,
  settlementReasonLabel,
} from "./ui/labels.js";

function syncUi(gameState: GameState): string {
  return gameState.settlement.isComplete ? settlementLabel(gameState.settlement) : gameStatusLabel(gameState.status);
}
`;

  assert.equal(transformUiLabelSource(input), input);
});
