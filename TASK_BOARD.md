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

## Next

- [ ] Expand level config with enemy waves and spawn scheduling.
- [ ] Add deterministic targeting and area-of-effect skill models.
- [ ] Add serialization compatibility tests for saved snapshots.
