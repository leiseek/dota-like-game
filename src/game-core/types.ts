export type EntityId = string;

export type Vector2 = Readonly<{
  x: number;
  y: number;
}>;

export type GameSpeed = 1 | 2 | 5 | 10;

export type GameStatus = "ready" | "running" | "paused" | "won" | "lost";

export type Hero = Readonly<{
  id: EntityId;
  archetype: string;
  position: Vector2;
  health: number;
  maxHealth: number;
  cooldownTicksRemaining: number;
}>;

export type Enemy = Readonly<{
  id: EntityId;
  archetype: string;
  pathIndex: number;
  progress: number;
  health: number;
  maxHealth: number;
  carryingCrystal: boolean;
}>;

export type CrystalState = Readonly<{
  atBase: boolean;
  carrierEnemyId?: EntityId;
}>;

export type GameClock = Readonly<{
  tick: number;
  fixedDeltaMs: number;
  speed: GameSpeed;
  paused: boolean;
}>;

export type GameState = Readonly<{
  schemaVersion: 1;
  levelId: string;
  status: GameStatus;
  clock: GameClock;
  randomSeed: number;
  randomState: number;
  baseHealth: number;
  crystal: CrystalState;
  heroes: readonly Hero[];
  enemies: readonly Enemy[];
  pendingActions: readonly GameAction[];
}>;

export type LevelConfig = Readonly<{
  id: string;
  fixedDeltaMs: number;
  randomSeed: number;
  baseHealth: number;
  path: readonly Vector2[];
  startingHeroes: readonly Omit<Hero, "id" | "cooldownTicksRemaining">[];
}>;

export type GameAction =
  | Readonly<{ type: "START" }>
  | Readonly<{ type: "PAUSE" }>
  | Readonly<{ type: "RESUME" }>
  | Readonly<{ type: "SET_SPEED"; speed: GameSpeed }>
  | Readonly<{ type: "PLACE_HERO"; hero: Hero }>
  | Readonly<{ type: "CAST_SKILL"; heroId: EntityId; targetEnemyId: EntityId }>
  | Readonly<{ type: "SPAWN_ENEMY"; enemy: Enemy }>;

export type GameSnapshot = Readonly<{
  savedAtTick: number;
  state: GameState;
}>;
