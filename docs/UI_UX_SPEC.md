---
doc_id: UI_UX_SPEC
version: 0.2.0
status: active
owner_agent: UX/UI Agent
last_updated: 2026-06-23
change_summary: battle HUD and interaction spec
---

# UI / UX Spec

## Goal

Make Demo 0.1 playable and clear on mobile, with tower-defense must-have controls:

- pause;
- exit resume;
- 1x/2x/5x/10x;
- active skill targeting;
- clear crystal theft feedback.

## Orientation

MVP prioritizes landscape.

Logical canvas:

```text
960 x 540
```

## Battle HUD

```text
┌────────────────────────────────────────────┐
│ Crystals  Gold  Mana  Wave                 │  Pause Speed
├────────────────────────────────────────────┤
│                                            │
│                 Battle Map                 │
│                                            │
├────────────────────────────────────────────┤
│ selected hero / build panel / skill / upg  │
└────────────────────────────────────────────┘
```

## Top Bar

| Element | Persistent | Notes |
|---|---|---|
| Crystals | yes | most important resource |
| Gold | yes | build and upgrade |
| Mana Crystal | yes | active skills |
| Wave | yes | progress |
| Pause | yes | top right |
| Speed | yes | top right |

## Speed Interaction

Button cycles:

```text
1x → 2x → 5x → 10x → 1x
```

Requirements:

- current speed always visible;
- 10x must be visually distinct;
- speed change does not unpause game;
- pause stops simulation regardless of speed.

## Pause Interaction

Pause menu:

```text
Resume
Restart
Save and Exit
Settings
```

Paused state:

- enemy movement stops;
- projectiles stop;
- skill cooldowns stop;
- wave timers stop;
- UI remains interactive.

## Exit Resume

Manual exit prompt:

```text
Save current battle progress?
[Save and Exit] [Abandon Run] [Cancel]
```

Resume prompt:

```text
Unfinished battle found
Ancient Forest Entrance - Wave 7
Remaining crystals: 8
[Continue] [Abandon]
```

## Build Interaction

Tap empty tower slot:

- open hero build panel;
- show hero icon, cost, and role;
- insufficient gold disables button;
- tapping hero builds immediately.

## Selected Hero Interaction

Tap hero tower:

- show attack range;
- show hero info;
- show upgrade;
- show sell;
- show active skill;
- show cooldown and mana cost.

## Skill Targeting

### Target enemy skill

Example: Storm Chain.

1. Select hero.
2. Tap skill.
3. Highlight valid enemies.
4. Tap enemy to cast.

### Target road / area skill

Example: Frozen Path.

1. Select hero.
2. Tap skill.
3. Highlight valid path areas.
4. Tap road position.

### Direction skill

Example: Rift Chain Hook.

1. Select hero.
2. Tap skill.
3. Show line preview.
4. Tap direction or enemy.

## Crystal Carrier Feedback

When an enemy carries crystals:

- show crystal icon above enemy;
- highlight HP bar;
- first occurrence shows prompt.

Prompt:

```text
An enemy stole a crystal. Defeat it to recover.
```

## Self Review

### Strengths

- pause and speed are persistent;
- selected-hero skill panel avoids global skill bar overload;
- resume prompt gives enough context;
- skill targeting is extensible.

### Risks

- selected-hero-only skill casting may feel slow to expert players;
- speed cycling may cause accidental 10x;
- bottom panel may cover lower tower slots.
