---
doc_id: TASK_BOARD
version: 0.3.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-23
change_summary: task board with Codex handoff and Phase 1 first tasks
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
| CORE-FOUNDATION-001 | game-core foundation | Codex / Engineering | Todo | types, state, action, clock, RNG, configs |
| CORE-002 | GameState type definitions | Engineering | Todo | create, serialize, deserialize |
| CORE-003 | GameAction entry | Engineering | Todo | UI input becomes actions |
| CORE-004 | GameClock / fixed tick | Engineering | Todo | pause and 1x/2x/5x/10x |
| CORE-005 | SeededRandom | Engineering | Todo | same seed reproducible |
| MAP-001 | LEVEL_001 config | Engineering | Todo | path, slots, obstacles loaded |
| ENEMY-001 | enemy path movement | Engineering | Todo | 1x/10x endpoint-safe |
| WAVE-001 | wave system | Engineering | Todo | 10 waves by config |
| TOWER-001 | build hero tower | Engineering | Todo | cost, slot occupancy |
| COMBAT-001 | auto target and basic attack | Engineering | Todo | enemy HP/death/gold |
| HUD-001 | minimal HUD | UX/UI + Engineering | Todo | crystals, gold, mana, wave, pause, speed |
| SAVE-001 | minimal Battle Snapshot | Engineering | Todo | restore to paused state |
| REVIEW-002 | Phase 1 Technical Review | Self Review | Todo | GameClock + GameState pass review |

## Codex First Task

Codex should execute `CORE-FOUNDATION-001` only after this docs-only PR is merged or used as context.

## Current Blocker

No implementation should start in this docs-only PR.

## Next Recommended Action

After docs-only baseline is approved, create a separate implementation PR for `CORE-FOUNDATION-001`.
