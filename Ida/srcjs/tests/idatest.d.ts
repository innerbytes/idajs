import type { Expect } from "./expect";

declare namespace IdaTest {
  /**
   * Test function type - can be sync or async
   */
  type TestFunction = () => void | Promise<void>;

  /**
   * Group function type - function that contains test definitions
   */
  type GroupFunction = () => void;

  /**
   * BeforeEach function type - can be sync or async
   */
  type BeforeEachFunction = () => void | Promise<void>;

  /**
   * Result callback function type
   */
  type ResultCallback = (exitCode: number) => void | Promise<void>;

  /**
   * Condition function type for waitFor
   */
  type ConditionFunction = () => boolean;

  interface TestInterface {
    /**
     * Define a test case
     * @param testName Name of the test
     * @param testFunction Function containing the test logic
     */
    (testName: string, testFunction: TestFunction): void;

    /**
     * Define a test case that will be the only one to run (for debugging)
     * @param testName Name of the test
     * @param testFunction Function containing the test logic
     */
    only(testName: string, testFunction: TestFunction): void;

    /**
     * Define a function to run before each test in the current group
     * @param beforeEachFunction Function to run before each test
     */
    beforeEach(beforeEachFunction: BeforeEachFunction): void;

    /**
     * Define a function to run after each test in the current group
     * @param afterEachFunction Function to run after each test
     */
    afterEach(afterEachFunction: AfterEachFunction): void;

    group: GroupInterface;
  }

  interface GroupInterface {
    /**
     * Group multiple tests together
     * @param groupName Name of the test group
     * @param groupFunction Function containing test definitions
     */
    (groupName: string, groupFunction: GroupFunction): void;

    /**
     * Define a test group that will be the only one to run (for debugging)
     * @param groupName Name of the test group
     * @param groupFunction Function containing test definitions
     */
    only(groupName: string, groupFunction: GroupFunction): void;
  }

  interface IdaTestModule {
    /**
     * Test definition function with additional methods
     */
    test: TestInterface;

    /**
     * The expect object with assertion methods
     */
    expect: Expect;

    /**
     * Run all defined tests
     * @param resultCallback Optional callback to handle test results
     */
    run(resultCallback?: ResultCallback): Promise<void>;

    /**
     * Wait for a specified amount of time
     * @param timeout Time to wait in milliseconds
     */
    wait(timeout: number): Promise<void>;

    /**
     * Wait for a condition to become true
     * @param condition Function that returns true when the condition is met
     * @param timeout Maximum time to wait in milliseconds (default: 5000)
     */
    waitFor(condition: ConditionFunction, timeout?: number): Promise<void>;
  }
}

declare module "./idatest" {
  /**
   * Test definition function with additional methods
   */
  export const test: IdaTest.TestInterface;

  /**
   * The expect object with assertion methods
   */
  export const expect: Expect;

  /**
   * Run all defined tests
   * @param resultCallback Optional callback to handle test results
   */
  export function run(resultCallback?: IdaTest.ResultCallback): Promise<void>;

  /**
   * Wait for a specified amount of time
   * @param timeout Time to wait in milliseconds
   */
  export function wait(timeout: number): Promise<void>;

  /**
   * Wait for a condition to become true
   * @param condition Function that returns true when the condition is met
   * @param timeout Maximum time to wait in milliseconds (default: 5000)
   */
  export function waitFor(
    condition: IdaTest.ConditionFunction,
    timeout?: number
  ): Promise<void>;
}
