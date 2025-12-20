/**
 * Interface for handling enum object reading operations.
 */
export interface EnumHandler {
  /**
   * Reads the enum value and returns the corresponding key name if found, otherwise returns the original numeric value.
   * @param enumValue The numeric value representing the enum.
   * @returns The key name if found, otherwise the numeric value.
   */
  read(enumValue: number): string | number;
}
