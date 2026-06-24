---
doc_id: TECH_ARCHITECTURE
version: 0.4.0
status: active
owner_agent: Technical Architect Agent
last_updated: 2026-06-24
change_summary: current core-first architecture with Web Preview platform adapter
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

## Current Repository Structure

```text
src/
  game-core/
    index.ts
    types.ts
    state.ts
    simulation.ts
    hud.ts
    level.ts
    random.ts
    simulation.test.ts

platform-web/
  index.html
  styles.css
  dev-server.mjs
  tsconfig.json
  src/
    main.ts

docs/
```

The current repository is a single TypeScript package. `src/game-core` is the platform-neutral core. Platform adapters are added beside it as separate folders.

## Target Multi-Platform Structure

```text
src/game-core/
platform-web/
platform-harmony/
platform-wechat/
docs/
```

`platform-web` is a Web Playtest Preview shell. It is allowed to use DOM, Canvas, CSS, and `localStorage`, but it must not move battle-result logic out of `src/game-core`.

## Platform Boundary

```text
Platform input
  ↓
GameAction
  ↓
src/game-core simulation
  ↓
GameState / HudState
  ↓
Platform rendering
```

Rules:

- battle-result state must be in `GameState`;
- platform input must become `GameAction`;
- randomness must use `SeededRandom` / `randomState` helpers;
- timing must use fixed tick simulation;
- persistence must use Battle Snapshot helpers;
- rendering must read state but not own state;
- platform code may store local snapshots, but snapshot shape remains owned by the core.

## Phase 1 Implementation Order

1. GameState
2. GameAction
3. GameClock / fixed tick
4. SeededRandom
5. Map config
6. Enemy movement
7. Tower construction
8. Auto targeting and attack
9. Wave system
10. Minimal HUD adapter
11. Battle Snapshot
12. Web Playtest Preview shell

## Fixed Tick Loop

```text
realDelta
↓
accumulator += realDelta
↓
while accumulator >= fixedStep and substeps < maxSubSteps:
    game.stepSimulation(1 fixed tick)
    accumulator -= fixedStep
↓
render(GameState)
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

Speed is represented in core state. The platform loop should call fixed-step advancement; the core applies the active speed multiplier.

Pause:

```text
clock.paused = true
effective fixed ticks = 0
```

## Web Preview Strategy

The Web Preview is the first visual validation layer for Demo 0.1.

It must validate:

- whether Level 001 path and slots are readable;
- whether 1x/2x/5x/10x feel stable;
- whether enemy theft and recovery are visible enough;
- whether build/select/cast interactions are understandable;
- whether save/continue works through core snapshots.

It must not become a separate game implementation.

## Technical Risks

| Risk | Level | Mitigation |
|---|---|---|
| 10x performance | High | fixed tick, max substeps, limit active units |
| projectile misses | Medium | fixed step and swept collision later |
| incomplete resume | High | centralized GameState and snapshot restore |
| platform pollution | High | adapter boundary review |
| ArkTS / TS differences | Medium | early compatibility validation |
| Web Preview divergence | Medium | Web reads GameState and dispatches GameAction only |

## Phase 1 Acceptance Criteria

- GameState can be created, updated, serialized, and restored;
- GameClock supports pause and 1x/2x/5x/10x;
- enemies can move along LEVEL_001 path;
- 10x does not skip path endpoint;
- heroes can be built and attack;
- UI only reads GameState;
- all player input reaches core as GameAction;
- Web Preview can visualize and operate the current Demo 0.1 core loop.

## Self Review

Review Result: Pass

Main Issues: Web Preview introduces DOM/Canvas code, so the platform boundary must stay explicit.

Required Changes: Keep all authoritative battle logic inside `src/game-core`; use Web Preview for validation only.

Risk Level: Medium
