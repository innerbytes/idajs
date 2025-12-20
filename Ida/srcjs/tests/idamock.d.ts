// Type helpers for test mocks

// Augment all functions in the test environment to optionally expose
// mock tracking helpers used by tests: calls, returnValue, reset
declare global {
  interface Function {
    /** Captured argument lists for each call to the function (set by mocks) */
    calls?: any[][];
    /** Default or dynamic return value for the mock (set by mocks) */
    returnValue?: any;
    /** Resets recorded calls and returnValue back to its initial state */
    reset?: () => void;
  }
}

// Shape of a mocked function value returned by createMockFn
export type MockFn = Function & {
  calls: any[][];
  returnValue: any;
  reset: () => void;
};

// Module typing for idamock.js
declare module "./idamock" {
  /**
   * Creates a mock function that tracks calls and exposes helper properties.
   */
  export function createMockFn(returnValue?: any): import("./idamock").MockFn & any;
  
  /**
   * Creates a mock object that proxies unmocked properties/methods to the original object.
   * Properties specified in mockOverrides will be returned instead of the original values.
   * @param {any} originalObj - The original object to proxy to
   * @param {any} mockOverrides - Object containing properties/methods to mock
   * @returns {any} Mock object that uses mocks when available, original otherwise
   */
  export function createMockObj<T = any>(originalObj?: T, mockOverrides?: Partial<T>): T;
}
