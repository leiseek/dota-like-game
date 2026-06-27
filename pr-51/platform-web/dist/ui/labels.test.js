/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { crystalStatusLabel, gameStatusLabel, settlementLabel, settlementReasonLabel, } from "./labels.js";
test("crystalStatusLabel formats every crystal objective state", () => {
    assert.equal(crystalStatusLabel("safe"), "安全");
    assert.equal(crystalStatusLabel("carried"), "被携带");
    assert.equal(crystalStatusLabel("dropped"), "掉落");
    assert.equal(crystalStatusLabel("returning"), "返回中");
    assert.equal(crystalStatusLabel("recovered"), "已回收");
    assert.equal(crystalStatusLabel("escaped"), "已被运出");
});
test("gameStatusLabel formats battle lifecycle states", () => {
    assert.equal(gameStatusLabel("ready"), "待开始");
    assert.equal(gameStatusLabel("running"), "战斗中");
    assert.equal(gameStatusLabel("paused"), "已暂停");
    assert.equal(gameStatusLabel("won"), "胜利");
    assert.equal(gameStatusLabel("lost"), "失败");
});
test("settlementLabel summarizes outcome, stars, and crystals", () => {
    const victorySettlement = {
        isComplete: true,
        outcome: "victory",
        reason: "all-waves-cleared",
        stars: 3,
        remainingCrystals: 5,
        maxCrystals: 5,
        recoveredCrystals: 1,
        stolenCrystals: 0,
        escapedCrystals: 0,
    };
    const defeatSettlement = {
        isComplete: true,
        outcome: "defeat",
        reason: "base-crystals-depleted",
        stars: 0,
        remainingCrystals: 0,
        maxCrystals: 5,
        recoveredCrystals: 0,
        stolenCrystals: 5,
        escapedCrystals: 5,
    };
    assert.equal(settlementLabel(victorySettlement), "胜利 · 3★ · 水晶 5/5");
    assert.equal(settlementLabel(defeatSettlement), "失败 · 0★ · 水晶 0/5");
});
test("settlementReasonLabel formats settlement reasons", () => {
    assert.equal(settlementReasonLabel("none"), "无");
    assert.equal(settlementReasonLabel("all-waves-cleared"), "清完全部波次");
    assert.equal(settlementReasonLabel("crystal-escaped"), "水晶被运出起点");
    assert.equal(settlementReasonLabel("base-crystals-depleted"), "水晶耗尽");
});
//# sourceMappingURL=labels.test.js.map