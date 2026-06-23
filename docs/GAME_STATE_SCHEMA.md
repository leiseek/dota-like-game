---
doc_id: GAME_STATE_SCHEMA
version: 0.2.0
status: active
owner_agent: Technical Architect Agent
last_updated: 2026-06-23
change_summary: serializable battle state schema
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
- future replay and multiplayer preparation.

## Top-level Shape

```ts
export interface GameState {
  schemaVersion: number;
  levelId: string;
  status: GameStatus;
  elapsedMs: number;
  tick: number;
  randomSeed: number;
  rngState: number;
  speed: GameSpeed;
  isPaused: boolean;
  resources: ResourceState;
  wave: WaveState;
  map: MapRuntimeState;
  enemies: EnemyState[];
  heroTowers: HeroTowerState[];
  projectiles: ProjectileState[];
  obstacles: ObstacleState[];
  droppedCrystals: DroppedCrystalState[];
  skills: SkillRuntimeState;
  tutorial: TutorialState;
  statistics: BattleStatistics;
}
```

## Core Types

```ts
export type GameStatus = 'READY' | 'RUNNING' | 'PAUSED' | 'VICTORY' | 'DEFEAT';
export type GameSpeed = 1 | 2 | 5 | 10;
```

## ResourceState

```ts
export interface ResourceState {
  gold: number;
  manaCrystal: number;
  baseCrystals: number;
  maxBaseCrystals: number;
}
```

## WaveState

```ts
export interface WaveState {
  currentWaveIndex: number;
  totalWaves: number;
  waveElapsedMs: number;
  nextSpawnElapsedMs: number;
  isWaveActive: boolean;
  isWaitingNextWave: boolean;
  spawnedCountInWave: number;
  killedCountInWave: number;
}
```

## EnemyState

```ts
export interface EnemyState {
  id: string;
  enemyTypeId: string;
  hp: number;
  maxHp: number;
  armor: number;
  magicResist: number;
  x: number;
  y: number;
  pathIndex: number;
  pathProgress: number;
  direction: 'FORWARD' | 'RETURNING';
  baseSpeed: number;
  currentSpeedMultiplier: number;
  isAlive: boolean;
  isCarryingCrystal: boolean;
  carriedCrystalCount: number;
  statusEffects: StatusEffectState[];
  shieldHp: number;
  targetPriorityModifier: number;
}
```

## HeroTowerState

```ts
export interface HeroTowerState {
  id: string;
  heroId: string;
  slotId: string;
  level: 1 | 2 | 3;
  x: number;
  y: number;
  attackCooldownMs: number;
  skillCooldownMs: number;
  totalCost: number;
  targetEnemyId?: string;
  temporaryBuffs: BuffState[];
}
```

## BattleSnapshot

```ts
export interface BattleSnapshot {
  snapshotVersion: number;
  createdAt: number;
  appVersion: string;
  gameState: GameState;
  checksum?: string;
}
```

## GameAction

```ts
export type GameAction =
  | { type: 'BUILD_HERO'; slotId: string; heroId: string }
  | { type: 'UPGRADE_HERO'; towerId: string; branchId?: string }
  | { type: 'SELL_HERO'; towerId: string }
  | { type: 'CAST_SKILL'; towerId: string; targetX?: number; targetY?: number; targetEnemyId?: string }
  | { type: 'SET_SPEED'; speed: GameSpeed }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'START_NEXT_WAVE' }
  | { type: 'SELECT_ENTITY'; entityId: string }
  | { type: 'CLEAR_SELECTION' };
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
5. Force status to `PAUSED`.
6. Show resume confirmation.
7. User confirmation resumes simulation.

## MVP Cut

Phase 1 must implement:

- GameStatus;
- GameSpeed;
- ResourceState;
- WaveState;
- EnemyState;
- HeroTowerState;
- GameAction;
- minimal BattleSnapshot.

Can defer:

- checksum;
- replay;
- complex buffs;
- complete statistics.
