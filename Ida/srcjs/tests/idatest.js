const Assert = require("./AssertJS/Assert");

const registeredTests = new Map();
const beforeEachFunctionsPerGroup = new Map();
const afterEachFunctionsPerGroup = new Map();
const registeredOnlyTests = [];
const registeredOnlyGroups = new Set();
const passedTests = [];
const assertions = [];
var currentGroup = "";
var testCount = 0;

class MoreAssert {
  static eq(value, expectedValue, message = "") {
    Assert.true(
      value === expectedValue,
      message
        ? message
        : `Expected value ${value} to equal ${expectedValue} but it's not.`
    );
  }
  static between(minValue, maxValue, value, message = "") {
    Assert.greaterThanOrEqual(minValue, value, message);
    Assert.lessThanOrEqual(maxValue, value, message);
  }
  static gt(minValue, value, message = "") {
    Assert.greaterThan(minValue, value, message);
  }
  static gte(minValue, value, message = "") {
    Assert.greaterThanOrEqual(minValue, value, message);
  }
  static lt(maxValue, value, message = "") {
    Assert.lessThan(maxValue, value, message);
  }
  static lte(maxValue, value, message = "") {
    Assert.lessThanOrEqual(maxValue, value, message);
  }

  static collectionEqual(collection1, collection2, message = "") {
    // Check if both are iterable
    Assert.true(
      collection1 && typeof collection1[Symbol.iterator] === "function",
      message || `First argument is not iterable: ${collection1}`
    );
    Assert.true(
      collection2 && typeof collection2[Symbol.iterator] === "function",
      message || `Second argument is not iterable: ${collection2}`
    );

    // Convert to arrays for easier comparison
    const array1 = Array.from(collection1);
    const array2 = Array.from(collection2);

    // Check lengths first
    Assert.true(
      array1.length === array2.length,
      message ||
        `Collections have different lengths:\n` +
          `  Collection 1 (length ${array1.length}): [${array1.join(", ")}]\n` +
          `  Collection 2 (length ${array2.length}): [${array2.join(", ")}]`
    );

    // Compare element by element
    for (let i = 0; i < array1.length; i++) {
      Assert.true(
        array1[i] === array2[i],
        message ||
          `Collections differ first at index ${i}:\n` +
            `  Collection 1: [${array1.join(", ")}]\n` +
            `  Collection 2: [${array2.join(", ")}]\n` +
            `  At index ${i}: ${array1[i]} !== ${array2[i]}`
      );
    }
  }
}

const expect = new Proxy(
  {},
  {
    get(target, prop) {
      let assertionMethod = null;

      if (typeof Assert[prop] === "function") {
        assertionMethod = Assert[prop].bind(Assert);
      } else if (typeof MoreAssert[prop] === "function") {
        assertionMethod = MoreAssert[prop];
      } else {
        throw new Error(`Unknown assertion method: ${prop}`);
      }

      return (...args) => {
        try {
          const result = assertionMethod(...args);
          assertions.push(true);
          return result;
        } catch (error) {
          assertions.push(error);
          return error;
        }
      };
    },
  }
);

const getTestsCount = () => testCount;

const waitForAssertions = (timeout) => {
  let timeoutCounter = timeout;

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (assertions.length) {
        clearInterval(interval);
        resolve();
      } else {
        timeoutCounter -= 50;
        if (timeoutCounter <= 0) {
          clearInterval(interval);
          reject(`test never asserted during ${timeout}ms`);
        }
      }
    }, 50);
  });
};

const runTest = async (testFunction) => {
  assertions.length = 0;
  const result = testFunction();
  if (result instanceof Promise) {
    await result;
  }
  await waitForAssertions(5000);
};

const runSetup = async (setupFunction) => {
  const result = setupFunction();
  if (result instanceof Promise) {
    await result;
  }
};

const checkTestResults = (testName) => {
  const testErrors = assertions.filter(
    (assertion) => assertion instanceof Error || typeof assertion === "string"
  );
  if (testErrors.length) {
    console.error(`[x] ${testName}`);
    for (const error of testErrors) {
      // Our JS engine prints error message as part of the stack, so no need to print it twice
      console.error(
        `  ${
          error instanceof Error ? error.stack : error
        }`
      );
    }
  } else {
    console.log(`[v] ${testName}`);
    passedTests.push(testName);
  }
};

// Full name of the test is group name + test name
function nm(group, testName) {
  return group ? `(${group}): ${testName}` : testName;
}

exports.test = (testName, testFunction) => {
  if (!testName || typeof testName !== "string") {
    throw new Error("testName must be a non-empty string");
  }

  if (!testFunction || typeof testFunction !== "function") {
    throw new Error("testFunction must be a function");
  }

  registeredTests.set(nm(currentGroup, testName), {
    testFunction,
    group: currentGroup,
  });
};

exports.test.only = (testName, testFunction) => {
  exports.test(testName, testFunction);
  registeredOnlyTests.push(nm(currentGroup, testName));
};

exports.test.group = (groupName, groupFunction) => {
  if (!groupName || typeof groupName !== "string") {
    throw new Error("Group name must be a non-empty string");
  }
  if (!groupFunction || typeof groupFunction !== "function") {
    throw new Error("Tests groupFunction must be a function");
  }

  currentGroup = groupName;
  groupFunction();
  currentGroup = "";
};

exports.test.group.only = (groupName, groupFunction) => {
  exports.test.group(groupName, groupFunction);
  registeredOnlyGroups.add(groupName);
};

exports.test.beforeEach = (beforeEachFunction) => {
  if (typeof beforeEachFunction !== "function") {
    throw new Error("beforeEachFunction must be a function");
  }
  beforeEachFunctionsPerGroup.set(currentGroup, beforeEachFunction);
};

exports.test.afterEach = (afterEachFunction) => {
  if (typeof afterEachFunction !== "function") {
    throw new Error("afterEachFunction must be a function");
  }
  afterEachFunctionsPerGroup.set(currentGroup, afterEachFunction);
};

exports.run = async (resultCallback) => {
  passedTests.length = 0;

  let testFullNames = registeredOnlyTests.length
    ? registeredOnlyTests
    : Array.from(registeredTests.keys());

  if (registeredOnlyGroups.size) {
    testFullNames = testFullNames.filter((testFullName) =>
      registeredOnlyGroups.has(registeredTests.get(testFullName).group)
    );
  }

  testCount = testFullNames.length;
  console.log(`Running ${getTestsCount()} tests`);

  for (const testFullName of testFullNames) {
    const testData = registeredTests.get(testFullName);
    const group = testData.group;
    const testFunction = testData.testFunction;
    const beforeEachFunction = beforeEachFunctionsPerGroup.get(group);
    const afterEachFunction = afterEachFunctionsPerGroup.get(group);

    try {
      if (beforeEachFunction) {
        await runSetup(beforeEachFunction);
      }
      await runTest(testFunction);
    } catch (error) {
      assertions.push(error);
    } finally {
      if (afterEachFunction) {
        await runSetup(afterEachFunction);
      }
      checkTestResults(testFullName);
    }
  }

  console.log(`Done executing ${getTestsCount()} tests`);
  let callbackResult;
  if (getTestsCount() > passedTests.length) {
    console.log(`${passedTests.length} tests passed`);
    console.log(`${getTestsCount() - passedTests.length} tests failed`);
    callbackResult = resultCallback?.(1);
  } else {
    console.log("[v] All tests passed!");
    callbackResult = resultCallback?.(0);
  }

  if (callbackResult instanceof Promise) {
    await callbackResult;
  }
};

exports.wait = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};

exports.waitFor = (condition, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve();
      } else if (timeout <= 0) {
        clearInterval(interval);
        reject(new Error("Condition not met within timeout"));
      }
      timeout -= 50;
    }, 50);
  });
};

exports.expect = expect;
