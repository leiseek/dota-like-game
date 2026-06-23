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

export type WaveSpawnGroup = Readonly<{
  enemyArchetype: string;
  count: number;
  intervalMs: number;
}>;

export type WaveConfig = Readonly<{
  id: string;
  startsAtMs: number;
  spawnGroups: readonly WaveSpawnGroup[];
}>;

export type EnemyConfig = Readonly<{
  archetype: string;
  maxHealth: number;
}>;

export type TowerSlotConfig = Readonly<{
  id: string;
  position: Vector2;
  initiallyUnlocked: boolean;
}>;

export type ObstacleConfig = Readonly<{
  id: string;
  position: Vector2;
  maxHealth: number;
  rewardGold: number;
  unlocksSlotId?: string;
}>;

export type TowerSlotState = Readonly<{
  id: string;
  position: Vector2;
  unlocked: boolean;
  occupiedByHeroId?: EntityId;
}>;

export type ObstacleState = Readonly<{
  id: string;
  position: Vector2;
  health: number;
  maxHealth: number;
  rewardGold: number;
  unlocksSlotId?: string;
  destroyed: boolean;
}>;

export type WaveRuntimeState = Readonly<{
  currentWaveIndex: number;
  totalWaves: number;
  waveElapsedMs: number;
  activeGroupIndex: number;
  spawnedCountInGroup: number;
  nextSpawnElapsedMs: number;
  isWaveActive: boolean;
  isWaitingNextWave: boolean;
  spawnedCountInWave: number;
  killedCountInWave: number;
  nextEnemySequence: number;
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
  towerSlots: readonly TowerSlotState[];
  obstacles: readonly ObstacleState[];
  wave: WaveRuntimeState;
}>;

export type LevelConfig = Readonly<{
  id: string;
  fixedDeltaMs: number;
  randomSeed: number;
  baseHealth: number;
  path: readonly Vector2[];
  startingHeroes: readonly Omit<Hero, "id" | "cooldownTicksRemaining">[];
  enemies?: readonly EnemyConfig[];
  towerSlots?: readonly TowerSlotConfig[];
  obstacles?: readonly ObstacleConfig[];
  waves?: readonly WaveConfig[];
}>;

export type GameAction =
  | Readonly<{ type: "START" }>
  | Readonly<{ type: "PAUSE" }>
  | Readonly<{ type: "RESUME" }>
  | Readonly<{ type: "SET_SPEED"; speed: GameSpeed }>
  | Readonly<{ type: "START_NEXT_WAVE" }>
  | Readonly<{ type: "PLACE_HERO"; hero: Hero }>
  | Readonly<{ type: "CAST_SKILL"; heroId: EntityId; targetEnemyId: EntityId }>
  | Readonly<{ type: "SPAWN_ENEMY"; enemy: Enemy }>;

export type GameSnapshot = Readonly<{
  savedAtTick: number;
  state: GameState;
}>;
