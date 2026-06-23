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
