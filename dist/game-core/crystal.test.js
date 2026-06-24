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
test("stealing the crystal records carried state and stolen event", () => {
    const withEnemy = enqueueAction(enqueueAction(createInitialGameState(tutorialLevel), { type: "START" }), { type: "SPAWN_ENEMY", enemy: nearCrystalEnemy });
    const stolen = stepSimulation(withEnemy, 1, tutorialLevel);
    const hud = selectHudState(stolen);
    assert.equal(stolen.crystal.atBase, false);
    assert.equal(stolen.crystal.status, "carried");
    assert.equal(stolen.crystal.carrierEnemyId, "enemy-1");
    assert.equal(stolen.crystal.lastEvent?.type, "stolen");
    assert.equal(stolen.crystal.stolenCount, 1);
    assert.equal(hud.crystal.status, "carried");
    assert.equal(hud.crystal.carrierEnemyId, "enemy-1");
    assert.equal(hud.crystal.lastEventType, "stolen");
});
test("killing a crystal carrier records dropped and recovered state", () => {
    const withEnemy = enqueueAction(enqueueAction(createInitialGameState(tutorialLevel), { type: "START" }), { type: "SPAWN_ENEMY", enemy: nearCrystalEnemy });
    const stolen = stepSimulation(withEnemy, 1, tutorialLevel);
    const recovered = stepSimulation(enqueueAction(stolen, { type: "CAST_SKILL", heroId: "hero-1", targetEnemyId: "enemy-1" }), 1, tutorialLevel);
    const hud = selectHudState(recovered);
    assert.equal(recovered.crystal.atBase, true);
    assert.equal(recovered.crystal.status, "recovered");
    assert.equal(recovered.crystal.carrierEnemyId, undefined);
    assert.equal(recovered.crystal.lastCarrierEnemyId, "enemy-1");
    assert.equal(recovered.crystal.lastDroppedEnemyId, "enemy-1");
    assert.equal(recovered.crystal.lastEvent?.type, "recovered");
    assert.equal(recovered.crystal.stolenCount, 1);
    assert.equal(recovered.crystal.droppedCount, 1);
    assert.equal(recovered.crystal.recoveredCount, 1);
    assert.equal(hud.crystal.status, "recovered");
    assert.equal(hud.crystal.lastDroppedEnemyId, "enemy-1");
    assert.equal(hud.crystal.lastEventType, "recovered");
});
test("a carrier escaping with the crystal records escaped state", () => {
    const shortLevel = {
        ...tutorialLevel,
        fixedDeltaMs: 100,
        path: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
        ],
        enemies: [{ archetype: "runner", maxHealth: 50, speedUnitsPerSecond: 100, rewardGold: 1 }],
    };
    const enemy = { ...nearCrystalEnemy, pathIndex: 0, progress: 0, position: shortLevel.path[0], health: 50, maxHealth: 50 };
    const primed = enqueueAction(enqueueAction(enqueueAction(createInitialGameState(shortLevel), { type: "START" }), { type: "SET_SPEED", speed: 10 }), { type: "SPAWN_ENEMY", enemy });
    const escaped = stepSimulation(primed, 1, shortLevel);
    const hud = selectHudState(escaped);
    assert.equal(escaped.status, "lost");
    assert.equal(escaped.crystal.status, "escaped");
    assert.equal(escaped.crystal.carrierEnemyId, "enemy-1");
    assert.equal(escaped.crystal.lastEvent?.type, "escaped");
    assert.equal(escaped.crystal.stolenCount, 1);
    assert.equal(escaped.crystal.escapedCount, 1);
    assert.equal(hud.crystal.status, "escaped");
    assert.equal(hud.crystal.lastEventType, "escaped");
});
