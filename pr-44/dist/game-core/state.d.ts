import type { GameAction, GameSnapshot, GameState, LevelConfig } from "./types.js";
export declare function createInitialGameState(level: LevelConfig): GameState;
export declare function enqueueAction(state: GameState, action: GameAction): GameState;
export declare function createSnapshot(state: GameState): GameSnapshot;
export declare function restoreSnapshot(snapshot: GameSnapshot): GameState;
