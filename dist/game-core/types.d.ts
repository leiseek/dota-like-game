export type EntityId = string;
export type Vector2 = Readonly<{
    x: number;
    y: number;
}>;
export type GameSpeed = 1 | 2 | 5 | 10;
export type GameStatus = "ready" | "running" | "paused" | "won" | "lost";
export type StatusEffectType = "slow" | "stun";
export type StatusEffectState = Readonly<{
    type: StatusEffectType;
    remainingTicks: number;
    speedMultiplier?: number;
    sourceHeroId?: EntityId;
}>;
export type SkillKind = "direct-damage" | "hook" | "frost" | "storm-chain" | "moonblade";
export type Hero = Readonly<{
    id: EntityId;
    archetype: string;
    position: Vector2;
    health: number;
    maxHealth: number;
    cooldownTicksRemaining: number;
    attackCooldownMs: number;
    targetEnemyId?: EntityId;
    slotId?: string;
    totalCost: number;
}>;
export type Enemy = Readonly<{
    id: EntityId;
    archetype: string;
    pathIndex: number;
    progress: number;
    position: Vector2;
    health: number;
    maxHealth: number;
    carryingCrystal: boolean;
    statusEffects?: readonly StatusEffectState[];
}>;
export type CrystalEventType = "stolen" | "dropped" | "recovered" | "escaped";
export type CrystalRuntimeStatus = "safe" | "carried" | "dropped" | "returning" | "recovered" | "escaped";
export type CrystalEvent = Readonly<{
    type: CrystalEventType;
    tick: number;
    enemyId?: EntityId | undefined;
}>;
export type CrystalState = Readonly<{
    atBase: boolean;
    status: CrystalRuntimeStatus;
    carrierEnemyId?: EntityId;
    lastCarrierEnemyId?: EntityId;
    lastDroppedEnemyId?: EntityId;
    lastEvent?: CrystalEvent;
    position?: Vector2;
    pathIndex?: number;
    progress?: number;
    returnSpeedUnitsPerSecond?: number;
    stolenCount: number;
    droppedCount: number;
    recoveredCount: number;
    escapedCount: number;
}>;
export type SettlementOutcome = "pending" | "victory" | "defeat";
export type SettlementReason = "none" | "all-waves-cleared" | "crystal-escaped" | "base-crystals-depleted";
export type StarRating = 0 | 1 | 2 | 3;
export type SettlementState = Readonly<{
    outcome: SettlementOutcome;
    reason: SettlementReason;
    isComplete: boolean;
    stars: StarRating;
    remainingCrystals: number;
    maxCrystals: number;
    recoveredCrystals: number;
    stolenCrystals: number;
    escapedCrystals: number;
    completedAtTick?: number;
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
export type HeroConfig = Readonly<{
    archetype: string;
    buildCost: number;
    maxHealth: number;
    attackDamage: number;
    attackIntervalMs: number;
    attackRange: number;
    skillKind?: SkillKind;
    skillManaCost?: number;
    skillCooldownMs?: number;
    skillDamage?: number;
    skillPullDistance?: number;
    skillStunMs?: number;
    skillSlowMs?: number;
    skillSlowMultiplier?: number;
    skillRadius?: number;
    skillJumpCount?: number;
    skillJumpRadius?: number;
    skillJumpDecay?: number;
    skillBonusJumpsVsStatus?: number;
    skillBounceCount?: number;
    skillBounceDecay?: number;
    skillBonusDamageVsStatusMultiplier?: number;
}>;
export type ResourceState = Readonly<{
    gold: number;
    manaCrystal: number;
}>;
export type EnemyConfig = Readonly<{
    archetype: string;
    maxHealth: number;
    speedUnitsPerSecond: number;
    rewardGold: number;
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
    maxBaseHealth: number;
    resources: ResourceState;
    crystal: CrystalState;
    settlement: SettlementState;
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
    startingGold: number;
    startingManaCrystal: number;
    path: readonly Vector2[];
    startingHeroes: readonly Omit<Hero, "id" | "cooldownTicksRemaining" | "attackCooldownMs" | "totalCost">[];
    heroConfigs?: readonly HeroConfig[];
    enemies?: readonly EnemyConfig[];
    towerSlots?: readonly TowerSlotConfig[];
    obstacles?: readonly ObstacleConfig[];
    waves?: readonly WaveConfig[];
}>;
export type GameAction = Readonly<{
    type: "START";
}> | Readonly<{
    type: "PAUSE";
}> | Readonly<{
    type: "RESUME";
}> | Readonly<{
    type: "SET_SPEED";
    speed: GameSpeed;
}> | Readonly<{
    type: "START_NEXT_WAVE";
}> | Readonly<{
    type: "BUILD_HERO";
    slotId: EntityId;
    heroArchetype: string;
}> | Readonly<{
    type: "PLACE_HERO";
    hero: Hero;
}> | Readonly<{
    type: "CAST_SKILL";
    heroId: EntityId;
    targetEnemyId: EntityId;
}> | Readonly<{
    type: "SPAWN_ENEMY";
    enemy: Enemy;
}>;
export type HudWaveState = Readonly<{
    currentWave: number;
    totalWaves: number;
    isWaveActive: boolean;
    isWaitingNextWave: boolean;
    spawnedCountInWave: number;
    killedCountInWave: number;
}>;
export type HudCrystalState = Readonly<{
    status: CrystalRuntimeStatus;
    carrierEnemyId?: EntityId;
    lastCarrierEnemyId?: EntityId;
    lastDroppedEnemyId?: EntityId;
    lastEventType?: CrystalEventType;
    position?: Vector2;
    pathIndex?: number;
    progress?: number;
    stolenCount: number;
    droppedCount: number;
    recoveredCount: number;
    escapedCount: number;
}>;
export type HudSpeedOption = Readonly<{
    speed: GameSpeed;
    isActive: boolean;
}>;
export type HudState = Readonly<{
    crystals: number;
    maxCrystals: number;
    crystal: HudCrystalState;
    settlement: SettlementState;
    gold: number;
    manaCrystal: number;
    wave: HudWaveState;
    status: GameStatus;
    isPaused: boolean;
    speed: GameSpeed;
    speedOptions: readonly HudSpeedOption[];
    canPause: boolean;
    canResume: boolean;
    canStartNextWave: boolean;
}>;
export type GameSnapshot = Readonly<{
    savedAtTick: number;
    state: GameState;
}>;
