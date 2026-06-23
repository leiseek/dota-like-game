# AGENTS.md

This repository is an AI Native game development project for **Ancient Defense / dota-like-game**.

The project is a 2D / pseudo-2.5D hero-skill tower-defense game. The player builds hero towers, casts active skills, combines effects, and prevents enemies from stealing Ancient Crystals.

## Project Governance

- Project Owner: Zach / ifanvip
- Team Leader Agent: ChatGPT
- Execution Model: AI Native Agent Team
- Current document baseline: v0.3.0
- Current phase: Phase 1 preparation / game-core implementation

## Mandatory Reading Order

Before implementing any task, read these files in order:

1. `docs/DOC_VERSION_INDEX.md`
2. `docs/DECISIONS.md`
3. `docs/TASK_BOARD.md`
4. `docs/MVP_SCOPE.md`
5. `docs/TECH_ARCHITECTURE.md`
6. `docs/GAME_STATE_SCHEMA.md`
7. `docs/LEVEL_001.md`
8. `docs/HERO_DESIGN.md`
9. `docs/UI_UX_SPEC.md`
10. `docs/SELF_REVIEW_PROCESS.md`

For task handoff instructions, read:

- `docs/CODEX_HANDOFF.md`

## Core Product Direction

This is not a generic tower defense game.

The core experience is:

> Build hero towers, use MOBA-like active skills, create skill combos, and recover crystals stolen by enemies.

The MVP must validate:

1. Hero tower construction;
2. Enemy path movement;
3. Auto-targeting and attacks;
4. Active hero skills;
5. Enemies stealing crystals and returning;
6. Player recovering stolen crystals;
7. Pause / resume;
8. Speed controls: 1x / 2x / 5x / 10x;
9. Exit-and-resume using Battle Snapshot;
10. Complete win/lose/star-rating flow.

## Non-Negotiable Architecture Rules

### 1. Core-first

Game logic must be implemented in `game-core`.

Do not bind battle logic to ArkUI, HarmonyOS APIs, WeChat Mini Game APIs, DOM, Canvas, or rendering code.

Expected structure:

```text
game-core/
platform-harmony/
platform-wechat/
docs/
```

### 2. GameState is the single source of truth

All battle-result-related state must live in `GameState`.

UI, rendering, platform lifecycle handlers, and input layers must not own authoritative battle state.

### 3. All input becomes GameAction

Platform input should be converted into `GameAction` before reaching the game core.

### 4. Fixed tick is required

Pause, 2x, 5x, 10x, replay potential, and Battle Snapshot recovery all depend on fixed tick simulation.

Do not implement the game loop as unbounded `deltaTime * speed` movement.

### 5. Battle Snapshot is required

Exit-and-resume is a P0 feature.

Any implementation that prevents serializing and restoring battle state is unacceptable.

### 6. Platform portability

The game should eventually support HarmonyOS / ArkTS native shell and WeChat Mini Game shell. Keep the game core platform-neutral.

## MVP Scope Control

Do not implement these yet unless explicitly assigned:

- Real-time multiplayer;
- Gacha system;
- Full campaign;
- 3D rendering;
- Complex external economy;
- Full hero talent tree;
- Advanced social features;
- Final art pipeline.

Focus on Demo 0.1.

## Documentation Requirements

Every meaningful implementation must update:

1. `docs/TASK_BOARD.md`
2. `docs/CHANGELOG.md`

If the work changes architecture, MVP scope, platform strategy, or core gameplay, also update `docs/DECISIONS.md`.

## Self Review Requirement

Before finishing a task, perform a Self Review using `docs/SELF_REVIEW_PROCESS.md`.

## Most Important Rule

When in doubt, preserve the MVP and core architecture.

Do not make the project bigger before the first playable core loop works.
