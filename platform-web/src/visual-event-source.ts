import {
  level001Config,
  type GameState,
  type Hero,
  type HeroConfig,
} from "../../dist/game-core/index.js";
import { dispatchVisualEvent, type CrystalObjectiveVisualEvent } from "./visual-event-bridge.js";

type CrystalStatus = GameState["crystal"]["status"];
type CrystalHudStatus = "unknown" | CrystalStatus;

const HERO_LABEL_PATTERN = /^Lv([1-5])\s+([A-Z]+)/;
const CRYSTAL_HUD_ID = "hud-crystals";
const seenHeroLevels = new Map<string, number>();
let previousCrystalStatus: CrystalHudStatus = "unknown";

installCompatibilityVisualEventSource();

export function emitVisualEventsFromStateDiff(previousState: GameState, nextState: GameState): void {
  emitHeroLevelUpEvents(previousState, nextState);
  emitCrystalObjectiveEvents(previousState, nextState);
}

function installCompatibilityVisualEventSource(): void {
  installHeroLabelSource();
  installCrystalHudSource();
}

function emitHeroLevelUpEvents(previousState: GameState, nextState: GameState): void {
  for (const nextHero of nextState.heroes) {
    const previousHero = previousState.heroes.find((hero) => hero.id === nextHero.id);
    if (!previousHero || nextHero.level <= previousHero.level) continue;

    dispatchVisualEvent({
      type: "hero-level-up",
      x: nextHero.position.x,
      y: nextHero.position.y,
      level: nextHero.level,
      heroAbbreviation: shortHeroName(nextHero.archetype),
      passiveLabel: unlockedPassiveLabel(previousHero, nextHero),
    });
  }
}

function emitCrystalObjectiveEvents(previousState: GameState, nextState: GameState): void {
  const previousStatus = previousState.crystal.status;
  const nextStatus = nextState.crystal.status;
  if (previousStatus === nextStatus) return;

  const event = createCrystalVisualEvent(previousStatus, nextStatus);
  if (event) dispatchVisualEvent(event);
}

function installHeroLabelSource(): void {
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

function installCrystalHudSource(): void {
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

  dispatchVisualEvent({
    type: "hero-level-up",
    x,
    y: y + 25,
    level,
    heroAbbreviation,
    passiveLabel: passiveLabelForHeroAbbreviation(heroAbbreviation, level),
  });
}

function observeCrystalStatus(element: HTMLElement): void {
  const nextStatus = parseCrystalHudStatus(element.textContent ?? "");
  if (nextStatus === "unknown" || nextStatus === previousCrystalStatus) return;

  const event = createCrystalVisualEvent(previousCrystalStatus, nextStatus);
  previousCrystalStatus = nextStatus;
  if (event) dispatchVisualEvent(event);
}

function unlockedPassiveLabel(previousHero: Hero, nextHero: Hero): string {
  const config = heroConfig(nextHero.archetype);
  const newlyUnlockedPassiveIds = nextHero.unlockedPassiveIds.filter((passiveId) => !previousHero.unlockedPassiveIds.includes(passiveId));
  const newlyUnlockedPassive = config?.progression?.passives.find((passive) => newlyUnlockedPassiveIds.includes(passive.id));
  if (newlyUnlockedPassive) return newlyUnlockedPassive.label;

  const levelPassive = config?.progression?.passives.find((passive) => passive.level === nextHero.level);
  return levelPassive?.label ?? `Lv${nextHero.level} 新被动`;
}

function passiveLabelForHeroAbbreviation(heroAbbreviation: string, level: number): string {
  const archetype = archetypeForHeroAbbreviation(heroAbbreviation);
  const config = archetype ? heroConfig(archetype) : undefined;
  const levelPassive = config?.progression?.passives.find((passive) => passive.level === level);
  return levelPassive?.label ?? `Lv${level} 新被动`;
}

function archetypeForHeroAbbreviation(heroAbbreviation: string): string | undefined {
  return level001Config.heroConfigs?.find((config) => shortHeroName(config.archetype) === heroAbbreviation)?.archetype;
}

function heroConfig(archetype: string): HeroConfig | undefined {
  return level001Config.heroConfigs?.find((config) => config.archetype === archetype);
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

function createCrystalVisualEvent(previous: CrystalHudStatus, next: CrystalStatus): CrystalObjectiveVisualEvent | undefined {
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

function shortHeroName(archetype: string): string {
  return archetype
    .split("-")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
