---
doc_id: CHANGELOG
version: 0.7.8
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-25
change_summary: Web crystal event feedback overlay added
---

# Changelog

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

## [0.7.5] - 2026-06-24

### Added

- Added Web Preview obstacle-clearing feedback effects: gold-spend floating text, unlock floating text, expanding impact ring, and radial debris lines.
- Added a visible insufficient-gold floating prompt at the clicked obstacle position.
- Reused the existing Web combat effect lifecycle for obstacle feedback to keep rendering deterministic and contained in the adapter layer.

### Self Review

Review Result: Pass
Main Issues: This is still placeholder Canvas VFX; later art passes should replace text/ring feedback with icon badges and themed break animations.
Required Changes: Validate through CI and PR Preview, then continue with obstacle UX and balance tuning.
Risk Level: Low

## [0.7.4] - 2026-06-24

### Added

- Added `CLEAR_OBSTACLE` core action for deterministic obstacle clearing.
- Added obstacle `clearCost` config/state data.
- Clearing an obstacle now spends gold, marks the obstacle destroyed, sets its health to 0, and unlocks any linked tower slot.
- Added Web Preview click interaction for clearing obstacles directly on the map.
- Added obstacle clear-cost labels to the Canvas map.
- Added regression coverage for clear costs, insufficient-gold rejection, duplicate-clear rejection, linked tower-slot unlocking, and building on a cleared slot.

### Self Review

Review Result: Pass
Main Issues: Obstacle clearing is instant and gold-only; later milestones should consider hero attack/worker/channel-clear variants if playtests need more depth.
Required Changes: Validate through CI and PR Preview, then continue with stronger obstacle UX and balance tuning.
Risk Level: Medium

## [0.7.3] - 2026-06-24

### Added

- Added stacked in-canvas enemy status labels for slow, stun, poison, burn, crystal carrying, and return-to-start behavior.
- Added shared Web status formatting helpers so selected enemy panels show the correct Chinese status names and remaining seconds instead of mapping every non-stun status to slow.

### Self Review

Review Result: Pass
Main Issues: Labels are text-first and may overlap in extreme swarm scenes; icon badges should follow after the combat readability pass.
Required Changes: Validate through PR Preview and continue with richer status/VFX readability.
Risk Level: Low

## [0.7.2] - 2026-06-24

### Added

- Added a Chinese Web Preview status legend for slow, stun/freeze, poison, burn, and crystal-carrier rules.
- Styled the status legend as a compact right-panel reference card so playtesters can understand passive effects without reading code or docs.

### Self Review

Review Result: Pass
Main Issues: Canvas enemy labels still only prioritize one status at a time; richer per-enemy icon stacks should follow in a dedicated Web rendering slice.
Required Changes: Validate through PR Preview and continue with in-Canvas status rendering polish.
Risk Level: Low

## [0.7.1] - 2026-06-24

### Changed

- Increased Level 001 starting gold from 300 to 360 so players can open with a three-hero passive combo instead of being forced into a two-hero opener.
- Updated hero passive descriptions to reflect currently active effects for slow, freeze, lightning-chain, poison, burn, cleave, and anti-carrier mechanics.
- Added regression coverage for the three-hero Level 001 opening economy.

### Self Review

Review Result: Pass
Main Issues: This is a first playtest tuning pass, not a full balance model; Web still needs richer status-effect rendering.
Required Changes: Validate through PR Preview and continue with Web status/VFX readability.
Risk Level: Low
