const CRYSTAL_EVENT_DURATION_MS = 1500;
const CRYSTAL_HUD_ID = "hud-crystals";
let previousStatus = "unknown";
let crystalEventEffects = [];
const hudElement = document.getElementById(CRYSTAL_HUD_ID);
if (hudElement) {
    previousStatus = parseCrystalHudStatus(hudElement.textContent ?? "");
    new MutationObserver(() => observeCrystalStatus(hudElement)).observe(hudElement, {
        childList: true,
        characterData: true,
        subtree: true,
    });
}
requestAnimationFrame(drawCrystalEventEffects);
function observeCrystalStatus(element) {
    const nextStatus = parseCrystalHudStatus(element.textContent ?? "");
    if (nextStatus === "unknown" || nextStatus === previousStatus)
        return;
    const effect = createCrystalEventEffect(previousStatus, nextStatus);
    previousStatus = nextStatus;
    if (!effect)
        return;
    crystalEventEffects = [...crystalEventEffects, effect].slice(-4);
}
function parseCrystalHudStatus(text) {
    if (text.includes("被携带"))
        return "carried";
    if (text.includes("掉落"))
        return "dropped";
    if (text.includes("返回中"))
        return "returning";
    if (text.includes("已回收"))
        return "recovered";
    if (text.includes("已被运出"))
        return "escaped";
    if (text.includes("安全"))
        return "safe";
    return "unknown";
}
function createCrystalEventEffect(previous, next) {
    const startedAtMs = performance.now();
    if (next === "carried") {
        const intercepted = previous === "returning" || previous === "dropped";
        return {
            title: intercepted ? "水晶被截走！" : "水晶被偷走！",
            subtitle: intercepted ? "返还途中被怪物追上，携晶者正在逃向起点。" : "怪物已从圣坛拿到水晶，必须拦截返程路线。",
            tone: "danger",
            startedAtMs,
        };
    }
    if (next === "returning" || next === "dropped") {
        return {
            title: "水晶掉落，正在返还！",
            subtitle: "水晶会以半速返回圣坛，途中仍可能被其他怪物截走。",
            tone: "warning",
            startedAtMs,
        };
    }
    if (next === "recovered" || next === "safe") {
        if (previous !== "returning" && previous !== "dropped")
            return undefined;
        return {
            title: "水晶已返还！",
            subtitle: "圣坛重新安全，可以继续防守下一次偷取。",
            tone: "success",
            startedAtMs,
        };
    }
    if (next === "escaped") {
        return {
            title: "水晶被运出起点！",
            subtitle: "只有怪物真正从起点离场时才扣除水晶。",
            tone: "danger",
            startedAtMs,
        };
    }
    return undefined;
}
function drawCrystalEventEffects(nowMs) {
    const canvas = document.getElementById("battle-canvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
        requestAnimationFrame(drawCrystalEventEffects);
        return;
    }
    crystalEventEffects = crystalEventEffects.filter((effect) => nowMs - effect.startedAtMs < CRYSTAL_EVENT_DURATION_MS);
    crystalEventEffects.forEach((effect, index) => drawCrystalEventEffect(context, effect, nowMs, index));
    requestAnimationFrame(drawCrystalEventEffects);
}
function drawCrystalEventEffect(context, effect, nowMs, stackIndex) {
    const ageMs = nowMs - effect.startedAtMs;
    const ratio = Math.min(1, ageMs / CRYSTAL_EVENT_DURATION_MS);
    const intro = Math.min(1, ratio / 0.18);
    const alpha = Math.max(0, 1 - Math.max(0, ratio - 0.72) / 0.28);
    const y = 76 + stackIndex * 70;
    const bannerWidth = 430;
    const bannerHeight = 58;
    const x = 480 - bannerWidth / 2;
    const pulseRadius = 28 + ratio * 96;
    const palette = paletteForTone(effect.tone);
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = palette.ring;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(480, 250, pulseRadius, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = palette.backdrop;
    context.strokeStyle = palette.border;
    context.lineWidth = 2;
    roundRect(context, x, y - bannerHeight / 2 - 10 * (1 - intro), bannerWidth, bannerHeight, 14);
    context.fill();
    context.stroke();
    context.fillStyle = palette.title;
    context.font = "bold 22px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(effect.title, 480, y - 4 - 8 * (1 - intro));
    context.fillStyle = "rgba(255, 255, 255, 0.88)";
    context.font = "14px system-ui, sans-serif";
    context.fillText(effect.subtitle, 480, y + 20 - 8 * (1 - intro));
    drawCrystalIcon(context, 480 - bannerWidth / 2 + 28, y - 4, palette.title, ratio);
    context.restore();
}
function paletteForTone(tone) {
    switch (tone) {
        case "danger":
            return { backdrop: "rgba(72, 18, 22, 0.82)", border: "rgba(255, 122, 89, 0.9)", title: "#ffb29c", ring: "rgba(255, 122, 89, 0.36)" };
        case "warning":
            return { backdrop: "rgba(76, 54, 13, 0.82)", border: "rgba(255, 226, 138, 0.9)", title: "#ffe28a", ring: "rgba(255, 226, 138, 0.34)" };
        case "success":
            return { backdrop: "rgba(16, 62, 35, 0.82)", border: "rgba(110, 255, 162, 0.9)", title: "#9dffbf", ring: "rgba(110, 255, 162, 0.34)" };
    }
}
function drawCrystalIcon(context, x, y, color, ratio) {
    const floatY = Math.sin(ratio * Math.PI * 2) * 3;
    context.save();
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, y - 17 + floatY);
    context.lineTo(x + 11, y + floatY);
    context.lineTo(x, y + 17 + floatY);
    context.lineTo(x - 11, y + floatY);
    context.closePath();
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.65)";
    context.lineWidth = 1.5;
    context.stroke();
    context.restore();
}
function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
}
export {};
//# sourceMappingURL=crystal-event-feedback.js.map