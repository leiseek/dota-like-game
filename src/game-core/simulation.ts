import type { Enemy, GameAction, GameState, Hero, LevelConfig, WaveRuntimeState } from "./types.js";

const DEFAULT_HERO_SKILL_DAMAGE = 25;
const DEFAULT_HERO_SKILL_COOLDOWN_TICKS = 10;
const DEFAULT_HERO_SKILL_MANA_COST = 0;
const DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND = 75;

function applyAction(state: GameState, action: GameAction, level?: LevelConfig): GameState {
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
    case "BUILD_HERO":
      return buildHero(state, action.slotId, action.heroArchetype, level);
    case "PLACE_HERO":
      return { ...state, heroes: [...state.heroes, action.hero] };
    case "SPAWN_ENEMY":
      return { ...state, enemies: [...state.enemies, action.enemy] };
    case "CAST_SKILL":
      return castSkill(state, action.heroId, action.targetEnemyId, level);
  }
}


function buildHero(state: GameState, slotId: string, heroArchetype: string, level?: LevelConfig): GameState {
  const slot = state.towerSlots.find((candidate) => candidate.id === slotId);
  const config = level?.heroConfigs?.find((candidate) => candidate.archetype === heroArchetype);

  if (!slot || !config || !slot.unlocked || slot.occupiedByHeroId || state.resources.gold < config.buildCost) {
    return state;
  }

  const hero: Hero = {
    id: `hero-${state.heroes.length + 1}`,
    archetype: heroArchetype,
    position: slot.position,
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    cooldownTicksRemaining: 0,
    attackCooldownMs: 0,
    slotId: slot.id,
    totalCost: config.buildCost,
  };

  return {
    ...state,
    resources: {
      ...state.resources,
      gold: state.resources.gold - config.buildCost,
    },
    heroes: [...state.heroes, hero],
    towerSlots: state.towerSlots.map((candidate) =>
      candidate.id === slot.id ? { ...candidate, occupiedByHeroId: hero.id } : candidate,
    ),
  };
}

function getSkillCooldownTicks(level: LevelConfig | undefined, hero: Hero, fixedDeltaMs: number): number {
  const config = getHeroConfig(level, hero);
  if (!config?.skillCooldownMs) return DEFAULT_HERO_SKILL_COOLDOWN_TICKS;
  return Math.max(1, Math.ceil(config.skillCooldownMs / fixedDeltaMs));
}

function getSkillManaCost(level: LevelConfig | undefined, hero: Hero): number {
  return getHeroConfig(level, hero)?.skillManaCost ?? DEFAULT_HERO_SKILL_MANA_COST;
}

function getSkillDamage(level: LevelConfig | undefined, hero: Hero): number {
  return getHeroConfig(level, hero)?.skillDamage ?? DEFAULT_HERO_SKILL_DAMAGE;
}

function castSkill(state: GameState, heroId: string, targetEnemyId: string, level?: LevelConfig): GameState {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  const target = state.enemies.find((candidate) => candidate.id === targetEnemyId);
  if (!hero || !target || hero.cooldownTicksRemaining > 0) return state;

  const manaCost = getSkillManaCost(level, hero);
  if (state.resources.manaCrystal < manaCost) return state;

  const skillDamage = getSkillDamage(level, hero);
  const damagedEnemies = state.enemies.map((enemy) =>
    enemy.id === targetEnemyId ? { ...enemy, health: enemy.health - skillDamage } : enemy,
  );
  const killedEnemies = damagedEnemies.filter((enemy) => enemy.health <= 0);
  const enemies = damagedEnemies.filter((enemy) => enemy.health > 0);
  const killedTarget = killedEnemies.some((enemy) => enemy.id === targetEnemyId);
  const killedCarrier = killedEnemies.some((enemy) => enemy.id === targetEnemyId && enemy.carryingCrystal);
  const rewardGold = killedEnemies.reduce((sum, enemy) => sum + getEnemyRewardGold(level, enemy), 0);

  return {
    ...state,
    crystal: killedCarrier ? { atBase: true } : state.crystal,
    resources: {
      ...state.resources,
      gold: state.resources.gold + rewardGold,
      manaCrystal: state.resources.manaCrystal - manaCost,
    },
    heroes: state.heroes.map((candidate) =>
      candidate.id === heroId
        ? { ...candidate, cooldownTicksRemaining: getSkillCooldownTicks(level, candidate, state.clock.fixedDeltaMs) }
        : candidate,
    ),
    enemies,
    wave: killedTarget && state.wave.isWaveActive
      ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + 1 }
      : state.wave,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function interpolate(a: { x: number; y: number }, b: { x: number; y: number }, progress: number): { x: number; y: number } {
  return {
    x: a.x + (b.x - a.x) * progress,
    y: a.y + (b.y - a.y) * progress,
  };
}

function getEnemySpeed(level: LevelConfig | undefined, enemy: Enemy): number {
  return (
    level?.enemies?.find((candidate) => candidate.archetype === enemy.archetype)?.speedUnitsPerSecond ??
    DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND
  );
}

function advanceEnemyAlongPath(enemy: Enemy, level?: LevelConfig): Enemy {
  const path = level?.path;
  if (!path || path.length < 2) {
    return {
      ...enemy,
      progress: Math.max(0, Math.min(1, enemy.progress + (enemy.carryingCrystal ? -0.05 : 0.05))),
    };
  }

  const lastSegmentIndex = path.length - 2;
  let pathIndex = Math.max(0, Math.min(enemy.pathIndex, lastSegmentIndex));
  let progress = Math.max(0, Math.min(enemy.progress, 1));
  let remainingDistance = getEnemySpeed(level, enemy) * (level.fixedDeltaMs / 1000);
  const direction = enemy.carryingCrystal ? -1 : 1;

  while (remainingDistance > 0) {
    const segmentStart = path[pathIndex];
    const segmentEnd = path[pathIndex + 1];
    if (!segmentStart || !segmentEnd) break;

    const segmentLength = distance(segmentStart, segmentEnd);
    if (segmentLength === 0) {
      if (direction > 0 && pathIndex < lastSegmentIndex) pathIndex += 1;
      else if (direction < 0 && pathIndex > 0) pathIndex -= 1;
      else break;
      continue;
    }

    const distanceToSegmentEnd = direction > 0 ? (1 - progress) * segmentLength : progress * segmentLength;
    if (remainingDistance < distanceToSegmentEnd) {
      progress += direction * (remainingDistance / segmentLength);
      remainingDistance = 0;
      break;
    }

    remainingDistance -= distanceToSegmentEnd;
    if (direction > 0) {
      if (pathIndex >= lastSegmentIndex) {
        progress = 1;
        break;
      }
      pathIndex += 1;
      progress = 0;
    } else {
      if (pathIndex <= 0) {
        progress = 0;
        break;
      }
      pathIndex -= 1;
      progress = 1;
    }
  }

  const segmentStart = path[pathIndex] ?? path[0]!;
  const segmentEnd = path[pathIndex + 1] ?? path[path.length - 1]!;
  const position = interpolate(segmentStart, segmentEnd, progress);
  return { ...enemy, pathIndex, progress, position };
}


function getHeroConfig(level: LevelConfig | undefined, hero: Hero) {
  return level?.heroConfigs?.find((candidate) => candidate.archetype === hero.archetype);
}

function getEnemyRewardGold(level: LevelConfig | undefined, enemy: Enemy): number {
  return level?.enemies?.find((candidate) => candidate.archetype === enemy.archetype)?.rewardGold ?? 0;
}

function enemyPathScore(enemy: Enemy): number {
  return enemy.pathIndex + enemy.progress;
}

function selectTarget(hero: Hero, enemies: readonly Enemy[], level?: LevelConfig): Enemy | undefined {
  const config = getHeroConfig(level, hero);
  if (!config) return undefined;

  return enemies
    .filter((enemy) => distance(hero.position, enemy.position) <= config.attackRange)
    .sort((a, b) => enemyPathScore(b) - enemyPathScore(a))[0];
}

function applyTowerCombat(state: GameState, level?: LevelConfig): GameState {
  let enemies = [...state.enemies];
  let rewardGold = 0;
  let killedCount = 0;
  let recoveredCrystal = false;

  const heroes = state.heroes.map((hero) => {
    const config = getHeroConfig(level, hero);
    if (!config) {
      return { ...hero, attackCooldownMs: Math.max(0, hero.attackCooldownMs - state.clock.fixedDeltaMs) };
    }

    const cooledHero = { ...hero, attackCooldownMs: Math.max(0, hero.attackCooldownMs - state.clock.fixedDeltaMs) };
    if (cooledHero.attackCooldownMs > 0) return cooledHero;

    const target = selectTarget(cooledHero, enemies, level);
    if (!target) {
      const { targetEnemyId: _targetEnemyId, ...untargetedHero } = cooledHero;
      return untargetedHero;
    }

    let killedEnemy: Enemy | undefined;
    enemies = enemies
      .map((enemy) => {
        if (enemy.id !== target.id) return enemy;
        const damaged = { ...enemy, health: enemy.health - config.attackDamage };
        if (damaged.health <= 0) killedEnemy = damaged;
        return damaged;
      })
      .filter((enemy) => enemy.health > 0);

    if (killedEnemy) {
      rewardGold += getEnemyRewardGold(level, killedEnemy);
      killedCount += 1;
      recoveredCrystal = recoveredCrystal || killedEnemy.carryingCrystal;
    }

    return { ...cooledHero, attackCooldownMs: config.attackIntervalMs, targetEnemyId: target.id };
  });

  return {
    ...state,
    heroes,
    enemies,
    resources: {
      ...state.resources,
      gold: state.resources.gold + rewardGold,
    },
    crystal: recoveredCrystal ? { atBase: true } : state.crystal,
    wave: killedCount > 0 && state.wave.isWaveActive
      ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + killedCount }
      : state.wave,
  };
}

function resolveCrystalAndBase(state: GameState, advancedEnemies: readonly Enemy[], level?: LevelConfig): Pick<GameState, "baseHealth" | "crystal" | "enemies" | "status"> {
  let baseHealth = state.baseHealth;
  let crystal = state.crystal;
  let status = state.status;
  const enemies: Enemy[] = [];

  for (const enemy of advancedEnemies) {
    if (enemy.carryingCrystal && enemy.pathIndex === 0 && enemy.progress <= 0) {
      status = "lost";
      crystal = { atBase: false, carrierEnemyId: enemy.id };
      enemies.push({ ...enemy, progress: 0 });
      continue;
    }

    const lastPathSegmentIndex = level?.path ? Math.max(0, level.path.length - 2) : 0;

    if (!enemy.carryingCrystal && enemy.progress >= 1 && enemy.pathIndex === lastPathSegmentIndex) {
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
    position: level.path[0] ?? { x: 0, y: 0 },
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
  const movedState = {
    ...preparedState,
    enemies: waveAdvanced.enemies.map((enemy) => advanceEnemyAlongPath(enemy, level)),
    wave: waveAdvanced.wave,
  };
  const combatState = applyTowerCombat(movedState, level);
  const resolved = resolveCrystalAndBase(combatState, combatState.enemies, level);

  const completedAllWaves =
    waveAdvanced.wave.totalWaves > 0 &&
    !waveAdvanced.wave.isWaveActive &&
    !waveAdvanced.wave.isWaitingNextWave &&
    resolved.enemies.length === 0;

  return {
    ...preparedState,
    ...resolved,
    status: completedAllWaves && resolved.status === "running" ? "won" : resolved.status,
    resources: combatState.resources,
    wave: combatState.wave,
    clock: { ...state.clock, tick: state.clock.tick + 1 },
    heroes: combatState.heroes.map((hero) => ({
      ...hero,
      cooldownTicksRemaining: Math.max(0, hero.cooldownTicksRemaining - 1),
    })),
  };
}

export function reduceActions(state: GameState, level?: LevelConfig): GameState {
  const reduced = state.pendingActions.reduce((nextState, action) => applyAction(nextState, action, level), state);
  return { ...reduced, pendingActions: [] };
}

export function stepFixedTick(state: GameState, level?: LevelConfig): GameState {
  const reduced = reduceActions(state, level);
  if (reduced.clock.paused || reduced.status !== "running") return reduced;
  return advanceRunningTick(reduced, level);
}

export function stepSimulation(state: GameState, fixedTicks = 1, level?: LevelConfig): GameState {
  let nextState = reduceActions(state, level);
  const ticksToRun = Math.max(0, Math.trunc(fixedTicks)) * nextState.clock.speed;

  for (let index = 0; index < ticksToRun; index += 1) {
    if (nextState.clock.paused || nextState.status !== "running") return nextState;
    nextState = advanceRunningTick(nextState, level);
  }

  return nextState;
}
