---
doc_id: WEB_PREVIEW_SMOKE_PLAYTEST
version: 0.5.0
status: active
owner_agent: QA Agent
last_updated: 2026-06-24
change_summary: Web Preview smoke playtest checklist added
---

# Web Preview Smoke Playtest

## Goal

Validate that Demo 0.1 is playable end-to-end through the Web Preview before deeper balance and UX polish.

This document is a manual test script plus issue-capture template. It should be used after `npm run check` passes.

## Setup

Run:

```bash
npm install
npm run check
npm run preview:web
```

Open:

```text
http://localhost:4173/platform-web/
```

## Pass / Fail Standard

The smoke test passes only if:

1. the project builds and tests pass;
2. Web Preview opens without console-breaking errors;
3. a player can start battle, build heroes, launch waves, cast active skills, pause/resume, switch speed, save/continue, and reach win or lose settlement;
4. core state remains authoritative in `src/game-core`;
5. no P0 blocker prevents another playtest session.

## Test Matrix

| Area | Test | Expected Result | Result |
|---|---|---|---|
| Build | `npm run check` | TypeScript build, tests, Web type-check pass | Not run in chat |
| Launch | `npm run preview:web` | Local server starts and Web Preview loads | Not run in chat |
| Start | Click Start | status changes from ready to running | Not run in chat |
| Build | Build each hero type | gold spends, slot becomes occupied, hero appears | Not run in chat |
| Wave | Start next wave | enemies spawn and move along route | Not run in chat |
| Combat | Let heroes auto-attack | enemies take damage and die | Not run in chat |
| Hook | Hook Guardian skill | target takes damage; carrier can be pulled/stunned | Not run in chat |
| Frost | Frost Priestess skill | nearby enemies show SLOW and move slower | Not run in chat |
| Storm | Storm Sigilist skill | chain hits multiple nearby enemies | Not run in chat |
| Combo | Frost then Storm | Storm hits more targets after slow/control | Not run in chat |
| Moonblade | Moonblade Ranger skill | bounces and bursts controlled enemies | Not run in chat |
| Crystal theft | Let enemy reach Ancient | enemy carries crystal, HUD shows stolen/carried | Not run in chat |
| Recovery | Kill carrier | crystal status becomes recovered | Not run in chat |
| Escape | Let carrier return | battle loses with escaped reason | Not run in chat |
| Speed | Cycle 1x/2x/5x/10x | simulation remains stable and endpoints resolve | Not run in chat |
| Pause | Pause/resume | movement, wave timers, cooldowns stop and resume | Not run in chat |
| Save | Save and Exit | snapshot stored locally and battle pauses | Not run in chat |
| Continue | Continue saved battle | snapshot restores into paused state | Not run in chat |
| Settlement | Win/lose | overlay shows outcome, stars, reason, crystals | Not run in chat |

## Playtest Notes Template

```text
Tester:
Date:
Browser:
Commit SHA:

Build result:
Preview result:

First impression:

Major blockers:
1.
2.
3.

Readability issues:
1.
2.
3.

Balance issues:
1.
2.
3.

Controls / UX issues:
1.
2.
3.

Recommended next actions:
1.
2.
3.
```

## Known Pre-Playtest Risks

- Placeholder Canvas visuals may make skill effects hard to read.
- Enemy-targeted click casting is still an MVP shortcut for road/area skills.
- Star thresholds are simple and need playtest tuning.
- Obstacle destruction is configured but not implemented as gameplay yet.
- Snapshot validation is minimal.

## Self Review

Review Result: Pass

Main Issues: The checklist cannot replace an actual local/browser run.

Required Changes: Run this script locally after CI passes and record findings before starting polish.

Risk Level: Medium
