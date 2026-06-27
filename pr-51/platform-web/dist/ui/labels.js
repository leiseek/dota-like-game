export function crystalStatusLabel(status) {
    switch (status) {
        case "safe":
            return "安全";
        case "carried":
            return "被携带";
        case "dropped":
            return "掉落";
        case "returning":
            return "返回中";
        case "recovered":
            return "已回收";
        case "escaped":
            return "已被运出";
    }
}
export function gameStatusLabel(status) {
    switch (status) {
        case "ready":
            return "待开始";
        case "running":
            return "战斗中";
        case "paused":
            return "已暂停";
        case "won":
            return "胜利";
        case "lost":
            return "失败";
    }
}
export function settlementLabel(settlement) {
    return `${settlement.outcome === "victory" ? "胜利" : "失败"} · ${settlement.stars}★ · 水晶 ${settlement.remainingCrystals}/${settlement.maxCrystals}`;
}
export function settlementReasonLabel(reason) {
    switch (reason) {
        case "none":
            return "无";
        case "all-waves-cleared":
            return "清完全部波次";
        case "crystal-escaped":
            return "水晶被运出起点";
        case "base-crystals-depleted":
            return "水晶耗尽";
    }
}
//# sourceMappingURL=labels.js.map