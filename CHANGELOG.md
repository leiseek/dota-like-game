# CHANGELOG

## Unreleased

### Added

- Added tower auto-targeting, basic attacks, enemy death, gold rewards, and wave kill-count tests.
- Added hero tower build validation with costs, Level 001 hero configs, resource state, and slot occupancy tests.
- Added endpoint-safe multi-point enemy path traversal with per-archetype speeds and 10x regression coverage.
- Added timed wave auto-start scheduling from configured wave start times.
- Added Level 001 tower slot and obstacle config plus serializable runtime state.
- Added wave kill counting and final-wave victory completion tests.
- Added Level 001 path, enemy archetypes, and 10-wave spawn config.
- Added wave runtime state plus deterministic `START_NEXT_WAVE` spawning tests.

- Added deterministic crystal steal/carry-away loss rules and carrier-kill crystal return behavior to the core simulation.
- Added regression tests for crystal carrier flow and recovery.
- Added a TypeScript game-core foundation with platform-agnostic state, actions, fixed-tick simulation, seeded random utilities, level config, and snapshot save/restore helpers.
- Added tests covering start/pause/resume, speed multipliers, deterministic snapshots, and hero skill actions.
