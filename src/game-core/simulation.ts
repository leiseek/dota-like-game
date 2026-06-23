import type { Enemy, GameAction, GameState, LevelConfig, WaveRuntimeState } from "./types.js";

const HERO_SKILL_DAMAGE = 25;
const HERO_SKILL_COOLDOWN_TICKS = 10;
const ENEMY_PROGRESS_PER_TICK = 0.05;

function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START":
      return state.status === "ready"
        ? { ...state, status: "running", clock: { ...state.clock, paused: false } }
        : state;
    case "PAUSE":
      return state.status === "running"
        ? { ...state, status: "paused", clock: { ...state.clock, paused: true } }
        : state;
    case "RESUME":
      return state.status === "paused"
        ? { ...state, status: "running", clock: { ...state.clock, paused: false } }
        : state;
    case "SET_SPEED":
      return { ...state, clock: { ...state.clock, speed: action.speed } };
    case "START_NEXT_WAVE":
      return startNextWave(state);
    case "PLACE_HERO":
      return { ...state, heroes: [...state.heroes, action.hero] };
    case "SPAWN_ENEMY":
      return { ...state, enemies: [...state.enemies, action.enemy] };
    case "CAST_SKILL":
      return castSkill(state, action.heroId, action.targetEnemyId);
  }
}

function castSkill(state: GameState, heroId: string, targetEnemyId: string): GameState {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  if (!hero || hero.cooldownTicksRemaining > 0) return state;

  const damagedEnemies = state.enemies.map((enemy) =>
    enemy.id === targetEnemyId ? { ...enemy, health: enemy.health - HERO_SKILL_DAMAGE } : enemy,
  );
  const enemies = damagedEnemies.filter((enemy) => enemy.health > 0);
  const killedTarget = damagedEnemies.some((enemy) => enemy.id === targetEnemyId && enemy.health <= 0);
  const killedCarrier = damagedEnemies.some(
    (enemy) => enemy.id === targetEnemyId && enemy.health <= 0 && enemy.carryingCrystal,
  );

  return {
    ...state,
    crystal: killedCarrier ? { atBase: true } : state.crystal,
    heroes: state.heroes.map((candidate) =>
      candidate.id === heroId ? { ...candidate, cooldownTicksRemaining: HERO_SKILL_COOLDOWN_TICKS } : candidate,
    ),
    enemies,
    wave: killedTarget && state.wave.isWaveActive
      ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + 1 }
      : state.wave,
  };
}

function advanceEnemy(enemy: Enemy): Enemy {
  return {
    ...enemy,
    progress: enemy.progress + (enemy.carryingCrystal ? -ENEMY_PROGRESS_PER_TICK : ENEMY_PROGRESS_PER_TICK),
  };
}

function resolveCrystalAndBase(state: GameState, advancedEnemies: readonly Enemy[]): Pick<GameState, "baseHealth" | "crystal" | "enemies" | "status"> {
  let baseHealth = state.baseHealth;
  let crystal = state.crystal;
  let status = state.status;
  const enemies: Enemy[] = [];

  for (const enemy of advancedEnemies) {
    if (enemy.carryingCrystal && enemy.progress <= 0) {
      status = "lost";
      crystal = { atBase: false, carrierEnemyId: enemy.id };
      enemies.push({ ...enemy, progress: 0 });
      continue;
    }

    if (!enemy.carryingCrystal && enemy.progress >= 1) {
      if (crystal.atBase) {
        const carrier = { ...enemy, progress: 1, carryingCrystal: true };
        crystal = { atBase: false, carrierEnemyId: carrier.id };
        enemies.push(carrier);
      } else {
        baseHealth = Math.max(0, baseHealth - 1);
      }
      continue;
    }

    enemies.push(enemy);
  }

  if (baseHealth === 0) status = "lost";

  return { baseHealth, crystal, enemies, status };
}

function startNextWave(state: GameState): GameState {
  if (state.wave.totalWaves === 0 || state.wave.isWaveActive) return state;
  return activateCurrentWave(state);
}

function activateCurrentWave(state: GameState): GameState {
  return {
    ...state,
    wave: {
      ...state.wave,
      waveElapsedMs: 0,
      activeGroupIndex: 0,
      spawnedCountInGroup: 0,
      nextSpawnElapsedMs: 0,
      isWaveActive: true,
      isWaitingNextWave: false,
      spawnedCountInWave: 0,
      killedCountInWave: 0,
    },
  };
}

function createEnemyFromConfig(level: LevelConfig, archetype: string, sequence: number): Enemy {
  const config = level.enemies?.find((candidate) => candidate.archetype === archetype);
  return {
    id: `enemy-${sequence}`,
    archetype,
    pathIndex: 0,
    progress: 0,
    health: config?.maxHealth ?? 50,
    maxHealth: config?.maxHealth ?? 50,
    carryingCrystal: false,
  };
}

function shouldAutoStartWave(state: GameState, level: LevelConfig): boolean {
  if (!state.wave.isWaitingNextWave || state.wave.isWaveActive) return false;
  const waveConfig = level.waves?.[state.wave.currentWaveIndex];
  if (!waveConfig) return false;
  return state.clock.tick * state.clock.fixedDeltaMs >= waveConfig.startsAtMs;
}

function prepareWaveForTick(state: GameState, level?: LevelConfig): GameState {
  if (!level?.waves?.length || !shouldAutoStartWave(state, level)) return state;
  return activateCurrentWave(state);
}

function advanceWave(state: GameState, level?: LevelConfig): Pick<GameState, "enemies" | "wave"> {
  const preparedState = prepareWaveForTick(state, level);
  if (!level?.waves?.length || !preparedState.wave.isWaveActive) {
    return { enemies: preparedState.enemies, wave: preparedState.wave };
  }

  const waveConfig = level.waves[preparedState.wave.currentWaveIndex];
  if (!waveConfig) return { enemies: state.enemies, wave: state.wave };

  let wave: WaveRuntimeState = {
    ...preparedState.wave,
    waveElapsedMs: preparedState.wave.waveElapsedMs + preparedState.clock.fixedDeltaMs,
  };
  const enemies = [...preparedState.enemies];

  while (wave.activeGroupIndex < waveConfig.spawnGroups.length) {
    const group = waveConfig.spawnGroups[wave.activeGroupIndex];
    if (!group || wave.spawnedCountInGroup >= group.count) {
      wave = { ...wave, activeGroupIndex: wave.activeGroupIndex + 1, spawnedCountInGroup: 0, nextSpawnElapsedMs: 0 };
      continue;
    }

    if (wave.waveElapsedMs < wave.nextSpawnElapsedMs) break;

    enemies.push(createEnemyFromConfig(level, group.enemyArchetype, wave.nextEnemySequence));
    wave = {
      ...wave,
      spawnedCountInGroup: wave.spawnedCountInGroup + 1,
      spawnedCountInWave: wave.spawnedCountInWave + 1,
      nextEnemySequence: wave.nextEnemySequence + 1,
      nextSpawnElapsedMs: wave.nextSpawnElapsedMs + group.intervalMs,
    };
  }

  const allGroupsSpawned = wave.activeGroupIndex >= waveConfig.spawnGroups.length;
  if (allGroupsSpawned && enemies.length === 0) {
    const nextWaveIndex = wave.currentWaveIndex + 1;
    wave = {
      ...wave,
      currentWaveIndex: Math.min(nextWaveIndex, wave.totalWaves - 1),
      waveElapsedMs: 0,
      activeGroupIndex: 0,
      spawnedCountInGroup: 0,
      nextSpawnElapsedMs: 0,
      isWaveActive: false,
      isWaitingNextWave: nextWaveIndex < wave.totalWaves,
    };
  }

  return { enemies, wave };
}

function advanceRunningTick(state: GameState, level?: LevelConfig): GameState {
  const preparedState = prepareWaveForTick(state, level);
  const waveAdvanced = advanceWave(preparedState, level);
  const resolved = resolveCrystalAndBase({ ...preparedState, enemies: waveAdvanced.enemies }, waveAdvanced.enemies.map(advanceEnemy));

  const completedAllWaves =
    waveAdvanced.wave.totalWaves > 0 &&
    !waveAdvanced.wave.isWaveActive &&
    !waveAdvanced.wave.isWaitingNextWave &&
    resolved.enemies.length === 0;

  return {
    ...preparedState,
    ...resolved,
    status: completedAllWaves && resolved.status === "running" ? "won" : resolved.status,
    wave: waveAdvanced.wave,
    clock: { ...state.clock, tick: state.clock.tick + 1 },
    heroes: state.heroes.map((hero) => ({
      ...hero,
      cooldownTicksRemaining: Math.max(0, hero.cooldownTicksRemaining - 1),
    })),
  };
}

export function reduceActions(state: GameState): GameState {
  const reduced = state.pendingActions.reduce(applyAction, state);
  return { ...reduced, pendingActions: [] };
}

export function stepFixedTick(state: GameState, level?: LevelConfig): GameState {
  const reduced = reduceActions(state);
  if (reduced.clock.paused || reduced.status !== "running") return reduced;
  return advanceRunningTick(reduced, level);
}

export function stepSimulation(state: GameState, fixedTicks = 1, level?: LevelConfig): GameState {
  let nextState = reduceActions(state);
  const ticksToRun = Math.max(0, Math.trunc(fixedTicks)) * nextState.clock.speed;

  for (let index = 0; index < ticksToRun; index += 1) {
    if (nextState.clock.paused || nextState.status !== "running") return nextState;
    nextState = advanceRunningTick(nextState, level);
  }

  return nextState;
}
