const LEVEL_UP_EFFECT_DURATION_MS = 1200;
const HERO_LABEL_PATTERN = /^Lv([1-5])\s+([A-Z]+)/;

type LevelUpEffect = Readonly<{
  x: number;
  y: number;
  level: number;
  heroAbbreviation: string;
  passiveLabel: string;
  startedAtMs: number;
}>;

const passiveLabelsByHeroAbbreviation: Record<string, readonly string[]> = {
  HG: ["Crystal Warden", "Stone Line", "Aftershock Guard", "Hold the Gate", "Ancient Fissure"],
  FP: ["Chill Touch", "Deep Freeze", "Return Wind", "Frozen Field", "Absolute Zero"],
  SS: ["Static Link", "Arc Snare", "Overload Jump", "Storm Field", "Thunder Cascade"],
  MR: ["Moon Glaive", "Night Venom", "Lunar Burn", "Ricochet Hunt", "Eclipse Mark"],
  G: ["基础守卫成长"],
};

const seenHeroLevels = new Map<string, number>();
let levelUpEffects: LevelUpEffect[] = [];

installHeroLabelObserver();
requestAnimationFrame(drawLevelUpEffects);

function installHeroLabelObserver(): void {
  const originalFillText = CanvasRenderingContext2D.prototype.fillText;

  CanvasRenderingContext2D.prototype.fillText = function patchedFillText(
    this: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
  ): void {
    observeHeroLevelText(this, text, x, y);
    if (maxWidth === undefined) originalFillText.call(this, text, x, y);
    else originalFillText.call(this, text, x, y, maxWidth);
  };
}

function observeHeroLevelText(context: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  if (context.canvas.id !== "battle-canvas") return;
  const match = HERO_LABEL_PATTERN.exec(text);
  if (!match) return;

  const level = Number(match[1]);
  const heroAbbreviation = match[2] ?? "?";
  const heroKey = `${heroAbbreviation}:${Math.round(x)}:${Math.round(y)}`;
  const previousLevel = seenHeroLevels.get(heroKey);
  seenHeroLevels.set(heroKey, Math.max(previousLevel ?? level, level));

  if (previousLevel === undefined || level <= previousLevel) return;

  const passiveLabel = passiveLabelsByHeroAbbreviation[heroAbbreviation]?.[level - 1] ?? "新被动";
  levelUpEffects = [
    ...levelUpEffects,
    {
      x,
      y: y + 25,
      level,
      heroAbbreviation,
      passiveLabel,
      startedAtMs: performance.now(),
    },
  ].slice(-10);
}

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
