/**
 * Type definition for the game store used in this mod.
 * This provides strong typing for your persistent game state, if you wish so.
 */
export interface GameStore {
  /** Whether the weather is currently sunny (true) or stormy (false) */
  isSunny: boolean;
}

/**
 * Returns the strongly-typed game store for this mod.
 */
export function useMyGameStore(): GameStore {
  return useGameStore() as GameStore;
}
