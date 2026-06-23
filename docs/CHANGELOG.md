---
doc_id: CHANGELOG
version: 0.3.3
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-23
change_summary: timed wave auto-start scheduling recorded
---

# Changelog

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
