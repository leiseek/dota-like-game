---
doc_id: DEMO_01_CORE_SELF_REVIEW
version: 0.5.0
status: active
owner_agent: Self Review Agent
last_updated: 2026-06-24
change_summary: Demo 0.1 core readiness self review added
---

# Demo 0.1 Core Self Review

## Scope

This review covers the current Demo 0.1 core-loop baseline on `main` after the Web Preview, hero-specific skills, crystal recovery, and settlement work landed.

Reviewed areas:

- product scope;
- game design;
- game-core architecture;
- state serialization;
- Web Preview adapter boundary;
- UX/readability;
- balance readiness;
- QA readiness;
- release readiness.

## Review Result

**Conditional Pass** for internal Web playtest.

The project is ready for first local smoke playtest through Web Preview, but not yet ready for external release or wider tester distribution.

## Evidence

Implemented Demo 0.1 core loop includes:

- platform-neutral `src/game-core`;
- fixed tick simulation;
- pause/resume;
- speed controls: 1x, 2x, 5x, 10x;
- Battle Snapshot save/restore behavior;
- Level 001 path, tower slots, obstacles, enemy archetypes, and waves;
- hero tower build flow;
- auto-targeting and basic attacks;
- active skill resource/cooldown foundation;
- hero-specific active skills;
- Frost + Storm combo;
- explicit crystal stolen/recovered/escaped state;
- win/lose/star settlement;
- Web Preview shell for manual validation;
- regression tests for core systems.

## Strengths

### Product

The MVP direction is now testable as a real loop, not just documentation. The player can build, fight, cast, experience crystal theft/recovery, and reach settlement.

### Architecture

The core-first rule is still intact. Authoritative gameplay state remains in `GameState`, and Web Preview acts as an adapter that renders state and dispatches `GameAction`.

### Simulation

Fixed tick plus speed multiplier supports the tower-defense requirements for pause, high-speed mode, and snapshot recovery.

### Design

The four starter heroes now have differentiated skill identities:

- Hook Guardian: control/recovery;
- Frost Priestess: area slow/setup;
- Storm Sigilist: chain/combo payoff;
- Moonblade Ranger: bounce burst.

### UX

The Web Preview has enough interaction to validate core feel quickly: build, select, cast, speed, save, continue, and settlement.

### QA

Regression tests cover many high-risk rules: wave spawning, path movement, speed, skills, crystal recovery, snapshot restore, and settlement.

## Main Issues

### P0 Before External Test

1. `npm run check` must be confirmed in CI or local environment.
2. `npm run preview:web` must be smoke-tested in a browser.
3. Web Preview readability must be validated at 1x and 10x.
4. At least one complete win/lose session must be manually recorded.

### P1 Before Demo 0.1 Public Build

1. Skill targeting is still MVP-simple: road/area skills are cast through enemy clicks.
2. Skill VFX are labels/shapes only, not final effects.
3. Obstacle destruction is configured but not yet active gameplay.
4. Snapshot validation is minimal.
5. Star thresholds are simple and need tuning.
6. Balance values are untested in real play.

### P2 Future Work

1. Upgrade/sell hero tower interactions.
2. Better tutorial prompts.
3. Meta save after battle result.
4. Shareable battle report.
5. More combos and hero progression.

## Go / No-Go

| Gate | Result | Notes |
|---|---|---|
| Core architecture | Pass | platform-neutral core remains intact |
| Fixed tick / speed | Pass | tests cover deterministic tick behavior |
| Pause / resume | Pass | tests cover pause and resume actions |
| Battle Snapshot | Pass with risk | restore works; validation is minimal |
| Hero skills | Pass | differentiated skill logic exists |
| Crystal loop | Pass | stolen/recovered/escaped state exists |
| Settlement | Pass | win/lose/star state exists |
| Web Preview | Conditional Pass | requires local browser run |
| Balance | Not Passed | no real playtest yet |
| External release | Not Passed | needs playtest and polish |

## Required Next Actions

1. Run CI and local smoke test.
2. Fill `docs/WEB_PREVIEW_SMOKE_PLAYTEST.md` with actual results.
3. Convert playtest findings into prioritized tasks.
4. Start `POLISH-001` only after concrete playtest issues are captured.

## Recommended Next Task Order

1. `PLAYTEST-001`: Web Preview smoke playtest.
2. `QA-001`: CI/build/test verification.
3. `POLISH-001`: readability fixes based on actual findings.
4. `BALANCE-001`: first numeric balance pass after one full run.
5. `SNAPSHOT-002`: snapshot schema/version validation.
6. `OBSTACLE-001`: destructible obstacle gameplay.

## Self Review

Review Result: Conditional Pass

Main Issues: No actual browser playtest has been recorded yet, and balance is unvalidated.

Required Changes: Validate through CI and Web Preview before claiming Demo 0.1 is playable-ready.

Risk Level: Medium
