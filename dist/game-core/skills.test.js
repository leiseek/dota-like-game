import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGameState, enqueueAction, level001Config, stepSimulation, } from "./index.js";
function buildHero(state, slotId, heroArchetype) {
    return stepSimulation(enqueueAction(state, { type: "BUILD_HERO", slotId, heroArchetype }), 1, level001Config);
}
function spawnEnemies(state, enemies) {
    return stepSimulation(enemies.reduce((nextState, enemy) => enqueueAction(nextState, { type: "SPAWN_ENEMY", enemy }), state), 1, level001Config);
}
function testEnemy(id, position = { x: 150, y: 190 }, health = 300) {
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
function pathEnemy(id, pathIndex, progress, health = 100) {
    const start = level001Config.path[pathIndex] ?? level001Config.path[0];
    const end = level001Config.path[pathIndex + 1] ?? start;
    return {
        id,
        archetype: "rift-grunt",
        pathIndex,
        progress,
        position: {
            x: start.x + (end.x - start.x) * progress,
            y: start.y + (end.y - start.y) * progress,
        },
        health,
        maxHealth: health,
        carryingCrystal: false,
    };
}
function withHero(state, heroId, patch) {
    return {
        ...state,
        heroes: state.heroes.map((hero) => hero.id === heroId ? { ...hero, ...patch } : hero),
    };
}
test("Hook Guardian pulls targets backward and stuns crystal carriers without spending mana", () => {
    const built = buildHero(createInitialGameState(level001Config), "T01", "hook-guardian");
    const carrier = {
        ...testEnemy("enemy-1", { x: 420, y: 175 }, 200),
        pathIndex: 3,
        progress: 0.5,
        carryingCrystal: true,
    };
    const withCarrier = spawnEnemies({
        ...built,
        crystal: {
            ...built.crystal,
            atBase: false,
            status: "carried",
            carrierEnemyId: "enemy-1",
            lastCarrierEnemyId: "enemy-1",
            lastEvent: { type: "stolen", tick: built.clock.tick, enemyId: "enemy-1" },
            stolenCount: 1,
        },
    }, [carrier]);
    const afterHook = stepSimulation(enqueueAction(withCarrier, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, level001Config);
    const pulled = afterHook.enemies[0];
    assert.equal(afterHook.resources.manaCrystal, 100);
    assert.ok((pulled?.health ?? carrier.health) < carrier.health);
    assert.ok((pulled?.pathIndex ?? 99) < carrier.pathIndex || (pulled?.progress ?? 1) < carrier.progress);
    assert.equal(pulled?.statusEffects?.some((statusEffect) => statusEffect.type === "stun"), true);
});
test("Frost Priestess damages and slows enemies in the targeted area without spending mana", () => {
    const built = buildHero(createInitialGameState(level001Config), "T01", "frost-priestess");
    const withEnemies = spawnEnemies(built, [
        testEnemy("enemy-1", { x: 150, y: 190 }, 100),
        testEnemy("enemy-2", { x: 210, y: 190 }, 100),
        testEnemy("enemy-3", { x: 330, y: 190 }, 100),
    ]);
    const afterFrost = stepSimulation(enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, level001Config);
    assert.equal(afterFrost.resources.manaCrystal, 100);
    assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-1")?.health, 55);
    assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-2")?.health, 55);
    assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-3")?.health, 100);
    assert.equal(afterFrost.enemies.find((enemy) => enemy.id === "enemy-1")?.statusEffects?.some((statusEffect) => statusEffect.type === "slow"), true);
});
test("Storm Chain jumps farther when the target is slowed by frost", () => {
    const withFrost = buildHero(createInitialGameState(level001Config), "T01", "frost-priestess");
    const withStorm = buildHero(withFrost, "T02", "storm-sigilist");
    const enemies = Array.from({ length: 7 }, (_, index) => testEnemy(`enemy-${index + 1}`, { x: 150 + index * 15, y: 190 }, 300));
    const withEnemies = spawnEnemies(withStorm, enemies);
    const afterFrost = stepSimulation(enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, level001Config);
    const afterStorm = stepSimulation(enqueueAction(afterFrost, { type: "CAST_SKILL", heroId: "hero-2", targetEnemyId: "enemy-1" }), 1, level001Config);
    assert.equal(afterStorm.resources.manaCrystal, 100);
    assert.equal(afterStorm.enemies.filter((enemy) => enemy.health < 255).length, 7);
    assert.ok((afterStorm.enemies.find((enemy) => enemy.id === "enemy-7")?.health ?? 300) < 255);
});
test("Storm Chain without ice combo keeps a smaller jump count than the ice combo", () => {
    const withStorm = buildHero(createInitialGameState(level001Config), "T01", "storm-sigilist");
    const enemies = Array.from({ length: 7 }, (_, index) => testEnemy(`enemy-${index + 1}`, { x: 150 + index * 18, y: 190 }, 300));
    const withEnemies = spawnEnemies(withStorm, enemies);
    const afterStorm = stepSimulation(enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, level001Config);
    assert.equal(afterStorm.resources.manaCrystal, 100);
    assert.equal(afterStorm.enemies.filter((enemy) => enemy.health < 300).length, 6);
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
    const afterFrost = stepSimulation(enqueueAction(withEnemies, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, level001Config);
    const afterMoonblade = stepSimulation(enqueueAction(afterFrost, { type: "CAST_SKILL", heroId: "hero-2", targetEnemyId: "enemy-1" }), 1, level001Config);
    assert.equal(afterMoonblade.resources.manaCrystal, 100);
    assert.ok((afterMoonblade.enemies.find((enemy) => enemy.id === "enemy-1")?.health ?? 200) < 100);
    assert.ok((afterMoonblade.enemies.find((enemy) => enemy.id === "enemy-2")?.health ?? 200) < 120);
    assert.ok((afterMoonblade.enemies.find((enemy) => enemy.id === "enemy-3")?.health ?? 200) < 130);
});
test("heroes gain XP, level up, and unlock the next passive from kills", () => {
    const built = buildHero(createInitialGameState(level001Config), "T01", "hook-guardian");
    const withEnemy = spawnEnemies(built, [testEnemy("enemy-1", { x: 150, y: 190 }, 80)]);
    const leveled = stepSimulation(enqueueAction(withEnemy, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 0, level001Config);
    const hero = leveled.heroes[0];
    assert.equal(hero?.experience, 1);
    assert.equal(hero?.level, 2);
    assert.equal(hero?.unlockedPassiveIds.length, 2);
    assert.equal(leveled.enemies.length, 0);
});
test("higher hero levels reduce active ultimate cooldown", () => {
    const built = buildHero(createInitialGameState(level001Config), "T01", "hook-guardian");
    const withEnemy = spawnEnemies(built, [testEnemy("enemy-1", { x: 150, y: 190 }, 1000)]);
    const levelOneCast = stepSimulation(enqueueAction(withEnemy, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 0, level001Config);
    const levelOneCooldown = levelOneCast.heroes[0]?.cooldownTicksRemaining ?? 0;
    const highLevelHero = withHero(withEnemy, "hero-1", {
        level: 5,
        experience: 10,
        unlockedPassiveIds: level001Config.heroConfigs?.[0]?.progression?.passives.map((passive) => passive.id) ?? [],
        cooldownTicksRemaining: 0,
    });
    const levelFiveCast = stepSimulation(enqueueAction(highLevelHero, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 0, level001Config);
    const levelFiveCooldown = levelFiveCast.heroes[0]?.cooldownTicksRemaining ?? 0;
    assert.ok(levelFiveCooldown < levelOneCooldown, `expected ${levelFiveCooldown} < ${levelOneCooldown}`);
});
test("auto-cast toggles per hero and casts deterministically on an in-range target", () => {
    const built = buildHero(createInitialGameState(level001Config), "T01", "hook-guardian");
    const withEnemy = spawnEnemies(built, [pathEnemy("enemy-1", 0, 0.6, 100)]);
    const toggled = stepSimulation(enqueueAction(withEnemy, { type: "SET_AUTO_CAST", heroId: "hero-1", enabled: true }), 0, level001Config);
    const afterAuto = stepSimulation({ ...toggled, status: "running", clock: { ...toggled.clock, paused: false } }, 1, level001Config);
    const hero = afterAuto.heroes[0];
    const enemy = afterAuto.enemies.find((candidate) => candidate.id === "enemy-1");
    assert.equal(hero?.autoCastEnabled, true);
    assert.ok((hero?.cooldownTicksRemaining ?? 0) > 0);
    assert.ok((enemy?.health ?? 100) <= 2);
});
