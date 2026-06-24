export const HUD_SPEED_OPTIONS = [1, 2, 5, 10];
/**
 * Builds the platform-neutral battle HUD read model from authoritative GameState.
 * Platform adapters can render this object directly, but must still send user input
 * back into the core as GameAction values.
 */
export function selectHudState(state) {
    return {
        crystals: state.baseHealth,
        maxCrystals: state.maxBaseHealth,
        crystal: selectHudCrystalState(state),
        settlement: state.settlement,
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
function selectHudCrystalState(state) {
    const baseCrystal = {
        status: state.crystal.status,
        stolenCount: state.crystal.stolenCount,
        droppedCount: state.crystal.droppedCount,
        recoveredCount: state.crystal.recoveredCount,
        escapedCount: state.crystal.escapedCount,
    };
    return {
        ...baseCrystal,
        ...(state.crystal.carrierEnemyId ? { carrierEnemyId: state.crystal.carrierEnemyId } : {}),
        ...(state.crystal.lastCarrierEnemyId ? { lastCarrierEnemyId: state.crystal.lastCarrierEnemyId } : {}),
        ...(state.crystal.lastDroppedEnemyId ? { lastDroppedEnemyId: state.crystal.lastDroppedEnemyId } : {}),
        ...(state.crystal.lastEvent ? { lastEventType: state.crystal.lastEvent.type } : {}),
        ...(state.crystal.position ? { position: state.crystal.position } : {}),
        ...(state.crystal.pathIndex !== undefined ? { pathIndex: state.crystal.pathIndex } : {}),
        ...(state.crystal.progress !== undefined ? { progress: state.crystal.progress } : {}),
    };
}
