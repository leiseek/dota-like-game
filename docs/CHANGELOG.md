---
doc_id: CHANGELOG
version: 0.7.0
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-24
change_summary: returning crystal and interception loop recorded
---

# Changelog

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
