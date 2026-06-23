---
doc_id: CHANGELOG
version: 0.3.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-23
change_summary: v0.3.0 complete documentation baseline
---

# Changelog

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
