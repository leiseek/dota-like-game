import type {
  CrystalState,
  Enemy,
  GameAction,
  GameState,
  Hero,
  HeroConfig,
  LevelConfig,
  SettlementReason,
  SettlementState,
  StarRating,
  StatusEffectState,
  Vector2,
  WaveRuntimeState,
} from "./types.js";

const DEFAULT_HERO_SKILL_DAMAGE = 25;
const DEFAULT_HERO_SKILL_COOLDOWN_TICKS = 10;
const DEFAULT_HERO_SKILL_MANA_COST = 0;
const DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND = 75;
const DEFAULT_CRYSTAL_RETURN_SPEED_MULTIPLIER = 0.5;
const CRYSTAL_PICKUP_RADIUS = 18;
const DEFAULT_HOOK_PULL_DISTANCE = 160;
const DEFAULT_FROST_RADIUS = 90;
const DEFAULT_FROST_SLOW_MS = 4_000;
const DEFAULT_FROST_SLOW_MULTIPLIER = 0.35;
const DEFAULT_STORM_JUMP_COUNT = 4;
const DEFAULT_STORM_JUMP_RADIUS = 120;
const DEFAULT_STORM_JUMP_DECAY = 0.85;
const DEFAULT_STORM_BONUS_JUMPS_VS_STATUS = 2;
const DEFAULT_MOONBLADE_BOUNCE_COUNT = 2;
const DEFAULT_MOONBLADE_BOUNCE_DECAY = 0.75;
const DEFAULT_MOONBLADE_BONUS_DAMAGE_VS_STATUS = 1.2;

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
  if (config?.skillCooldownMs === undefined) return DEFAULT_HERO_SKILL_COOLDOWN_TICKS;
  return Math.max(1, Math.ceil(config.skillCooldownMs / fixedDeltaMs));
}

function getSkillManaCost(level: LevelConfig | undefined, hero: Hero): number {
  return getHeroConfig(level, hero)?.skillManaCost ?? DEFAULT_HERO_SKILL_MANA_COST;
}

function getSkillDamage(level: LevelConfig | undefined, hero: Hero): number {
  return getHeroConfig(level, hero)?.skillDamage ?? DEFAULT_HERO_SKILL_DAMAGE;
}

type PendingEnemyMutation = {
  damage: number;
  pullDistance: number;
  statusEffects: StatusEffectState[];
};

type SkillApplicationResult = Readonly<{
  enemies: readonly Enemy[];
  killedEnemies: readonly Enemy[];
}>;

function castSkill(state: GameState, heroId: string, targetEnemyId: string, level?: LevelConfig): GameState {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  const target = state.enemies.find((candidate) => candidate.id === targetEnemyId);
  if (!hero || !target || hero.cooldownTicksRemaining > 0) return state;

  const manaCost = getSkillManaCost(level, hero);
  if (state.resources.manaCrystal < manaCost) return state;

  const result = applySkillEffect(state.enemies, hero, target, level);
  const killedCarrier = result.killedEnemies.find((enemy) => enemy.carryingCrystal);
  const rewardGold = result.killedEnemies.reduce((sum, enemy) => sum + getEnemyRewardGold(level, enemy), 0);

  return syncSettlementState({
    ...state,
    crystal: killedCarrier ? dropCrystal(state.crystal, killedCarrier, state.clock.tick, level) : state.crystal,
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
    enemies: result.enemies,
    wave: result.killedEnemies.length > 0 && state.wave.isWaveActive
      ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + result.killedEnemies.length }
      : state.wave,
  });
}

function applySkillEffect(enemies: readonly Enemy[], hero: Hero, target: Enemy, level?: LevelConfig): SkillApplicationResult {
  const config = getHeroConfig(level, hero);
  if (!config) return applyDirectDamageSkill(enemies, hero, target, level);

  switch (config.skillKind ?? "direct-damage") {
    case "hook":
      return applyHookSkill(enemies, hero, target, level, config);
    case "frost":
      return applyFrostSkill(enemies, hero, target, level, config);
    case "storm-chain":
      return applyStormChainSkill(enemies, hero, target, level, config);
    case "moonblade":
      return applyMoonbladeSkill(enemies, hero, target, level, config);
    case "direct-damage":
      return applyDirectDamageSkill(enemies, hero, target, level);
  }
}

function applyDirectDamageSkill(enemies: readonly Enemy[], hero: Hero, target: Enemy, level?: LevelConfig): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  addDamage(mutations, target.id, getSkillDamage(level, hero));
  return applyEnemyMutations(enemies, mutations, level);
}

function applyHookSkill(
  enemies: readonly Enemy[],
  hero: Hero,
  target: Enemy,
  level: LevelConfig | undefined,
  config: HeroConfig,
): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  addDamage(mutations, target.id, getSkillDamage(level, hero));
  addPull(mutations, target.id, config.skillPullDistance ?? DEFAULT_HOOK_PULL_DISTANCE);
  if (target.carryingCrystal) {
    addStatusEffect(mutations, target.id, {
      type: "stun",
      remainingTicks: msToTicks(config.skillStunMs ?? 1_000, level),
      speedMultiplier: 0,
      sourceHeroId: hero.id,
    });
  }
  return applyEnemyMutations(enemies, mutations, level);
}

function applyFrostSkill(
  enemies: readonly Enemy[],
  hero: Hero,
  target: Enemy,
  level: LevelConfig | undefined,
  config: HeroConfig,
): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  const radius = config.skillRadius ?? DEFAULT_FROST_RADIUS;
  const slowTicks = msToTicks(config.skillSlowMs ?? DEFAULT_FROST_SLOW_MS, level);

  for (const enemy of enemies) {
    if (distance(enemy.position, target.position) > radius) continue;
    addDamage(mutations, enemy.id, getSkillDamage(level, hero));
    addStatusEffect(mutations, enemy.id, {
      type: "slow",
      remainingTicks: slowTicks,
      speedMultiplier: enemy.carryingCrystal
        ? Math.max(0.1, (config.skillSlowMultiplier ?? DEFAULT_FROST_SLOW_MULTIPLIER) - 0.15)
        : config.skillSlowMultiplier ?? DEFAULT_FROST_SLOW_MULTIPLIER,
      sourceHeroId: hero.id,
    });
  }

  return applyEnemyMutations(enemies, mutations, level);
}

function applyStormChainSkill(
  enemies: readonly Enemy[],
  hero: Hero,
  target: Enemy,
  level: LevelConfig | undefined,
  config: HeroConfig,
): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  const baseJumps = config.skillJumpCount ?? DEFAULT_STORM_JUMP_COUNT;
  const bonusJumps = hasControlStatus(target) ? config.skillBonusJumpsVsStatus ?? DEFAULT_STORM_BONUS_JUMPS_VS_STATUS : 0;
  const maxHits = 1 + baseJumps + bonusJumps;
  const chainTargets = selectChainTargets(enemies, target, maxHits, config.skillJumpRadius ?? DEFAULT_STORM_JUMP_RADIUS);
  const decay = config.skillJumpDecay ?? DEFAULT_STORM_JUMP_DECAY;
  const baseDamage = getSkillDamage(level, hero);

  chainTargets.forEach((enemy, index) => {
    addDamage(mutations, enemy.id, Math.round(baseDamage * Math.pow(decay, index)));
  });

  return applyEnemyMutations(enemies, mutations, level);
}

function applyMoonbladeSkill(
  enemies: readonly Enemy[],
  hero: Hero,
  target: Enemy,
  level: LevelConfig | undefined,
  config: HeroConfig,
): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  const maxHits = 1 + (config.skillBounceCount ?? DEFAULT_MOONBLADE_BOUNCE_COUNT);
  const bounceTargets = selectChainTargets(enemies, target, maxHits, config.skillJumpRadius ?? DEFAULT_STORM_JUMP_RADIUS);
  const decay = config.skillBounceDecay ?? DEFAULT_MOONBLADE_BOUNCE_DECAY;
  const baseDamage = getSkillDamage(level, hero);
  const bonusMultiplier = config.skillBonusDamageVsStatusMultiplier ?? DEFAULT_MOONBLADE_BONUS_DAMAGE_VS_STATUS;

  bounceTargets.forEach((enemy, index) => {
    const statusBonus = hasControlStatus(enemy) ? bonusMultiplier : 1;
    addDamage(mutations, enemy.id, Math.round(baseDamage * Math.pow(decay, index) * statusBonus));
  });

  return applyEnemyMutations(enemies, mutations, level);
}

function selectChainTargets(enemies: readonly Enemy[], firstTarget: Enemy, maxHits: number, radius: number): readonly Enemy[] {
  const selected: Enemy[] = [firstTarget];
  let current = firstTarget;

  while (selected.length < maxHits) {
    const next = enemies
      .filter((enemy) => enemy.health > 0 && !selected.some((selectedEnemy) => selectedEnemy.id === enemy.id))
      .filter((enemy) => distance(enemy.position, current.position) <= radius)
      .sort((a, b) => distance(a.position, current.position) - distance(b.position, current.position))[0];

    if (!next) break;
    selected.push(next);
    current = next;
  }

  return selected;
}

function getMutation(mutations: Map<string, PendingEnemyMutation>, enemyId: string): PendingEnemyMutation {
  const existing = mutations.get(enemyId);
  if (existing) return existing;

  const created: PendingEnemyMutation = { damage: 0, pullDistance: 0, statusEffects: [] };
  mutations.set(enemyId, created);
  return created;
}

function addDamage(mutations: Map<string, PendingEnemyMutation>, enemyId: string, damage: number): void {
  getMutation(mutations, enemyId).damage += damage;
}

function addPull(mutations: Map<string, PendingEnemyMutation>, enemyId: string, pullDistance: number): void {
  getMutation(mutations, enemyId).pullDistance += pullDistance;
}

function addStatusEffect(mutations: Map<string, PendingEnemyMutation>, enemyId: string, statusEffect: StatusEffectState): void {
  getMutation(mutations, enemyId).statusEffects.push(statusEffect);
}

function applyEnemyMutations(
  enemies: readonly Enemy[],
  mutations: Map<string, PendingEnemyMutation>,
  level?: LevelConfig,
): SkillApplicationResult {
  const mutatedEnemies = enemies.map((enemy) => {
    const mutation = mutations.get(enemy.id);
    if (!mutation) return enemy;

    let nextEnemy: Enemy = mutation.damage > 0 ? { ...enemy, health: enemy.health - mutation.damage } : enemy;
    if (nextEnemy.health > 0 && mutation.statusEffects.length > 0) {
      nextEnemy = withAddedStatusEffects(nextEnemy, mutation.statusEffects);
    }
    if (nextEnemy.health > 0 && mutation.pullDistance > 0 && level) {
      nextEnemy = moveEnemyAlongPath(nextEnemy, level, mutation.pullDistance, -1);
    }
    return nextEnemy;
  });

  return {
    enemies: mutatedEnemies.filter((enemy) => enemy.health > 0),
    killedEnemies: mutatedEnemies.filter((enemy) => enemy.health <= 0),
  };
}

function withAddedStatusEffects(enemy: Enemy, statusEffects: readonly StatusEffectState[]): Enemy {
  return {
    ...enemy,
    statusEffects: [...(enemy.statusEffects ?? []), ...statusEffects].filter((statusEffect) => statusEffect.remainingTicks > 0),
  };
}

function decayStatusEffects(enemy: Enemy): Enemy {
  if (!enemy.statusEffects?.length) return enemy;

  const statusEffects = enemy.statusEffects
    .map((statusEffect) => ({ ...statusEffect, remainingTicks: statusEffect.remainingTicks - 1 }))
    .filter((statusEffect) => statusEffect.remainingTicks > 0);

  if (statusEffects.length === 0) {
    const { statusEffects: _statusEffects, ...enemyWithoutStatusEffects } = enemy;
    return enemyWithoutStatusEffects;
  }

  return { ...enemy, statusEffects };
}

function msToTicks(durationMs: number, level?: LevelConfig): number {
  return Math.max(1, Math.ceil(durationMs / (level?.fixedDeltaMs ?? 100)));
}

function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function interpolate(a: Vector2, b: Vector2, progress: number): Vector2 {
  return {
    x: a.x + (b.x - a.x) * progress,
    y: a.y + (b.y - a.y) * progress,
  };
}

function getEnemyBaseSpeed(level: LevelConfig | undefined, enemy: Pick<Enemy, "archetype">): number {
  return level?.enemies?.find((candidate) => candidate.archetype === enemy.archetype)?.speedUnitsPerSecond ??
    DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND;
}

function getEnemySpeed(level: LevelConfig | undefined, enemy: Enemy): number {
  return getEnemyBaseSpeed(level, enemy) * getStatusSpeedMultiplier(enemy);
}

function getStatusSpeedMultiplier(enemy: Enemy): number {
  const activeStatusEffects = enemy.statusEffects?.filter((statusEffect) => statusEffect.remainingTicks > 0) ?? [];
  if (activeStatusEffects.some((statusEffect) => statusEffect.type === "stun")) return 0;

  const slowMultipliers = activeStatusEffects
    .filter((statusEffect) => statusEffect.type === "slow")
    .map((statusEffect) => statusEffect.speedMultiplier ?? 1);

  return slowMultipliers.length > 0 ? Math.min(...slowMultipliers) : 1;
}

function hasControlStatus(enemy: Enemy): boolean {
  return Boolean(
    enemy.statusEffects?.some(
      (statusEffect) =>
        statusEffect.remainingTicks > 0 && (statusEffect.type === "slow" || statusEffect.type === "stun"),
    ),
  );
}

function advanceEnemyAlongPath(enemy: Enemy, level?: LevelConfig): Enemy {
  const direction = enemy.carryingCrystal ? -1 : 1;
  if (!level || level.path.length < 2) {
    return {
      ...enemy,
      progress: Math.max(0, Math.min(1, enemy.progress + direction * 0.05 * getStatusSpeedMultiplier(enemy))),
    };
  }

  const remainingDistance = getEnemySpeed(level, enemy) * (level.fixedDeltaMs / 1000);
  return moveEnemyAlongPath(enemy, level, remainingDistance, direction);
}

function moveEnemyAlongPath(enemy: Enemy, level: LevelConfig, distanceToMove: number, direction: 1 | -1): Enemy {
  const moved = movePathPosition(
    { pathIndex: enemy.pathIndex, progress: enemy.progress, position: enemy.position },
    level,
    distanceToMove,
    direction,
  );
  return { ...enemy, ...moved };
}

function moveCrystalAlongPath(crystal: CrystalState, level: LevelConfig, distanceToMove: number, direction: 1 | -1): CrystalState {
  if (crystal.pathIndex === undefined || crystal.progress === undefined || !crystal.position) return crystal;
  const moved = movePathPosition(
    { pathIndex: crystal.pathIndex, progress: crystal.progress, position: crystal.position },
    level,
    distanceToMove,
    direction,
  );
  return { ...crystal, ...moved };
}

type PathPosition = Readonly<{
  pathIndex: number;
  progress: number;
  position: Vector2;
}>;

function movePathPosition(position: PathPosition, level: LevelConfig, distanceToMove: number, direction: 1 | -1): PathPosition {
  const path = level.path;
  if (path.length < 2 || distanceToMove <= 0) return position;

  const lastSegmentIndex = path.length - 2;
  let pathIndex = Math.max(0, Math.min(position.pathIndex, lastSegmentIndex));
  let progress = Math.max(0, Math.min(position.progress, 1));
  let remainingDistance = distanceToMove;

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
  return { pathIndex, progress, position: interpolate(segmentStart, segmentEnd, progress) };
}

function getHeroConfig(level: LevelConfig | undefined, hero: Hero): HeroConfig | undefined {
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
  let killedCarrier: Enemy | undefined;

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
      if (killedEnemy.carryingCrystal) killedCarrier = killedEnemy;
    }

    return { ...cooledHero, attackCooldownMs: config.attackIntervalMs, targetEnemyId: target.id };
  });

  return syncSettlementState({
    ...state,
    heroes,
    enemies,
    resources: {
      ...state.resources,
      gold: state.resources.gold + rewardGold,
    },
    crystal: killedCarrier ? dropCrystal(state.crystal, killedCarrier, state.clock.tick, level) : state.crystal,
    wave: killedCount > 0 && state.wave.isWaveActive
      ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + killedCount }
      : state.wave,
  });
}

function stealCrystal(crystal: CrystalState, enemyId: string, tick: number): CrystalState {
  const {
    position: _position,
    pathIndex: _pathIndex,
    progress: _progress,
    returnSpeedUnitsPerSecond: _returnSpeedUnitsPerSecond,
    ...withoutReturn
  } = crystal;
  return {
    ...withoutReturn,
    atBase: false,
    status: "carried",
    carrierEnemyId: enemyId,
    lastCarrierEnemyId: enemyId,
    lastEvent: { type: "stolen", tick, enemyId },
    stolenCount: crystal.stolenCount + 1,
  };
}

function dropCrystal(crystal: CrystalState, carrier: Enemy, tick: number, level?: LevelConfig): CrystalState {
  const { carrierEnemyId: _carrierEnemyId, ...withoutCarrier } = crystal;
  return {
    ...withoutCarrier,
    atBase: false,
    status: "returning",
    lastCarrierEnemyId: carrier.id,
    lastDroppedEnemyId: carrier.id,
    lastEvent: { type: "dropped", tick, enemyId: carrier.id },
    position: carrier.position,
    pathIndex: carrier.pathIndex,
    progress: carrier.progress,
    returnSpeedUnitsPerSecond: getEnemyBaseSpeed(level, carrier) * DEFAULT_CRYSTAL_RETURN_SPEED_MULTIPLIER,
    droppedCount: crystal.droppedCount + 1,
  };
}

function recoverCrystal(crystal: CrystalState, tick: number): CrystalState {
  const {
    carrierEnemyId: _carrierEnemyId,
    position: _position,
    pathIndex: _pathIndex,
    progress: _progress,
    returnSpeedUnitsPerSecond: _returnSpeedUnitsPerSecond,
    ...withoutCarrierOrReturn
  } = crystal;
  return {
    ...withoutCarrierOrReturn,
    atBase: true,
    status: "recovered",
    lastEvent: { type: "recovered", tick, enemyId: crystal.lastDroppedEnemyId ?? crystal.lastCarrierEnemyId },
    recoveredCount: crystal.recoveredCount + 1,
  };
}

function escapeCrystal(crystal: CrystalState, enemyId: string, tick: number): CrystalState {
  const {
    position: _position,
    pathIndex: _pathIndex,
    progress: _progress,
    returnSpeedUnitsPerSecond: _returnSpeedUnitsPerSecond,
    ...withoutReturn
  } = crystal;
  return {
    ...withoutReturn,
    atBase: false,
    status: "escaped",
    carrierEnemyId: enemyId,
    lastCarrierEnemyId: enemyId,
    lastEvent: { type: "escaped", tick, enemyId },
    escapedCount: crystal.escapedCount + 1,
  };
}

function advanceReturningCrystal(state: GameState, level?: LevelConfig): Pick<GameState, "crystal" | "enemies"> {
  if (!level || (state.crystal.status !== "returning" && state.crystal.status !== "dropped")) {
    return { crystal: state.crystal, enemies: state.enemies };
  }

  const immediatePickup = pickUpReturningCrystal(state.crystal, state.enemies, state.clock.tick);
  if (immediatePickup) return immediatePickup;

  const speed = state.crystal.returnSpeedUnitsPerSecond ??
    DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND * DEFAULT_CRYSTAL_RETURN_SPEED_MULTIPLIER;
  const movedCrystal = moveCrystalAlongPath(state.crystal, level, speed * (state.clock.fixedDeltaMs / 1000), 1);

  if (hasCrystalReachedAncient(movedCrystal, level)) {
    return { crystal: recoverCrystal(movedCrystal, state.clock.tick), enemies: state.enemies };
  }

  return pickUpReturningCrystal(movedCrystal, state.enemies, state.clock.tick) ?? {
    crystal: movedCrystal,
    enemies: state.enemies,
  };
}

function pickUpReturningCrystal(
  crystal: CrystalState,
  enemies: readonly Enemy[],
  tick: number,
): Pick<GameState, "crystal" | "enemies"> | undefined {
  if (!crystal.position) return undefined;

  const pickupEnemy = enemies
    .filter((enemy) => !enemy.carryingCrystal && enemy.health > 0)
    .filter((enemy) => distance(enemy.position, crystal.position!) <= CRYSTAL_PICKUP_RADIUS)
    .sort((a, b) => distance(a.position, crystal.position!) - distance(b.position, crystal.position!))[0];

  if (!pickupEnemy) return undefined;

  return {
    crystal: stealCrystal(crystal, pickupEnemy.id, tick),
    enemies: enemies.map((enemy) =>
      enemy.id === pickupEnemy.id ? { ...enemy, carryingCrystal: true } : enemy,
    ),
  };
}

function hasCrystalReachedAncient(crystal: CrystalState, level: LevelConfig): boolean {
  const lastPathSegmentIndex = Math.max(0, level.path.length - 2);
  return (crystal.pathIndex ?? 0) >= lastPathSegmentIndex && (crystal.progress ?? 0) >= 1;
}

function resolveCrystalAndBase(state: GameState, advancedEnemies: readonly Enemy[], level?: LevelConfig): Pick<GameState, "baseHealth" | "crystal" | "enemies" | "status"> {
  let baseHealth = state.baseHealth;
  let crystal = state.crystal;
  let status = state.status;
  const enemies: Enemy[] = [];
  const lastPathSegmentIndex = level?.path ? Math.max(0, level.path.length - 2) : 0;

  for (const enemy of advancedEnemies) {
    if (enemy.carryingCrystal && enemy.pathIndex === 0 && enemy.progress <= 0) {
      baseHealth = Math.max(0, baseHealth - 1);
      status = "lost";
      crystal = escapeCrystal(crystal, enemy.id, state.clock.tick);
      enemies.push({ ...enemy, progress: 0 });
      continue;
    }

    if (!enemy.carryingCrystal && enemy.progress >= 1 && enemy.pathIndex === lastPathSegmentIndex) {
      if (crystal.atBase) {
        const carrier = { ...enemy, progress: 1, carryingCrystal: true };
        crystal = stealCrystal(crystal, carrier.id, state.clock.tick);
        enemies.push(carrier);
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
    enemies: waveAdvanced.enemies.map((enemy) => decayStatusEffects(advanceEnemyAlongPath(enemy, level))),
    wave: waveAdvanced.wave,
  };
  const combatState = applyTowerCombat(movedState, level);
  const crystalAdvanced = advanceReturningCrystal(combatState, level);
  const crystalState = {
    ...combatState,
    crystal: crystalAdvanced.crystal,
    enemies: crystalAdvanced.enemies,
  };
  const resolved = resolveCrystalAndBase(crystalState, crystalState.enemies, level);

  const completedAllWaves =
    waveAdvanced.wave.totalWaves > 0 &&
    !waveAdvanced.wave.isWaveActive &&
    !waveAdvanced.wave.isWaitingNextWave &&
    resolved.enemies.length === 0 &&
    resolved.crystal.atBase;

  const nextStatus = completedAllWaves && resolved.status === "running" ? "won" : resolved.status;
  const nextState: GameState = {
    ...preparedState,
    ...resolved,
    status: nextStatus,
    resources: combatState.resources,
    wave: combatState.wave,
    clock: { ...state.clock, tick: state.clock.tick + 1 },
    heroes: combatState.heroes.map((hero) => ({
      ...hero,
      cooldownTicksRemaining: Math.max(0, hero.cooldownTicksRemaining - 1),
    })),
    settlement: combatState.settlement,
  };

  return syncSettlementState(nextState);
}

function calculateStars(remainingCrystals: number, maxCrystals: number): StarRating {
  if (maxCrystals <= 0 || remainingCrystals <= 0) return 0;
  if (remainingCrystals === maxCrystals) return 3;
  if (remainingCrystals / maxCrystals >= 0.5) return 2;
  return 1;
}

function getSettlementReason(state: GameState): SettlementReason {
  if (state.status === "won") return "all-waves-cleared";
  if (state.crystal.status === "escaped") return "crystal-escaped";
  if (state.baseHealth <= 0) return "base-crystals-depleted";
  return "none";
}

function createSettlementState(state: GameState): SettlementState {
  const isVictory = state.status === "won";
  const isDefeat = state.status === "lost";
  const isComplete = isVictory || isDefeat;
  const stars = isVictory ? calculateStars(state.baseHealth, state.maxBaseHealth) : 0;

  return {
    outcome: isVictory ? "victory" : isDefeat ? "defeat" : "pending",
    reason: getSettlementReason(state),
    isComplete,
    stars,
    remainingCrystals: state.baseHealth,
    maxCrystals: state.maxBaseHealth,
    recoveredCrystals: state.crystal.recoveredCount,
    stolenCrystals: state.crystal.stolenCount,
    escapedCrystals: state.crystal.escapedCount,
    ...(isComplete ? { completedAtTick: state.clock.tick } : {}),
  };
}

function syncSettlementState(state: GameState): GameState {
  if (state.settlement.isComplete) return state;
  return { ...state, settlement: createSettlementState(state) };
}

export function reduceActions(state: GameState, level?: LevelConfig): GameState {
  const reduced = state.pendingActions.reduce((nextState, action) => applyAction(nextState, action, level), state);
  return syncSettlementState({ ...reduced, pendingActions: [] });
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
