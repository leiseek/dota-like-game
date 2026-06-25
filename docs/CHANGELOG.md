---
doc_id: CHANGELOG
version: 0.7.4
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: Obstacle clearing MVP added
---

# Changelog

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

## [0.7.0] - 2026-06-24

### Added

- Added returning crystal runtime state with path position and return speed.
- Added half-speed crystal return after a carrier is killed.
- Added enemy interception of returning crystals; intercepting enemies immediately become new carriers and turn back toward the start.
- Added HUD/Web Preview support for rendering returning crystals on the path.
- Added regression coverage for drop, return movement, recovery, interception, endpoint waiting, and delayed settlement until a returning crystal is safe.

### Changed

- Carrier death no longer instantly recovers the crystal.
- Final victory now waits until no crystal is being carried or returning.
- Monsters reaching the Ancient while the crystal is unavailable now wait at the endpoint instead of silently disappearing.
- Updated GameState schema and task board to document `CRYSTAL-002`.

### Fixed

- Fixed confusing endpoint behavior where monsters could appear to steal a crystal and vanish when `crystal.atBase === false`.

### Self Review

Review Result: Pass
Main Issues: Returning crystal visuals are placeholder and should be upgraded through `VFX-001`.
Required Changes: Validate through PR Preview, then continue with projectile/HIT visual events.
Risk Level: Medium

## [0.6.1] - 2026-06-24

### Changed

- Replaced official GitHub Actions Pages deployment with branch-based deployment to `gh-pages`.
- Updated main preview deployment to publish root `pages-dist/` content to the root of `gh-pages`.
- Updated PR preview deployment to publish `pages-dist/` content under `gh-pages/pr-<PR_NUMBER>/`.
- Updated PR preview comments to reuse a single marker comment instead of creating a new comment on every push.
- Updated docs to clarify that Pages source must be `Deploy from a branch`, branch `gh-pages`, folder `/ (root)`.

### Fixed

- Avoids `actions/configure-pages@v5` failing with `Get Pages site failed ... Not Found` before/while Pages is initialized.
- Avoids relying on official `actions/deploy-pages` PR preview mode, which is currently alpha and not publicly available.

### Self Review

Review Result: Pass
Main Issues: After this PR merges, the first main deployment must create/update the `gh-pages` branch before repository Pages can be pointed to it.
Required Changes: Merge this PR, wait for the `gh-pages` branch to be created, then set Pages source to `Deploy from a branch`, branch `gh-pages`, folder `/ (root)`.
Risk Level: Medium

## [0.6.0] - 2026-06-24

### Added

- Added `npm run build:pages` to build a deployable GitHub Pages artifact.
- Added `scripts/build-pages.mjs` to prepare `pages-dist/` with `platform-web/`, root `dist/`, `.nojekyll`, and a root redirect page.
