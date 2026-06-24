# Ancient Defense / dota-like-game

AI Native hero-skill tower-defense project.

Current documentation baseline: `v0.4.0`.

## Project Direction

A 2D / pseudo-2.5D hero-skill tower-defense game. Players build hero towers, cast active skills, combine effects, and prevent enemies from stealing Ancient Crystals.

## Current Phase

Demo 0.1 preparation.

The repository now contains a platform-neutral TypeScript `game-core` plus a lightweight Web Playtest Preview shell.

## Current Implementation

- `src/game-core/`: platform-neutral battle simulation, state, actions, fixed tick, Level 001 config, waves, enemies, hero towers, combat, HUD selector, snapshots, and active skill foundation.
- `platform-web/`: Canvas-based playtest/debug shell that renders `GameState`, dispatches `GameAction`, and stores local Battle Snapshots.
- `docs/`: versioned product, architecture, task, review, and handoff documentation.

## Run Checks

```bash
npm install
npm run check
```

## Run Web Preview

```bash
npm run preview:web
```

Then open:

```text
http://localhost:4173/platform-web/
```

## v0.4.0 Contents

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

## Codex Entry

Codex should read:

1. `AGENTS.md`
2. `docs/CODEX_HANDOFF.md`
3. `docs/TASK_BOARD.md`
4. `docs/TECH_ARCHITECTURE.md`
5. `docs/GAME_STATE_SCHEMA.md`
6. `docs/WEB_PREVIEW_SPEC.md`

Then execute the assigned task from the task board.
