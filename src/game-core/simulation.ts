import type {
  CrystalState,
  Enemy,
  GameAction,
  GameState,
  Hero,
  HeroConfig,
  HeroLevel,
  HeroPassiveKind,
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
const DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND = 75;
const DEFAULT_CRYSTAL_RETURN_SPEED_MULTIPLIER = 0.5;
const DEFAULT_LEVEL_THRESHOLDS: readonly [number, number, number, number, number] = [0, 1, 3, 6, 10];
const DEFAULT_XP_PER_KILL = 1;
const DEFAULT_COOLDOWN_REDUCTION_PER_LEVEL = 0.1;
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
const DEFAULT_PASSIVE_SLOW_MS = 700;
const DEFAULT_PASSIVE_FREEZE_MS = 300;
const DEFAULT_PASSIVE_BURN_MS = 600;
const DEFAULT_PASSIVE_POISON_MS = 900;
const DEFAULT_PASSIVE_DOT_DAMAGE = 1;
const DEFAULT_PASSIVE_CHAIN_RADIUS = 105;
const DEFAULT_PASSIVE_CLEAVE_RADIUS = 75;

function applyAction(state: GameState, action: GameAction, level?: LevelConfig): GameState {
  switch (action.type) {
    case "START":
      return state.status === "ready" ? { ...state, status: "running", clock: { ...state.clock, paused: false } } : state;
    case "PAUSE":
      return state.status === "running" ? { ...state, status: "paused", clock: { ...state.clock, paused: true } } : state;
    case "RESUME":
      return state.status === "paused" ? { ...state, status: "running", clock: { ...state.clock, paused: false } } : state;
    case "SET_SPEED":
      return { ...state, clock: { ...state.clock, speed: action.speed } };
    case "START_NEXT_WAVE":
      return startNextWave(state);
    case "BUILD_HERO":
      return buildHero(state, action.slotId, action.heroArchetype, level);
    case "PLACE_HERO":
      return { ...state, heroes: [...state.heroes, normalizePlacedHero(action.hero, level)] };
    case "SPAWN_ENEMY":
      return { ...state, enemies: [...state.enemies, action.enemy] };
    case "CAST_SKILL":
      return castSkill(state, action.heroId, action.targetEnemyId, level);
    case "SET_AUTO_CAST":
      return {
        ...state,
        heroes: state.heroes.map((hero) => hero.id === action.heroId ? { ...hero, autoCastEnabled: action.enabled } : hero),
      };
  }
}

function buildHero(state: GameState, slotId: string, heroArchetype: string, level?: LevelConfig): GameState {
  const slot = state.towerSlots.find((candidate) => candidate.id === slotId);
  const config = level?.heroConfigs?.find((candidate) => candidate.archetype === heroArchetype);
  if (!slot || !config || !slot.unlocked || slot.occupiedByHeroId || state.resources.gold < config.buildCost) return state;

  const heroLevel = getHeroLevel(0, config);
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
    level: heroLevel,
    experience: 0,
    unlockedPassiveIds: getUnlockedPassiveIds(heroLevel, config),
    autoCastEnabled: false,
  };

  return {
    ...state,
    resources: { ...state.resources, gold: state.resources.gold - config.buildCost },
    heroes: [...state.heroes, hero],
    towerSlots: state.towerSlots.map((candidate) =>
      candidate.id === slot.id ? { ...candidate, occupiedByHeroId: hero.id } : candidate,
    ),
  };
}

function normalizePlacedHero(hero: Hero, level?: LevelConfig): Hero {
  const config = getHeroConfig(level, hero);
  const experience = hero.experience ?? 0;
  const heroLevel = hero.level ?? getHeroLevel(experience, config);
  return {
    ...hero,
    level: heroLevel,
    experience,
    unlockedPassiveIds: hero.unlockedPassiveIds ?? getUnlockedPassiveIds(heroLevel, config),
    autoCastEnabled: hero.autoCastEnabled ?? false,
  };
}

function getHeroConfig(level: LevelConfig | undefined, hero: Pick<Hero, "archetype">): HeroConfig | undefined {
  return level?.heroConfigs?.find((candidate) => candidate.archetype === hero.archetype);
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
  return config?.progression?.passives.filter((passive) => passive.level <= heroLevel).map((passive) => passive.id) ?? [];
}

function gainHeroExperience(hero: Hero, experienceToAdd: number, level?: LevelConfig): Hero {
  if (experienceToAdd <= 0) return hero;
  const config = getHeroConfig(level, hero);
  const experience = hero.experience + experienceToAdd;
  const heroLevel = getHeroLevel(experience, config);
  return {
    ...hero,
    experience,
    level: heroLevel,
    unlockedPassiveIds: getUnlockedPassiveIds(heroLevel, config),
  };
}

function getXpPerKill(level: LevelConfig | undefined, hero: Hero): number {
  return getHeroConfig(level, hero)?.progression?.xpPerKill ?? DEFAULT_XP_PER_KILL;
}

function getSkillCooldownTicks(level: LevelConfig | undefined, hero: Hero, fixedDeltaMs: number): number {
  const config = getHeroConfig(level, hero);
  if (config?.skillCooldownMs === undefined) return DEFAULT_HERO_SKILL_COOLDOWN_TICKS;
  const reductionPerLevel = config.progression?.cooldownReductionPerLevel ?? DEFAULT_COOLDOWN_REDUCTION_PER_LEVEL;
  const multiplier = Math.max(0.35, 1 - (hero.level - 1) * reductionPerLevel);
  return Math.max(1, Math.ceil((config.skillCooldownMs * multiplier) / fixedDeltaMs));
}

function getSkillDamage(level: LevelConfig | undefined, hero: Hero): number {
  return getHeroConfig(level, hero)?.skillDamage ?? DEFAULT_HERO_SKILL_DAMAGE;
}

function hasPassiveKind(level: LevelConfig | undefined, hero: Hero, kind: HeroPassiveKind): boolean {
  const config = getHeroConfig(level, hero);
  return Boolean(config?.progression?.passives.some((passive) => passive.kind === kind && hero.unlockedPassiveIds.includes(passive.id)));
}

function getAttackDamageAgainst(level: LevelConfig | undefined, hero: Hero, target: Enemy, baseDamage: number): number {
  const antiCarrierMultiplier = hasPassiveKind(level, hero, "anti-carrier") && target.carryingCrystal ? 1.5 : 1;
  return Math.round(baseDamage * antiCarrierMultiplier);
}

function getSkillDamageAgainst(level: LevelConfig | undefined, hero: Hero, target: Enemy): number {
  return getAttackDamageAgainst(level, hero, target, getSkillDamage(level, hero));
}

type PendingEnemyMutation = { damage: number; pullDistance: number; statusEffects: StatusEffectState[] };
type SkillApplicationResult = Readonly<{ enemies: readonly Enemy[]; killedEnemies: readonly Enemy[] }>;

type StatusDamageResult = Readonly<{
  enemies: readonly Enemy[];
  killedEnemies: readonly Enemy[];
  killCredits: ReadonlyMap<string, string>;
}>;

function castSkill(state: GameState, heroId: string, targetEnemyId: string, level?: LevelConfig): GameState {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  const target = state.enemies.find((candidate) => candidate.id === targetEnemyId);
  if (!hero || !target || hero.cooldownTicksRemaining > 0) return state;

  const result = applySkillEffect(state.enemies, hero, target, level);
  const killedCarrier = result.killedEnemies.find((enemy) => enemy.carryingCrystal);
  const rewardGold = result.killedEnemies.reduce((sum, enemy) => sum + getEnemyRewardGold(level, enemy), 0);
  const earnedXp = result.killedEnemies.length * getXpPerKill(level, hero);

  return syncSettlementState({
    ...state,
    crystal: killedCarrier ? dropCrystal(state.crystal, killedCarrier, state.clock.tick, level) : state.crystal,
    resources: { ...state.resources, gold: state.resources.gold + rewardGold },
    heroes: state.heroes.map((candidate) => {
      if (candidate.id !== heroId) return candidate;
      const cooled = { ...candidate, cooldownTicksRemaining: getSkillCooldownTicks(level, candidate, state.clock.fixedDeltaMs) };
      return gainHeroExperience(cooled, earnedXp, level);
    }),
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
  addDamage(mutations, target.id, getSkillDamageAgainst(level, hero, target));
  addPassiveOnHitEffects(mutations, hero, target, level);
  return applyEnemyMutations(enemies, mutations, level);
}

function applyHookSkill(enemies: readonly Enemy[], hero: Hero, target: Enemy, level: LevelConfig | undefined, config: HeroConfig): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  addDamage(mutations, target.id, getSkillDamageAgainst(level, hero, target));
  addPassiveOnHitEffects(mutations, hero, target, level);
  addPull(mutations, target.id, config.skillPullDistance ?? DEFAULT_HOOK_PULL_DISTANCE);
  if (target.carryingCrystal || hasPassiveKind(level, hero, "stun")) {
    addStatusEffect(mutations, target.id, { type: "stun", remainingTicks: msToTicks(config.skillStunMs ?? 1_000, level), speedMultiplier: 0, sourceHeroId: hero.id });
  }
  if (hasPassiveKind(level, hero, "fissure-block")) {
    addStatusEffect(mutations, target.id, { type: "slow", remainingTicks: msToTicks(900, level), speedMultiplier: 0.55, sourceHeroId: hero.id });
  }
  return applyEnemyMutations(enemies, mutations, level);
}

function applyFrostSkill(enemies: readonly Enemy[], hero: Hero, target: Enemy, level: LevelConfig | undefined, config: HeroConfig): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  const radius = config.skillRadius ?? DEFAULT_FROST_RADIUS;
  const slowTicks = msToTicks(config.skillSlowMs ?? DEFAULT_FROST_SLOW_MS, level);
  for (const enemy of enemies) {
    if (distance(enemy.position, target.position) > radius) continue;
    addDamage(mutations, enemy.id, getSkillDamageAgainst(level, hero, enemy));
    addStatusEffect(mutations, enemy.id, {
      type: "slow",
      remainingTicks: slowTicks,
      speedMultiplier: enemy.carryingCrystal ? Math.max(0.1, (config.skillSlowMultiplier ?? DEFAULT_FROST_SLOW_MULTIPLIER) - 0.15) : config.skillSlowMultiplier ?? DEFAULT_FROST_SLOW_MULTIPLIER,
      sourceHeroId: hero.id,
    });
    addPassiveOnHitEffects(mutations, hero, enemy, level);
    if (hasPassiveKind(level, hero, "freeze") && (hasControlStatus(enemy) || enemy.carryingCrystal)) {
      addStatusEffect(mutations, enemy.id, { type: "stun", remainingTicks: msToTicks(DEFAULT_PASSIVE_FREEZE_MS, level), speedMultiplier: 0, sourceHeroId: hero.id });
    }
  }
  return applyEnemyMutations(enemies, mutations, level);
}

function applyStormChainSkill(enemies: readonly Enemy[], hero: Hero, target: Enemy, level: LevelConfig | undefined, config: HeroConfig): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  const passiveBonusHits = hasPassiveKind(level, hero, "lightning-chain") ? 1 : 0;
  const maxHits = 1 + passiveBonusHits + (config.skillJumpCount ?? DEFAULT_STORM_JUMP_COUNT) + (hasControlStatus(target) ? config.skillBonusJumpsVsStatus ?? DEFAULT_STORM_BONUS_JUMPS_VS_STATUS : 0);
  const targets = selectChainTargets(enemies, target, maxHits, config.skillJumpRadius ?? DEFAULT_STORM_JUMP_RADIUS);
  const decay = config.skillJumpDecay ?? DEFAULT_STORM_JUMP_DECAY;
  targets.forEach((enemy, index) => {
    addDamage(mutations, enemy.id, Math.round(getSkillDamageAgainst(level, hero, enemy) * Math.pow(decay, index)));
    addPassiveOnHitEffects(mutations, hero, enemy, level);
    if (hasPassiveKind(level, hero, "slow")) {
      addStatusEffect(mutations, enemy.id, { type: "slow", remainingTicks: msToTicks(DEFAULT_PASSIVE_SLOW_MS, level), speedMultiplier: 0.8, sourceHeroId: hero.id });
    }
  });
  return applyEnemyMutations(enemies, mutations, level);
}

function applyMoonbladeSkill(enemies: readonly Enemy[], hero: Hero, target: Enemy, level: LevelConfig | undefined, config: HeroConfig): SkillApplicationResult {
  const mutations = new Map<string, PendingEnemyMutation>();
  const passiveBonusBounces = hasPassiveKind(level, hero, "cleave") ? 1 : 0;
  const targets = selectChainTargets(enemies, target, 1 + passiveBonusBounces + (config.skillBounceCount ?? DEFAULT_MOONBLADE_BOUNCE_COUNT), config.skillJumpRadius ?? DEFAULT_STORM_JUMP_RADIUS);
  const decay = config.skillBounceDecay ?? DEFAULT_MOONBLADE_BOUNCE_DECAY;
  const bonus = config.skillBonusDamageVsStatusMultiplier ?? DEFAULT_MOONBLADE_BONUS_DAMAGE_VS_STATUS;
  targets.forEach((enemy, index) => {
    addDamage(mutations, enemy.id, Math.round(getSkillDamageAgainst(level, hero, enemy) * Math.pow(decay, index) * (hasControlStatus(enemy) ? bonus : 1)));
    addPassiveOnHitEffects(mutations, hero, enemy, level);
  });
  return applyEnemyMutations(enemies, mutations, level);
}

function addPassiveOnHitEffects(mutations: Map<string, PendingEnemyMutation>, hero: Hero, enemy: Enemy, level?: LevelConfig): void {
  if (hasPassiveKind(level, hero, "slow")) {
    addStatusEffect(mutations, enemy.id, { type: "slow", remainingTicks: msToTicks(DEFAULT_PASSIVE_SLOW_MS, level), speedMultiplier: 0.8, sourceHeroId: hero.id });
  }
  if (hasPassiveKind(level, hero, "freeze") && hasControlStatus(enemy)) {
    addStatusEffect(mutations, enemy.id, { type: "stun", remainingTicks: msToTicks(DEFAULT_PASSIVE_FREEZE_MS, level), speedMultiplier: 0, sourceHeroId: hero.id });
  }
  if (hasPassiveKind(level, hero, "burn")) {
    addStatusEffect(mutations, enemy.id, { type: "burn", remainingTicks: msToTicks(DEFAULT_PASSIVE_BURN_MS, level), damagePerTick: DEFAULT_PASSIVE_DOT_DAMAGE, sourceHeroId: hero.id });
  }
  if (hasPassiveKind(level, hero, "poison")) {
    addStatusEffect(mutations, enemy.id, { type: "poison", remainingTicks: msToTicks(DEFAULT_PASSIVE_POISON_MS, level), damagePerTick: DEFAULT_PASSIVE_DOT_DAMAGE, sourceHeroId: hero.id });
  }
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

function applyEnemyMutations(enemies: readonly Enemy[], mutations: Map<string, PendingEnemyMutation>, level?: LevelConfig): SkillApplicationResult {
  const mutatedEnemies = enemies.map((enemy) => {
    const mutation = mutations.get(enemy.id);
    if (!mutation) return enemy;
    let nextEnemy: Enemy = mutation.damage > 0 ? { ...enemy, health: enemy.health - mutation.damage } : enemy;
    if (nextEnemy.health > 0 && mutation.statusEffects.length > 0) nextEnemy = withAddedStatusEffects(nextEnemy, mutation.statusEffects);
    if (nextEnemy.health > 0 && mutation.pullDistance > 0 && level) nextEnemy = moveEnemyAlongPath(nextEnemy, level, mutation.pullDistance, -1);
    return nextEnemy;
  });
  return { enemies: mutatedEnemies.filter((enemy) => enemy.health > 0), killedEnemies: mutatedEnemies.filter((enemy) => enemy.health <= 0) };
}

function withAddedStatusEffects(enemy: Enemy, statusEffects: readonly StatusEffectState[]): Enemy {
  return { ...enemy, statusEffects: [...(enemy.statusEffects ?? []), ...statusEffects].filter((statusEffect) => statusEffect.remainingTicks > 0) };
}

function decayStatusEffects(enemy: Enemy): Enemy {
  if (!enemy.statusEffects?.length) return enemy;
  const statusEffects = enemy.statusEffects.map((statusEffect) => ({ ...statusEffect, remainingTicks: statusEffect.remainingTicks - 1 })).filter((statusEffect) => statusEffect.remainingTicks > 0);
  if (statusEffects.length === 0) {
    const { statusEffects: _statusEffects, ...enemyWithoutStatusEffects } = enemy;
    return enemyWithoutStatusEffects;
  }
  return { ...enemy, statusEffects };
}

function applyStatusEffectDamage(state: GameState, level?: LevelConfig): GameState {
  const killCredits = new Map<string, string>();
  const damagedEnemies = state.enemies.map((enemy) => {
    const damagingEffects = enemy.statusEffects?.filter((statusEffect) => (statusEffect.damagePerTick ?? 0) > 0 && statusEffect.remainingTicks > 0) ?? [];
    if (damagingEffects.length === 0) return enemy;
    const totalDamage = damagingEffects.reduce((sum, statusEffect) => sum + (statusEffect.damagePerTick ?? 0), 0);
    const sourceHeroId = damagingEffects.find((statusEffect) => statusEffect.sourceHeroId)?.sourceHeroId;
    if (sourceHeroId) killCredits.set(enemy.id, sourceHeroId);
    return { ...enemy, health: enemy.health - totalDamage };
  });

  const killedEnemies = damagedEnemies.filter((enemy) => enemy.health <= 0);
  if (killedEnemies.length === 0) return { ...state, enemies: damagedEnemies };

  const rewardGold = killedEnemies.reduce((sum, enemy) => sum + getEnemyRewardGold(level, enemy), 0);
  const killedCarrier = killedEnemies.find((enemy) => enemy.carryingCrystal);
  const xpByHeroId = new Map<string, number>();
  for (const enemy of killedEnemies) {
    const heroId = killCredits.get(enemy.id);
    const hero = heroId ? state.heroes.find((candidate) => candidate.id === heroId) : undefined;
    if (!heroId || !hero) continue;
    xpByHeroId.set(heroId, (xpByHeroId.get(heroId) ?? 0) + getXpPerKill(level, hero));
  }

  return syncSettlementState({
    ...state,
    enemies: damagedEnemies.filter((enemy) => enemy.health > 0),
    resources: { ...state.resources, gold: state.resources.gold + rewardGold },
    crystal: killedCarrier ? dropCrystal(state.crystal, killedCarrier, state.clock.tick, level) : state.crystal,
    heroes: state.heroes.map((hero) => gainHeroExperience(hero, xpByHeroId.get(hero.id) ?? 0, level)),
    wave: killedEnemies.length > 0 && state.wave.isWaveActive
      ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + killedEnemies.length }
      : state.wave,
  });
}

function msToTicks(durationMs: number, level?: LevelConfig): number {
  return Math.max(1, Math.ceil(durationMs / (level?.fixedDeltaMs ?? 100)));
}

function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function interpolate(a: Vector2, b: Vector2, progress: number): Vector2 {
  return { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress };
}

function getEnemyBaseSpeed(level: LevelConfig | undefined, enemy: Pick<Enemy, "archetype">): number {
  return level?.enemies?.find((candidate) => candidate.archetype === enemy.archetype)?.speedUnitsPerSecond ?? DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND;
}

function getEnemySpeed(level: LevelConfig | undefined, enemy: Enemy): number {
  return getEnemyBaseSpeed(level, enemy) * getStatusSpeedMultiplier(enemy);
}

function getStatusSpeedMultiplier(enemy: Enemy): number {
  const active = enemy.statusEffects?.filter((statusEffect) => statusEffect.remainingTicks > 0) ?? [];
  if (active.some((statusEffect) => statusEffect.type === "stun")) return 0;
  const slows = active.filter((statusEffect) => statusEffect.type === "slow").map((statusEffect) => statusEffect.speedMultiplier ?? 1);
  return slows.length > 0 ? Math.min(...slows) : 1;
}

function hasControlStatus(enemy: Enemy): boolean {
  return Boolean(enemy.statusEffects?.some((statusEffect) => statusEffect.remainingTicks > 0 && (statusEffect.type === "slow" || statusEffect.type === "stun")));
}

function advanceEnemyAlongPath(enemy: Enemy, level?: LevelConfig): Enemy {
  const direction: 1 | -1 = enemy.carryingCrystal || enemy.returningToStart ? -1 : 1;
  if (!level || level.path.length < 2) {
    return { ...enemy, progress: Math.max(0, Math.min(1, enemy.progress + direction * 0.05 * getStatusSpeedMultiplier(enemy))) };
  }
  return moveEnemyAlongPath(enemy, level, getEnemySpeed(level, enemy) * (level.fixedDeltaMs / 1000), direction);
}

function moveEnemyAlongPath(enemy: Enemy, level: LevelConfig, distanceToMove: number, direction: 1 | -1): Enemy {
  return { ...enemy, ...movePathPosition({ pathIndex: enemy.pathIndex, progress: enemy.progress, position: enemy.position }, level, distanceToMove, direction) };
}

function moveCrystalAlongPath(crystal: CrystalState, level: LevelConfig, distanceToMove: number, direction: 1 | -1): CrystalState {
  if (crystal.pathIndex === undefined || crystal.progress === undefined || !crystal.position) return crystal;
  return { ...crystal, ...movePathPosition({ pathIndex: crystal.pathIndex, progress: crystal.progress, position: crystal.position }, level, distanceToMove, direction) };
}

type PathPosition = Readonly<{ pathIndex: number; progress: number; position: Vector2 }>;

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

function getEnemyRewardGold(level: LevelConfig | undefined, enemy: Enemy): number {
  return level?.enemies?.find((candidate) => candidate.archetype === enemy.archetype)?.rewardGold ?? 0;
}

function enemyPathScore(enemy: Enemy): number {
  return enemy.pathIndex + enemy.progress;
}

function selectTarget(hero: Hero, enemies: readonly Enemy[], level?: LevelConfig): Enemy | undefined {
  const config = getHeroConfig(level, hero);
  if (!config) return undefined;
  return enemies.filter((enemy) => distance(hero.position, enemy.position) <= config.attackRange).sort((a, b) => enemyPathScore(b) - enemyPathScore(a))[0];
}

function applyTowerCombat(state: GameState, level?: LevelConfig): GameState {
  let enemies = [...state.enemies];
  let rewardGold = 0;
  let killedCount = 0;
  let killedCarrier: Enemy | undefined;
  const heroes = state.heroes.map((hero) => {
    const config = getHeroConfig(level, hero);
    const cooledHero = { ...hero, attackCooldownMs: Math.max(0, hero.attackCooldownMs - state.clock.fixedDeltaMs) };
    if (!config || cooledHero.attackCooldownMs > 0) return cooledHero;
    const target = selectTarget(cooledHero, enemies, level);
    if (!target) {
      const { targetEnemyId: _targetEnemyId, ...untargetedHero } = cooledHero;
      return untargetedHero;
    }

    const mutations = new Map<string, PendingEnemyMutation>();
    addDamage(mutations, target.id, getAttackDamageAgainst(level, cooledHero, target, config.attackDamage));
    addPassiveOnHitEffects(mutations, cooledHero, target, level);
    if (hasPassiveKind(level, cooledHero, "lightning-chain")) {
      const chainTarget = selectChainTargets(enemies, target, 2, DEFAULT_PASSIVE_CHAIN_RADIUS)[1];
      if (chainTarget) addDamage(mutations, chainTarget.id, Math.round(config.attackDamage * 0.5));
    }
    if (hasPassiveKind(level, cooledHero, "cleave")) {
      for (const enemy of enemies) {
        if (enemy.id === target.id || distance(enemy.position, target.position) > DEFAULT_PASSIVE_CLEAVE_RADIUS) continue;
        addDamage(mutations, enemy.id, Math.round(config.attackDamage * 0.35));
      }
    }

    const result = applyEnemyMutations(enemies, mutations, level);
    enemies = [...result.enemies];
    let nextHero: Hero = { ...cooledHero, attackCooldownMs: config.attackIntervalMs, targetEnemyId: target.id };
    if (result.killedEnemies.length > 0) {
      rewardGold += result.killedEnemies.reduce((sum, enemy) => sum + getEnemyRewardGold(level, enemy), 0);
      killedCount += result.killedEnemies.length;
      if (!killedCarrier) killedCarrier = result.killedEnemies.find((enemy) => enemy.carryingCrystal);
      nextHero = gainHeroExperience(nextHero, result.killedEnemies.length * getXpPerKill(level, nextHero), level);
    }
    return nextHero;
  });
  return syncSettlementState({
    ...state,
    heroes,
    enemies,
    resources: { ...state.resources, gold: state.resources.gold + rewardGold },
    crystal: killedCarrier ? dropCrystal(state.crystal, killedCarrier, state.clock.tick, level) : state.crystal,
    wave: killedCount > 0 && state.wave.isWaveActive ? { ...state.wave, killedCountInWave: state.wave.killedCountInWave + killedCount } : state.wave,
  });
}

function applyAutoCastSkills(state: GameState, level?: LevelConfig): GameState {
  let nextState = state;
  for (const hero of state.heroes) {
    const currentHero = nextState.heroes.find((candidate) => candidate.id === hero.id);
    if (!currentHero?.autoCastEnabled || currentHero.cooldownTicksRemaining > 0) continue;
    const target = selectTarget(currentHero, nextState.enemies, level);
    if (!target) continue;
    nextState = castSkill(nextState, currentHero.id, target.id, level);
  }
  return nextState;
}

function stealCrystal(crystal: CrystalState, enemyId: string, tick: number): CrystalState {
  const { position: _position, pathIndex: _pathIndex, progress: _progress, returnSpeedUnitsPerSecond: _returnSpeedUnitsPerSecond, ...withoutReturn } = crystal;
  return { ...withoutReturn, atBase: false, status: "carried", carrierEnemyId: enemyId, lastCarrierEnemyId: enemyId, lastEvent: { type: "stolen", tick, enemyId }, stolenCount: crystal.stolenCount + 1 };
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
  const { carrierEnemyId: _carrierEnemyId, position: _position, pathIndex: _pathIndex, progress: _progress, returnSpeedUnitsPerSecond: _returnSpeedUnitsPerSecond, ...withoutCarrierOrReturn } = crystal;
  return { ...withoutCarrierOrReturn, atBase: true, status: "recovered", lastEvent: { type: "recovered", tick, enemyId: crystal.lastDroppedEnemyId ?? crystal.lastCarrierEnemyId }, recoveredCount: crystal.recoveredCount + 1 };
}

function escapeCrystal(crystal: CrystalState, enemyId: string, tick: number): CrystalState {
  const { position: _position, pathIndex: _pathIndex, progress: _progress, returnSpeedUnitsPerSecond: _returnSpeedUnitsPerSecond, ...withoutReturn } = crystal;
  return { ...withoutReturn, atBase: false, status: "escaped", carrierEnemyId: enemyId, lastCarrierEnemyId: enemyId, lastEvent: { type: "escaped", tick, enemyId }, escapedCount: crystal.escapedCount + 1 };
}

function advanceReturningCrystal(state: GameState, level?: LevelConfig): Pick<GameState, "crystal" | "enemies"> {
  if (!level || (state.crystal.status !== "returning" && state.crystal.status !== "dropped")) return { crystal: state.crystal, enemies: state.enemies };
  const immediatePickup = pickUpReturningCrystal(state.crystal, state.enemies, state.clock.tick);
  if (immediatePickup) return immediatePickup;
  const speed = state.crystal.returnSpeedUnitsPerSecond ?? DEFAULT_ENEMY_SPEED_UNITS_PER_SECOND * DEFAULT_CRYSTAL_RETURN_SPEED_MULTIPLIER;
  const movedCrystal = moveCrystalAlongPath(state.crystal, level, speed * (state.clock.fixedDeltaMs / 1000), 1);
  if (hasCrystalReachedAncient(movedCrystal, level)) return { crystal: recoverCrystal(movedCrystal, state.clock.tick), enemies: state.enemies };
  return pickUpReturningCrystal(movedCrystal, state.enemies, state.clock.tick) ?? { crystal: movedCrystal, enemies: state.enemies };
}

function pickUpReturningCrystal(crystal: CrystalState, enemies: readonly Enemy[], tick: number): Pick<GameState, "crystal" | "enemies"> | undefined {
  if (!crystal.position) return undefined;
  const pickupEnemy = enemies
    .filter((enemy) => !enemy.carryingCrystal && enemy.health > 0)
    .filter((enemy) => distance(enemy.position, crystal.position!) <= CRYSTAL_PICKUP_RADIUS)
    .sort((a, b) => distance(a.position, crystal.position!) - distance(b.position, crystal.position!))[0];
  if (!pickupEnemy) return undefined;
  return { crystal: stealCrystal(crystal, pickupEnemy.id, tick), enemies: enemies.map((enemy) => enemy.id === pickupEnemy.id ? { ...enemy, carryingCrystal: true, returningToStart: true } : enemy) };
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
  const ancientPosition = level?.path[level.path.length - 1];
  const startPosition = level?.path[0];

  for (const enemy of advancedEnemies) {
    if (enemy.pathIndex === 0 && enemy.progress <= 0 && (enemy.carryingCrystal || enemy.returningToStart)) {
      if (enemy.carryingCrystal) {
        baseHealth = Math.max(0, baseHealth - 1);
        status = "lost";
        crystal = escapeCrystal(crystal, enemy.id, state.clock.tick);
        enemies.push({ ...enemy, progress: 0, ...(startPosition ? { position: startPosition } : {}) });
      }
      continue;
    }

    if (!enemy.returningToStart && !enemy.carryingCrystal && enemy.progress >= 1 && enemy.pathIndex === lastPathSegmentIndex) {
      if (crystal.atBase) {
        const carrier: Enemy = { ...enemy, progress: 1, carryingCrystal: true, returningToStart: true, ...(ancientPosition ? { position: ancientPosition } : {}) };
        crystal = stealCrystal(crystal, carrier.id, state.clock.tick);
        enemies.push(carrier);
      } else {
        enemies.push({ ...enemy, progress: 1, returningToStart: true, ...(ancientPosition ? { position: ancientPosition } : {}) });
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
  return { id: `enemy-${sequence}`, archetype, pathIndex: 0, progress: 0, position: level.path[0] ?? { x: 0, y: 0 }, health: config?.maxHealth ?? 50, maxHealth: config?.maxHealth ?? 50, carryingCrystal: false };
}

function shouldAutoStartWave(state: GameState, level: LevelConfig): boolean {
  if (!state.wave.isWaitingNextWave || state.wave.isWaveActive) return false;
  const waveConfig = level.waves?.[state.wave.currentWaveIndex];
  return Boolean(waveConfig && state.clock.tick * state.clock.fixedDeltaMs >= waveConfig.startsAtMs);
}

function prepareWaveForTick(state: GameState, level?: LevelConfig): GameState {
  return level?.waves?.length && shouldAutoStartWave(state, level) ? activateCurrentWave(state) : state;
}

function advanceWave(state: GameState, level?: LevelConfig): Pick<GameState, "enemies" | "wave"> {
  const preparedState = prepareWaveForTick(state, level);
  if (!level?.waves?.length || !preparedState.wave.isWaveActive) return { enemies: preparedState.enemies, wave: preparedState.wave };
  const waveConfig = level.waves[preparedState.wave.currentWaveIndex];
  if (!waveConfig) return { enemies: preparedState.enemies, wave: preparedState.wave };

  let wave: WaveRuntimeState = { ...preparedState.wave, waveElapsedMs: preparedState.wave.waveElapsedMs + preparedState.clock.fixedDeltaMs };
  const enemies = [...preparedState.enemies];
  while (wave.activeGroupIndex < waveConfig.spawnGroups.length) {
    const group = waveConfig.spawnGroups[wave.activeGroupIndex];
    if (!group || wave.spawnedCountInGroup >= group.count) {
      wave = { ...wave, activeGroupIndex: wave.activeGroupIndex + 1, spawnedCountInGroup: 0, nextSpawnElapsedMs: 0 };
      continue;
    }
    if (wave.waveElapsedMs < wave.nextSpawnElapsedMs) break;
    enemies.push(createEnemyFromConfig(level, group.enemyArchetype, wave.nextEnemySequence));
    wave = { ...wave, spawnedCountInGroup: wave.spawnedCountInGroup + 1, spawnedCountInWave: wave.spawnedCountInWave + 1, nextEnemySequence: wave.nextEnemySequence + 1, nextSpawnElapsedMs: wave.nextSpawnElapsedMs + group.intervalMs };
  }

  const allGroupsSpawned = wave.activeGroupIndex >= waveConfig.spawnGroups.length;
  if (allGroupsSpawned && enemies.length === 0) {
    const nextWaveIndex = wave.currentWaveIndex + 1;
    wave = { ...wave, currentWaveIndex: Math.min(nextWaveIndex, wave.totalWaves - 1), waveElapsedMs: 0, activeGroupIndex: 0, spawnedCountInGroup: 0, nextSpawnElapsedMs: 0, isWaveActive: false, isWaitingNextWave: nextWaveIndex < wave.totalWaves };
  }
  return { enemies, wave };
}

function advanceRunningTick(state: GameState, level?: LevelConfig): GameState {
  const preparedState = prepareWaveForTick(state, level);
  const waveAdvanced = advanceWave(preparedState, level);
  const statusDamageState = applyStatusEffectDamage({ ...preparedState, enemies: waveAdvanced.enemies, wave: waveAdvanced.wave }, level);
  const movedState = { ...statusDamageState, enemies: statusDamageState.enemies.map((enemy) => decayStatusEffects(advanceEnemyAlongPath(enemy, level))) };
  const combatState = applyTowerCombat(movedState, level);
  const autoCastState = applyAutoCastSkills(combatState, level);
  const crystalAdvanced = advanceReturningCrystal(autoCastState, level);
  const crystalState = { ...autoCastState, crystal: crystalAdvanced.crystal, enemies: crystalAdvanced.enemies };
  const resolved = resolveCrystalAndBase(crystalState, crystalState.enemies, level);
  const completedAllWaves = autoCastState.wave.totalWaves > 0 && !autoCastState.wave.isWaveActive && !autoCastState.wave.isWaitingNextWave && resolved.enemies.length === 0 && resolved.crystal.atBase;
  const nextState: GameState = {
    ...preparedState,
    ...resolved,
    status: completedAllWaves && resolved.status === "running" ? "won" : resolved.status,
    resources: autoCastState.resources,
    wave: autoCastState.wave,
    clock: { ...state.clock, tick: state.clock.tick + 1 },
    heroes: autoCastState.heroes.map((hero) => ({ ...hero, cooldownTicksRemaining: Math.max(0, hero.cooldownTicksRemaining - 1) })),
    settlement: autoCastState.settlement,
  };
  return syncSettlementState(nextState);
}

function calculateStars(remainingCrystals: number, maxCrystals: number): StarRating {
  if (maxCrystals <= 0 || remainingCrystals <= 0) return 0;
  if (remainingCrystals === maxCrystals) return 3;
  return remainingCrystals / maxCrystals >= 0.5 ? 2 : 1;
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
  return {
    outcome: isVictory ? "victory" : isDefeat ? "defeat" : "pending",
    reason: getSettlementReason(state),
    isComplete,
    stars: isVictory ? calculateStars(state.baseHealth, state.maxBaseHealth) : 0,
    remainingCrystals: state.baseHealth,
    maxCrystals: state.maxBaseHealth,
    recoveredCrystals: state.crystal.recoveredCount,
    stolenCrystals: state.crystal.stolenCount,
    escapedCrystals: state.crystal.escapedCount,
    ...(isComplete ? { completedAtTick: state.clock.tick } : {}),
  };
}

function syncSettlementState(state: GameState): GameState {
  return state.settlement.isComplete ? state : { ...state, settlement: createSettlementState(state) };
}

export function reduceActions(state: GameState, level?: LevelConfig): GameState {
  const reduced = state.pendingActions.reduce((nextState, action) => applyAction(nextState, action, level), state);
  return syncSettlementState({ ...reduced, pendingActions: [] });
}

export function stepFixedTick(state: GameState, level?: LevelConfig): GameState {
  const reduced = reduceActions(state, level);
  return reduced.clock.paused || reduced.status !== "running" ? reduced : advanceRunningTick(reduced, level);
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
