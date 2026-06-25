import assert from "node:assert/strict";
import test from "node:test";

import { createInitialGameState, enqueueAction, level001Config, stepSimulation } from "./index.js";

test("Level 001 obstacles expose clear costs in initial state", () => {
  const initial = createInitialGameState(level001Config);
  const obstacle = initial.obstacles.find((candidate) => candidate.id === "O01");

  assert.equal(obstacle?.clearCost, 80);
  assert.equal(obstacle?.destroyed, false);
  assert.equal(initial.towerSlots.find((slot) => slot.id === "T09")?.unlocked, false);
});

test("CLEAR_OBSTACLE spends gold, destroys obstacle, and unlocks the linked tower slot", () => {
  const initial = createInitialGameState(level001Config);
  const cleared = stepSimulation(enqueueAction(initial, { type: "CLEAR_OBSTACLE", obstacleId: "O01" }), 0, level001Config);

  assert.equal(cleared.resources.gold, initial.resources.gold - 80);
  assert.equal(cleared.obstacles.find((obstacle) => obstacle.id === "O01")?.destroyed, true);
  assert.equal(cleared.obstacles.find((obstacle) => obstacle.id === "O01")?.health, 0);
  assert.equal(cleared.towerSlots.find((slot) => slot.id === "T09")?.unlocked, true);
});

test("CLEAR_OBSTACLE is rejected when gold is insufficient or obstacle is already destroyed", () => {
  const initial = createInitialGameState(level001Config);
  const broke = { ...initial, resources: { ...initial.resources, gold: 79 } };
  const rejected = stepSimulation(enqueueAction(broke, { type: "CLEAR_OBSTACLE", obstacleId: "O01" }), 0, level001Config);

  assert.equal(rejected.resources.gold, 79);
  assert.equal(rejected.obstacles.find((obstacle) => obstacle.id === "O01")?.destroyed, false);
  assert.equal(rejected.towerSlots.find((slot) => slot.id === "T09")?.unlocked, false);

  const cleared = stepSimulation(enqueueAction(initial, { type: "CLEAR_OBSTACLE", obstacleId: "O01" }), 0, level001Config);
  const repeated = stepSimulation(enqueueAction(cleared, { type: "CLEAR_OBSTACLE", obstacleId: "O01" }), 0, level001Config);
  assert.equal(repeated.resources.gold, cleared.resources.gold);
});

test("cleared tower slots can be used for hero building", () => {
  const initial = createInitialGameState(level001Config);
  const cleared = stepSimulation(enqueueAction(initial, { type: "CLEAR_OBSTACLE", obstacleId: "O01" }), 0, level001Config);
  const built = stepSimulation(enqueueAction(cleared, { type: "BUILD_HERO", slotId: "T09", heroArchetype: "frost-priestess" }), 0, level001Config);

  assert.equal(built.heroes.at(-1)?.slotId, "T09");
  assert.equal(built.towerSlots.find((slot) => slot.id === "T09")?.occupiedByHeroId, "hero-1");
  assert.equal(built.resources.gold, initial.resources.gold - 80 - 110);
});
