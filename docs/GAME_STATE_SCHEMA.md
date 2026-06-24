---
doc_id: GAME_STATE_SCHEMA
version: 0.7.0
status: active
owner_agent: Technical Architect Agent
last_updated: 2026-06-24
change_summary: returning crystal path state added
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
- explicit crystal theft, drop, return, re-steal, recovery, and escape feedback;
- win/lose/star settlement;
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
  settlement: SettlementState;
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

## CrystalState

```ts
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
```

Rules:

- `safe`: crystal is at the Ancient and has not recently been contested;
- `carried`: an enemy is carrying the crystal back toward the start;
- `dropped` / `returning`: the carrier died and the crystal is moving back toward the Ancient as an independent path object;
- `recovered`: the returning crystal reached the Ancient;
- `escaped`: a carrier reached the start with the crystal and the battle is lost;
- returning crystals move at `returnSpeedUnitsPerSecond`, currently initialized to half the killed carrier archetype speed;
- monsters can intercept a returning crystal by reaching its position, immediately becoming the new carrier;
- monsters that reach the Ancient while the crystal is away wait at the endpoint instead of silently disappearing;
- no platform adapter may infer crystal events from enemy removal alone.

## SettlementState

```ts
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
```

Settlement rules for Demo 0.1:

- running battles keep `outcome: "pending"`;
- clearing all waves creates a `victory` settlement only when no crystal is being carried or returning;
- crystal escape creates a `defeat` settlement with reason `crystal-escaped`;
- base crystal depletion creates a `defeat` settlement with reason `base-crystals-depleted`;
- defeat always gives 0 stars;
- victory gives 3 stars when all crystals remain;
- victory gives 2 stars when at least 50% of crystals remain;
- victory gives 1 star when at least 1 crystal remains.

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

## HUD Crystal State

`HudCrystalState` exposes crystal status, carrier ids, latest event, counters, and returning crystal path position. Platform adapters should render returning crystals from the HUD/core state rather than owning separate crystal motion.

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
- hero-specific active skill config;
- explicit crystal stolen/dropped/returning/recovered/escaped state;
- win/lose/star settlement state.

Can defer:

- checksum;
- replay;
- projectile runtime;
- complex buffs;
- complete statistics;
- physical multi-crystal inventory entities.

## Self Review

Review Result: Pass

Main Issues: Returning crystal state is now authoritative, but visuals are still placeholder and should be improved through VFX-001.

Required Changes: Keep returning crystal mechanics in `GameState` and expose it through HUD selectors.

Risk Level: Medium
