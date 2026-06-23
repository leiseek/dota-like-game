# CODEX_HANDOFF

## Project
Ancient Defense / dota-like-game

## Concept
Hero skill-based tower defense with deterministic simulation.

Core loop:
Build heroes -> enemies path -> skills -> steal/return crystal -> win/lose.

## Codex Task
Implement game-core foundation:
- GameState
- GameAction
- GameClock (fixed tick)
- SeededRandom
- Level config

## Rules
- No rendering logic in core
- No platform coupling
- Everything derived from GameState
- Must support pause/resume and speed 1x/2x/5x/10x

## Workflow
Read AGENTS.md first, then implement tasks in TASK_BOARD.
