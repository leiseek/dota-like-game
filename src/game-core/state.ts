import { normalizeSeed } from "./random.js";
import type { GameAction, GameSnapshot, GameState, LevelConfig } from "./types.js";

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
    resources: {
      gold: level.startingGold,
      manaCrystal: level.startingManaCrystal,
    },
    crystal: { atBase: true },
    heroes: level.startingHeroes.map((hero, index) => ({
      ...hero,
      id: `hero-${index + 1}`,
      cooldownTicksRemaining: 0,
      attackCooldownMs: 0,
      totalCost: 0,
    })),
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
  return structuredClone(snapshot.state);
}
