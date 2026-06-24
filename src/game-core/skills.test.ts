import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialGameState,
  enqueueAction,
  level001Config,
  stepSimulation,
  type Enemy,
  type GameState,
} from "./index.js";

function buildHero(state: GameState, slotId: string, heroArchetype: string): GameState {
  return stepSimulation(enqueueAction(state, { type: "BUILD_HERO", slotId, heroArchetype }), 1, level001Config);
}

function spawnEnemies(state: GameState, enemies: readonly Enemy[]): GameState {
  return stepSimulation(
    enemies.reduce((nextState, enemy) => enqueueAction(nextState, { type: "SPAWN_ENEMY", enemy }), state),
    1,
    level001Config,
  );
}

function testEnemy(id: string, position = { x: 150, y: 190 }, health = 300): Enemy {
  return {
    id,
    archetype: "rift-grunt",
    pathIndex: 2,
    progress: 0.5,
    position,
    health,
    maxHealth: health,
    carryingCrystal: false,
  };
}

test("Hook Guardian pulls targets backward and stuns crystal carriers", () => {
  const built = buildHero(createInitialGameState(level001Config), "T01", "hook-guardian");
  const carrier = {
    ...testEnemy("enemy-1", { x: 420, y: 175 }, 100),
    pathIndex: 3,
    progress: 0.5,
    carryingCrystal: true,
  };
  const withCarrier = spawnEnemies({ ...built, crystal: { atBase: false, carrierEnemyId: "enemy-1" } }, [carrier]);

  const afterHook = stepSimulation(
    enqueueAction(withCarrier, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );
  const pulled = afterHook.enemies[0];

  assert.equal(afterHook.resources.manaCrystal, 65);
  assert.equal(pulled?.health, 20);
  assert.ok((pulled?.pathIndex ?? 99) < carrier.pathIndex || (pulled?.progress ?? 1) < carrier.progress);
  assert.equal(pulled?.statusEffects?.some((statusEffect) => statusEffect.type === "stun"), true);
});

test("Frost Priestess damages and slows enemies in the targeted area", () => {
  const built = buildHero(createInitialGameState(level001Config), "T01", "frost-priestess");
  const withEnemies = spawnEnemies(built, [
    testEnemy("enemy-1", { x: 150, y: 190 }, 100),
    testEnemy("enemy-2", { x: 210, y: 190 }, 100),
    testEnemy("enemy-3", { x: 330, y: 190 }, 100),
  ]);

  const afterFrost = stepSimulation(
    enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );

  assert.equal(afterFrost.resources.manaCrystal, 60);
  assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-1")?.health, 55);
  assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-2")?.health, 55);
  assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-3")?.health, 100);
  assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-1")?.statusEffects?.[0]?.type, "slow");
  assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-1")?.statusEffects?.[0]?.speedMultiplier, 0.35);
});

test("Storm Chain jumps farther when the target is slowed by frost", () => {
  const withFrost = buildHero(createInitialGameState(level001Config), "T01", "frost-priestess");
  const withStorm = buildHero(withFrost, "T02", "storm-sigilist");
  const enemies = Array.from({ length: 7 }, (_, index) => testEnemy(`enemy-${index + 1}`, { x: 150 + index * 18, y: 190 }, 300));
  const withEnemies = spawnEnemies(withStorm, enemies);

  const afterFrost = stepSimulation(
    enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );
  const afterStorm = stepSimulation(
    enqueueAction(afterFrost, { type: "CAST_SKILL", heroId: "hero-2", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );

  assert.equal(afterStorm.resources.manaCrystal, 15);
  assert.equal(afterStorm.enemies.filter((enemy) => enemy.health < 255).length, 7);
  assert.equal(afterStorm.enemies.find((enemy) => enemy.id === "enemy-7")?.health, 219);
});

test("Storm Chain without ice combo keeps the base jump count", () => {
  const withStorm = buildHero(createInitialGameState(level001Config), "T01", "storm-sigilist");
  const enemies = Array.from({ length: 7 }, (_, index) => testEnemy(`enemy-${index + 1}`, { x: 150 + index * 18, y: 190 }, 300));
  const withEnemies = spawnEnemies(withStorm, enemies);

  const afterStorm = stepSimulation(
    enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );

  assert.equal(afterStorm.enemies.filter((enemy) => enemy.health < 300).length, 5);
  assert.equal(afterStorm.enemies.find((enemy) => enemy.id === "enemy-6")?.health, 300);
  assert.equal(afterStorm.enemies.find((enemy) => enemy.id === "enemy-7")?.health, 300);
});

test("Moonblade Ranger bursts and bounces with bonus damage against slowed enemies", () => {
  const withFrost = buildHero(createInitialGameState(level001Config), "T01", "frost-priestess");
  const withMoonblade = buildHero(withFrost, "T02", "moonblade-ranger");
  const withEnemies = spawnEnemies(withMoonblade, [
    testEnemy("enemy-1", { x: 150, y: 190 }, 200),
    testEnemy("enemy-2", { x: 190, y: 190 }, 200),
    testEnemy("enemy-3", { x: 230, y: 190 }, 200),
  ]);

  const afterFrost = stepSimulation(
    enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );
  const afterMoonblade = stepSimulation(
    enqueueAction(afterFrost, { type: "CAST_SKILL", heroId: "hero-2", targetEnemyId: "enemy-1" }),
    1,
    level001Config,
  );

  assert.equal(afterMoonblade.resources.manaCrystal, 10);
  assert.equal(afterMoonblade.enemies.find((enemy) => enemy.id === "enemy-1")?.health, 83);
  assert.equal(afterMoonblade.enemies.find((enemy) => enemy.id === "enemy-2")?.health, 101);
  assert.equal(afterMoonblade.enemies.find((enemy) => enemy.id === "enemy-3")?.health, 114);
});
