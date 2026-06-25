export {};

const VISUAL_EVENT_NAME = "ancient-defense:visual-event";
const CRYSTAL_HUD_ID = "hud-crystals";
const HERO_LABEL_PATTERN = /^Lv([1-5])\s+([A-Z]+)/;

type CrystalHudStatus = "unknown" | "safe" | "carried" | "dropped" | "returning" | "recovered" | "escaped";
type CrystalEventTone = "danger" | "warning" | "success";

type HeroLevelUpVisualEvent = Readonly<{
  type: "hero-level-up";
  x: number;
  y: number;
  level: number;
  heroAbbreviation: string;
  passiveLabel: string;
}>;

type CrystalObjectiveVisualEvent = Readonly<{
  type: "crystal-event";
  title: string;
  subtitle: string;
  tone: CrystalEventTone;
}>;

type WebVisualEvent = HeroLevelUpVisualEvent | CrystalObjectiveVisualEvent;

const passiveLabelsByHeroAbbreviation: Record<string, readonly string[]> = {
  HG: ["Crystal Warden", "Stone Line", "Aftershock Guard", "Hold the Gate", "Ancient Fissure"],
  FP: ["Chill Touch", "Deep Freeze", "Return Wind", "Frozen Field", "Absolute Zero"],
  SS: ["Static Link", "Arc Snare", "Overload Jump", "Storm Field", "Thunder Cascade"],
  MR: ["Moon Glaive", "Night Venom", "Lunar Burn", "Ricochet Hunt", "Eclipse Mark"],
  G: ["基础守卫成长"],
};

const seenHeroLevels = new Map<string, number>();
let previousCrystalStatus: CrystalHudStatus = "unknown";

installHeroLabelBridge();
installCrystalHudBridge();

function installHeroLabelBridge(): void {
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

function installCrystalHudBridge(): void {
  const hudElement = document.getElementById(CRYSTAL_HUD_ID);
  if (!hudElement) return;

  previousCrystalStatus = parseCrystalHudStatus(hudElement.textContent ?? "");
  new MutationObserver(() => observeCrystalStatus(hudElement)).observe(hudElement, {
    childList: true,
    characterData: true,
    subtree: true,
  });
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
  dispatchVisualEvent({
    type: "hero-level-up",
    x,
    y: y + 25,
    level,
    heroAbbreviation,
    passiveLabel,
  });
}

function observeCrystalStatus(element: HTMLElement): void {
  const nextStatus = parseCrystalHudStatus(element.textContent ?? "");
  if (nextStatus === "unknown" || nextStatus === previousCrystalStatus) return;

  const event = createCrystalVisualEvent(previousCrystalStatus, nextStatus);
  previousCrystalStatus = nextStatus;
  if (event) dispatchVisualEvent(event);
}

function parseCrystalHudStatus(text: string): CrystalHudStatus {
  if (text.includes("被携带")) return "carried";
  if (text.includes("掉落")) return "dropped";
  if (text.includes("返回中")) return "returning";
  if (text.includes("已回收")) return "recovered";
  if (text.includes("已被运出")) return "escaped";
  if (text.includes("安全")) return "safe";
  return "unknown";
}

function createCrystalVisualEvent(previous: CrystalHudStatus, next: CrystalHudStatus): CrystalObjectiveVisualEvent | undefined {
  if (next === "carried") {
    const intercepted = previous === "returning" || previous === "dropped";
    return {
      type: "crystal-event",
      title: intercepted ? "水晶被截走！" : "水晶被偷走！",
      subtitle: intercepted ? "返还途中被怪物追上，携晶者正在逃向起点。" : "怪物已从圣坛拿到水晶，必须拦截返程路线。",
      tone: "danger",
    };
  }

  if (next === "returning" || next === "dropped") {
    return {
      type: "crystal-event",
      title: "水晶掉落，正在返还！",
      subtitle: "水晶会以半速返回圣坛，途中仍可能被其他怪物截走。",
      tone: "warning",
    };
  }

  if (next === "recovered" || next === "safe") {
    if (previous !== "returning" && previous !== "dropped") return undefined;
    return {
      type: "crystal-event",
      title: "水晶已返还！",
      subtitle: "圣坛重新安全，可以继续防守下一次偷取。",
      tone: "success",
    };
  }

  if (next === "escaped") {
    return {
      type: "crystal-event",
      title: "水晶被运出起点！",
      subtitle: "只有怪物真正从起点离场时才扣除水晶。",
      tone: "danger",
    };
  }

  return undefined;
}

function dispatchVisualEvent(detail: WebVisualEvent): void {
  window.dispatchEvent(new CustomEvent<WebVisualEvent>(VISUAL_EVENT_NAME, { detail }));
}
