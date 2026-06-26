---
doc_id: CHANGELOG
version: 0.8.2
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-26
change_summary: Web main module growth guard added
---

# Changelog

## [0.8.2] - 2026-06-26

### Added

- Added `scripts/check-web-main-size.mjs` to guard against unbounded `platform-web/src/main.ts` growth.
- Added `npm run check:web-boundary` and wired it into `npm run check`.
- Added `docs/WEB_ADAPTER_STRUCTURE.md` to define the Web adapter module boundaries, forbidden `main.ts` additions, preferred module targets, and refactor roadmap.

### Changed

- `npm run check` now fails if `platform-web/src/main.ts` exceeds the current boundary limit of 1150 lines.

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

## [0.8.0] - 2026-06-25

### Added

- Added `visual-event-source.ts` as the current Web visual-event source module.
- Added explicit Web page loading for `visual-event-source.js` between the event bridge and feedback overlays.

### Changed

- Converted `visual-event-bridge.ts` into a pure event bus and shared visual-event contract module.
- Moved current compatibility event inference for hero level-up and crystal objective events out of the bridge and into `visual-event-source.ts`.
- Updated `level-up-feedback.ts` and `crystal-event-feedback.ts` to import the shared event name and event types from the bridge instead of duplicating contracts locally.

### Self Review

Review Result: Pass
Main Issues: The current source still uses compatibility inference from Canvas labels and HUD text; this round intentionally isolates that source so it can be replaced by `main.ts` state-diff emission with less risk.
Required Changes: Validate through CI and PR Preview, then wire `main.ts` `previousState -> nextState` diff emission into the source path.
Risk Level: Low

## [0.7.9] - 2026-06-25

### Added

- Added `visual-event-bridge.ts` as a Web adapter visual-event bridge.
- The bridge now emits `ancient-defense:visual-event` events for hero level-up and crystal objective feedback.
- Added `visual-event-bridge.js` to the Web page before feedback overlays.

### Changed

- Refactored `level-up-feedback.ts` to consume explicit `hero-level-up` visual events instead of patching Canvas text rendering itself.
- Refactored `crystal-event-feedback.ts` to consume explicit `crystal-event` visual events instead of observing HUD text itself.
- Centralized current event inference in a single Web bridge so future core/main-adapter event emission can replace it without changing the overlay renderers.

### Self Review

Review Result: Pass
Main Issues: v1 still infers event sources from rendered labels/HUD inside the bridge; this improves separation but is not yet a true core-emitted event stream.
Required Changes: Validate through CI and PR Preview, then move event emission into the main Web adapter state-diff path or core visual-event output.
Risk Level: Medium

## [0.7.8] - 2026-06-25

### Added

- Added a Web Preview crystal event feedback overlay module.
- Added prominent Canvas banners and pulse rings for crystal stolen, crystal intercepted, crystal dropped/returning, crystal recovered, and crystal escaped events.
- Added `crystal-event-feedback.js` to the Web page as an adapter-only visual layer that observes HUD crystal status transitions without changing core simulation.

### Self Review

Review Result: Pass
Main Issues: The overlay infers events from localized HUD text; a future core visual-event stream should emit explicit objective events for stronger correctness and easier localization.
Required Changes: Validate through CI and PR Preview, then continue with a first-class event bridge for objective/combat/level-up feedback.
Risk Level: Low

## [0.7.7] - 2026-06-25

### Added

- Added a Web Preview hero level-up feedback overlay module.
- Hero level changes now show a short-lived `Lv Up` callout, new level text, unlocked passive label, and pulse rings around the hero on the Canvas.
- Added `level-up-feedback.js` to the Web page as an adapter-only visual layer that observes rendered hero `LvX` labels without changing core simulation.

### Self Review

Review Result: Pass
Main Issues: The overlay currently infers level changes from rendered Canvas labels; a future core event stream would be more explicit and less coupled to label formatting.
Required Changes: Validate through CI and PR Preview, then consider adding a first-class visual event bridge for level-ups, kills, and objective events.
Risk Level: Low

## [0.7.6] - 2026-06-24

### Added

- Added Web Preview hero selection profiles with role, summary, special behavior, and play tips.
- Added Web Preview enemy selection profiles with role, summary, special rules, and counterplay tips.
- Upgraded the selected hero panel to show Lv1-Lv5 passive progression with unlocked/locked markers.
- Upgraded the selected enemy panel to show enemy identity, skill/rule summary, counterplay tips, status, buff, and water-crystal escape rule.

### Changed

- Expanded the Canvas selection panel width/height and clipped long lines to keep the current text-first UI readable.
- Updated hero and tower-slot click messages to point players toward the richer selection panel.

### Self Review

Review Result: Pass
Main Issues: The panel is still Canvas text and clips long localized lines; a future DOM/React-style inspector would support wrapping, icons, and tabs better.
Required Changes: Validate through CI and PR Preview, then continue with UI readability and balance-facing information.
Risk Level: Low
