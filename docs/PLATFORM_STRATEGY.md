---
doc_id: PLATFORM_STRATEGY
version: 0.1.0
status: active
owner_agent: Platform Strategy Agent
last_updated: 2026-06-23
change_summary: HarmonyOS and WeChat Mini Game dual-platform strategy
---

# Platform Strategy

## Platform Positioning

The project considers both:

1. HarmonyOS ArkTS native application;
2. WeChat Mini Game ecosystem.

They are not mutually exclusive. Core gameplay is shared through a core-first architecture.

## Platform Comparison

| Platform | Product Shape | Advantage | Risk |
|---|---|---|---|
| HarmonyOS ArkTS | native single-player app | useful for ArkTS learning, full local experience | game engine features must be built or adapted |
| WeChat Mini Game | lightweight distribution version | massive ecosystem, sharing, short sessions | package size, performance, platform adaptation |

## WeChat Mini Game Constraints

- sessions should be 3 to 8 minutes;
- fast startup;
- lightweight controls;
- clear feedback;
- shareable battle reports;
- fast retry;
- active unit count should be controlled.

## HarmonyOS Constraints

- landscape experience first;
- can support richer campaign;
- better local settings and save management;
- can later adapt to tablets and PC-like devices.

## Technical Principle

```text
game-core
  platform-neutral game logic

platform-harmony
  ArkTS / ArkUI / Canvas / lifecycle

platform-wechat
  WeChat Mini Game shell or Cocos adapter

shared-assets
  configs, values, maps, text
```

## Platform-Neutral Rules

- no battle logic inside UI components;
- all timing goes through GameClock;
- all randomness goes through SeededRandom;
- all battle state lives in GameState;
- input becomes GameAction;
- persistence uses BattleSnapshot.

## Validation Tasks

| Task | Goal |
|---|---|
| PLATFORM-001 | validate ArkTS Canvas rendering and input |
| PLATFORM-002 | validate WeChat Mini Game minimal canvas runtime |
| PLATFORM-003 | validate game-core reuse between shells |
| PLATFORM-004 | validate local save and exit resume |
| PLATFORM-005 | validate 10x speed performance |
