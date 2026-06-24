---
doc_id: WEB_PREVIEW_SPEC
version: 0.7.0
status: active
owner_agent: Platform Web Agent
last_updated: 2026-06-24
change_summary: PR-level GitHub Pages preview deployment added
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
  deploy-pages-branch.mjs
  remove-pages-preview.mjs
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

## GitHub Pages Artifact

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

## GitHub Pages Deployment Strategy

The project uses branch-based GitHub Pages deployment through the `gh-pages` branch.

Repository setting required:

```text
Settings → Pages → Build and deployment → Source: Deploy from a branch
Branch: gh-pages
Folder: / (root)
```

This avoids the first-time `actions/configure-pages` 404 problem and allows multiple PR preview directories to coexist.

## Main Preview URL

Pushes to `main` run:

1. `npm run check`;
2. `npm run build:pages`;
3. deployment to the root of `gh-pages`.

Expected stable URL:

```text
https://leiseek.github.io/dota-like-game/
```

The root page redirects to:

```text
https://leiseek.github.io/dota-like-game/platform-web/
```

## PR Preview URLs

Pull requests from branches in the same repository run:

1. `npm run check`;
2. `npm run build:pages`;
3. deployment to `gh-pages/previews/pr-<number>/`;
4. an automatic PR comment with the preview URL.

Expected PR preview URL format:

```text
https://leiseek.github.io/dota-like-game/previews/pr-<number>/
```

The PR preview root redirects to:

```text
https://leiseek.github.io/dota-like-game/previews/pr-<number>/platform-web/
```

When a PR is closed, the workflow removes its preview directory from `gh-pages`.

Security note: PR preview deployment is limited to same-repository PRs. Fork PRs should run checks but not publish previews with write access.

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
- Branch-based Pages requires the repo Pages source to be `gh-pages` branch `/root`.
- PR previews are intentionally limited to same-repository PRs.

Required Changes:

- Set GitHub Pages source to `gh-pages` branch `/root`.
- Use main and PR preview URLs for `PLAYTEST-001` smoke testing.

Risk Level: Medium
