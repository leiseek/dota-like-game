export const VISUAL_EVENT_NAME = "ancient-defense:visual-event";

export type CrystalEventTone = "danger" | "warning" | "success";

export type HeroLevelUpVisualEvent = Readonly<{
  type: "hero-level-up";
  x: number;
  y: number;
  level: number;
  heroAbbreviation: string;
  passiveLabel: string;
}>;

export type CrystalObjectiveVisualEvent = Readonly<{
  type: "crystal-event";
  title: string;
  subtitle: string;
  tone: CrystalEventTone;
}>;

export type WebVisualEvent = HeroLevelUpVisualEvent | CrystalObjectiveVisualEvent;

export function dispatchVisualEvent(detail: WebVisualEvent): void {
  window.dispatchEvent(new CustomEvent<WebVisualEvent>(VISUAL_EVENT_NAME, { detail }));
}
