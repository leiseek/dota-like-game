---
doc_id: WEB_PREVIEW_SPEC
version: 0.1.0
status: active
owner_agent: Platform Web Agent
last_updated: 2026-06-24
change_summary: initial Web Playtest Preview shell specification
---

# Web Preview Spec

## Purpose

The Web Preview is a fast playable/debug surface for Demo 0.1.

It is not the final product platform. Its purpose is to let the Project Owner and AI Agent Team see and test the current `game-core` loop quickly:

- map route and enemy movement;
- hero tower placement;
- auto attacks;
- active skill targeting;
- pause/resume;
- 1x/2x/5x/10x speed;
- Battle Snapshot save/continue;
- crystal theft feedback.

## Architecture Boundary

```text
platform-web
  ↓ reads
GameState / HudState
  ↑ sends
GameAction
  ↓ advances
stepSimulation(...)
```

Rules:

- `platform-web` may use DOM, Canvas, CSS, and `localStorage`.
- `src/game-core` must not import DOM, Canvas, browser, or platform APIs.
- Web rendering reads state but never owns authoritative battle state.
- Web input must become `GameAction` before changing battle state.
- Web save/continue must use the core snapshot helpers.

## Current File Layout

```text
platform-web/
  index.html
  styles.css
  dev-server.mjs
  tsconfig.json
  src/
    main.ts
```

## Preview Commands

```bash
npm run preview:web
```

This command:

1. builds `src/game-core` into `dist/game-core`;
2. builds `platform-web/src` into `platform-web/dist`;
3. starts a zero-dependency local static server;
4. opens the preview path manually at `/platform-web/`.

## Implemented Interactions

| Interaction | Status | Notes |
|---|---|---|
| Start battle | Done | Dispatches `START` |
| Pause/resume | Done | Dispatches `PAUSE` / `RESUME` |
| Speed cycle | Done | Dispatches `SET_SPEED` through 1x/2x/5x/10x |
| Start next wave | Done | Dispatches `START_NEXT_WAVE` when HUD allows it |
| Build hero | Done | Click empty unlocked tower slot; selected hero archetype is built |
| Select hero | Done | Click built hero tower |
| Cast active skill | Done | Click enemy while hero is selected; dispatches `CAST_SKILL` |
| Save and exit | Done | Stores `createSnapshot(gameState)` in `localStorage` |
| Continue battle | Done | Restores snapshot via `restoreSnapshot`, which returns paused state |
| Abandon saved battle | Done | Clears local Web snapshot |

## Non-Goals

Do not add these to Web Preview before Demo 0.1 core loop is readable:

- production UI framework;
- account system;
- backend server;
- final art pipeline;
- advanced animation system;
- platform-specific HarmonyOS or WeChat APIs.

## Self Review

Review Result: Pass

Main Issues:

- Web Preview currently uses placeholder Canvas shapes and labels.
- It depends on `dist/game-core` being built first.
- It validates interaction flow, not final mobile UX polish.

Required Changes:

- Continue using `GameAction` and `GameState` as the platform boundary.
- Use the Web Preview to validate `SKILL-002`, `CRYSTAL-001`, and `SETTLEMENT-001` next.

Risk Level: Medium
