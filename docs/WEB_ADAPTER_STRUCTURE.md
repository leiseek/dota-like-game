---
doc_id: WEB_ADAPTER_STRUCTURE
version: 0.1.4
status: active
owner_agent: Team Leader Agent
last_updated: 2026-06-27
change_summary: UI label codemod documented
---

# Web Adapter Structure

This document defines how the Web Preview adapter should evolve without letting `platform-web/src/main.ts` grow without limit.

## Goal

`main.ts` should stay as the Web Preview composition root and thin adapter shell. It may coordinate startup, input wiring, simulation stepping, and top-level render order, but it should not keep accumulating feature-specific logic.

## Hard Guardrail

`npm run check` runs `scripts/check-web-main-size.mjs`.

Current rule:

```text
platform-web/src/main.ts <= 1300 lines
```

This first threshold is intentionally above the current large file so the guard can merge safely. It is still a hard stop against unlimited growth. After each extraction pass, lower the threshold to lock in the reduction.

If a new feature would push `main.ts` above this limit, the feature must first extract code into focused modules.

## Allowed in `main.ts`

`main.ts` may contain:

- Web bootstrapping and DOM element lookup
- top-level `GameState` ownership
- dispatching user input into core `GameAction`s
- frame loop coordination
- top-level render ordering
- calls into focused Web modules

## Not Allowed in `main.ts`

New code should not add the following directly to `main.ts`:

- hero profile databases
- enemy profile databases
- localized long-form UI copy
- visual effect renderer implementations
- HUD overlay modules
- event bridge/source implementations
- balance tuning tables
- large helper families for a single feature
- future audio, replay, telemetry, or debug panels

## Preferred Module Targets

Use these module categories instead:

```text
platform-web/src/visual-event-bridge.ts
  Shared visual-event names, event contracts, and dispatch API.

platform-web/src/visual-event-source.ts
  Web visual event emission from state diffs or temporary compatibility sources.

platform-web/src/*-feedback.ts
  Focused overlay renderers for one feedback family, such as level-up or crystal events.

platform-web/src/renderers/*.ts
  Canvas drawing modules split by responsibility: map, heroes, enemies, panels, VFX.

platform-web/src/ui/*.ts
  DOM/HUD controls, status text, messages, and player-facing UI helpers.

platform-web/src/profiles/*.ts
  Hero, enemy, obstacle, and status profile copy used by the Web inspector.

platform-web/src/input/*.ts
  Hit testing, click handling, and user interaction translation.
```

## Extraction Progress

```text
Done:
- Created platform-web/src/profiles/selection-profiles.ts as the target home for hero names, enemy names, hero profiles, enemy profiles, and status badge copy.
- Added scripts/refactor-web-selection-profiles.mjs to automate the main.ts extraction safely.
- Created platform-web/src/ui/labels.ts as the target home for shared HUD/status/settlement labels.
- Added scripts/refactor-web-ui-labels.mjs to automate the main.ts label-helper extraction safely.

Next:
- Run npm run refactor:web-selection-profiles:dry-run and npm run refactor:web-ui-labels:dry-run to inspect expected line deltas.
- Run the codemods in a patch-capable environment to update main.ts.
- Run npm run check.
- Lower the main.ts line limit after duplicate blocks are removed.
```

## Selection Profile Codemod

Use the codemod instead of hand-editing the 1000+ line `main.ts` file:

```bash
npm run refactor:web-selection-profiles:dry-run
npm run refactor:web-selection-profiles
npm run check
```

The codemod performs these operations:

- adds imports from `platform-web/src/profiles/selection-profiles.ts`
- removes local display-name maps
- removes local hero/enemy profile maps
- removes local status badge map
- removes duplicate helper functions now provided by the profile module
- rewrites status badge lookups to `statusBadgeFor(statusEffect.type)`

## UI Label Codemod

Use this codemod to replace local HUD/status/settlement label helpers with imports from `platform-web/src/ui/labels.ts`:

```bash
npm run refactor:web-ui-labels:dry-run
npm run refactor:web-ui-labels
npm run check
```

The codemod performs these operations:

- adds imports from `platform-web/src/ui/labels.ts`
- removes local `crystalStatusLabel`
- removes local `gameStatusLabel`
- removes local `settlementLabel`
- removes local `settlementReasonLabel`
- preserves unrelated UI/rendering helpers such as `setText`, `drawSettlementPanel`, and selection panel rendering

## Refactor Roadmap

1. Wire `main.ts` to call `emitVisualEventsFromStateDiff(previousState, nextState)`.
2. Remove the compatibility Canvas/HUD source from `visual-event-source.ts`.
3. Replace hero/enemy profile data in `main.ts` with `profiles/selection-profiles.ts` imports.
4. Replace duplicated label helpers in `main.ts` with `ui/labels.ts` imports.
5. Extract selection panel drawing into `renderers/selection-panel.ts`.
6. Extract combat and obstacle VFX drawing into `renderers/combat-effects.ts`.
7. Extract DOM/HUD sync into `ui/hud.ts`.
8. Lower the `main.ts` line limit after each extraction.

## Self Review Checklist

Before merging Web changes, check:

- Does this add more than a small adapter call to `main.ts`?
- Could this be a focused module instead?
- Did `npm run check` pass locally/CI?
- Is any new long-form Chinese copy stored outside `main.ts`?
- Are visual events emitted through the bridge/source rather than custom DOM observers?

## Decision

`main.ts` is no longer allowed to be the default destination for new Web gameplay or UI work. New features must either reuse existing modules or create a focused module with a narrow public API.
