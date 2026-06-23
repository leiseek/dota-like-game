---
doc_id: ROADMAP
version: 0.1.0
status: active
owner_agent: Executive Producer Agent
last_updated: 2026-06-23
change_summary: project phase roadmap
---

# Roadmap

## Phase 0: AI Native setup and documentation baseline

Goal: establish team roles, scope, architecture, Self Review, and version tracking.

### Outputs

- AGENT_TEAM.md
- MVP_SCOPE.md
- PLATFORM_STRATEGY.md
- TECH_ARCHITECTURE.md
- SELF_REVIEW_PROCESS.md
- GDD.md
- CHANGELOG.md
- DECISIONS.md

### Gate

- [x] MVP scope clear;
- [x] Agent roles clear;
- [x] Self Review clear;
- [x] document version tracking clear;
- [x] core technical direction clear.

## Phase 1: Core gameplay prototype

Goal: one map can spawn enemies, build towers, attack, pause, and speed up.

### Outputs

- map rendering placeholder;
- enemy path movement;
- hero tower construction;
- auto targeting and attack;
- wave system;
- pause / resume;
- 1x / 2x / 5x / 10x.

### Gate

- [ ] run can start;
- [ ] enemies spawn;
- [ ] towers can be built;
- [ ] towers attack;
- [ ] pause works;
- [ ] speed is stable;
- [ ] 10x has no obvious path skipping.

## Phase 2: Soul mechanics

Goal: implement crystal theft, recovery, active skills, and exit resume.

### Outputs

- crystal theft system;
- dropped crystal and recovery;
- Hook skill;
- Frozen Path skill;
- Storm Chain skill;
- Moonblade Storm skill;
- Battle Snapshot;
- exit resume.

### Gate

- [ ] enemies can steal crystals;
- [ ] player can recover crystals;
- [ ] skills create rescue value;
- [ ] ice + lightning combo works;
- [ ] exit resume works.

## Phase 3: Complete first level

Goal: 10 waves + boss + settlement.

### Outputs

- complete LEVEL_001;
- 10 waves;
- one boss;
- obstacles;
- tutorial;
- win/lose settlement;
- star rating.

### Gate

- [ ] start-to-end playable;
- [ ] first level lasts 3 to 8 minutes;
- [ ] at least one rescue moment;
- [ ] at least one skill combo payoff;
- [ ] clear settlement.

## Phase 4: Platform validation

Goal: validate HarmonyOS and WeChat Mini Game feasibility.

### Outputs

- ArkTS shell;
- WeChat Mini Game shell;
- game-core reuse proof;
- storage adaptation;
- performance record.

### Gate

- [ ] game-core reusable;
- [ ] platform layers do not pollute battle logic;
- [ ] mobile controls acceptable;
- [ ] basic performance acceptable.
