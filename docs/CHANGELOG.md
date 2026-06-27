---
doc_id: CHANGELOG
version: 0.8.7
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-26
change_summary: Shared Web UI label helpers added
---

# Changelog

## [0.8.7] - 2026-06-26

### Added

- Added `platform-web/src/ui/labels.ts` as the target module for shared Web UI label helpers.
- Added `platform-web/src/ui/labels.test.ts` covering crystal status labels, game status labels, settlement summaries, and settlement reason labels.
- Added `npm run test:web` to execute compiled Web adapter tests.

### Changed

- Wired `npm run test:web` into `npm run check` after Web TypeScript compilation.

### Self Review

Review Result: Pass
Main Issues: `main.ts` still contains duplicate local label helpers until the large-file extraction can be safely patched, but this PR creates a tested target module for the next extraction.
Required Changes: Validate through CI and PR Preview, then replace the duplicated label helpers in `main.ts` with imports from `ui/labels.ts` and lower the line guard.
Risk Level: Low

## [0.8.6] - 2026-06-26

### Added

- Added `scripts/refactor-web-selection-profiles.test.mjs` with fixture coverage for the selection profile extraction codemod.
- Added `npm run test:scripts` for Node-based script tests.
- Wired script tests into `npm run check` through `npm run check:web-refactors`.

### Changed

- Refactored `scripts/refactor-web-selection-profiles.mjs` into a testable module that exports `transformSelectionProfileSource(source)` while preserving the existing CLI behavior.
- The codemod fixture now verifies that duplicate display-name/profile/status blocks are removed, profile imports are added, status badge lookups are rewritten, unrelated functions are preserved, and the transform is idempotent after extraction.

### Self Review

Review Result: Pass
Main Issues: This still does not commit the generated `main.ts` extraction, but it turns the codemod from an untested migration script into a continuously tested refactor tool.
Required Changes: Validate through CI and PR Preview, then run the codemod in a patch-capable environment to commit the real `main.ts` reduction and lower the line guard.
Risk Level: Low

## [0.8.5] - 2026-06-26

### Added

- Added `npm run check:web-refactors` to validate Web refactor codemods without mutating files.
- Wired `npm run refactor:web-selection-profiles:dry-run` into `npm run check`.

### Changed

- `npm run check` now verifies that the selection profile extraction codemod can still parse the current `platform-web/src/main.ts` structure.

### Self Review

Review Result: Pass
Main Issues: This validates the codemod continuously but still does not commit the generated `main.ts` extraction because the current connector cannot safely apply large-file patches directly.
Required Changes: Use a local checkout or a trusted patch-capable runner to execute `npm run refactor:web-selection-profiles`, then commit the generated `main.ts` diff and lower the line guard.
Risk Level: Low

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
