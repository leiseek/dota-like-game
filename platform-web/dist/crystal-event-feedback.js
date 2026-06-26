import { VISUAL_EVENT_NAME } from "./visual-event-bridge.js";
const CRYSTAL_EVENT_DURATION_MS = 1500;
let crystalEventEffects = [];
window.addEventListener(VISUAL_EVENT_NAME, (event) => {
    const detail = event.detail;
    if (detail.type !== "crystal-event")
        return;
    crystalEventEffects = [
        ...crystalEventEffects,
        {
            title: detail.title,
            subtitle: detail.subtitle,
            tone: detail.tone,
            startedAtMs: performance.now(),
        },
    ].slice(-4);
});
requestAnimationFrame(drawCrystalEventEffects);
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
//# sourceMappingURL=crystal-event-feedback.js.map