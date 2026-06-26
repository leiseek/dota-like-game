import type { GameState, LevelConfig } from "./types.js";
export declare function reduceActions(state: GameState, level?: LevelConfig): GameState;
export declare function stepFixedTick(state: GameState, level?: LevelConfig): GameState;
export declare function stepSimulation(state: GameState, fixedTicks?: number, level?: LevelConfig): GameState;
