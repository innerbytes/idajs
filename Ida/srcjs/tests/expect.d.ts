export interface Expect {
  // ============================================================================
  // Assert.js Methods
  // ============================================================================

  /**
   * Asserts that an object is an instance of the expected class/constructor
   * @param objectValue The object to check
   * @param expectedInstance The expected constructor/class
   * @param message Optional custom error message
   */
  instanceOf(
    objectValue: object,
    expectedInstance: Function,
    message?: string
  ): void;

  /**
   * Asserts that an object is an instance of one of the expected classes/constructors
   * @param objectValue The object to check
   * @param expectedInstances Array of expected constructors/classes
   * @param message Optional custom error message
   */
  instanceOneOf(
    objectValue: object,
    expectedInstances: Function[],
    message?: string
  ): void;

  /**
   * Asserts that a value is an integer
   * @param integerValue The value to check
   * @param message Optional custom error message
   */
  integer(integerValue: any, message?: string): void;

  /**
   * Asserts that a value is a number
   * @param numberValue The value to check
   * @param message Optional custom error message
   */
  number(numberValue: any, message?: string): void;

  /**
   * Asserts that a value is a string
   * @param stringValue The value to check
   * @param message Optional custom error message
   */
  string(stringValue: any, message?: string): void;

  /**
   * Asserts that a value is a boolean
   * @param booleanValue The value to check
   * @param message Optional custom error message
   */
  boolean(booleanValue: any, message?: string): void;

  /**
   * Asserts that a value is true
   * @param value The value to check
   * @param message Optional custom error message
   */
  true(value: any, message?: string): void;

  /**
   * Asserts that a value is false
   * @param value The value to check
   * @param message Optional custom error message
   */
  false(value: any, message?: string): void;

  /**
   * Asserts that two values are equal
   * @param value The actual value
   * @param expectedValue The expected value
   * @param message Optional custom error message
   */
  equal(value: any, expectedValue: any, message?: string): void;

  /**
   * Asserts that two objects are equal (deep object comparison)
   * @param object The actual object
   * @param expectedObject The expected object
   * @param message Optional custom error message
   */
  objectEqual(
    object: object,
    expectedObject: object,
    message?: string,
    partial?: boolean
  ): void;

  /**
   * Asserts that a value is an object
   * @param objectValue The value to check
   * @param message Optional custom error message
   */
  object(objectValue: any, message?: string): void;

  /**
   * Asserts that an object has a specific function
   * @param expectedFunctionName The name of the expected function
   * @param objectValue The object to check
   * @param message Optional custom error message
   */
  hasFunction(
    expectedFunctionName: string,
    objectValue: object,
    message?: string
  ): void;

  /**
   * Asserts that an object has a specific property
   * @param expectedPropertyName The name of the expected property
   * @param objectValue The object to check
   * @param message Optional custom error message
   */
  hasProperty(
    expectedPropertyName: string,
    objectValue: object,
    message?: string
  ): void;

  /**
   * Asserts that an object has all the specified properties
   * @param expectedProperties Array of expected property names
   * @param objectValue The object to check
   * @param message Optional custom error message
   */
  hasProperties(
    expectedProperties: string[],
    objectValue: object,
    message?: string
  ): void;

  /**
   * Asserts that a value is an array
   * @param arrayValue The value to check
   * @param message Optional custom error message
   */
  array(arrayValue: any, message?: string): void;

  /**
   * Asserts that a value is one of the expected values
   * @param value The value to check
   * @param expectedElements Array of possible values
   * @param message Optional custom error message
   */
  oneOf(value: any, expectedElements: any[], message?: string): void;

  /**
   * Asserts that a value is a function
   * @param functionValue The value to check
   * @param message Optional custom error message
   */
  isFunction(functionValue: any, message?: string): void;

  /**
   * Asserts that a number is greater than the expected value
   * @param expected The minimum value (exclusive)
   * @param integerValue The value to check
   * @param message Optional custom error message
   */
  greaterThan(expected: number, integerValue: number, message?: string): void;

  /**
   * Asserts that a number is greater than or equal to the expected value
   * @param expected The minimum value (inclusive)
   * @param integerValue The value to check
   * @param message Optional custom error message
   */
  greaterThanOrEqual(
    expected: number,
    integerValue: number,
    message?: string
  ): void;

  /**
   * Asserts that a number is less than the expected value
   * @param expected The maximum value (exclusive)
   * @param integerValue The value to check
   * @param message Optional custom error message
   */
  lessThan(expected: number, integerValue: number, message?: string): void;

  /**
   * Asserts that a number is less than or equal to the expected value
   * @param expected The maximum value (inclusive)
   * @param integerValue The value to check
   * @param message Optional custom error message
   */
  lessThanOrEqual(
    expected: number,
    integerValue: number,
    message?: string
  ): void;

  /**
   * Asserts that an array contains only instances of the expected type
   * @param arrayValue The array to check
   * @param expectedInstance The expected constructor/class
   * @param message Optional custom error message
   */
  containsOnly(
    arrayValue: any[],
    expectedInstance: Function,
    message?: string
  ): void;

  /**
   * Asserts that an array contains only strings
   * @param arrayValue The array to check
   * @param message Optional custom error message
   */
  containsOnlyString(arrayValue: any[], message?: string): void;

  /**
   * Asserts that an array contains only integers
   * @param arrayValue The array to check
   * @param message Optional custom error message
   */
  containsOnlyInteger(arrayValue: any[], message?: string): void;

  /**
   * Asserts that an array contains only numbers
   * @param arrayValue The array to check
   * @param message Optional custom error message
   */
  containsOnlyNumber(arrayValue: any[], message?: string): void;

  /**
   * Asserts that an array has the expected number of elements
   * @param expectedCount The expected number of elements
   * @param arrayValue The array to check
   * @param message Optional custom error message
   */
  count(expectedCount: number, arrayValue: any[], message?: string): void;

  /**
   * Asserts that a value is not empty (has length > 0)
   * @param value The value to check
   * @param message Optional custom error message
   */
  notEmpty(value: { length: number }, message?: string): void;

  /**
   * Asserts that a number is odd
   * @param integerValue The number to check
   * @param message Optional custom error message
   */
  oddNumber(integerValue: number, message?: string): void;

  /**
   * Asserts that a number is even
   * @param integerValue The number to check
   * @param message Optional custom error message
   */
  evenNumber(integerValue: number, message?: string): void;

  /**
   * Asserts that a string is valid JSON
   * @param stringValue The string to check
   * @param message Optional custom error message
   */
  jsonString(stringValue: string, message?: string): void;

  /**
   * Asserts that a string is a valid email address
   * @param emailValue The string to check
   * @param message Optional custom error message
   */
  email(emailValue: string, message?: string): void;

  /**
   * Asserts that a string is a valid URL
   * @param urlValue The string to check
   * @param message Optional custom error message
   */
  url(urlValue: string, message?: string): void;

  /**
   * Asserts that a string is a valid UUID
   * @param uuidValue The string to check
   * @param message Optional custom error message
   */
  uuid(uuidValue: string, message?: string): void;

  /**
   * Asserts that an HTML element contains an element matching the selector
   * @param selector The CSS selector to search for
   * @param htmlElement The HTML element to search within
   * @param message Optional custom error message
   */
  hasElement(
    selector: string,
    htmlElement: HTMLElement | HTMLDocument,
    message?: string
  ): void;

  /**
   * Asserts that an HTML element has the specified attribute
   * @param attributeName The name of the attribute
   * @param htmlElement The HTML element to check
   * @param message Optional custom error message
   */
  hasAttribute(
    attributeName: string,
    htmlElement: HTMLElement,
    message?: string
  ): void;

  /**
   * Asserts that an HTML element has all the specified attributes
   * @param attributes Array of attribute names
   * @param htmlElement The HTML element to check
   * @param message Optional custom error message
   */
  hasAttributes(
    attributes: string[],
    htmlElement: HTMLElement,
    message?: string
  ): void;

  /**
   * Asserts that a callback function throws an error
   * @param callback The function that should throw
   * @param expectedError Optional expected error (defaults to any Error)
   */
  throws(callback: () => void, expectedError?: Error): void;

  // ============================================================================
  // MoreAssert Methods (Custom Extensions)
  // ============================================================================

  /**
   * Asserts that two references are equal
   * @param value The actual value
   * @param expectedValue The expected value
   * @param message Optional custom error message
   */
  eq(value: any, expectedValue: any, message?: string): void;

  /**
   * Asserts that a value is between min and max (inclusive)
   * @param minValue The minimum value (inclusive)
   * @param maxValue The maximum value (inclusive)
   * @param value The value to check
   * @param message Optional custom error message
   */
  between(
    minValue: number,
    maxValue: number,
    value: number,
    message?: string
  ): void;

  /**
   * Asserts that a value is greater than the minimum (alias for greaterThan)
   * @param minValue The minimum value (exclusive)
   * @param value The value to check
   * @param message Optional custom error message
   */
  gt(minValue: number, value: number, message?: string): void;

  /**
   * Asserts that a value is greater than or equal to the minimum (alias for greaterThanOrEqual)
   * @param minValue The minimum value (inclusive)
   * @param value The value to check
   * @param message Optional custom error message
   */
  gte(minValue: number, value: number, message?: string): void;

  /**
   * Asserts that a value is less than the maximum (alias for lessThan)
   * @param maxValue The maximum value (exclusive)
   * @param value The value to check
   * @param message Optional custom error message
   */
  lt(maxValue: number, value: number, message?: string): void;

  /**
   * Asserts that a value is less than or equal to the maximum (alias for lessThanOrEqual)
   * @param maxValue The maximum value (inclusive)
   * @param value The value to check
   * @param message Optional custom error message
   */
  lte(maxValue: number, value: number, message?: string): void;

  /**
   * Asserts that two collections (iterables) are equal element by element
   * @param collection1 The first collection to compare
   * @param collection2 The second collection to compare
   * @param message Optional custom error message
   */
  collectionEqual(
    collection1: Iterable<any>,
    collection2: Iterable<any>,
    message?: string
  ): void;
}
