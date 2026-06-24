---
doc_id: GAME_STATE_SCHEMA
version: 0.4.1
status: active
owner_agent: Technical Architect Agent
last_updated: 2026-06-24
change_summary: active skill status effects added to serializable battle state
---

# GameState Schema

## Goal

GameState is the single source of truth for battle simulation.

It must support:

- fixed tick;
- pause;
- 1x/2x/5x/10x speed;
- exit-and-resume;
- cross-platform reuse;
- active skill effects;
- future replay and multiplayer preparation.

## Current Runtime Shape

The current implementation uses a compact TypeScript runtime schema under `src/game-core/types.ts`.

```ts
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
  heroes: readonly Hero[];
  enemies: readonly Enemy[];
  pendingActions: readonly GameAction[];
  towerSlots: readonly TowerSlotState[];
  obstacles: readonly ObstacleState[];
  wave: WaveRuntimeState;
}>;
```

## Core Types

```ts
export type GameStatus = "ready" | "running" | "paused" | "won" | "lost";
export type GameSpeed = 1 | 2 | 5 | 10;
```

## ResourceState

```ts
export type ResourceState = Readonly<{
  gold: number;
  manaCrystal: number;
}>;
```

`baseHealth` and `maxBaseHealth` currently represent remaining Ancient Crystals and maximum Ancient Crystals.

## GameClock

```ts
export type GameClock = Readonly<{
  tick: number;
  fixedDeltaMs: number;
  speed: GameSpeed;
  paused: boolean;
}>;
```

## WaveRuntimeState

```ts
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
```

## Enemy

```ts
export type StatusEffectType = "slow" | "stun";

export type StatusEffectState = Readonly<{
  type: StatusEffectType;
  remainingTicks: number;
  speedMultiplier?: number;
  sourceHeroId?: EntityId;
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
```

Rules:

- status effects must be serializable;
- status duration is stored in fixed ticks, not wall-clock timers;
- `slow` modifies enemy movement speed through `speedMultiplier`;
- `stun` sets effective movement speed to zero while active;
- active skill combo detection reads these status effects from `GameState`.

## Hero

```ts
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
```

## HeroConfig Skill Fields

```ts
export type SkillKind = "direct-damage" | "hook" | "frost" | "storm-chain" | "moonblade";
```

Hero skill behavior is data-driven through optional config fields:

- `skillKind`;
- `skillManaCost`;
- `skillCooldownMs`;
- `skillDamage`;
- `skillPullDistance`;
- `skillStunMs`;
- `skillSlowMs`;
- `skillSlowMultiplier`;
- `skillRadius`;
- `skillJumpCount`;
- `skillJumpRadius`;
- `skillJumpDecay`;
- `skillBonusJumpsVsStatus`;
- `skillBounceCount`;
- `skillBounceDecay`;
- `skillBonusDamageVsStatusMultiplier`.

## BattleSnapshot

```ts
export type GameSnapshot = Readonly<{
  savedAtTick: number;
  state: GameState;
}>;
```

## GameAction

```ts
export type GameAction =
  | Readonly<{ type: "START" }>
  | Readonly<{ type: "PAUSE" }>
  | Readonly<{ type: "RESUME" }>
  | Readonly<{ type: "SET_SPEED"; speed: GameSpeed }>
  | Readonly<{ type: "START_NEXT_WAVE" }>
  | Readonly<{ type: "BUILD_HERO"; slotId: EntityId; heroArchetype: string }>
  | Readonly<{ type: "PLACE_HERO"; hero: Hero }>
  | Readonly<{ type: "CAST_SKILL"; heroId: EntityId; targetEnemyId: EntityId }>
  | Readonly<{ type: "SPAWN_ENEMY"; enemy: Enemy }>;
```

## Save Timing

| Scenario | Save? |
|---|---|
| manual save and exit | yes |
| app background | yes |
| WeChat onHide | yes |
| wave end | yes |
| boss start | yes |
| battle end | clear battle snapshot, write meta save |

## Restore Rules

1. Load BattleSnapshot.
2. Validate snapshot version.
3. Validate levelId.
4. Restore GameState.
5. Force unfinished battle status to `paused`.
6. Show resume confirmation.
7. User confirmation resumes simulation.

## MVP Cut

Implemented or active in Demo 0.1 core:

- GameStatus;
- GameSpeed;
- ResourceState;
- WaveRuntimeState;
- Enemy;
- Hero;
- GameAction;
- minimal GameSnapshot;
- status effects for slow/stun;
- hero-specific active skill config.

Can defer:

- checksum;
- replay;
- projectile runtime;
- complex buffs;
- complete statistics.

## Self Review

Review Result: Pass

Main Issues: Current schema still uses compact runtime names rather than final design names like `heroTowers` and `baseCrystals`.

Required Changes: Keep schema serializable and avoid platform-owned skill state.

Risk Level: Medium
