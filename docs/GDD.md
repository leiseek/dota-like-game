---
doc_id: GDD
version: 0.2.0
status: active
owner_agent: Game Director Agent
last_updated: 2026-06-23
change_summary: game design baseline with first level, heroes, and core systems
---

# Game Design Document

## Project Codename

Ancient Defense / dota-like-game

## Genre

2D / pseudo-2.5D hero-skill tower defense.

## One-liner

Summon heroes, cast skills, and recover Ancient Crystals stolen by enemies.

## Core Differentiation

Traditional tower defense asks:

> Which tower do you build?

This game asks:

> Which hero combo will you use to control, burst, and recover this wave?

## Core Mechanics

1. Hero towers;
2. Active hero skills;
3. Crystal theft and recovery;
4. Skill combo reactions;
5. Destructible map objects;
6. In-run upgrades;
7. Pause, speed, and exit resume.

## Demo 0.1 Heroes

| Hero | Role | Active Skill |
|---|---|---|
| Hook Guardian | control / pullback / rescue | Rift Chain Hook |
| Frost Priestess | slow / freeze / control | Frozen Path |
| Storm Sigilist | chain magic / wave clear | Storm Chain |
| Moonblade Ranger | bouncing physical DPS | Moonblade Storm |

## Demo 0.1 Enemies

| Enemy | Feature | Purpose |
|---|---|---|
| Rift Grunt | basic unit | baseline DPS check |
| Swift Beast | fast | teaches slow/control |
| Stoneguard | armored | teaches upgrades/damage type |
| Shield Acolyte | shields allies | teaches priority targeting |
| Crystal Thief | steals crystal and returns | core pressure mechanic |

## First Level

See `docs/LEVEL_001.md`.

Level name: Ancient Forest Entrance.

Features:

- S-shaped path;
- 10 tower slots;
- 10 waves;
- 1 boss;
- 6 obstacles;
- tutorial for pause, speed, skills, and crystal recovery.

## UX

See `docs/UI_UX_SPEC.md`.

Battle HUD must always display:

- base crystals;
- gold;
- mana crystal;
- wave;
- pause;
- current speed.

## Technical State Source

See `docs/GAME_STATE_SCHEMA.md`.

All battle state goes into GameState. UI and platform layers do not own battle-result state.

## Current Self Review

### Strengths

- clear core differentiation;
- strong tower-defense must-have controls;
- first level and hero set are concrete enough for implementation;
- core-first architecture protects platform portability.

### Risks

- first balance values are untested;
- 10x speed is technically risky;
- boss details remain incomplete;
- IP expression must stay original.

### Required Changes Next

- enemy numeric design;
- boss detailed design;
- first game-core implementation;
- technical review after GameState and GameClock.
