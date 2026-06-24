import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGameState, enqueueAction, selectHudState, stepSimulation, tutorialLevel, } from "./index.js";
const nearCrystalEnemy = {
    id: "enemy-1",
    archetype: "runner",
    pathIndex: 1,
    progress: 0.95,
    position: { x: 9.75, y: 3.8 },
    health: 25,
    maxHealth: 25,
    carryingCrystal: false,
};
const straightLevel = {
    ...tutorialLevel,
    fixedDeltaMs: 1_000,
    path: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
    ],
    enemies: [{ archetype: "runner", maxHealth: 50, speedUnitsPerSecond: 20, rewardGold: 1 }],
};
function runningStateWithCarrier(carrier) {
    const initial = createInitialGameState(straightLevel);
    return {
        ...initial,
        status: "running",
        clock: { ...initial.clock, paused: false },
        crystal: {
            ...initial.crystal,
            atBase: false,
            status: "carried",
            carrierEnemyId: carrier.id,
            lastCarrierEnemyId: carrier.id,
            lastEvent: { type: "stolen", tick: 0, enemyId: carrier.id },
            stolenCount: 1,
        },
        enemies: [carrier],
    };
}
function carrierAtHalfPath(health = 25) {
    return {
        id: "enemy-1",
        archetype: "runner",
        pathIndex: 0,
        progress: 0.5,
        position: { x: 50, y: 0 },
        health,
        maxHealth: 50,
        carryingCrystal: true,
    };
}
function assertNear(actual, expected) {
    assert.ok(actual !== undefined, `expected ${expected}, got undefined`);
    assert.ok(Math.abs(actual - expected) < 1e-9, `expected ${expected}, got ${actual}`);
}
test("initial crystal state is safe and exposed through HUD", () => {
    const initial = createInitialGameState(tutorialLevel);
    const hud = selectHudState(initial);
    assert.equal(initial.crystal.status, "safe");
    assert.equal(initial.crystal.atBase, true);
    assert.equal(initial.crystal.stolenCount, 0);
    assert.equal(initial.crystal.droppedCount, 0);
    assert.equal(initial.crystal.recoveredCount, 0);
    assert.equal(initial.crystal.escapedCount, 0);
    assert.equal(hud.crystal.status, "safe");
    assert.equal(hud.crystal.stolenCount, 0);
});
test("stealing the crystal records carried state and stolen event without deducting crystals", () => {
    const initial = createInitialGameState(tutorialLevel);
    const withEnemy = enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SPAWN_ENEMY", enemy: nearCrystalEnemy });
    const stolen = stepSimulation(withEnemy, 1, tutorialLevel);
    const hud = selectHudState(stolen);
    assert.equal(stolen.baseHealth, initial.baseHealth);
    assert.equal(stolen.crystal.atBase, false);
    assert.equal(stolen.crystal.status, "carried");
    assert.equal(stolen.crystal.carrierEnemyId, "enemy-1");
    assert.equal(stolen.crystal.lastEvent?.type, "stolen");
    assert.equal(stolen.crystal.stolenCount, 1);
    assert.equal(hud.crystal.status, "carried");
    assert.equal(hud.crystal.carrierEnemyId, "enemy-1");
    assert.equal(hud.crystal.lastEventType, "stolen");
});
test("killing a crystal carrier drops a returning crystal instead of instant recovery", () => {
    const dropped = stepSimulation(enqueueAction(runningStateWithCarrier(carrierAtHalfPath()), { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 0, straightLevel);
    const hud = selectHudState(dropped);
    assert.equal(dropped.baseHealth, straightLevel.baseHealth);
    assert.equal(dropped.crystal.atBase, false);
    assert.equal(dropped.crystal.status, "returning");
    assert.equal(dropped.crystal.carrierEnemyId, undefined);
    assert.equal(dropped.crystal.position?.x, 50);
    assert.equal(dropped.crystal.pathIndex, 0);
    assert.equal(dropped.crystal.progress, 0.5);
    assert.equal(dropped.crystal.returnSpeedUnitsPerSecond, 10);
    assert.equal(dropped.crystal.lastCarrierEnemyId, "enemy-1");
    assert.equal(dropped.crystal.lastDroppedEnemyId, "enemy-1");
    assert.equal(dropped.crystal.lastEvent?.type, "dropped");
    assert.equal(dropped.crystal.droppedCount, 1);
    assert.equal(dropped.crystal.recoveredCount, 0);
    assert.equal(hud.crystal.status, "returning");
    assert.equal(hud.crystal.position?.x, 50);
});
test("a returning crystal moves toward the Ancient at half monster speed and then recovers without deducting crystals", () => {
    const dropped = stepSimulation(enqueueAction(runningStateWithCarrier(carrierAtHalfPath()), { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 0, straightLevel);
    const moving = stepSimulation(dropped, 1, straightLevel);
    assert.equal(moving.baseHealth, straightLevel.baseHealth);
    assert.equal(moving.crystal.status, "returning");
    assertNear(moving.crystal.position?.x, 60);
    assertNear(moving.crystal.progress, 0.6);
    const recovered = stepSimulation(dropped, 6, straightLevel);
    assert.equal(recovered.baseHealth, straightLevel.baseHealth);
    assert.equal(recovered.crystal.status, "recovered");
    assert.equal(recovered.crystal.atBase, true);
    assert.equal(recovered.crystal.position, undefined);
    assert.equal(recovered.crystal.recoveredCount, 1);
    assert.equal(recovered.crystal.lastEvent?.type, "recovered");
});
test("a monster can intercept a returning crystal and immediately become the new carrier without deducting crystals", () => {
    const dropped = stepSimulation(enqueueAction(runningStateWithCarrier(carrierAtHalfPath()), { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 0, straightLevel);
    const chaser = {
        id: "enemy-2",
        archetype: "runner",
        pathIndex: 0,
        progress: 0.4,
        position: { x: 40, y: 0 },
        health: 50,
        maxHealth: 50,
        carryingCrystal: false,
    };
    const intercepted = stepSimulation({ ...dropped, enemies: [chaser] }, 1, straightLevel);
    const newCarrier = intercepted.enemies.find((enemy) => enemy.id === "enemy-2");
    assert.equal(intercepted.baseHealth, straightLevel.baseHealth);
    assert.equal(intercepted.crystal.status, "carried");
    assert.equal(intercepted.crystal.carrierEnemyId, "enemy-2");
    assert.equal(intercepted.crystal.stolenCount, 2);
    assert.equal(intercepted.crystal.lastEvent?.type, "stolen");
    assert.equal(newCarrier?.carryingCrystal, true);
    assert.equal(newCarrier?.returningToStart, true);
});
test("endpoint monsters return to the start instead of leaving through the Ancient", () => {
    const initial = createInitialGameState(straightLevel);
    const endpointEnemy = {
        id: "enemy-2",
        archetype: "runner",
        pathIndex: 0,
        progress: 0.95,
        position: { x: 95, y: 0 },
        health: 50,
        maxHealth: 50,
        carryingCrystal: false,
    };
    const turnedAround = stepSimulation(enqueueAction({
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
    }, { type: "SPAWN_ENEMY", enemy: endpointEnemy }), 1, straightLevel);
    assert.equal(turnedAround.status, "running");
    assert.equal(turnedAround.baseHealth, straightLevel.baseHealth);
    assert.equal(turnedAround.enemies.length, 1);
    assert.equal(turnedAround.enemies[0]?.returningToStart, true);
    assert.equal(turnedAround.enemies[0]?.carryingCrystal, false);
    assertNear(turnedAround.enemies[0]?.position.x, 100);
    const leftFromStart = stepSimulation(turnedAround, 6, straightLevel);
    assert.equal(leftFromStart.baseHealth, straightLevel.baseHealth);
    assert.equal(leftFromStart.enemies.length, 0);
    assert.equal(leftFromStart.crystal.stolenCount, 1);
});
test("endpoint monsters can intercept a returning crystal only by crossing it on the way back", () => {
    const initial = createInitialGameState(straightLevel);
    const endpointEnemy = {
        id: "enemy-2",
        archetype: "runner",
        pathIndex: 0,
        progress: 0.95,
        position: { x: 95, y: 0 },
        health: 50,
        maxHealth: 50,
        carryingCrystal: false,
    };
    const returningCrystal = stepSimulation(enqueueAction({
        ...initial,
        status: "running",
        clock: { ...initial.clock, paused: false },
        crystal: {
            ...initial.crystal,
            atBase: false,
            status: "returning",
            position: { x: 50, y: 0 },
            pathIndex: 0,
            progress: 0.5,
            returnSpeedUnitsPerSecond: 10,
            lastDroppedEnemyId: "enemy-1",
            lastEvent: { type: "dropped", tick: 0, enemyId: "enemy-1" },
            stolenCount: 1,
            droppedCount: 1,
        },
    }, { type: "SPAWN_ENEMY", enemy: endpointEnemy }), 1, straightLevel);
    assert.equal(returningCrystal.enemies[0]?.returningToStart, true);
    assert.equal(returningCrystal.enemies[0]?.carryingCrystal, false);
    assert.equal(returningCrystal.crystal.status, "returning");
    const intercepted = stepSimulation(returningCrystal, 1, straightLevel);
    assert.equal(intercepted.crystal.status, "carried");
    assert.equal(intercepted.crystal.carrierEnemyId, "enemy-2");
    assert.equal(intercepted.enemies[0]?.carryingCrystal, true);
    assert.equal(intercepted.enemies[0]?.returningToStart, true);
});
test("a carrier escaping with the crystal deducts exactly one crystal at the start", () => {
    const shortLevel = {
        ...tutorialLevel,
        fixedDeltaMs: 100,
        path: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
        ],
        enemies: [{ archetype: "runner", maxHealth: 50, speedUnitsPerSecond: 100, rewardGold: 1 }],
    };
    const initial = createInitialGameState(shortLevel);
    const enemy = { ...nearCrystalEnemy, pathIndex: 0, progress: 0, position: shortLevel.path[0], health: 50, maxHealth: 50 };
    const primed = enqueueAction(enqueueAction(enqueueAction(initial, { type: "START" }), { type: "SET_SPEED", speed: 10 }), { type: "SPAWN_ENEMY", enemy });
    const escaped = stepSimulation(primed, 1, shortLevel);
    const hud = selectHudState(escaped);
    assert.equal(escaped.status, "lost");
    assert.equal(escaped.baseHealth, initial.baseHealth - 1);
    assert.equal(escaped.crystal.status, "escaped");
    assert.equal(escaped.crystal.carrierEnemyId, "enemy-1");
    assert.equal(escaped.crystal.lastEvent?.type, "escaped");
    assert.equal(escaped.crystal.stolenCount, 1);
    assert.equal(escaped.crystal.escapedCount, 1);
    assert.equal(escaped.settlement.remainingCrystals, initial.baseHealth - 1);
    assert.equal(hud.crystal.status, "escaped");
    assert.equal(hud.crystal.lastEventType, "escaped");
});
