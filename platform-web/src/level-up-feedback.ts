const LEVEL_UP_EFFECT_DURATION_MS = 1200;
const VISUAL_EVENT_NAME = "ancient-defense:visual-event";

type HeroLevelUpVisualEvent = Readonly<{
  type: "hero-level-up";
  x: number;
  y: number;
  level: number;
  heroAbbreviation: string;
  passiveLabel: string;
}>;

type OtherVisualEvent = Readonly<{ type: string }>;
type WebVisualEvent = HeroLevelUpVisualEvent | OtherVisualEvent;

type LevelUpEffect = Readonly<{
  x: number;
  y: number;
  level: number;
  heroAbbreviation: string;
  passiveLabel: string;
  startedAtMs: number;
}>;

let levelUpEffects: LevelUpEffect[] = [];

window.addEventListener(VISUAL_EVENT_NAME, (event) => {
  const detail = (event as CustomEvent<WebVisualEvent>).detail;
  if (detail.type !== "hero-level-up") return;
  levelUpEffects = [
    ...levelUpEffects,
    {
      x: detail.x,
      y: detail.y,
      level: detail.level,
      heroAbbreviation: detail.heroAbbreviation,
      passiveLabel: detail.passiveLabel,
      startedAtMs: performance.now(),
    },
  ].slice(-10);
});

requestAnimationFrame(drawLevelUpEffects);

function drawLevelUpEffects(nowMs: number): void {
  const canvas = document.getElementById("battle-canvas") as HTMLCanvasElement | null;
  const context = canvas?.getContext("2d");
  if (!canvas || !context) {
    requestAnimationFrame(drawLevelUpEffects);
    return;
  }

  levelUpEffects = levelUpEffects.filter((effect) => nowMs - effect.startedAtMs < LEVEL_UP_EFFECT_DURATION_MS);
  for (const effect of levelUpEffects) drawLevelUpEffect(context, effect, nowMs);
  requestAnimationFrame(drawLevelUpEffects);
}

function drawLevelUpEffect(context: CanvasRenderingContext2D, effect: LevelUpEffect, nowMs: number): void {
  const ageMs = nowMs - effect.startedAtMs;
  const ratio = Math.min(1, ageMs / LEVEL_UP_EFFECT_DURATION_MS);
  const alpha = Math.max(0, 1 - ratio);
  const pulse = Math.sin(ratio * Math.PI);
  const radius = 24 + ratio * 42;

  context.save();
  context.globalAlpha = alpha;

  context.strokeStyle = "rgba(255, 226, 138, 0.95)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = "rgba(110, 255, 162, 0.75)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(effect.x, effect.y, 18 + pulse * 18, 0, Math.PI * 2);
  context.stroke();

  context.fillStyle = "#fff1a8";
  context.font = "bold 19px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(`Lv Up! Lv${effect.level}`, effect.x, effect.y - 38 - ratio * 24);

  context.fillStyle = "#c8ff8a";
  context.font = "bold 14px system-ui, sans-serif";
  context.fillText(`解锁：${effect.passiveLabel}`, effect.x, effect.y - 18 - ratio * 24);

  context.fillStyle = "rgba(255, 255, 255, 0.86)";
  context.font = "12px system-ui, sans-serif";
  context.fillText(effect.heroAbbreviation, effect.x, effect.y + 4);

  context.restore();
}

export {};
