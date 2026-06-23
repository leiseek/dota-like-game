---
doc_id: TECH_ARCHITECTURE
version: 0.2.0
status: active
owner_agent: Technical Architect Agent
last_updated: 2026-06-23
change_summary: core-first technical architecture baseline
---

# Technical Architecture

## Core Principle

The project uses a core-first architecture.

```text
Battle logic is platform-neutral.
Platform layers handle input, rendering, storage, and lifecycle only.
UI does not own battle state.
GameState is the single source of truth.
```

## Target Structure

```text
game-core/
  src/
    core/
      Game.ts
      GameClock.ts
      GameState.ts
      GameAction.ts
      SeededRandom.ts
    entity/
      Enemy.ts
      HeroTower.ts
      Projectile.ts
      Obstacle.ts
      Crystal.ts
    system/
      WaveSystem.ts
      CombatSystem.ts
      SkillSystem.ts
      TargetingSystem.ts
      CrystalSystem.ts
      SaveSystem.ts
    data/
      HeroConfig.ts
      EnemyConfig.ts
      MapConfig.ts
      WaveConfig.ts
    types/
      GameTypes.ts

platform-harmony/
platform-wechat/
docs/
```

## Phase 1 Implementation Order

1. GameState.ts
2. GameAction.ts
3. GameClock.ts
4. SeededRandom.ts
5. Map config
6. Enemy movement
7. Tower construction
8. Auto targeting and attack
9. Wave system
10. Minimal HUD adapter
11. Battle Snapshot

## Fixed Tick Loop

```text
realDelta
↓
scaledDelta = realDelta * gameSpeed
↓
accumulator += scaledDelta
↓
while accumulator >= fixedStep:
    game.fixedUpdate(fixedStep)
    accumulator -= fixedStep
↓
render(interpolation)
```

Recommended:

```text
fixedStepMs = 33.333
maxSubStepsPerFrame = 12
```

## Speed Strategy

Supported speeds:

```text
1x / 2x / 5x / 10x
```

Pause:

```text
isPaused = true
effectiveDelta = 0
```

## Architecture Rules

- battle-result state must be in GameState;
- platform input must become GameAction;
- randomness must use SeededRandom;
- timing must use GameClock;
- persistence must use BattleSnapshot;
- rendering must read state but not own state.

## Technical Risks

| Risk | Level | Mitigation |
|---|---|---|
| 10x performance | High | fixed tick, max substeps, limit active units |
| projectile misses | Medium | fixed step and swept collision later |
| incomplete resume | High | centralized GameState |
| platform pollution | High | adapter boundary review |
| ArkTS / TS differences | Medium | early compatibility validation |

## Phase 1 Acceptance Criteria

- GameState can be created, updated, serialized, and restored;
- GameClock supports pause and 1x/2x/5x/10x;
- enemies can move along LEVEL_001 path;
- 10x does not skip path endpoint;
- heroes can be built and attack;
- UI only reads GameState;
- all player input reaches core as GameAction.
