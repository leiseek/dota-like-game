---
doc_id: MVP_SCOPE
version: 0.1.0
status: active
owner_agent: Executive Producer Agent
last_updated: 2026-06-23
change_summary: Demo 0.1 MVP scope
---

# MVP Scope

## MVP Goal

Demo 0.1 must validate:

> In one map, the player builds hero towers, uses active skills and skill combos, prevents 10 waves of enemies from stealing Ancient Crystals, and can pause, speed up, exit, resume, and complete settlement.

## North Star Loop

```text
Build hero
↓
Enemies attack
↓
Hero auto-attacks
↓
Enemies steal crystal
↓
Player saves with skill
↓
Recover crystal
↓
Upgrade hero
↓
Defeat boss
↓
Star settlement
```

## Must Have

| Module | Content | Acceptance |
|---|---|---|
| Map | 1 S-shaped route | enemies move from start to base |
| Heroes | 4 hero towers | each has attack and one active skill |
| Enemies | 5 enemy types | normal, fast, armored, shield, thief |
| Waves | 10 waves | wave 1 to boss wave works |
| Crystal theft | enemies steal and return | player can recover crystals |
| Active skills | hook, ice field, lightning chain, moonblade burst | cooldown and mana cost |
| Skill combo | ice + lightning | slowed/frozen targets boost chain lightning |
| Pause | pause/resume | all simulation stops |
| Speed | 1x/2x/5x/10x | stable speed switching |
| Exit resume | Battle Snapshot | can resume unfinished battle |
| Settlement | win/lose/star rating | based on remaining crystals |
| Self Review | SRG gate | core modules include review |

## Should Have

- destructible obstacles;
- lightweight tutorial;
- start-next-wave button;
- local meta save.

## Could Have

- shareable battle report;
- friend leaderboard;
- additional skill combos;
- hero progression.

## Won't Have Yet

- real-time multiplayer;
- gacha;
- large 3D maps;
- complex story;
- multi-chapter campaign.
