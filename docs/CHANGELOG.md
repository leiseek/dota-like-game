---
doc_id: CHANGELOG
version: 0.8.4
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-26
change_summary: Selection profile extraction codemod added
---

# Changelog

## [0.8.4] - 2026-06-26

### Added

- Added `scripts/refactor-web-selection-profiles.mjs` to automate replacing duplicated `main.ts` selection profile data with imports from `profiles/selection-profiles.ts`.
- Added `npm run refactor:web-selection-profiles` and `npm run refactor:web-selection-profiles:dry-run` scripts.
- Documented the codemod workflow in `docs/WEB_ADAPTER_STRUCTURE.md`.

### Self Review

Review Result: Pass
Main Issues: The codemod is ready, but the duplicate block is not removed in this PR to avoid unsafe whole-file replacement of `main.ts` through the connector.
Required Changes: Run the codemod in a follow-up, validate `npm run check`, then lower the `main.ts` line limit after the extraction is committed.
Risk Level: Low

## [0.8.3] - 2026-06-26

### Added

- Added `platform-web/src/profiles/selection-profiles.ts` as the target module for Web selection profile data.
- The new module centralizes hero display names, enemy display names, hero profiles, enemy profiles, status badges, and status-name helpers.

### Changed

- Updated `docs/WEB_ADAPTER_STRUCTURE.md` to mark the selection profile module as the first concrete extraction target and clarify the next step: replacing duplicate `main.ts` constants/functions with imports.

### Self Review

Review Result: Pass
Main Issues: This PR creates the extraction target and compiles it, but does not yet remove the duplicate block from `main.ts` because the current connector path only supports whole-file replacement for that large file.
Required Changes: Validate through CI and PR Preview, then safely patch `main.ts` to import from `profiles/selection-profiles.ts`, delete the duplicate constants/functions, and lower the line limit.
Risk Level: Low

## [0.8.2] - 2026-06-26

### Added

- Added `scripts/check-web-main-size.mjs` to guard against unbounded `platform-web/src/main.ts` growth.
- Added `npm run check:web-boundary` and wired it into `npm run check`.
- Added `docs/WEB_ADAPTER_STRUCTURE.md` to define the Web adapter module boundaries, forbidden `main.ts` additions, preferred module targets, and refactor roadmap.

### Changed

- `npm run check` now fails if `platform-web/src/main.ts` exceeds the current boundary limit of 1300 lines.
- Documented that the line limit must be lowered after each extraction pass to lock in reductions.

### Self Review

Review Result: Pass
Main Issues: This PR establishes a hard anti-growth guard and structure rules, but does not yet reduce the existing `main.ts` size. The next PR should extract one concrete area such as selection profiles or selection panel rendering.
Required Changes: Validate through CI and PR Preview, then begin reducing `main.ts` by moving profile/panel/VFX code into focused modules and lowering the line limit after each extraction.
Risk Level: Low

## [0.8.1] - 2026-06-25

### Added

- Added `emitVisualEventsFromStateDiff(previousState, nextState)` to `visual-event-source.ts`.
- The state-diff API emits explicit hero level-up visual events from hero level changes.
- The state-diff API emits explicit crystal objective visual events from crystal status changes.

### Changed

- Kept the existing Canvas/HUD compatibility source active so current Web feedback remains functional until `main.ts` is wired to the new state-diff API.
- Passive labels for both state-diff and compatibility level-up paths now resolve from `level001Config.heroConfigs` instead of a duplicated abbreviation table.

### Self Review

Review Result: Pass
Main Issues: `main.ts` is not wired in this PR because replacing the 1100+ line file through the current connector is high-risk; the new API is ready for a smaller follow-up once we can patch the import and `setGameState` call safely.
Required Changes: Validate through CI and PR Preview, then wire `main.ts` to call `emitVisualEventsFromStateDiff` and remove the compatibility Canvas/HUD source.
Risk Level: Low
