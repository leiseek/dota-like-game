import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialGameState,
  createSnapshot,
  enqueueAction,
  restoreSnapshot,
  stepSimulation,
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
