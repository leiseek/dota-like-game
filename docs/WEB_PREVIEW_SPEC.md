---
doc_id: WEB_PREVIEW_SPEC
version: 0.6.0
status: active
owner_agent: Platform Web Agent
last_updated: 2026-06-24
change_summary: GitHub Pages deployment added for Web Preview testing
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
- crystal theft feedback;
- win/lose/star settlement.

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
scripts/
  build-pages.mjs
.github/workflows/
  ci.yml
```

## Local Preview Commands

```bash
npm run preview:web
```

This command:

1. builds `src/game-core` into `dist/game-core`;
2. builds `platform-web/src` into `platform-web/dist`;
3. starts a zero-dependency local static server;
4. opens the preview path manually at `/platform-web/`.

## GitHub Pages Deployment

```bash
npm run build:pages
```

This command:

1. builds `src/game-core` into `dist/game-core`;
2. builds `platform-web/src` into `platform-web/dist`;
3. creates `pages-dist/`;
4. copies `platform-web/` and `dist/` into the Pages artifact;
5. writes `.nojekyll`;
6. writes a root `index.html` that redirects to `./platform-web/`.

GitHub Actions behavior:

- pull requests run `npm run check` only;
- pushes to `main` run `npm run check` and then deploy `pages-dist/` to GitHub Pages;
- manual workflow dispatch is available for CI, but Pages deployment only runs on `main` pushes.

Expected test URL after Pages is enabled in repository settings:

```text
https://leiseek.github.io/dota-like-game/
```

The root page redirects to:

```text
https://leiseek.github.io/dota-like-game/platform-web/
```

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
- Pages deployment depends on repository Pages settings allowing GitHub Actions deployment.
- It validates interaction flow, not final mobile UX polish.

Required Changes:

- Enable GitHub Pages source as GitHub Actions in repository settings.
- Use the deployed Web Preview for `PLAYTEST-001` smoke testing.

Risk Level: Medium
