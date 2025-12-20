const { test, expect } = require("./idatest");
const { createMockFn, createMockObj } = require("./idamock");
// @ts-ignore
const { image } = require("./srcjs/image");

test.group("Image Tests", () => {
  let originalConsole;
  let originalIda;

  test.beforeEach(() => {
    originalConsole = global.console;
    global.console = { ...originalConsole, error: createMockFn(undefined) };

    originalIda = global.ida;
    // @ts-ignore
    global.ida = createMockObj(originalIda, {
      getFirstImageId: createMockFn(41), // Mock the first image ID as 41
    });

    // Reset the image module state
    image._reset();
  });

  test.afterEach(() => {
    global.console = originalConsole;
    global.ida = originalIda;
    image._reset();
  });

  // Test validateImageName function behavior through public methods
  test("use should reject invalid image names", () => {
    const invalidNames = [
      { name: "", description: "empty string" },
      { name: "   ", description: "whitespace only" },
      { name: "image\\test.png", description: "backslash character" },
      { name: 123, description: "non-string (number)" },
      { name: null, description: "null value" },
      { name: undefined, description: "undefined value" },
    ];

    for (const { name, description } of invalidNames) {
      // Reset console error calls for each test
      global.console.error.calls.length = 0;

      const result = image.use(name);
      expect.equal(result, undefined, `Failed for ${description}`);
      expect.true(
        global.console.error.calls.length > 0,
        `No error logged for ${description}`
      );
      expect.true(
        global.console.error.calls[0][0].includes("Invalid image name"),
        `Wrong error message for ${description}`
      );
    }
  });

  test("use should accept valid image name and return first image ID", () => {
    const result = image.use("test.png");
    expect.equal(result, 41); // firstImageId
    expect.equal(global.console.error.calls.length, 0);
  });

  test("use should accept image name with forward slash", () => {
    const result = image.use("sprites/test.png");
    expect.equal(result, 41);
    expect.equal(global.console.error.calls.length, 0);
  });

  // Test validateImageId function behavior through public methods
  test("__get should reject invalid image IDs", () => {
    const invalidIds = [
      { id: -1, description: "negative number" },
      { id: 256, description: "number greater than 255" },
      { id: "test", description: "non-number string" },
      { id: null, description: "null value" },
      { id: 100, description: "user image ID greater than firstImageId" },
      { id: 255, description: "maximum ID when greater than firstImageId" },
    ];

    for (const { id, description } of invalidIds) {
      // Reset console error calls for each test
      global.console.error.calls.length = 0;

      const result = image.__get(id);
      expect.true(
        result === null,
        `Failed for ${description}: expected null, got ${result}`
      );
      expect.true(
        global.console.error.calls.length > 0,
        `No error logged for ${description}`
      );

      // Check for appropriate error message based on ID type
      const errorMessage = global.console.error.calls[0][0];
      if (id === 100 || id === 255) {
        expect.true(
          errorMessage.includes("Invalid user image ID"),
          `Wrong error message for ${description}: ${errorMessage}`
        );
      } else {
        expect.true(
          errorMessage.includes("Invalid image ID"),
          `Wrong error message for ${description}: ${errorMessage}`
        );
      }
    }
  });

  test("__get should accept valid image IDs", () => {
    const validIds = [
      { id: 0, description: "minimum valid game image ID" },
      { id: 38, description: "maximum valid game image ID" },
      { id: 41, description: "valid user image ID (firstImageId)" },
      { id: 20, description: "mid-range game image ID" },
    ];

    for (const { id, description } of validIds) {
      // Reset console error calls for each test
      global.console.error.calls.length = 0;

      const result = image.__get(id);
      expect.true(
        result === null,
        `Should return null for ${description} when no image is set, got ${result}`
      );
      expect.equal(
        global.console.error.calls.length,
        0,
        `Should not log error for ${description}`
      );
    }
  });

  // Test validateGameImageId function behavior through replace method
  test("replace should reject invalid game image IDs", () => {
    const invalidGameIds = [
      { id: 41, description: "ID equal to firstImageId" }, // firstImageId is 41
      { id: 42, description: "ID greater than firstImageId" },
      { id: 255, description: "maximum ID" },
    ];

    for (const { id, description } of invalidGameIds) {
      // Reset console error calls for each test
      global.console.error.calls.length = 0;

      const result = image.replace(id, "test.png");
      expect.equal(result, undefined, `Should reject ${description}`);
      expect.true(
        global.console.error.calls.length > 0,
        `No error logged for ${description}`
      );
      expect.true(
        global.console.error.calls[0][0].includes("Invalid game image ID"),
        `Wrong error message for ${description}`
      );
    }
  });

  test("replace should accept valid game image IDs", () => {
    const validGameIds = [
      { id: 0, description: "minimum game image ID" },
      { id: 40, description: "maximum valid game image ID (firstImageId - 1)" },
      { id: 20, description: "mid-range game image ID" },
    ];

    for (const { id, description } of validGameIds) {
      // Reset console error calls for each test
      global.console.error.calls.length = 0;

      const result = image.replace(id, "test.png");
      expect.equal(result, id, `Should accept ${description}`);
      expect.equal(
        global.console.error.calls.length,
        0,
        `Should not log error for ${description}`
      );
    }
  });

  // Test image.use functionality
  test("use should set current image name and allow subsequent use calls", () => {
    const result1 = image.use("first.png");
    expect.equal(result1, 41);

    const result2 = image.use("second.png");
    expect.equal(result2, 41);

    expect.equal(global.console.error.calls.length, 0);
  });

  // Test image.replace functionality
  test("replace should store image name mapping and return game image ID", () => {
    const result = image.replace(5, "replacement.png");
    expect.equal(result, 5);
    expect.equal(global.console.error.calls.length, 0);
  });

  test("replace should reject invalid image name", () => {
    const result = image.replace(5, "");
    expect.equal(result, undefined);
    expect.true(global.console.error.calls.length > 0);
  });

  test("replace should allow multiple replacements for different IDs", () => {
    const result1 = image.replace(1, "first.png");
    const result2 = image.replace(2, "second.png");

    expect.equal(result1, 1);
    expect.equal(result2, 2);
    expect.equal(global.console.error.calls.length, 0);
  });

  test("replace should allow overwriting existing replacement", () => {
    image.replace(5, "first.png");
    const result = image.replace(5, "second.png");

    expect.equal(result, 5);
    expect.equal(global.console.error.calls.length, 0);
  });

  // Test image.restore functionality
  test("restore should remove image mapping", () => {
    image.replace(5, "test.png");
    image.restore(5);
    expect.equal(global.console.error.calls.length, 0);
  });

  test("restore should reject invalid game image ID", () => {
    image.restore(41); // firstImageId
    expect.true(global.console.error.calls.length > 0);
    expect.true(
      global.console.error.calls[0][0].includes("Invalid game image ID")
    );
  });

  test("restore should work even if image was never replaced", () => {
    image.restore(10);
    expect.equal(global.console.error.calls.length, 0);
  });

  test("restore should accept valid game image ID", () => {
    image.restore(0);
    expect.equal(global.console.error.calls.length, 0);
  });

  // Test image.__get functionality
  test("__get should handle different scenarios correctly", () => {
    const scenarios = [
      {
        description: "return null for game image ID when no replacement exists",
        setup: () => {},
        imageId: 5,
        expected: null,
      },
      {
        description: "return replacement image name for replaced game image ID",
        setup: () => image.replace(5, "replaced.png"),
        imageId: 5,
        expected: "replaced.png",
      },
      {
        description:
          "return null for user image ID when no current image is set",
        setup: () => {},
        imageId: 41, // firstImageId
        expected: null,
      },
      {
        description:
          "return current image name for the user image ID (firstImageId)",
        setup: () => image.use("current.png"),
        imageId: 41, // firstImageId
        expected: "current.png",
      },
      {
        description: "return null for user image ID after _reset",
        setup: () => {
          image.use("current.png");
          image._reset();
        },
        imageId: 41,
        expected: null,
      },
    ];

    for (const { description, setup, imageId, expected } of scenarios) {
      // Reset state for each scenario
      image._reset();
      global.console.error.calls.length = 0;

      // Run setup
      setup();

      // Test the scenario
      const result = image.__get(imageId);
      if (expected === null) {
        expect.true(result === null, `Should ${description}, got ${result}`);
      } else {
        expect.equal(result, expected, `Should ${description}`);
      }
      expect.equal(
        global.console.error.calls.length,
        0,
        `Should not log error for: ${description}`
      );
    }
  });

  // Test replacement priority over current image
  test("__get should return replacement for game image ID even when current image is set", () => {
    image.use("current.png");
    image.replace(5, "replaced.png");

    const gameResult = image.__get(5);
    const userResult = image.__get(41);

    expect.equal(gameResult, "replaced.png");
    expect.equal(userResult, "current.png");
    expect.equal(global.console.error.calls.length, 0);
  });

  test("__get should return null for restored game image ID", () => {
    image.replace(5, "test.png");
    image.restore(5);
    const result = image.__get(5);
    expect.true(result === null);
    expect.equal(global.console.error.calls.length, 0);
  });

  // Test image._reset functionality
  test("_reset should clear different types of image state", () => {
    const resetScenarios = [
      {
        description: "clear current image name",
        setup: () => image.use("test.png"),
        verifications: [
          {
            imageId: 41,
            expected: null,
            desc: "current image should be cleared",
          },
        ],
      },
      {
        description: "clear all image replacements",
        setup: () => {
          image.replace(1, "first.png");
          image.replace(2, "second.png");
          image.replace(10, "tenth.png");
          image.replace(38, "last-game.png");
        },
        verifications: [
          {
            imageId: 1,
            expected: null,
            desc: "first replacement should be cleared",
          },
          {
            imageId: 2,
            expected: null,
            desc: "second replacement should be cleared",
          },
          {
            imageId: 10,
            expected: null,
            desc: "tenth replacement should be cleared",
          },
          {
            imageId: 38,
            expected: null,
            desc: "last game replacement should be cleared",
          },
        ],
      },
      {
        description: "clear both current image and replacements",
        setup: () => {
          image.use("current.png");
          image.replace(5, "replaced.png");
        },
        verifications: [
          {
            imageId: 41,
            expected: null,
            desc: "current image should be cleared",
          },
          { imageId: 5, expected: null, desc: "replacement should be cleared" },
        ],
      },
    ];

    for (const { description, setup, verifications } of resetScenarios) {
      // Reset state and setup scenario
      image._reset();
      global.console.error.calls.length = 0;
      setup();

      // Perform reset
      image._reset();

      // Verify all expectations
      for (const { imageId, expected, desc } of verifications) {
        const result = image.__get(imageId);
        if (expected === null) {
          expect.true(
            result === null,
            `${description}: ${desc}, got ${result}`
          );
        } else {
          expect.equal(result, expected, `${description}: ${desc}`);
        }
      }

      expect.equal(
        global.console.error.calls.length,
        0,
        `Should not log errors for: ${description}`
      );
    }
  });

  // Test that the image object is frozen and immutable
  test("image object should be frozen and immutable", () => {
    // Test that properties cannot be added (should throw in strict mode or fail silently)
    expect.throws(() => {
      "use strict";
      // @ts-ignore
      image.newProperty = "test";
    });

    // Verify property was not added even if no error was thrown
    expect.false(
      image.hasOwnProperty("newProperty"),
      "Should not allow adding new properties"
    );

    // Test that methods cannot be overwritten
    const originalUse = image.use;
    expect.throws(() => {
      "use strict";
      // @ts-ignore
      image.use = () => "hacked";
    });

    // Verify method was not overwritten even if no error was thrown
    expect.true(
      image.use === originalUse,
      "Should not allow overwriting methods"
    );

    // Test that properties cannot be deleted
    expect.throws(() => {
      "use strict";
      delete image.use;
    });

    // Verify method was not deleted even if no error was thrown
    expect.true(
      typeof image.use === "function",
      "Should not allow deleting methods"
    );
    expect.hasFunction("use", image, "use method should still exist");
    expect.hasFunction("replace", image, "replace method should still exist");
    expect.hasFunction("restore", image, "restore method should still exist");
    expect.hasFunction("__get", image, "__get method should still exist");
    expect.hasFunction("_reset", image, "_reset method should still exist");
  });

  // Test error handling with mixed valid/invalid calls
  test("should handle mixed valid and invalid operations", () => {
    // Valid operation
    image.use("valid.png");
    expect.equal(global.console.error.calls.length, 0);

    // Invalid operation
    image.use("");
    expect.equal(global.console.error.calls.length, 1);

    // Another valid operation should still work
    const result = image.__get(41);
    expect.equal(result, "valid.png");
    expect.equal(global.console.error.calls.length, 1); // No new errors
  });
});
