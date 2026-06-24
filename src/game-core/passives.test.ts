import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialGameState,
  enqueueAction,
  level001Config,
  stepSimulation,
  type Enemy,
  type GameState,
  type Hero,
} from "./index.js";

function buildHero(state: GameState, slotId: string, heroArchetype: string): GameState {
  return stepSimulation(enqueueAction(state, { type: "BUILD_HERO", slotId, heroArchetype }), 0, level001Config);
}

function pathEnemy(id: string, progress: number, health: number): Enemy {
  const start = level001Config.path[0]!;
  const end = level001Config.path[1]!;
  return {
    id,
    archetype: "rift-grunt",
    pathIndex: 0,
    progress,
    position: { x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress },
    health,
    maxHealth: health,
    carryingCrystal: false,
  };
}

function withRunningState(state: GameState): GameState {
  return { ...state, status: "running", clock: { ...state.clock, paused: false } };
}

function withHeroProgression(state: GameState, heroId: string, heroLevel: Hero["level"]): GameState {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  const config = hero ? level001Config.heroConfigs?.find((candidate) => candidate.archetype === hero.archetype) : undefined;
  const unlockedPassiveIds = config?.progression?.passives.filter((passive) => passive.level <= heroLevel).map((passive) => passive.id) ?? [];
  const experience = config?.progression?.levelThresholds[heroLevel - 1] ?? 0;
  return {
    ...state,
    heroes: state.heroes.map((candidate) => candidate.id === heroId ? { ...candidate, level: heroLevel, experience, unlockedPassiveIds } : candidate),
  };
}

function spawnEnemies(state: GameState, enemies: readonly Enemy[]): GameState {
  return stepSimulation(
    enemies.reduce((nextState, enemy) => enqueueAction(nextState, { type: "SPAWN_ENEMY", enemy }), state),
    0,
    level001Config,
  );
}

test("Moonblade Ranger Lv3 applies poison and burn that tick for deterministic damage", () => {
  const built = buildHero(createInitialGameState(level001Config), "T01", "moonblade-ranger");
  const leveled = withHeroProgression(built, "hero-1", 3);
  const ready = withRunningState(spawnEnemies(leveled, [pathEnemy("enemy-1", 0.6, 200)]));

  const afterAttack = stepSimulation(ready, 1, level001Config);
  const damaged = afterAttack.enemies[0];
  assert.equal(damaged?.health, 184);
  assert.equal(damaged?.statusEffects?.some((statusEffect) => statusEffect.type === "poison"), true);
  assert.equal(damaged?.statusEffects?.some((statusEffect) => statusEffect.type === "burn"), true);

  const afterDotTick = stepSimulation(afterAttack, 1, level001Config);
  assert.equal(afterDotTick.enemies[0]?.health, 182);
});

test("damage-over-time kills credit gold and XP to the source hero", () => {
  const built = buildHero(createInitialGameState(level001Config), "T01", "moonblade-ranger");
  const leveled = withHeroProgression(built, "hero-1", 3);
  const ready = withRunningState(spawnEnemies(leveled, [pathEnemy("enemy-1", 0.6, 17)]));
  const goldBefore = ready.resources.gold;

  const afterAttack = stepSimulation(ready, 1, level001Config);
  assert.equal(afterAttack.enemies[0]?.health, 1);

  const afterDotKill = stepSimulation(afterAttack, 1, level001Config);
  assert.equal(afterDotKill.enemies.length, 0);
  assert.equal(afterDotKill.resources.gold, goldBefore + 10);
  assert.equal(afterDotKill.heroes[0]?.experience, 4);
});

test("Storm Sigilist Lv1 chain passive splashes basic attack damage to a nearby enemy", () => {
  const built = buildHero(createInitialGameState(level001Config), "T01", "storm-sigilist");
  const ready = withRunningState(spawnEnemies(built, [pathEnemy("enemy-1", 0.6, 100), pathEnemy("enemy-2", 0.61, 100)]));

  const afterAttack = stepSimulation(ready, 1, level001Config);
  const damagedEnemies = afterAttack.enemies.filter((enemy) => enemy.health < 100);

  assert.equal(damagedEnemies.length, 2);
  assert.equal(afterAttack.enemies.some((enemy) => enemy.health === 78), true);
  assert.equal(afterAttack.enemies.some((enemy) => enemy.health === 89), true);
});

test("Hook Guardian anti-carrier passive amplifies damage against crystal carriers", () => {
  const built = buildHero(createInitialGameState(level001Config), "T01", "hook-guardian");
  const carrier = { ...pathEnemy("enemy-1", 0.6, 100), carryingCrystal: true, returningToStart: true };
  const withCarrier = spawnEnemies(
    {
      ...built,
      crystal: {
        ...built.crystal,
        atBase: false,
        status: "carried",
        carrierEnemyId: carrier.id,
        lastCarrierEnemyId: carrier.id,
        lastEvent: { type: "stolen", tick: 0, enemyId: carrier.id },
        stolenCount: 1,
      },
    },
    [carrier],
  );
  const ready = withRunningState(withCarrier);

  const afterAttack = stepSimulation(ready, 1, level001Config);
  assert.equal(afterAttack.enemies[0]?.health, 73);
});
