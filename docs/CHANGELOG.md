---
doc_id: CHANGELOG
version: 0.5.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: Demo 0.1 readiness review recorded
---

# Changelog

## [0.5.0] - 2026-06-24

### Added

- Added GitHub Actions CI workflow that runs `npm run check` on PRs and pushes to `main`.
- Added `docs/WEB_PREVIEW_SMOKE_PLAYTEST.md` with manual Web Preview smoke test matrix and playtest notes template.
- Added `docs/DEMO_01_CORE_SELF_REVIEW.md` with Demo 0.1 Core Self Review and conditional pass for internal Web playtest.

### Changed

- Updated task board to mark `CI-001`, `PLAYTEST-001` checklist creation, and `REVIEW-003` documentation complete.
- Added follow-up readiness tasks for Web Preview polish, first balance pass, snapshot validation hardening, and destructible obstacle gameplay.

### Self Review

Review Result: Conditional Pass
Main Issues: Browser smoke playtest and balance validation still require an actual local run.
Required Changes: Run CI/local checks, fill the playtest checklist with real results, then prioritize polish from findings.
Risk Level: Medium

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
