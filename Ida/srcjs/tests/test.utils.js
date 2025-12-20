const { test, expect } = require("./idatest");
const {
  deepFreeze,
  initExtensions,
  isTriggeredTrue,
  isTriggeredFalse,
  oneIfTrue,
  oneIfFalse,
  // @ts-ignore
} = require("./srcjs/utils");

test.group("Utils Tests", () => {
  test.beforeEach(() => {
    initExtensions();
  });

  test("deepFreeze should deeply freeze nested objects and arrays", () => {
    const obj = {
      a: 1,
      b: { c: 2, d: [1, 2, { e: 3 }] },
      f: function () {
        return 1;
      },
    };

    deepFreeze(obj);

    // Top-level object frozen
    expect.true(Object.isFrozen(obj));
    // Nested object frozen
    expect.true(Object.isFrozen(obj.b));
    // Nested array frozen
    expect.true(Object.isFrozen(obj.b.d));
    // Deeply nested object frozen
    expect.true(Object.isFrozen(obj.b.d[2]));

    // Attempting to modify should fail silently in non-strict mode, verify values unchanged
    obj.a = 10;
    obj.b.c = 20;
    obj.b.d[0] = 99;
    // @ts-ignore
    obj.b.d[2].e = 42;

    expect.equal(obj.a, 1);
    expect.equal(obj.b.c, 2);
    expect.equal(obj.b.d[0], 1);
    // @ts-ignore
    expect.equal(obj.b.d[2].e, 3);
  });

  test("deepFreeze should return undefined when input is undefined", () => {
    const result = deepFreeze(undefined);
    expect.true(result === undefined);
  });

  test("Array.plus should add element-wise for equal-length arrays", () => {
    const result = [1, 2, 3].plus([4, 5, 6]);
    expect.objectEqual(result, [5, 7, 9]);
  });

  test("Array.plus should throw when argument is not array", () => {
    // @ts-ignore
    expect.throws(() => [1, 2, 3].plus("not array"));
  });

  test("Array.plus should throw when arrays have different lengths", () => {
    // @ts-ignore
    expect.throws(() => [1, 2, 3].plus([1, 2]));
  });

  test("Array.minus should subtract element-wise for equal-length arrays", () => {
    const result = [5, 7, 9].minus([4, 5, 6]);
    expect.objectEqual(result, [1, 2, 3]);
  });

  test("Array.minus should throw when argument is not array", () => {
    // @ts-ignore
    expect.throws(() => [1, 2, 3].minus(123));
  });

  test("Array.minus should throw when arrays have different lengths", () => {
    // @ts-ignore
    expect.throws(() => [1, 2, 3].minus([1, 2]));
  });

  test("Array.sqrMagnitude should return sum of squares", () => {
    expect.equal([3, 4].sqrMagnitude(), 25);
    expect.equal([0, 0, 0].sqrMagnitude(), 0);
    expect.equal([1, 2, 2].sqrMagnitude(), 9);
  });

  test("Array.magnitude should return Euclidean norm", () => {
    // sqrt(25) = 5
    expect.equal([3, 4].magnitude(), 5);
    expect.equal([0, 0, 0].magnitude(), 0);
  });

  // isTriggeredTrue Tests
  test("isTriggeredTrue should return true when state changes from falsy to truthy", () => {
    const store = { testState: false };

    // First call with falsy state - should not trigger
    expect.false(isTriggeredTrue(store, "testState"));

    // Change to truthy state - should trigger
    store.testState = true;
    expect.true(isTriggeredTrue(store, "testState"));

    // Keep truthy state - should not trigger again
    expect.false(isTriggeredTrue(store, "testState"));

    // State changes again from false to true
    store.testState = false;
    expect.false(isTriggeredTrue(store, "testState"));
    store.testState = true;
    expect.true(isTriggeredTrue(store, "testState"));
  });

  test("isTriggeredTrue should work with different falsy/truthy values", () => {
    const store = {};

    // Test various falsy to truthy transitions
    const falsyValues = [undefined, null, 0, false, ""];
    const truthyValues = [true, 1, "hello", {}, []];

    falsyValues.forEach((falsyValue, index) => {
      const truthyValue = truthyValues[index] || true;
      store.testState = falsyValue;
      expect.false(isTriggeredTrue(store, "testState"));
      store.testState = truthyValue;
      expect.true(isTriggeredTrue(store, "testState"));

      // Reset for next iteration
      delete store.testState;
      delete store.__testState;
    });
  });

  test("isTriggeredTrue should work with customState parameter", () => {
    const store = {};

    // First call - should not trigger since customState is falsy
    expect.false(isTriggeredTrue(store, "testState", false));

    // Use customState true - should trigger
    expect.true(isTriggeredTrue(store, "testState", true));

    // Use customState true again - should not trigger
    expect.false(isTriggeredTrue(store, "testState", true));

    // State changes again from false to true
    expect.false(isTriggeredTrue(store, "testState", false));
    expect.true(isTriggeredTrue(store, "testState", true));
  });

  // isTriggeredFalse Tests
  test("isTriggeredFalse should return true when state changes from truthy to falsy", () => {
    const store = { testState: true };

    // First call with truthy state - should not trigger
    expect.false(isTriggeredFalse(store, "testState"));

    // Change to falsy state - should trigger
    store.testState = false;
    expect.true(isTriggeredFalse(store, "testState"));

    // Keep falsy state - should not trigger again
    expect.false(isTriggeredFalse(store, "testState"));

    // State changes again from true to false
    store.testState = true;
    expect.false(isTriggeredFalse(store, "testState"));
    store.testState = false;
    expect.true(isTriggeredFalse(store, "testState"));
  });

  test("isTriggeredFalse should work with different truthy/falsy values", () => {
    const store = {};

    // Test various truthy to falsy transitions
    const truthyValues = [true, 1, "hello", {}, []];
    const falsyValues = [false, 0, null, undefined, ""];

    truthyValues.forEach((truthyValue, index) => {
      const falsyValue = falsyValues[index] || false;
      store.testState = truthyValue;
      expect.false(isTriggeredFalse(store, "testState"));
      store.testState = falsyValue;
      expect.true(isTriggeredFalse(store, "testState"));

      // Reset for next iteration
      delete store.testState;
      delete store.__testState;
    });
  });

  test("isTriggeredFalse should work with customState parameter", () => {
    const store = {};

    // First call - should not trigger since customState is truthy
    expect.false(isTriggeredFalse(store, "testState", true));

    // Use customState false - should trigger
    expect.true(isTriggeredFalse(store, "testState", false));

    // Use customState false again - should not trigger
    expect.false(isTriggeredFalse(store, "testState", false));

    // State changes again from truthy to falsy - should trigger again
    expect.false(isTriggeredFalse(store, "testState", true));
    expect.true(isTriggeredFalse(store, "testState", false));
  });

  // oneIfTrue Tests
  test("oneIfTrue should work like if statement until first fulfillment", () => {
    const store = { testState: false };

    // Works like normal if - false condition returns false
    expect.false(oneIfTrue(store, "testState"));

    // Works like normal if - true condition returns true (first time)
    store.testState = true;
    expect.true(oneIfTrue(store, "testState"));

    // After fulfillment, always returns false regardless of state
    expect.false(oneIfTrue(store, "testState"));

    // Even if state changes, still returns false
    store.testState = false;
    expect.false(oneIfTrue(store, "testState"));
    store.testState = true;
    expect.false(oneIfTrue(store, "testState"));
  });

  test("oneIfTrue should work with customState parameter", () => {
    const store = {};

    // False customState returns false
    expect.false(oneIfTrue(store, "testState", false));

    // True customState returns true (first fulfillment)
    expect.true(oneIfTrue(store, "testState", true));

    // After fulfillment, always returns false
    expect.false(oneIfTrue(store, "testState", false));
    expect.false(oneIfTrue(store, "testState", true));
  });

  // oneIfFalse Tests
  test("oneIfFalse should work like if statement until first fulfillment", () => {
    const store = { testState: true };

    // Works like normal if - true condition returns false (for oneIfFalse)
    expect.false(oneIfFalse(store, "testState"));

    // Works like normal if - false condition returns true (first time)
    store.testState = false;
    expect.true(oneIfFalse(store, "testState"));

    // After fulfillment, always returns false regardless of state
    expect.false(oneIfFalse(store, "testState"));

    // Even if state changes, still returns false
    store.testState = true;
    expect.false(oneIfFalse(store, "testState"));
    store.testState = false;
    expect.false(oneIfFalse(store, "testState"));
  });

  test("oneIfFalse should work with customState parameter", () => {
    const store = {};

    // True customState returns false
    expect.false(oneIfFalse(store, "testState", true));

    // False customState returns true (first fulfillment)
    expect.true(oneIfFalse(store, "testState", false));

    // After fulfillment, always returns false
    expect.false(oneIfFalse(store, "testState", true));
    expect.false(oneIfFalse(store, "testState", false));
  });

  // Cross-function isolation tests
  test("utility functions should not interfere with each other when using same state name", () => {
    const store = { testState: false };

    // Test that different functions use different internal state markers
    expect.false(isTriggeredTrue(store, "testState"));
    expect.false(oneIfTrue(store, "testState"));

    store.testState = true;
    expect.true(isTriggeredTrue(store, "testState"));
    expect.true(oneIfTrue(store, "testState"));

    // isTriggeredTrue should continue working normally
    store.testState = false;
    expect.false(isTriggeredTrue(store, "testState"));
    store.testState = true;
    expect.true(isTriggeredTrue(store, "testState"));

    // oneIfTrue should not work again after first fulfillment
    expect.false(oneIfTrue(store, "testState"));

    // Test with different state name to ensure oneIfTrue works fresh
    store.anotherState = true;
    expect.true(oneIfTrue(store, "anotherState"));
    expect.false(oneIfTrue(store, "anotherState"));
  });
});
