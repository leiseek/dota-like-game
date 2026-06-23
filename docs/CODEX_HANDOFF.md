---
doc_id: CODEX_HANDOFF
version: 0.3.0
status: active
owner_agent: AI Workflow Agent
last_updated: 2026-06-23
change_summary: Codex execution handoff for the v0.3.0 documentation baseline
---

# CODEX_HANDOFF.md

## Purpose

This document tells Codex how to work on Ancient Defense / dota-like-game.

Codex should treat repository documents as the durable source of project context. The long ChatGPT conversation is intentionally summarized into versioned docs.

## Current Context

Project:

> Ancient Defense / dota-like-game

Type:

> 2D / pseudo-2.5D hero-skill tower-defense game.

Core loop:

```text
Enter level
↓
Build hero towers
↓
Enemies follow path
↓
Hero towers auto-attack
↓
Player casts active skills
↓
Enemies steal crystals at the base
↓
Player controls / bursts / slows enemies to recover crystals
↓
Upgrade heroes
↓
Defeat boss
↓
Win / lose / star-rating settlement
```

## Current Version

Document baseline: `v0.3.0`

Previous baseline:

- `v0.1.0`: project organization and AI Agent framework
- `v0.2.0`: playable-design preparation
- `v0.3.0`: Codex handoff and repo instruction layer

## Required Reading

Codex must read `AGENTS.md` first.

Then read:

1. `docs/TASK_BOARD.md`
2. `docs/TECH_ARCHITECTURE.md`
3. `docs/GAME_STATE_SCHEMA.md`
4. `docs/LEVEL_001.md`
5. `docs/HERO_DESIGN.md`
6. `docs/UI_UX_SPEC.md`
7. `docs/SELF_REVIEW_PROCESS.md`

## Phase 1 Goal

Implement the initial `game-core` foundation.

The goal is not visual polish. The goal is stable, serializable, platform-neutral simulation.

## Phase 1 First Task Bundle

### Task Bundle: CORE-FOUNDATION-001

Implement these files later, when coding is explicitly requested:

```text
game-core/
└── src/
    ├── types/GameTypes.ts
    ├── core/GameState.ts
    ├── core/GameAction.ts
    ├── core/GameClock.ts
    ├── core/SeededRandom.ts
    └── data/
        ├── Level001Config.ts
        └── HeroConfig.ts
```

## Current PR Note

This v0.3.0 PR is documentation-only. Do not add implementation code in this PR.

## Acceptance Criteria for Future Code Task

- `game-core` has no dependency on ArkUI, HarmonyOS, WeChat, browser DOM, or Canvas.
- GameState can be created and serialized.
- GameState can be deserialized and cloned.
- GameClock supports pause and 1x/2x/5x/10x.
- Basic GameAction reducer can set speed, pause, resume, start next wave, and build a hero.
- Level 001 config matches `docs/LEVEL_001.md`.
- Hero config matches `docs/HERO_DESIGN.md`.
- `docs/TASK_BOARD.md` and `docs/CHANGELOG.md` are updated.
- Self Review is included in the PR description.

## Explicit Non-Goals for This Docs PR

Do not implement:

- Rendering;
- ArkTS UI;
- WeChat Mini Game shell;
- Enemy movement;
- Tower attacks;
- Skills;
- Save persistence adapter;
- Full battle simulation;
- Audio;
- Art assets.
