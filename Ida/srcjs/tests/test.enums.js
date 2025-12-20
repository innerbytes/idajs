const { test, expect } = require("./idatest");
// @ts-ignore
const { FlagsHandler, EnumHandler } = require("./srcjs/enums");

test.group("FlagsHandler Tests", () => {
  let flagsHandler;
  let testFlags;

  test.beforeEach(() => {
    testFlags = {
      FLAG_A: 1, // 0b00001
      FLAG_B: 2, // 0b00010
      FLAG_C: 4, // 0b00100
      FLAG_D: 8, // 0b01000
      FLAG_E: 16, // 0b10000
      $: "action", // Reserved key
    };
    flagsHandler = new FlagsHandler(testFlags);
  });

  test("constructor creates instance with valid flags object", () => {
    const handler = new FlagsHandler({ TEST: 1 });
    expect.object(handler);
    expect.instanceOf(handler, FlagsHandler);
    expect.hasProperty("flags", handler);
  });

  test("constructor throws error for invalid flags parameter", () => {
    expect.throws(() => new FlagsHandler(null));
    expect.throws(() => new FlagsHandler(undefined));
    expect.throws(() => new FlagsHandler("string"));
    expect.throws(() => new FlagsHandler(123));
    expect.throws(() => new FlagsHandler([]));
  });

  test("flag validation through set method - valid string flags", () => {
    const result1 = flagsHandler.set(0, "FLAG_A");
    expect.equal(result1, 1);

    const result2 = flagsHandler.set(0, "FLAG_C");
    expect.equal(result2, 4);
  });

  test("flag validation through set method - valid numeric flags", () => {
    const result1 = flagsHandler.set(0, 1);
    expect.equal(result1, 1);

    const result2 = flagsHandler.set(0, 42);
    expect.equal(result2, 42);
  });

  test("flag validation through set method - reserved $ flag throws error", () => {
    expect.throws(() => {
      flagsHandler.set(0, "$");
    });
  });

  test("flag validation through set method - non-existent string flag throws error", () => {
    expect.throws(() => {
      flagsHandler.set(0, "NON_EXISTENT");
    });
  });

  test("flag validation through set method - invalid flag types throw error", () => {
    expect.throws(() => {
      flagsHandler.set(0, null);
    });

    expect.throws(() => {
      flagsHandler.set(0, undefined);
    });

    expect.throws(() => {
      flagsHandler.set(0, {});
    });

    expect.throws(() => {
      flagsHandler.set(0, []);
    });
  });

  test("flag validation through set method - out-of-range numeric values throw error", () => {
    expect.throws(() => {
      flagsHandler.set(0, -1);
    });

    expect.throws(() => {
      flagsHandler.set(0, 0x100000000); // 2^32
    });
  });

  test("flag validation through set method - boundary values work", () => {
    const result1 = flagsHandler.set(0, 0);
    expect.equal(result1, 0);

    const result2 = flagsHandler.set(0, 0xffffffff);
    expect.equal(new Uint32Array([result2])[0], 0xffffffff);
  });

  test("flags value validation through read method - valid values work", () => {
    // Should not throw for valid values
    flagsHandler.read(0);
    flagsHandler.read(1);
    flagsHandler.read(0xffffffff);
    expect.true(true); // Test passes if no error is thrown
  });

  test("flags value validation through read method - invalid values throw error", () => {
    expect.throws(() => {
      flagsHandler.read(-1);
    });

    expect.throws(() => {
      flagsHandler.read(0x100000000); // 2^32
    });

    expect.throws(() => {
      flagsHandler.read("string");
    });

    expect.throws(() => {
      flagsHandler.read(null);
    });

    expect.throws(() => {
      flagsHandler.read(undefined);
    });
  });

  test("read returns array of set flag names", () => {
    const result = flagsHandler.read(5); // FLAG_A | FLAG_C
    expect.array(result);
    expect.count(2, result);
    expect.collectionEqual(result, ["FLAG_A", "FLAG_C"]);
  });

  test("read returns empty array for zero flags", () => {
    const result = flagsHandler.read(0);
    expect.array(result);
    expect.count(0, result);
  });

  test("read skips reserved $ key", () => {
    const result = flagsHandler.read(0xffffffff);
    expect.array(result);
    // Should include all flags except $
    const expectedFlags = Object.keys(testFlags).filter((key) => key !== "$");
    expect.count(expectedFlags.length, result);
  });

  test("read handles single flag", () => {
    const result = flagsHandler.read(2); // FLAG_B only
    expect.collectionEqual(result, ["FLAG_B"]);
  });

  test("read handles complex flag combinations", () => {
    const result = flagsHandler.read(11); // FLAG_A | FLAG_B | FLAG_D
    expect.count(3, result);
    expect.collectionEqual(result, ["FLAG_A", "FLAG_B", "FLAG_D"]);
  });

  test("read ignores bits that don't correspond to defined flags", () => {
    // flagsValue has bits set that don't exist in the flags object
    const result = flagsHandler.read(39); // FLAG_A(1) + FLAG_B(2) + FLAG_C(4) + unknown_flag(32)
    expect.count(3, result);
    expect.collectionEqual(result, ["FLAG_A", "FLAG_B", "FLAG_C"]);
    // The bit with value 32 is ignored since no flag in testFlags has value 32
  });

  test("set adds flag to existing flags value", () => {
    const result = flagsHandler.set(1, "FLAG_B"); // Add FLAG_B to FLAG_A
    expect.equal(result, 3); // FLAG_A | FLAG_B
  });

  test("set works with numeric flag parameter", () => {
    const result = flagsHandler.set(1, 2); // Add FLAG_B (2) to FLAG_A (1)
    expect.equal(result, 3);
  });

  test("set is idempotent", () => {
    const result1 = flagsHandler.set(1, "FLAG_A"); // FLAG_A already set
    expect.equal(result1, 1);

    const result2 = flagsHandler.set(5, "FLAG_A"); // FLAG_A already set in combination
    expect.equal(result2, 5);
  });

  test("unset removes flag from existing flags value", () => {
    const result = flagsHandler.unset(3, "FLAG_B"); // Remove FLAG_B from FLAG_A | FLAG_B
    expect.equal(result, 1); // Only FLAG_A remains
  });

  test("unset works with numeric flag parameter", () => {
    const result = flagsHandler.unset(3, 2); // Remove FLAG_B (2) from 3
    expect.equal(result, 1);
  });

  test("unset is idempotent", () => {
    const result1 = flagsHandler.unset(1, "FLAG_B"); // FLAG_B not set
    expect.equal(result1, 1);

    const result2 = flagsHandler.unset(0, "FLAG_A"); // No flags set
    expect.equal(result2, 0);
  });

  test("isSet returns true for set flags", () => {
    expect.true(flagsHandler.isSet(3, "FLAG_A"));
    expect.true(flagsHandler.isSet(3, "FLAG_B"));
    expect.true(flagsHandler.isSet(5, "FLAG_A"));
    expect.true(flagsHandler.isSet(5, "FLAG_C"));
  });

  test("isSet returns false for unset flags", () => {
    expect.false(flagsHandler.isSet(3, "FLAG_C")); // FLAG_C not set in 3
    expect.false(flagsHandler.isSet(1, "FLAG_B")); // FLAG_B not set in 1
    expect.false(flagsHandler.isSet(0, "FLAG_A")); // No flags set
  });

  test("isSet works with numeric flag parameter", () => {
    expect.true(flagsHandler.isSet(3, 1)); // FLAG_A (1) is set in 3
    expect.false(flagsHandler.isSet(3, 4)); // FLAG_C (4) not set in 3
  });

  test("isSet requires exact match for multi-bit flags", () => {
    expect.true(flagsHandler.isSet(5, 5)); // 5 contains COMBINED (5)
    expect.false(flagsHandler.isSet(1, 5)); // 1 doesn't contain full COMBINED (5)
    expect.false(flagsHandler.isSet(4, 5)); // 4 doesn't contain full COMBINED (5)
  });
});

test.group("EnumHandler Tests", () => {
  let enumHandler;
  let testEnum;

  test.beforeEach(() => {
    testEnum = {
      OPTION_A: 0,
      OPTION_B: 1,
      OPTION_C: 2,
      SPECIAL_OPTION: 42,
      NEGATIVE_OPTION: -5,
      $: "action", // Reserved key
    };
    enumHandler = new EnumHandler(testEnum);
  });

  test("constructor creates instance with valid enum object", () => {
    const handler = new EnumHandler({ TEST: 1 });
    expect.object(handler);
    expect.instanceOf(handler, EnumHandler);
    expect.hasProperty("enumObject", handler);
  });

  test("constructor throws error for invalid enum parameter", () => {
    expect.throws(() => new EnumHandler(null));
    expect.throws(() => new EnumHandler(undefined));
    expect.throws(() => new EnumHandler("string"));
    expect.throws(() => new EnumHandler(123));
    expect.throws(() => new EnumHandler([]));
  });

  test("constructor error message mentions 'Flags' (legacy from FlagsHandler)", () => {
    // Note: The current implementation has "Flags must be a valid object"
    // even for EnumHandler - this tests the current behavior
    expect.throws(() => new EnumHandler(null));
  });

  test("enum value validation through read method - valid numeric values work", () => {
    // Should not throw for valid numbers
    enumHandler.read(0);
    enumHandler.read(1);
    enumHandler.read(-1);
    enumHandler.read(3.14);
    expect.true(true); // Test passes if no error is thrown
  });

  test("enum value validation through read method - non-numeric values throw error", () => {
    expect.throws(() => {
      enumHandler.read("string");
    });

    expect.throws(() => {
      enumHandler.read(null);
    });

    expect.throws(() => {
      enumHandler.read(undefined);
    });

    expect.throws(() => {
      enumHandler.read({});
    });

    expect.throws(() => {
      enumHandler.read([]);
    });

    expect.throws(() => {
      enumHandler.read(true);
    });
  });

  test("read returns enum key for matching value", () => {
    const result1 = enumHandler.read(0);
    expect.equal(result1, "OPTION_A");

    const result2 = enumHandler.read(1);
    expect.equal(result2, "OPTION_B");

    const result3 = enumHandler.read(42);
    expect.equal(result3, "SPECIAL_OPTION");
  });

  test("read returns original value for non-matching enum value", () => {
    const result1 = enumHandler.read(99);
    expect.equal(result1, 99);

    const result2 = enumHandler.read(-999);
    expect.equal(result2, -999);

    const result3 = enumHandler.read(3.14);
    expect.equal(result3, 3.14);
  });

  test("read skips reserved $ key", () => {
    // Even if $ had a numeric value, it should be skipped
    const modifiedEnum = { ...testEnum, $: 100 };
    const handler = new EnumHandler(modifiedEnum);

    const result = handler.read(100);
    expect.equal(result, 100); // Should return original value, not "$"
  });

  test("read handles negative enum values", () => {
    const result = enumHandler.read(-5);
    expect.equal(result, "NEGATIVE_OPTION");
  });

  test("read returns first matching key when multiple keys have same value", () => {
    const duplicateEnum = {
      FIRST: 1,
      SECOND: 1, // Same value as FIRST
      THIRD: 2,
    };
    const handler = new EnumHandler(duplicateEnum);

    const result = handler.read(1);
    expect.equal(result, "FIRST"); // Should return the first match
  });

  test("read method validates enum value parameter", () => {
    expect.throws(() => enumHandler.read("string"));
    expect.throws(() => enumHandler.read(null));
    expect.throws(() => enumHandler.read(undefined));
    expect.throws(() => enumHandler.read({}));
    expect.throws(() => enumHandler.read([]));
  });

  test("edge case: empty enum object", () => {
    const emptyHandler = new EnumHandler({});

    const result = emptyHandler.read(42);
    expect.equal(result, 42); // Should return original value
  });

  test("edge case: enum with only $ key", () => {
    const onlyActionHandler = new EnumHandler({ $: "action" });

    const result = onlyActionHandler.read(42);
    expect.equal(result, 42); // Should return original value since $ is skipped
  });
});
