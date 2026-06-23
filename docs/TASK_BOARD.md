---
doc_id: TASK_BOARD
version: 0.3.3
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-23
change_summary: WAVE-001 auto scheduling completed
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
| ENEMY-001 | enemy path movement | Engineering | Todo | 1x/10x endpoint-safe |
| WAVE-001 | wave system | Engineering | Done | START_NEXT_WAVE, timed auto-start, deterministic spawning, kill counts, and final-wave victory covered by tests |
| TOWER-001 | build hero tower | Engineering | Todo | cost, slot occupancy |
| COMBAT-001 | auto target and basic attack | Engineering | Todo | enemy HP/death/gold |
| HUD-001 | minimal HUD | UX/UI + Engineering | Todo | crystals, gold, mana, wave, pause, speed |
| SAVE-001 | minimal Battle Snapshot | Engineering | Todo | restore to paused state |
| REVIEW-002 | Phase 1 Technical Review | Self Review | Todo | GameClock + GameState pass review |

## Current Implementation Note

`MAP-001` and `WAVE-001` are now complete for the current core foundation. The next safest continuation is `ENEMY-001` path movement with endpoint-safe 1x/10x behavior before tower combat or rendering adapters.

## Self Review

Review Result: Pass
Main Issues: Enemy movement still uses normalized progress rather than the documented multi-point path; obstacle destruction behavior is data-only and not interactable yet.
Required Changes: Implement ENEMY-001 endpoint-safe path movement and then TOWER-001 build validation.
Risk Level: Medium
