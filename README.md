# Ancient Defense / dota-like-game

AI Native hero-skill tower-defense project.

Current documentation baseline: `v0.6.0`.

## Project Direction

A 2D / pseudo-2.5D hero-skill tower-defense game. Players build hero towers, cast active skills, combine effects, and prevent enemies from stealing Ancient Crystals.

## Current Phase

Demo 0.1 internal Web playtest.

The repository now contains a platform-neutral TypeScript `game-core` plus a lightweight Web Playtest Preview shell.

## Current Implementation

- `src/game-core/`: platform-neutral battle simulation, state, actions, fixed tick, Level 001 config, waves, enemies, hero towers, combat, HUD selector, snapshots, hero-specific active skills, crystal recovery state, and settlement.
- `platform-web/`: Canvas-based playtest/debug shell that renders `GameState`, dispatches `GameAction`, and stores local Battle Snapshots.
- `.github/workflows/ci.yml`: checks pull requests and deploys the Web Preview to GitHub Pages on pushes to `main`.
- `docs/`: versioned product, architecture, task, review, and handoff documentation.

## Run Checks

```bash
npm install
npm run check
```

## Run Web Preview Locally

```bash
npm run preview:web
```

Then open:

```text
http://localhost:4173/platform-web/
```

## Build GitHub Pages Artifact Locally

```bash
npm run build:pages
```

This creates:

```text
pages-dist/
```

## GitHub Pages Preview

After GitHub Pages is enabled with source set to GitHub Actions, every push to `main` deploys the Web Preview.

Expected URL:

```text
https://leiseek.github.io/dota-like-game/
```

The root page redirects to:

```text
https://leiseek.github.io/dota-like-game/platform-web/
```

## v0.6.0 Contents

- `.github/workflows/ci.yml`: CI and GitHub Pages deployment workflow
- `scripts/build-pages.mjs`: GitHub Pages artifact builder
- `AGENTS.md`: project-level instructions for Codex / AI coding agents
- `docs/CODEX_HANDOFF.md`: Codex execution handoff
- `docs/DOC_VERSION_INDEX.md`: document version index
- `docs/CHANGELOG.md`: project changelog
- `docs/DECISIONS.md`: architecture and product decisions
- `docs/TASK_BOARD.md`: current task board
- `docs/GDD.md`: game design document
- `docs/MVP_SCOPE.md`: MVP scope
- `docs/TECH_ARCHITECTURE.md`: core-first technical architecture
- `docs/GAME_STATE_SCHEMA.md`: serializable battle state schema
- `docs/LEVEL_001.md`: first level design
- `docs/HERO_DESIGN.md`: first hero set design
- `docs/UI_UX_SPEC.md`: battle HUD and interaction spec
- `docs/SELF_REVIEW_PROCESS.md`: Self Review Gate process
- `docs/WEB_PREVIEW_SPEC.md`: Web Playtest Preview specification
- `docs/WEB_PREVIEW_SMOKE_PLAYTEST.md`: Web Preview smoke playtest checklist
- `docs/DEMO_01_CORE_SELF_REVIEW.md`: Demo 0.1 core readiness review

## Codex Entry

Codex should read:

1. `AGENTS.md`
2. `docs/CODEX_HANDOFF.md`
3. `docs/TASK_BOARD.md`
4. `docs/TECH_ARCHITECTURE.md`
5. `docs/GAME_STATE_SCHEMA.md`
6. `docs/WEB_PREVIEW_SPEC.md`

Then execute the assigned task from the task board.
