---
doc_id: TASK_BOARD
version: 0.4.1
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: SKILL-002 hero-specific active skill effects completed
---

# Task Board

## Status Definitions

| Status | Meaning |
|---|---|
| Todo | not started |
| In Progress | being worked on |
| Review | waiting for Self Review |
| Done | complete |
| Blocked | blocked |

## Completed Documentation Tasks

| Task ID | Title | Owner Agent | Status | Result |
|---|---|---|---|---|
| DOC-001 | establish version tracking | Team Leader | Done | version index + changelog + decisions |
| DOC-002 | establish MVP scope | Producer | Done | Must/Should/Could/Won't Have |
| DOC-003 | establish Self Review | Self Review | Done | SRG gate |
| TECH-001 | define core-first architecture | Architect | Done | GameState, GameAction, fixed tick |
| REVIEW-001 | Phase 0 Self Review | Self Review | Done | Phase 1 allowed |
| GAME-001 | first level design | Level Designer | Done | LEVEL_001.md |
| GAME-002 | first four heroes | Combat Designer | Done | HERO_DESIGN.md |
| UX-001 | battle HUD draft | UX/UI | Done | UI_UX_SPEC.md |
| CORE-001 | GameState schema | Architect | Done | GAME_STATE_SCHEMA.md |
| CODEX-001 | Codex handoff files | AI Workflow | Done | AGENTS.md + CODEX_HANDOFF.md |

## Phase 1 P0 Tasks

| Task ID | Title | Owner Agent | Status | Acceptance Summary |
|---|---|---|---|---|
| CORE-FOUNDATION-001 | game-core foundation | Codex / Engineering | Done | platform-neutral TypeScript core, state, action, clock, RNG, configs, snapshots, tests |
| CORE-002 | GameState type definitions | Engineering | Done | create, serialize, deserialize, snapshot clone tests |
| CORE-003 | GameAction entry | Engineering | Done | start, pause, resume, speed, skill, spawn, start-next-wave actions |
| CORE-004 | GameClock / fixed tick | Engineering | Done | pause and 1x/2x/5x/10x covered by tests |
| CORE-005 | SeededRandom | Engineering | Done | deterministic seeded random utility added |
| MAP-001 | LEVEL_001 config | Engineering | Done | documented path, slots, obstacles, enemy archetypes, and waves loaded into core state/config |
| ENEMY-001 | enemy path movement | Engineering | Done | multi-point path traversal, per-archetype speed, and 10x endpoint-safe behavior covered by tests |
| WAVE-001 | wave system | Engineering | Done | START_NEXT_WAVE, timed auto-start, deterministic spawning, kill counts, and final-wave victory covered by tests |
| TOWER-001 | build hero tower | Engineering | Done | BUILD_HERO validates hero config, gold cost, unlocked slot, and slot occupancy |
| COMBAT-001 | auto target and basic attack | Engineering | Done | hero tower target selection, attack cooldowns, enemy HP/death, gold rewards, and wave kill counts covered by tests |
| HUD-001 | minimal HUD | UX/UI + Engineering | Done | platform-neutral HUD selector exposes crystals, gold, mana, wave, pause/resume availability, and 1x/2x/5x/10x speed state |
| SAVE-001 | minimal Battle Snapshot | Engineering | Done | restore unfinished snapshots to paused state, preserve simulation data, and clear pending actions before resume confirmation |
| REVIEW-002 | Phase 1 Technical Review | Self Review | Done | Phase 1 game-core foundation accepted with medium follow-up risk; see PHASE_1_TECHNICAL_REVIEW.md |

## Web Preview Tasks

| Task ID | Title | Owner Agent | Status | Acceptance Summary |
|---|---|---|---|---|
| WEB-001 | Web Playtest Preview shell | Platform Web + Engineering | Done | zero-dependency Canvas preview renders Level 001 state, dispatches GameAction controls, supports build/select/cast, pause/resume, 1x/2x/5x/10x, start-next-wave, and local snapshot continue |

## Next Demo 0.1 Tasks

| Task ID | Title | Owner Agent | Status | Acceptance Summary |
|---|---|---|---|---|
| SKILL-001 | active skill resource and cooldown foundation | Engineering | Done | CAST_SKILL uses per-hero mana cost, cooldown, configured damage, target validation, reward payout, carrier recovery, and rejection tests |
| SKILL-002 | hero-specific active skill effects | Engineering + Combat | Done | hook pull/stun, frost area slow, storm chain jumps, ice combo bonus jumps, and moonblade bounce burst covered by regression tests |
| CRYSTAL-001 | explicit crystal recovery runtime state | Engineering | Todo | stolen/dropped/recovered crystals are represented in GameState and HUD |
| SETTLEMENT-001 | win/lose/star settlement | Engineering + UX | Todo | settlement state and star rating based on remaining crystals |

## Execution Policy

Unless the Project Owner explicitly asks to pause, continue implementing Demo 0.1 tasks in priority order. Visual validation through `platform-web` is allowed when it helps verify the core loop, but authoritative gameplay logic must remain in `src/game-core`.

## Current Implementation Note

`MAP-001`, `WAVE-001`, `ENEMY-001`, `TOWER-001`, `COMBAT-001`, `HUD-001`, `SAVE-001`, `REVIEW-002`, `SKILL-001`, `SKILL-002`, and `WEB-001` are complete. Continue with `CRYSTAL-001` explicit crystal recovery runtime state unless the owner reprioritizes settlement work.

## Self Review

Review Result: Pass

Main Issues: Explicit crystal recovery state, obstacle destruction, settlement, stronger snapshot validation, and Web Preview polish remain follow-up work for Demo 0.1.

Required Changes: Continue with `CRYSTAL-001` while preserving core-first architecture and using Web Preview only as a platform adapter.

Risk Level: Medium
