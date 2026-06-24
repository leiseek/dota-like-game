import { normalizeSeed } from "./random.js";
import type { GameAction, GameSnapshot, GameState, HeroConfig, HeroLevel, LevelConfig } from "./types.js";

const DEFAULT_LEVEL_THRESHOLDS: readonly [number, number, number, number, number] = [0, 1, 3, 6, 10];

function getHeroConfig(level: LevelConfig, archetype: string): HeroConfig | undefined {
  return level.heroConfigs?.find((candidate) => candidate.archetype === archetype);
}

function getHeroLevel(experience: number, config?: HeroConfig): HeroLevel {
  const thresholds = config?.progression?.levelThresholds ?? DEFAULT_LEVEL_THRESHOLDS;
  if (experience >= thresholds[4]) return 5;
  if (experience >= thresholds[3]) return 4;
  if (experience >= thresholds[2]) return 3;
  if (experience >= thresholds[1]) return 2;
  return 1;
}

function getUnlockedPassiveIds(heroLevel: HeroLevel, config?: HeroConfig): readonly string[] {
  return config?.progression?.passives
    .filter((passive) => passive.level <= heroLevel)
    .map((passive) => passive.id) ?? [];
}

export function createInitialGameState(level: LevelConfig): GameState {
  const randomSeed = normalizeSeed(level.randomSeed);

  return {
    schemaVersion: 1,
    levelId: level.id,
    status: "ready",
    clock: {
      tick: 0,
      fixedDeltaMs: level.fixedDeltaMs,
      speed: 1,
      paused: true,
    },
    randomSeed,
    randomState: randomSeed,
    baseHealth: level.baseHealth,
    maxBaseHealth: level.baseHealth,
    resources: {
      gold: level.startingGold,
      manaCrystal: level.startingManaCrystal,
    },
    crystal: {
      atBase: true,
      status: "safe",
      stolenCount: 0,
      droppedCount: 0,
      recoveredCount: 0,
      escapedCount: 0,
    },
    settlement: {
      outcome: "pending",
      reason: "none",
      isComplete: false,
      stars: 0,
      remainingCrystals: level.baseHealth,
      maxCrystals: level.baseHealth,
      recoveredCrystals: 0,
      stolenCrystals: 0,
      escapedCrystals: 0,
    },
    heroes: level.startingHeroes.map((hero, index) => {
      const config = getHeroConfig(level, hero.archetype);
      const heroLevel = getHeroLevel(0, config);
      return {
        ...hero,
        id: `hero-${index + 1}`,
        cooldownTicksRemaining: 0,
        attackCooldownMs: 0,
        totalCost: 0,
        level: heroLevel,
        experience: 0,
        unlockedPassiveIds: getUnlockedPassiveIds(heroLevel, config),
        autoCastEnabled: false,
      };
    }),
    enemies: [],
    pendingActions: [],
    towerSlots: (level.towerSlots ?? []).map((slot) => ({
      id: slot.id,
      position: slot.position,
      unlocked: slot.initiallyUnlocked,
    })),
    obstacles: (level.obstacles ?? []).map((obstacle) => ({
      id: obstacle.id,
      position: obstacle.position,
      health: obstacle.maxHealth,
      maxHealth: obstacle.maxHealth,
      rewardGold: obstacle.rewardGold,
      ...(obstacle.unlocksSlotId ? { unlocksSlotId: obstacle.unlocksSlotId } : {}),
      destroyed: false,
    })),
    wave: {
      currentWaveIndex: 0,
      totalWaves: level.waves?.length ?? 0,
      waveElapsedMs: 0,
      activeGroupIndex: 0,
      spawnedCountInGroup: 0,
      nextSpawnElapsedMs: 0,
      isWaveActive: false,
      isWaitingNextWave: (level.waves?.length ?? 0) > 0,
      spawnedCountInWave: 0,
      killedCountInWave: 0,
      nextEnemySequence: 1,
    },
  };
}

export function enqueueAction(state: GameState, action: GameAction): GameState {
  return {
    ...state,
    pendingActions: [...state.pendingActions, action],
  };
}

export function createSnapshot(state: GameState): GameSnapshot {
  return {
    savedAtTick: state.clock.tick,
    state: structuredClone(state),
  };
}

export function restoreSnapshot(snapshot: GameSnapshot): GameState {
  const restored = structuredClone(snapshot.state);
  return {
    ...restored,
    status: restored.status === "won" || restored.status === "lost" ? restored.status : "paused",
    clock: { ...restored.clock, paused: restored.status !== "won" && restored.status !== "lost" },
    pendingActions: [],
  };
}
