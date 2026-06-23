import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialGameState,
  createSnapshot,
  enqueueAction,
  restoreSnapshot,
  stepSimulation,
  level001Config,
  tutorialLevel,
  type Enemy,
} from "./index.js";

const enemy: Enemy = {
  id: "enemy-1",
  archetype: "runner",
  pathIndex: 0,
  progress: 0,
  health: 50,
  maxHealth: 50,
  carryingCrystal: false,
};

test("fixed tick simulation only advances after START action", () => {
  const initial = createInitialGameState(tutorialLevel);
  assert.equal(stepSimulation(initial).clock.tick, 0);

  const started = stepSimulation(enqueueAction(initial, { type: "START" }));
  assert.equal(started.status, "running");
  assert.equal(started.clock.tick, 1);
});

test("pause and resume are represented by GameAction", () => {
  const running = stepSimulation(enqueueAction(createInitialGameState(tutorialLevel), { type: "START" }));
  const paused = stepSimulation(enqueueAction(running, { type: "PAUSE" }));
  assert.equal(paused.status, "paused");
  assert.equal(paused.clock.tick, 1);

  const resumed = stepSimulation(enqueueAction(paused, { type: "RESUME" }));
  assert.equal(resumed.status, "running");
  assert.equal(resumed.clock.tick, 2);
});

test("speed multiplier controls fixed tick count deterministically", () => {
  const initial = createInitialGameState(tutorialLevel);
  const primed = enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SET_SPEED", speed: 5 });
  const advanced = stepSimulation(primed);
  assert.equal(advanced.clock.speed, 5);
  assert.equal(advanced.clock.tick, 5);
});

test("snapshots restore the exact game state", () => {
  const initial = createInitialGameState(tutorialLevel);
  const withEnemy = enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SPAWN_ENEMY", enemy });
  const advanced = stepSimulation(withEnemy, 3);
  const restored = restoreSnapshot(createSnapshot(advanced));
  assert.deepEqual(restored, advanced);
});

test("hero skills are deterministic GameAction effects", () => {
  const initial = createInitialGameState(tutorialLevel);
  const withEnemy = stepSimulation(
    enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SPAWN_ENEMY", enemy }),
  );
  const afterSkill = stepSimulation(
    enqueueAction(withEnemy, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
  );
  assert.equal(afterSkill.enemies[0]?.health, 25);
  assert.equal(afterSkill.heroes[0]?.cooldownTicksRemaining, 9);
});

test("enemies steal the crystal and lose after carrying it away", () => {
  const initial = createInitialGameState(tutorialLevel);
  const withEnemy = enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SPAWN_ENEMY", enemy });
  const atCrystal = stepSimulation(withEnemy, 20);
  assert.equal(atCrystal.crystal.atBase, false);
  assert.equal(atCrystal.crystal.carrierEnemyId, "enemy-1");
  assert.equal(atCrystal.enemies[0]?.carryingCrystal, true);

  const escapedWithCrystal = stepSimulation(atCrystal, 20);
  assert.equal(escapedWithCrystal.status, "lost");
});

test("killing a crystal carrier returns the crystal to base", () => {
  const initial = createInitialGameState(tutorialLevel);
  const strongEnemy = { ...enemy, health: 25, maxHealth: 25 };
  const withEnemy = enqueueAction(enqueueAction(initial, { type: "START" }), {
    type: "SPAWN_ENEMY",
    enemy: strongEnemy,
  });
  const carrier = stepSimulation(withEnemy, 20);
  const afterSkill = stepSimulation(
    enqueueAction(carrier, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
  );

  assert.equal(afterSkill.crystal.atBase, true);
  assert.equal(afterSkill.crystal.carrierEnemyId, undefined);
  assert.equal(afterSkill.enemies.length, 0);
});

test("level 001 config exposes the documented 10 waves", () => {
  const initial = createInitialGameState(level001Config);
  assert.equal(initial.wave.totalWaves, 10);
  assert.equal(level001Config.path.length, 10);
  assert.equal(level001Config.waves?.[0]?.spawnGroups[0]?.count, 8);
  assert.equal(level001Config.waves?.[9]?.spawnGroups[0]?.enemyArchetype, "rift-beast-hatchling");
});

test("START_NEXT_WAVE activates deterministic configured spawning", () => {
  const initial = createInitialGameState(level001Config);
  const started = stepSimulation(
    enqueueAction(enqueueAction(initial, { type: "START" }), { type: "START_NEXT_WAVE" }),
    1,
    level001Config,
  );

  assert.equal(started.wave.isWaveActive, true);
  assert.equal(started.wave.spawnedCountInWave, 1);
  assert.equal(started.enemies[0]?.id, "enemy-1");
  assert.equal(started.enemies[0]?.archetype, "rift-grunt");
  assert.equal(started.enemies[0]?.maxHealth, 50);

  const nextSpawn = stepSimulation(started, 36, level001Config);
  assert.equal(nextSpawn.wave.spawnedCountInWave, 2);
  assert.equal(nextSpawn.enemies[1]?.id, "enemy-2");
});

test("Level 001 loads documented tower slots and obstacles into GameState", () => {
  const initial = createInitialGameState(level001Config);
  assert.equal(initial.towerSlots.length, 10);
  assert.equal(initial.towerSlots.find((slot) => slot.id === "T01")?.unlocked, true);
  assert.equal(initial.towerSlots.find((slot) => slot.id === "T09")?.unlocked, false);
  assert.equal(initial.obstacles.length, 6);
  assert.equal(initial.obstacles.find((obstacle) => obstacle.id === "O01")?.unlocksSlotId, "T09");
  assert.equal(initial.obstacles.find((obstacle) => obstacle.id === "O06")?.rewardGold, 40);
});

test("last configured wave completes and wins after all spawned enemies are killed", () => {
  const oneWaveLevel = {
    ...tutorialLevel,
    enemies: [{ archetype: "runner", maxHealth: 25 }],
    waves: [{ id: "wave-01", startsAtMs: 0, spawnGroups: [{ enemyArchetype: "runner", count: 1, intervalMs: 100 }] }],
  };
  const initial = createInitialGameState(oneWaveLevel);
  const spawned = stepSimulation(
    enqueueAction(enqueueAction(initial, { type: "START" }), { type: "START_NEXT_WAVE" }),
    1,
    oneWaveLevel,
  );
  const killed = stepSimulation(enqueueAction(spawned, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, oneWaveLevel);
  const completed = stepSimulation(killed, 1, oneWaveLevel);

  assert.equal(killed.wave.killedCountInWave, 1);
  assert.equal(completed.wave.isWaveActive, false);
  assert.equal(completed.wave.isWaitingNextWave, false);
  assert.equal(completed.status, "won");
});

test("configured waves auto-start when their scheduled time is reached", () => {
  const scheduledLevel = {
    ...tutorialLevel,
    enemies: [{ archetype: "runner", maxHealth: 25 }],
    waves: [{ id: "wave-01", startsAtMs: 100, spawnGroups: [{ enemyArchetype: "runner", count: 1, intervalMs: 100 }] }],
  };
  const started = stepSimulation(enqueueAction(createInitialGameState(scheduledLevel), { type: "START" }), 1, scheduledLevel);
  assert.equal(started.wave.isWaitingNextWave, true);
  assert.equal(started.enemies.length, 0);

  const autoStarted = stepSimulation(started, 1, scheduledLevel);
  assert.equal(autoStarted.wave.isWaveActive, true);
  assert.equal(autoStarted.wave.spawnedCountInWave, 1);
  assert.equal(autoStarted.enemies[0]?.archetype, "runner");
});
