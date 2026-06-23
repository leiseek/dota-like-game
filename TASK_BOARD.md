# TASK_BOARD

## Iteration 1 - game-core foundation

- [x] Read project docs and existing handoff context.
- [x] Define platform-agnostic `GameState`, `GameAction`, fixed-tick `GameClock`, `SeededRandom`, snapshots, and `LevelConfig`.
- [x] Implement deterministic reducer/simulation entry points with pause, resume, and 1x/2x/5x/10x speed support.
- [x] Add baseline tests for fixed ticks, action flow, speed, snapshots, and skill effects.

## Iteration 2 - review fixes

- [x] Re-read repository docs and handoff context before changing code.
- [x] Fetch remote refs and verify the current branch has no configured upstream before continuing locally.
- [x] Add deterministic crystal steal/carry-away loss rules to the core simulation.
- [x] Return the crystal to base when a skill kills the carrier enemy.
- [x] Add regression tests for crystal steal/loss and carrier kill recovery.

## Iteration 3 - Level 001 waves

- [x] Review all docs and code before continuing incomplete tasks.
- [x] Add Level 001 path, enemy archetypes, and 10-wave config from docs.
- [x] Add wave runtime state and `START_NEXT_WAVE` configured spawning.
- [x] Add regression tests for Level 001 config and deterministic wave spawning.

## Next

- [x] Expand Level 001 config with tower slots and obstacles.
- [x] Add final-wave completion when all spawned enemies are cleared.
- [x] Finish timed/auto-start scheduling for configured waves.
- [x] Add endpoint-safe multi-point enemy path movement at 1x/10x.
- [x] Add hero tower build validation with costs and slot occupancy.
- [x] Add deterministic auto targeting, basic attacks, enemy death, and gold rewards.
- [ ] Add deterministic targeting and area-of-effect skill models.
- [ ] Add serialization compatibility tests for saved snapshots.
