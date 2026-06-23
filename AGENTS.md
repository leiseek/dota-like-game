# AGENTS.md

This repository is an AI Native game project: dota-like-game.

Core idea:
Hero-based tower defense with active skills, deterministic simulation, and snapshot save/resume.

Rules:
- Game logic must be platform-agnostic.
- No UI framework dependencies in core logic.
- All inputs must become GameAction.
- GameState is the single source of truth.
- Must support pause, resume, and fixed-tick simulation.

Docs-first workflow:
1. Read docs first
2. Implement game-core
3. Update TASK_BOARD and CHANGELOG
