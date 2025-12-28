/**
 * Extends the Array prototype with additional mathematical operations with vectors.
 */
export interface ArrayExtensions<T> {
  /**
   * Performs element-wise addition between this array and another numeric array.
   * Both arrays must have equal length.
   * @param other - The numeric array to add to this array
   * @returns A new array with the results of element-wise addition
   * @throws Error if the argument is not an array or arrays have different lengths
   */
  plus(other: number[]): number[];

  /**
   * Performs element-wise subtraction between this array and another numeric array.
   * Both arrays must have equal length.
   * @param other - The numeric array to subtract from this array
   * @returns A new array with the results of element-wise subtraction
   * @throws Error if the argument is not an array or arrays have different lengths
   */
  minus(other: number[]): number[];

  /**
   * Calculates the magnitude (length) of the array as a vector.
   * Uses the formula: √(x₁² + x₂² + ... + xₙ²)
   * @returns The magnitude of the array as a number
   */
  magnitude(): number;

  /**
   * Calculates the squared magnitude of the array as a vector (faster than magnitude).
   * Uses the formula: x₁² + x₂² + ... + xₙ²
   * @returns The squared magnitude of the array as a number
   */
  sqrMagnitude(): number;

  /**
   * Performs scalar multiplication on all components of the array.
   * @param scalar - The number to multiply each array element by
   * @returns A new array with each element multiplied by the scalar
   * @throws Error if the argument is not a number
   */
  mul(scalar: number): number[];

  /**
   * Performs scalar division on all components of the array.
   * @param scalar - The number to divide each array element by
   * @returns A new array with each element divided by the scalar
   * @throws Error if the argument is not a number or is zero
   */
  div(scalar: number): number[];

  /**
   * Returns a random element from the array.
   */
  random(): T;
}
