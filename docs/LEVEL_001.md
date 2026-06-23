---
doc_id: LEVEL_001
version: 0.2.0
status: active
owner_agent: Level Designer Agent
last_updated: 2026-06-23
change_summary: first level detailed design
---

# LEVEL_001: Ancient Forest Entrance

## Goal

Validate Demo 0.1 core gameplay:

- build hero towers;
- enemies follow path;
- enemies steal crystals and return;
- player recovers crystals with skills;
- pause, speed, and full settlement work.

## Level Overview

| Item | Value |
|---|---|
| Level name | Ancient Forest Entrance |
| Expected length | 4 to 7 minutes |
| Style | forest ruins, runic road, crystal base |
| Difficulty | tutorial + light pressure |
| Route type | one entrance, one base, S-shaped path |
| Tower slots | 10 |
| Obstacles | 6 |
| Boss | Rift Beast Hatchling |

## Coordinate System

Logical map size:

```text
width: 960
height: 540
```

## Path Points

```text
P0:  40, 110
P1: 220, 110
P2: 220, 250
P3: 420, 250
P4: 420, 100
P5: 650, 100
P6: 650, 360
P7: 850, 360
P8: 850, 250
P9: 920, 250
```

Base is near P9.

## Tower Slots

| Slot ID | Position | Initial State | Purpose |
|---|---:|---|---|
| T01 | 150,190 | unlocked | opening line coverage |
| T02 | 280,180 | unlocked | first turn |
| T03 | 330,320 | unlocked | middle segment |
| T04 | 500,180 | unlocked | reverse path coverage |
| T05 | 560,300 | unlocked | long route coverage |
| T06 | 730,220 | unlocked | pre-base defense |
| T07 | 760,430 | unlocked | returning thief interception |
| T08 | 875,160 | unlocked | base defense |
| T09 | 370,420 | locked | unlocked by obstacle |
| T10 | 620,430 | locked | unlocked by obstacle |

## Obstacles

| ID | Position | HP | Reward | Note |
|---|---:|---:|---:|---|
| O01 | 360,410 | 120 | 60 gold | unlock T09 |
| O02 | 610,420 | 150 | 80 gold | unlock T10 |
| O03 | 250,360 | 100 | 50 gold | obstacle tutorial |
| O04 | 720,130 | 140 | 70 gold | base-side resource |
| O05 | 500,420 | 180 | 100 gold | midgame reward |
| O06 | 120,300 | 80 | 40 gold | low-risk reward |

## Initial Resources

| Resource | Value |
|---|---:|
| Gold | 300 |
| Mana Crystal | 100 |
| Base Crystals | 12 |
| Default speed | 1x |

## Waves

| Wave | Time | Enemy | Count | Interval | Purpose |
|---:|---:|---|---:|---:|---|
| 1 | 0s | Rift Grunt | 8 | 1.2s | build tutorial |
| 2 | 25s | Rift Grunt | 12 | 1.0s | range tutorial |
| 3 | 55s | Swift Beast | 8 | 0.9s | slow tutorial |
| 4 | 85s | Grunt + Swift | 10 + 6 | 0.8s | mixed pressure |
| 5 | 120s | Crystal Thief | 2 | 4.0s | crystal recovery tutorial |
| 6 | 155s | Stoneguard | 6 | 1.8s | upgrade tutorial |
| 7 | 190s | Shield Acolyte + Grunt | 3 + 12 | 1.0s | priority targeting |
| 8 | 230s | Swift + Thief | 10 + 3 | 0.8s | rescue pressure |
| 9 | 270s | Rift Grunt | 28 | 0.35s | skill payoff |
| 10 | 325s | Rift Beast Hatchling | 1 | - | boss test |

## Tutorial Prompts

| Trigger | Prompt |
|---|---|
| first entry | Tap an empty tower slot to summon a hero. |
| first hero selected | Heroes can upgrade and cast active skills. |
| wave 3 starts | Fast enemies are vulnerable to slowing effects. |
| first thief steals crystal | An enemy stole a crystal. Defeat it to recover. |
| first speed change | Speed helps, but high speed increases risk. |
| first pause | Pause stops battle and lets you inspect the field. |

## Settlement

| Stars | Condition |
|---|---|
| 3 | remaining crystals >= 10 |
| 2 | remaining crystals 6 to 9 |
| 1 | remaining crystals 1 to 5 |
| defeat | crystals = 0 |

## Self Review

### Strengths

- S-shaped route creates overlapping coverage and recovery space.
- T07/T08 support crystal recovery gameplay.
- Wave 5 teaches theft explicitly.
- Wave 9 creates a skill payoff moment.

### Risks

- T07/T08 may make theft too easy.
- Wave 9 may stress 10x performance.
- Tutorial prompts may interrupt flow if too frequent.
