---
doc_id: HERO_DESIGN
version: 0.2.0
status: active
owner_agent: Combat Designer Agent
last_updated: 2026-06-23
change_summary: first four MVP hero designs
---

# Hero Design

## Goal

The first four heroes cover MVP needs:

1. control and crystal recovery;
2. slow and crowd control;
3. chain magic wave clear;
4. bouncing physical DPS.

## Common Rules

| Rule | Value |
|---|---|
| Build | only on tower slots |
| Attack | automatic targeting |
| Skill | selected hero casts active skill |
| Upgrade | MVP supports level 1 to 3 |
| Sell | refund 70% of total cost |
| Default target | enemy closest to base |

## Hero 1: Hook Guardian

Role: control / pullback / rescue.

| Stat | Lv1 | Lv2 | Lv3 |
|---|---:|---:|---:|
| Build cost | 120 | - | - |
| Upgrade cost | - | 160 | 240 |
| Damage | 18 | 28 | 42 |
| Attack interval | 1.15s | 1.05s | 0.95s |
| Range | 130 | 140 | 150 |
| Damage type | physical | physical | physical |

### Active: Rift Chain Hook

| Property | Value |
|---|---:|
| Cooldown | 16s |
| Mana cost | 35 |
| Cast | target enemy or direction |
| Hook distance | 260 |
| Pull distance | 160 |
| Damage | 80 |
| Bonus vs carrier | stun 1.0s |

Lv3: hitting a crystal carrier refunds 40% cooldown.

## Hero 2: Frost Priestess

Role: slow / freeze / control.

| Stat | Lv1 | Lv2 | Lv3 |
|---|---:|---:|---:|
| Build cost | 110 | - | - |
| Upgrade cost | - | 150 | 220 |
| Damage | 10 | 16 | 24 |
| Attack interval | 1.0s | 0.95s | 0.9s |
| Range | 150 | 160 | 170 |
| Basic slow | 20% / 1.0s | 25% / 1.2s | 30% / 1.5s |
| Damage type | magical | magical | magical |

### Active: Frozen Path

| Property | Value |
|---|---:|
| Cooldown | 18s |
| Mana cost | 40 |
| Cast | road area |
| Length | 180 |
| Duration | 4s |
| Slow | 65% |
| Carrier bonus | additional 15% slow |
| End burst damage | 45 |

Combo: slowed/frozen enemies hit by Storm Chain cause +2 lightning jumps.

## Hero 3: Storm Sigilist

Role: chain magic / wave clear.

| Stat | Lv1 | Lv2 | Lv3 |
|---|---:|---:|---:|
| Build cost | 140 | - | - |
| Upgrade cost | - | 180 | 260 |
| Damage | 22 | 34 | 50 |
| Attack interval | 1.4s | 1.3s | 1.2s |
| Range | 165 | 175 | 185 |
| Damage type | magical | magical | magical |

### Active: Storm Chain

| Property | Value |
|---|---:|
| Cooldown | 20s |
| Mana cost | 45 |
| Cast | target enemy |
| Initial damage | 95 |
| Base jumps | 4 |
| Jump radius | 120 |
| Jump decay | 15% |
| Ice combo | +2 jumps |

## Hero 4: Moonblade Ranger

Role: bouncing physical DPS.

| Stat | Lv1 | Lv2 | Lv3 |
|---|---:|---:|---:|
| Build cost | 130 | - | - |
| Upgrade cost | - | 170 | 250 |
| Damage | 16 | 25 | 38 |
| Attack interval | 0.8s | 0.72s | 0.65s |
| Range | 155 | 165 | 175 |
| Bounces | 1 | 2 | 3 |
| Bounce decay | 25% | 22% | 20% |
| Damage type | physical | physical | physical |

### Active: Moonblade Storm

| Property | Value |
|---|---:|
| Cooldown | 22s |
| Mana cost | 50 |
| Duration | 6s |
| Attack speed | +60% |
| Extra bounces | +2 |
| Bonus vs slowed | +20% damage |

## Initial Economy Assumption

Initial gold is 300. Player can build two heroes at start, encouraging combo play.

## MVP Balance Assumption

- a normal player may leak 1 to 3 crystals and still win;
- 2x should feel safe;
- 5x/10x are for advanced play and debugging;
- no single hero should trivially 3-star the level.
