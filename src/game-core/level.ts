import type { LevelConfig } from "./types.js";

export const tutorialLevel: LevelConfig = {
  id: "tutorial-ancient-road",
  fixedDeltaMs: 100,
  randomSeed: 1337,
  baseHealth: 20,
  path: [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
    { x: 10, y: 4 },
  ],
  startingHeroes: [
    {
      archetype: "guardian",
      position: { x: 2, y: 1 },
      health: 100,
      maxHealth: 100,
    },
  ],
};

export const level001Config: LevelConfig = {
  id: "level-001-ancient-forest-entrance",
  fixedDeltaMs: 33.333,
  randomSeed: 1001,
  baseHealth: 12,
  path: [
    { x: 40, y: 110 },
    { x: 220, y: 110 },
    { x: 220, y: 250 },
    { x: 420, y: 250 },
    { x: 420, y: 100 },
    { x: 650, y: 100 },
    { x: 650, y: 360 },
    { x: 850, y: 360 },
    { x: 850, y: 250 },
    { x: 920, y: 250 },
  ],
  startingHeroes: [],
  towerSlots: [
    { id: "T01", position: { x: 150, y: 190 }, initiallyUnlocked: true },
    { id: "T02", position: { x: 280, y: 180 }, initiallyUnlocked: true },
    { id: "T03", position: { x: 330, y: 320 }, initiallyUnlocked: true },
    { id: "T04", position: { x: 500, y: 180 }, initiallyUnlocked: true },
    { id: "T05", position: { x: 560, y: 300 }, initiallyUnlocked: true },
    { id: "T06", position: { x: 730, y: 220 }, initiallyUnlocked: true },
    { id: "T07", position: { x: 760, y: 430 }, initiallyUnlocked: true },
    { id: "T08", position: { x: 875, y: 160 }, initiallyUnlocked: true },
    { id: "T09", position: { x: 370, y: 420 }, initiallyUnlocked: false },
    { id: "T10", position: { x: 620, y: 430 }, initiallyUnlocked: false },
  ],
  obstacles: [
    { id: "O01", position: { x: 360, y: 410 }, maxHealth: 120, rewardGold: 60, unlocksSlotId: "T09" },
    { id: "O02", position: { x: 610, y: 420 }, maxHealth: 150, rewardGold: 80, unlocksSlotId: "T10" },
    { id: "O03", position: { x: 250, y: 360 }, maxHealth: 100, rewardGold: 50 },
    { id: "O04", position: { x: 720, y: 130 }, maxHealth: 140, rewardGold: 70 },
    { id: "O05", position: { x: 500, y: 420 }, maxHealth: 180, rewardGold: 100 },
    { id: "O06", position: { x: 120, y: 300 }, maxHealth: 80, rewardGold: 40 },
  ],
  enemies: [
    { archetype: "rift-grunt", maxHealth: 50 },
    { archetype: "swift-beast", maxHealth: 36 },
    { archetype: "crystal-thief", maxHealth: 70 },
    { archetype: "stoneguard", maxHealth: 150 },
    { archetype: "shield-acolyte", maxHealth: 85 },
    { archetype: "rift-beast-hatchling", maxHealth: 900 },
  ],
  waves: [
    { id: "wave-01", startsAtMs: 0, spawnGroups: [{ enemyArchetype: "rift-grunt", count: 8, intervalMs: 1200 }] },
    { id: "wave-02", startsAtMs: 25000, spawnGroups: [{ enemyArchetype: "rift-grunt", count: 12, intervalMs: 1000 }] },
    { id: "wave-03", startsAtMs: 55000, spawnGroups: [{ enemyArchetype: "swift-beast", count: 8, intervalMs: 900 }] },
    {
      id: "wave-04",
      startsAtMs: 85000,
      spawnGroups: [
        { enemyArchetype: "rift-grunt", count: 10, intervalMs: 800 },
        { enemyArchetype: "swift-beast", count: 6, intervalMs: 800 },
      ],
    },
    { id: "wave-05", startsAtMs: 120000, spawnGroups: [{ enemyArchetype: "crystal-thief", count: 2, intervalMs: 4000 }] },
    { id: "wave-06", startsAtMs: 155000, spawnGroups: [{ enemyArchetype: "stoneguard", count: 6, intervalMs: 1800 }] },
    {
      id: "wave-07",
      startsAtMs: 190000,
      spawnGroups: [
        { enemyArchetype: "shield-acolyte", count: 3, intervalMs: 1000 },
        { enemyArchetype: "rift-grunt", count: 12, intervalMs: 1000 },
      ],
    },
    {
      id: "wave-08",
      startsAtMs: 230000,
      spawnGroups: [
        { enemyArchetype: "swift-beast", count: 10, intervalMs: 800 },
        { enemyArchetype: "crystal-thief", count: 3, intervalMs: 800 },
      ],
    },
    { id: "wave-09", startsAtMs: 270000, spawnGroups: [{ enemyArchetype: "rift-grunt", count: 28, intervalMs: 350 }] },
    { id: "wave-10", startsAtMs: 325000, spawnGroups: [{ enemyArchetype: "rift-beast-hatchling", count: 1, intervalMs: 0 }] },
  ],
};
