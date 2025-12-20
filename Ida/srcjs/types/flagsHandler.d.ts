/**
 * Interface for handling flag object operations.
 */
export interface FlagsHandler {
  /**
   * Reads the flags set in the given flags value and returns an array of flag names that are set.
   * @param flagsValue The numeric value representing the flags.
   * @returns An array of flag names that are set
   */
  read(flagsValue: number): string[];

  /**
   * Sets a specific flag in the given flags value and returns the updated flags value.
   * @param flagsValue The numeric value representing the flags.
   * @param flag The flag to set, either as a string or a numeric value.
   * @returns The updated flags value with the specified flag set.
   */
  set(flagsValue: number, flag: string | number): number;

  /**
   * Clears a specific flag in the given flags value and returns the updated flags value.
   * @param flagsValue The numeric value representing the flags.
   * @param flag The flag to clear, either as a string or a numeric value.
   * @returns The updated flags value with the specified flag cleared.
   */
  unset(flagsValue: number, flag: string | number): number;

  /**
   * Checks if a specific flag is set in the given flags value.
   * @param flagsValue The numeric value representing the flags.
   * @param flag The flag to check, either as a string or a numeric value.
   * @returns True if the flag is set, false otherwise.
   */
  isSet(flagsValue: number, flag: string | number): boolean;
}
