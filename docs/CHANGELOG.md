---
doc_id: CHANGELOG
version: 0.4.3
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: win/lose/star settlement recorded
---

# Changelog

## [0.4.3] - 2026-06-24

### Added

- Added `SettlementState` with outcome, reason, completion flag, star rating, remaining crystals, max crystals, recovered crystals, stolen crystals, escaped crystals, and completion tick.
- Added Demo 0.1 star rules: 3 stars for all crystals, 2 stars for at least 50%, 1 star for at least one crystal, and 0 stars for defeat.
- Added settlement finalization for all-waves-cleared victory, crystal-escaped defeat, and base-crystals-depleted defeat.
- Added settlement exposure through the platform-neutral HUD selector.
- Added Web Preview settlement overlay with outcome, stars, reason, and remaining crystals.
- Added regression coverage for pending settlement, 3-star victory, 2-star victory, 1-star victory, crystal-escaped defeat, and base-crystals-depleted defeat.

### Changed

- Updated GameState schema documentation for settlement runtime state.
- Updated UI/UX spec with settlement display requirements.
- Marked `SETTLEMENT-001` complete and moved next work to Web Preview smoke playtest and Demo 0.1 core self review.

### Self Review

Review Result: Pass
Main Issues: Star thresholds are MVP-simple and need playtest tuning after Web Preview validation.
Required Changes: Run the PR stack locally, validate Web Preview readability, and perform Demo 0.1 Core Self Review.
Risk Level: Medium

## [0.4.2] - 2026-06-24

### Added

- Added explicit `CrystalState` runtime status for safe, carried, recovered, and escaped states.
- Added crystal event tracking for stolen, dropped, recovered, and escaped feedback.
- Added stolen, dropped, recovered, and escaped counters to support HUD, review, and future settlement logic.
- Added `HudCrystalState` through the platform-neutral HUD selector.
- Added Web Preview HUD text for crystal status and Canvas labels for slow/stun readability.
- Added regression coverage for initial safe crystal state, stolen state, carrier kill recovery, and carrier escape.

### Changed

- Replaced implicit carrier-only crystal recovery with explicit `recoverCrystal`, `stealCrystal`, and `escapeCrystal` state transitions.
- Updated GameState schema documentation for explicit crystal feedback state.
- Marked `CRYSTAL-001` complete and moved the next implementation target to `SETTLEMENT-001`.

### Self Review

Review Result: Pass
Main Issues: Demo 0.1 records dropped-and-recovered in one step instead of spawning a separate pickup entity.
Required Changes: Continue with win/lose/star settlement and use crystal state as settlement input.
Risk Level: Medium

## [0.4.1] - 2026-06-24

### Added

- Added serializable enemy `statusEffects` for slow and stun, measured in fixed ticks.
- Added hero-specific active skill behavior for Hook Guardian, Frost Priestess, Storm Sigilist, and Moonblade Ranger.
- Added Hook Guardian pullback and carrier stun behavior.
- Added Frost Priestess area damage and slow behavior.
- Added Storm Chain jump targeting, jump decay, and ice/control combo bonus jumps.
- Added Moonblade bounce burst with bonus damage against slowed or stunned enemies.
- Added regression coverage for each hero-specific skill and the Frost + Storm combo.

### Changed

- Extended Level 001 hero configs with data-driven skill shape fields.
- Updated GameState schema documentation for current runtime types and skill status effects.
- Marked `SKILL-002` complete and moved the next implementation target to `CRYSTAL-001`.

### Self Review

Review Result: Pass
Main Issues: Active skills now have gameplay shape, but road-area targeting is still represented through target-enemy clicks in the current action model.
Required Changes: Continue with explicit crystal recovery runtime state and then validate skill readability in Web Preview.
Risk Level: Medium

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
