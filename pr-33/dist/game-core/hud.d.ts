import type { GameSpeed, GameState, HudState } from "./types.js";
export declare const HUD_SPEED_OPTIONS: readonly GameSpeed[];
/**
 * Builds the platform-neutral battle HUD read model from authoritative GameState.
 * Platform adapters can render this object directly, but must still send user input
 * back into the core as GameAction values.
 */
export declare function selectHudState(state: GameState): HudState;
