---
doc_id: CHANGELOG
version: 0.7.1
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: Level 001 opening economy tuned for passive combo play
---

# Changelog

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
- Added GitHub Actions Pages deployment for pushes to `main` after `npm run check` passes.
- Added manual `workflow_dispatch` support for the CI workflow.

### Changed

- Updated Web Preview documentation with deployed Pages URL and artifact layout.
- Updated task board to mark `WEB-DEPLOY-001` complete.
- Ignored local `pages-dist/` output.

### Self Review

Review Result: Pass
Main Issues: Actual deployment still depends on repository Pages settings allowing GitHub Actions deployment.
Required Changes: Enable GitHub Pages source as GitHub Actions, merge this PR, and verify the deployed URL.
Risk Level: Medium

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

### Changed

- Advanced active skills from a hardcoded placeholder damage action to a data-driven resource/cooldown foundation.

### Self Review

Review Result: Pass
Main Issues: Hero-specific skill shapes and combos are still pending.
Required Changes: Continue with `SKILL-002` hero-specific active skill effects.
Risk Level: Medium
