---
doc_id: CHANGELOG
version: 0.4.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: Web Playtest Preview shell recorded
---

# Changelog

## [0.4.0] - 2026-06-24

### Added

- Added `platform-web` Web Playtest Preview shell with Canvas rendering for Level 001 path, tower slots, obstacles, hero towers, enemies, HP bars, selected hero range, and crystal carrier marker.
- Added Web controls for start, pause/resume, 1x/2x/5x/10x speed cycling, start-next-wave, hero build selection, local save/continue, and saved-battle abandon.
- Added click interactions for building heroes on unlocked slots, selecting built hero towers, and casting active skills on enemies through core `GameAction` values.
- Added `docs/WEB_PREVIEW_SPEC.md` to document the Web Preview purpose, platform boundary, commands, implemented interactions, and non-goals.
- Added zero-dependency `platform-web/dev-server.mjs` preview server and Web TypeScript build config.

### Changed

- Updated README to reflect the current implementation instead of the old docs-only baseline.
- Updated technical architecture to record the actual `src/game-core` plus `platform-web` structure.
- Added ADR-0006 accepting Web Playtest Preview before native platform shells.
- Updated task board to mark `WEB-001` done while keeping `SKILL-002` as the next Demo 0.1 gameplay task.
- Updated package scripts with `build:web`, `preview:web`, and Web compilation in `check`.

### Self Review

Review Result: Pass
Main Issues: Web Preview uses placeholder visuals and should not become authoritative gameplay logic.
Required Changes: Continue with `SKILL-002`, then validate hero-specific skill effects through Web Preview.
Risk Level: Medium

## [0.3.10] - 2026-06-24

### Added

- Added per-hero active skill mana cost, cooldown, and damage values to Level 001 hero configs.
- Added `CAST_SKILL` handling for target validation, mana checks, configured damage, configured cooldown ticks, gold rewards on skill kills, and crystal recovery on carrier kills.
- Added regression coverage for Level 001 skill mana spend, configured damage, cooldown, invalid target rejection, cooldown recast rejection, and insufficient mana rejection.
- Added the next Demo 0.1 task slice to the task board, with `SKILL-001` complete and `SKILL-002` next.

### Changed

- Advanced active skills from a hardcoded placeholder damage action to a data-driven resource/cooldown foundation.

### Self Review

Review Result: Pass
Main Issues: Hero-specific skill shapes and combos are still pending.
Required Changes: Continue with `SKILL-002` hero-specific active skill effects.
Risk Level: Medium

## [0.3.9] - 2026-06-24

### Added

- Added `PHASE_1_TECHNICAL_REVIEW.md` with the REVIEW-002 technical review for the game-core foundation.
- Recorded evidence for build/test status, platform-boundary scan, GameState/snapshot behavior, fixed tick, Level 001 data, enemy movement, combat, HUD, and Battle Snapshot restore.
- Captured follow-up risks for hero-specific active skills, explicit crystal recovery state, obstacle destruction, settlement, snapshot validation, and 10x stress testing.

### Changed

- Marked `REVIEW-002` done and closed the current Phase 1 core foundation task sequence.

### Self Review

Review Result: Pass
Main Issues: Demo 0.1 gameplay systems beyond the core foundation remain pending.
Required Changes: Start the next prioritized Demo 0.1 implementation slice while preserving core-first architecture.
Risk Level: Medium

## [0.3.8] - 2026-06-24

### Added

- Added restore-to-paused Battle Snapshot behavior for unfinished battles.
- Added pending-action clearing during snapshot restore so resume confirmation cannot accidentally replay stale input.
- Added regression coverage for paused restore state, preserved simulation data, and no-tick progression while restored state is awaiting resume.

### Changed

- Marked `SAVE-001` done and identified `REVIEW-002` as the next required continuation.

### Self Review

Review Result: Pass
Main Issues: Phase 1 Technical Review remains pending.
Required Changes: Continue with `REVIEW-002` in board order.
Risk Level: Medium

## [0.3.7] - 2026-06-24

### Added

- Added a platform-neutral HUD selector derived from authoritative `GameState`.
- Added HUD read-model fields for crystals, max crystals, gold, mana crystal, wave progress, pause/resume availability, start-next-wave availability, and 1x/2x/5x/10x speed options.
- Added max base crystal tracking to `GameState` so HUD display does not infer maximum crystals from mutable current crystal state.
- Added regression coverage for initial HUD top-bar values and running speed/control state.

### Changed

- Marked `HUD-001` done and identified `SAVE-001` as the next required continuation.

### Self Review

Review Result: Pass
Main Issues: Battle Snapshot restore-to-paused behavior remains pending.
Required Changes: Continue with `SAVE-001`, then `REVIEW-002` in board order.
Risk Level: Medium

## [0.3.6] - 2026-06-23

### Added

- Added hero tower auto-targeting for enemies in range, prioritizing enemies closest to the base by path progress.
- Added basic attack cooldowns, attack damage, attack range, and attack interval values for MVP hero configs.
- Added enemy gold rewards and reward payout when tower attacks kill enemies.
- Added wave kill-count integration for tower kills during active waves.
- Added regression coverage for tower targeting, enemy death, gold rewards, and wave completion via tower kills.

### Changed

- Marked `COMBAT-001` done and identified `HUD-001` as the next required continuation.

### Self Review

Review Result: Pass
Main Issues: Minimal HUD state/adapter surface and restore-to-paused Battle Snapshot behavior remain pending.
Required Changes: Continue with `HUD-001`, then `SAVE-001` and `REVIEW-002` in board order.
Risk Level: Medium

## [0.3.5] - 2026-06-23

### Added

- Added `BUILD_HERO` action handling for tower construction through the platform-neutral core.
- Added resource state with starting gold and mana crystal values from Level 001.
- Added Level 001 hero build configs for all four MVP heroes.
- Added regression coverage for successful build spending/slot occupancy and rejection of locked, occupied, unknown, and unaffordable builds.
- Added Task Board execution policy to continue Phase 1 P0 tasks in board order until all are done or blocked.

### Changed

- Marked `TOWER-001` done and identified `COMBAT-001` as the next required continuation.

### Self Review

Review Result: Pass
Main Issues: Auto targeting, basic attacks, kill rewards, HUD, and restore-to-paused Battle Snapshot behavior remain pending.
Required Changes: Continue with `COMBAT-001`, then `HUD-001`, `SAVE-001`, and `REVIEW-002` in board order.
Risk Level: Medium

## [0.3.4] - 2026-06-23

### Added

- Added multi-point path traversal for enemies using path segment index, segment progress, and serializable positions.
- Added per-archetype enemy movement speeds in Level 001 config.
- Added regression coverage for traversing all tutorial path segments before crystal theft and 10x endpoint-safe return behavior.

### Changed

- Marked `ENEMY-001` done and identified `TOWER-001` build validation as the next safest continuation.
- TypeScript now explicitly includes Node test type definitions for repository test builds.

### Self Review

Review Result: Pass
Main Issues: Tower build validation, resources, and slot occupancy are still pending; crystal theft at 10x is currently resolved through fixed substeps rather than visible intermediate UI events.
Required Changes: Continue with TOWER-001 build validation, then COMBAT-001 auto targeting and basic attacks.
Risk Level: Medium

## [0.3.3] - 2026-06-23

### Added

- Added timed wave auto-start scheduling using each configured wave `startsAtMs`.
- Added regression coverage proving configured waves remain waiting before their scheduled time and spawn deterministically after the threshold.

### Changed

- Marked `WAVE-001` done for the current core foundation.

### Self Review

Review Result: Pass
Main Issues: Enemy movement still needs endpoint-safe path traversal across Level 001 points; obstacles are not destructible yet.
Required Changes: Continue with ENEMY-001 path movement before tower combat or rendering adapters.
Risk Level: Medium

## [0.3.2] - 2026-06-23

### Added

- Added Level 001 tower slot and obstacle config to the platform-neutral core.
- Added serializable tower slot and obstacle runtime state initialization in `GameState`.
- Added wave kill counting and final-wave victory completion once all spawned enemies are cleared.
- Added regression tests for Level 001 map runtime data and last-wave completion.

### Changed

- Marked `MAP-001` done and refined `WAVE-001` remaining work to timed/auto-start scheduling.

### Self Review

Review Result: Pass
Main Issues: Obstacles are loaded as runtime state but are not yet destructible through actions/combat. Wave auto-start timing remains pending.
Required Changes: Continue with WAVE-001 auto scheduling, then ENEMY-001 endpoint-safe path movement.
Risk Level: Medium

## [0.3.1] - 2026-06-23

### Added

- Added `level001Config` with the documented Level 001 path, enemy archetypes, and 10-wave spawn table.
- Added wave runtime state and `START_NEXT_WAVE` handling for deterministic configured spawning.
- Added regression tests for Level 001 wave config and spawn scheduling.

### Changed

- Updated Phase 1 task status to mark core foundation tasks complete and wave/map tasks in progress.

### Self Review

Review Result: Pass
Main Issues: Slot/obstacle config and full wave-completion behavior remain pending.
Required Changes: Continue with MAP-001 slot/obstacle runtime data and WAVE-001 completion rules.
Risk Level: Medium

## [0.3.0] - 2026-06-23

### Added

- Added root `AGENTS.md` as the project-level AI Agent / Codex instruction file.
- Added `docs/CODEX_HANDOFF.md` as the Codex execution handoff document.
- Added complete docs-only baseline for AI Native project management.
- Added Codex reading order and future `CORE-FOUNDATION-001` task definition.
- Clarified that the v0.3.0 PR is documentation-only.

### Changed

- Project repository becomes a docs-first AI Native game development workspace.
- Codex should use repository files, not chat history, as durable context.
- Task board now includes Codex handoff and future game-core foundation tasks.

### Risks

- Codex may drift from architecture if it skips `AGENTS.md`.
- First implementation task must avoid premature rendering or platform coupling.
- ArkTS compatibility still requires later validation.

## [0.2.0] - 2026-06-23

### Added

- Phase 0 Self Review.
- First level detailed design.
- First four hero designs.
- Battle HUD and UX spec.
- GameState schema.

### Changed

- Moved from concept baseline to playable-design preparation.

### Risks

- First level and hero values require playtest.
- 10x speed requires careful fixed-tick handling.

## [0.1.0] - 2026-06-23

### Added

- Established AI Native Studio workflow.
- Established full AI Agent Team roles.
- Defined the project as a hero-skill tower defense game.
- Added pause, resume, exit-and-resume, and 1x/2x/5x/10x as MVP requirements.
- Added HarmonyOS and WeChat Mini Game platform strategy.
- Adopted core-first architecture.
