import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialGameState,
  enqueueAction,
  selectHudState,
  stepSimulation,
  tutorialLevel,
  type Enemy,
} from "./index.js";

const oneWaveLevel = {
  ...tutorialLevel,
  baseHealth: 10,
  enemies: [{ archetype: "runner", maxHealth: 25, speedUnitsPerSecond: 75, rewardGold: 1 }],
  waves: [{ id: "wave-01", startsAtMs: 0, spawnGroups: [{ enemyArchetype: "runner", count: 1, intervalMs: 100 }] }],
};

function clearOneWave(baseHealthOverride?: number) {
  const initial = createInitialGameState(oneWaveLevel);
  const spawned = stepSimulation(
    enqueueAction(enqueueAction(initial, { type: "START" }), { type: "START_NEXT_WAVE" }),
    1,
    oneWaveLevel,
  );
  const adjusted = baseHealthOverride === undefined ? spawned : { ...spawned, baseHealth: baseHealthOverride };
  const killed = stepSimulation(
    enqueueAction(adjusted, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    1,
    oneWaveLevel,
  );
  return stepSimulation(killed, 1, oneWaveLevel);
}

test("initial settlement is pending and mirrored through HUD", () => {
  const initial = createInitialGameState(oneWaveLevel);
  const hud = selectHudState(initial);

  assert.equal(initial.settlement.outcome, "pending");
  assert.equal(initial.settlement.reason, "none");
  assert.equal(initial.settlement.isComplete, false);
  assert.equal(initial.settlement.stars, 0);
  assert.equal(initial.settlement.remainingCrystals, 10);
  assert.equal(hud.settlement.outcome, "pending");
});

test("clearing all waves creates a three-star victory settlement when all crystals remain", () => {
  const completed = clearOneWave();
  const hud = selectHudState(completed);

  assert.equal(completed.status, "won");
  assert.equal(completed.settlement.outcome, "victory");
  assert.equal(completed.settlement.reason, "all-waves-cleared");
  assert.equal(completed.settlement.isComplete, true);
  assert.equal(completed.settlement.stars, 3);
  assert.equal(completed.settlement.remainingCrystals, 10);
  assert.equal(completed.settlement.maxCrystals, 10);
  assert.equal(completed.settlement.completedAtTick, completed.clock.tick);
  assert.equal(hud.settlement.stars, 3);
});

test("victory star rating scales from remaining crystals", () => {
  const twoStar = clearOneWave(5);
  const oneStar = clearOneWave(1);

  assert.equal(twoStar.status, "won");
  assert.equal(twoStar.settlement.stars, 2);
  assert.equal(twoStar.settlement.remainingCrystals, 5);

  assert.equal(oneStar.status, "won");
  assert.equal(oneStar.settlement.stars, 1);
  assert.equal(oneStar.settlement.remainingCrystals, 1);
});

test("carrier escape creates a zero-star defeat settlement after deducting one crystal", () => {
  const shortLevel = {
    ...tutorialLevel,
    fixedDeltaMs: 100,
    path: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    enemies: [{ archetype: "runner", maxHealth: 50, speedUnitsPerSecond: 100, rewardGold: 1 }],
  };
  const enemy: Enemy = {
    id: "enemy-1",
    archetype: "runner",
    pathIndex: 0,
    progress: 0,
    position: shortLevel.path[0]!,
    health: 50,
    maxHealth: 50,
    carryingCrystal: false,
  };
  const initial = createInitialGameState(shortLevel);
  const primed = enqueueAction(
    enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SET_SPEED", speed: 10 }),
    { type: "SPAWN_ENEMY", enemy },
  );

  const escaped = stepSimulation(primed, 1, shortLevel);

  assert.equal(escaped.status, "lost");
  assert.equal(escaped.baseHealth, initial.baseHealth - 1);
  assert.equal(escaped.settlement.outcome, "defeat");
  assert.equal(escaped.settlement.reason, "crystal-escaped");
  assert.equal(escaped.settlement.stars, 0);
  assert.equal(escaped.settlement.remainingCrystals, initial.baseHealth - 1);
  assert.equal(escaped.settlement.escapedCrystals, 1);
});

test("cleared waves do not settle while a dropped crystal is still returning", () => {
  const returnLevel = {
    ...tutorialLevel,
    fixedDeltaMs: 1_000,
    baseHealth: 10,
    path: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
    enemies: [{ archetype: "runner", maxHealth: 25, speedUnitsPerSecond: 20, rewardGold: 1 }],
    waves: [{ id: "wave-01", startsAtMs: 0, spawnGroups: [] }],
  };
  const carrier: Enemy = {
    id: "enemy-1",
    archetype: "runner",
    pathIndex: 0,
    progress: 0.5,
    position: { x: 50, y: 0 },
    health: 25,
    maxHealth: 25,
    carryingCrystal: true,
  };
  const initial = createInitialGameState(returnLevel);
  const withCarrier = {
    ...initial,
    status: "running" as const,
    clock: { ...initial.clock, paused: false },
    crystal: {
      ...initial.crystal,
      atBase: false,
      status: "carried" as const,
      carrierEnemyId: carrier.id,
      lastCarrierEnemyId: carrier.id,
      lastEvent: { type: "stolen" as const, tick: 0, enemyId: carrier.id },
      stolenCount: 1,
    },
    enemies: [carrier],
    wave: {
      ...initial.wave,
      totalWaves: 1,
      isWaveActive: false,
      isWaitingNextWave: false,
    },
  };

  const returning = stepSimulation(
    enqueueAction(withCarrier, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    0,
    returnLevel,
  );

  assert.equal(returning.status, "running");
  assert.equal(returning.settlement.outcome, "pending");
  assert.equal(returning.crystal.status, "returning");

  const completed = stepSimulation(returning, 6, returnLevel);
  assert.equal(completed.status, "won");
  assert.equal(completed.settlement.outcome, "victory");
  assert.equal(completed.crystal.status, "recovered");
});
