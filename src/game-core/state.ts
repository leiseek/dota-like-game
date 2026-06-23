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
    crystal: { atBase: true },
    heroes: level.startingHeroes.map((hero, index) => ({
      ...hero,
      id: `hero-${index + 1}`,
      cooldownTicksRemaining: 0,
    })),
    enemies: [],
    pendingActions: [],
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
