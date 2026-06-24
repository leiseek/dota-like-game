import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGameState, enqueueAction, selectHudState, stepSimulation, tutorialLevel, } from "./index.js";
const oneWaveLevel = {
    ...tutorialLevel,
    baseHealth: 10,
    enemies: [{ archetype: "runner", maxHealth: 25, speedUnitsPerSecond: 75, rewardGold: 1 }],
    waves: [{ id: "wave-01", startsAtMs: 0, spawnGroups: [{ enemyArchetype: "runner", count: 1, intervalMs: 100 }] }],
};
function clearOneWave(baseHealthOverride) {
    const initial = createInitialGameState(oneWaveLevel);
    const spawned = stepSimulation(enqueueAction(enqueueAction(initial, { type: "START" }), { type: "START_NEXT_WAVE" }), 1, oneWaveLevel);
    const adjusted = baseHealthOverride === undefined ? spawned : { ...spawned, baseHealth: baseHealthOverride };
    const killed = stepSimulation(enqueueAction(adjusted, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, oneWaveLevel);
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
test("carrier escape creates a zero-star defeat settlement", () => {
    const shortLevel = {
        ...tutorialLevel,
        fixedDeltaMs: 100,
        path: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
        ],
        enemies: [{ archetype: "runner", maxHealth: 50, speedUnitsPerSecond: 100, rewardGold: 1 }],
    };
    const enemy = {
        id: "enemy-1",
        archetype: "runner",
        pathIndex: 0,
        progress: 0,
        position: shortLevel.path[0],
        health: 50,
        maxHealth: 50,
        carryingCrystal: false,
    };
    const primed = enqueueAction(enqueueAction(enqueueAction(createInitialGameState(shortLevel), { type: "START" }), { type: "SET_SPEED", speed: 10 }), { type: "SPAWN_ENEMY", enemy });
    const escaped = stepSimulation(primed, 1, shortLevel);
    assert.equal(escaped.status, "lost");
    assert.equal(escaped.settlement.outcome, "defeat");
    assert.equal(escaped.settlement.reason, "crystal-escaped");
    assert.equal(escaped.settlement.stars, 0);
    assert.equal(escaped.settlement.escapedCrystals, 1);
});
test("base crystal depletion creates a zero-star defeat settlement", () => {
    const initial = createInitialGameState({ ...tutorialLevel, baseHealth: 1 });
    const extraEnemy = {
        id: "enemy-2",
        archetype: "runner",
        pathIndex: 1,
        progress: 0.95,
        position: { x: 9.75, y: 3.8 },
        health: 50,
        maxHealth: 50,
        carryingCrystal: false,
    };
    const depleted = stepSimulation(enqueueAction({
        ...initial,
        status: "running",
        clock: { ...initial.clock, paused: false },
        crystal: {
            ...initial.crystal,
            atBase: false,
            status: "carried",
            carrierEnemyId: "enemy-1",
            lastCarrierEnemyId: "enemy-1",
            lastEvent: { type: "stolen", tick: 0, enemyId: "enemy-1" },
            stolenCount: 1,
        },
    }, { type: "SPAWN_ENEMY", enemy: extraEnemy }), 1, tutorialLevel);
    assert.equal(depleted.status, "lost");
    assert.equal(depleted.settlement.outcome, "defeat");
    assert.equal(depleted.settlement.reason, "base-crystals-depleted");
    assert.equal(depleted.settlement.stars, 0);
    assert.equal(depleted.settlement.remainingCrystals, 0);
});
