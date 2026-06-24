import type { GameSpeed, GameState, HudState } from "./types.js";

export const HUD_SPEED_OPTIONS: readonly GameSpeed[] = [1, 2, 5, 10];

/**
 * Builds the platform-neutral battle HUD read model from authoritative GameState.
 * Platform adapters can render this object directly, but must still send user input
 * back into the core as GameAction values.
 */
export function selectHudState(state: GameState): HudState {
  return {
    crystals: state.baseHealth,
    maxCrystals: state.maxBaseHealth,
    gold: state.resources.gold,
    manaCrystal: state.resources.manaCrystal,
    wave: {
      currentWave: state.wave.totalWaves === 0 ? 0 : state.wave.currentWaveIndex + 1,
      totalWaves: state.wave.totalWaves,
      isWaveActive: state.wave.isWaveActive,
      isWaitingNextWave: state.wave.isWaitingNextWave,
      spawnedCountInWave: state.wave.spawnedCountInWave,
      killedCountInWave: state.wave.killedCountInWave,
    },
    status: state.status,
    isPaused: state.clock.paused,
    speed: state.clock.speed,
    speedOptions: HUD_SPEED_OPTIONS.map((speed) => ({ speed, isActive: speed === state.clock.speed })),
    canPause: state.status === "running" && !state.clock.paused,
    canResume: state.status === "paused" && state.clock.paused,
    canStartNextWave: state.status === "running" && state.wave.isWaitingNextWave && !state.wave.isWaveActive,
  };
}
