const { test, expect } = require("./idatest");
const { createMockFn } = require("./idamock");
// @ts-ignore
const { text } = require("./srcjs/text");

// @ts-ignore
const { encoding } = require("./srcjs/encoding");
const { setEncoding, encodeString } = require("./test-utils/encoding");

setEncoding(encoding);

test.group("Text Tests", () => {
  let originalConsole;

  test.beforeEach(() => {
    originalConsole = global.console;
    global.console = { ...originalConsole, error: createMockFn(undefined) };
    text._reset();
  });

  test.afterEach(() => {
    global.console = originalConsole;
    text._reset();
  });

  test("create should register text id sequentially starting after firstTextId", () => {
    const firstId = ida.getFirstTextId();
    const id1 = text.create("Hello");
    const id2 = text.create("World");
    expect.equal(id1, firstId + 1);
    expect.equal(id2, firstId + 2);
  });

  test("create + __get should return prepared text and default flags", () => {
    const id = text.create("Line1\nLine2 with\nsymbol");
    const result = text.__get(id);
    expect.collectionEqual(
      result.slice(1),
      encodeString("Line1 \nLine2 with \nsymbol", true)
    );
    expect.equal(result[0], text.Flags.DialogDefault);
  });

  test("__get should encode all characters properly", () => {
    for (const encodingItem of encoding) {
      const id = text.create(encodingItem.key);
      const result = text.__get(id);

      if (encodingItem.key === "\n") {
        // Special case for line break, as it gets a space before it
        expect.collectionEqual(result.slice(1), [32, 1]);
      } else {
        expect.collectionEqual(result.slice(1), [encodingItem.val]);
      }
    }
  });

  test("__get should encode all characters together properly", () => {
    const allChars = encoding.map((e) => e.key).join("");

    // Because first character in the encoding is \n and the space will be added before it
    const allCharValues = [32].concat(encoding.map((e) => e.val));
    const id = text.create(allChars);
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), allCharValues);
  });

  test("__get should encode all characters together properly, testing as string", () => {
    const allChars = "←✓ÇüéâäàçêëèïîìÄÉæÆôöòûùÿÖÜ£áíóúñÑ¿¡ãõœŒÀÃÕ©™ßº";
    const allCharValues = encodeString(allChars);
    const id = text.create(allChars);
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), allCharValues);
  });

  test("__get should replace restricted ASCII and unsupported high characters with dots and log warnings", () => {
    const originalWarn = global.console.warn;
    global.console.warn = createMockFn(undefined);

    try {
      const testString = "Hello*+<=>ø[]🙂^`{|}~";

      const id = text.create(testString);
      const result = text.__get(id);

      const expectedEncoded = encodeString("Hello................");
      expect.collectionEqual(result.slice(1), expectedEncoded);

      expect.true(global.console.warn.calls.length > 0);

      // Verify the warning message contains expected format and characters
      // Console.warn should be called once with all unsupported characters batched together
      expect.equal(global.console.warn.calls.length, 1);
      const warnMessage = global.console.warn.calls[0][0];

      // Check the message starts with expected prefix
      expect.true(
        warnMessage.includes(
          "Text contained characters that are not supported by the LBA2 font"
        )
      );

      // Check for warning about + (restricted ASCII character)
      expect.true(warnMessage.includes("+ at index 6"));

      // Check for warning about ø (not in encoding, should be unsupported)
      expect.true(warnMessage.includes("ø at index 10"));

      // Check for warning about smile emoji 🙂 (high Unicode, unsupported)
      expect.true(warnMessage.includes("at index 13"));
    } finally {
      // Restore original console.warn
      global.console.warn = originalWarn;
    }
  });

  test("create with function should unwrap lazily", () => {
    const id = text.create(() => "Dynamic");
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("Dynamic"));
    expect.equal(result[0], text.Flags.DialogDefault);
  });

  test("create with array should map to object with text and flags", () => {
    const id = text.create(["Hi", text.Flags.DialogBig]);
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("Hi"));
    expect.equal(result[0], text.Flags.DialogBig);
  });

  test("create with array [text] should default flags and undefined color tuple", () => {
    const id = text.create(["OnlyText"]);
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("OnlyText"));
    expect.equal(result[0], text.Flags.DialogDefault);
    const color = text.__getColor(id);
    expect.collectionEqual(color, [undefined, undefined, undefined]);
  });

  test("create with array [text, flags, color] should expose color via __getColor", () => {
    const id = text.create([
      "Colored",
      text.Flags.DialogRadio,
      text.Colors.ZoeRed,
    ]);
    const getResult = text.__get(id);
    expect.collectionEqual(getResult.slice(1), encodeString("Colored"));
    expect.equal(getResult[0], text.Flags.DialogRadio);
    const color = text.__getColor(id);
    expect.collectionEqual(color, [text.Colors.ZoeRed, undefined, undefined]);
  });

  test("create with array [text, flags, color, sprite] should expose sprite via __getSprite", () => {
    const id = text.create([
      "WithSprite",
      text.Flags.DialogRadio,
      text.Colors.ZoeRed,
      "character.png",
    ]);
    const getResult = text.__get(id);
    expect.collectionEqual(getResult.slice(1), encodeString("WithSprite"));
    expect.equal(getResult[0], text.Flags.DialogRadio);
    const color = text.__getColor(id);
    expect.collectionEqual(color, [text.Colors.ZoeRed, undefined, undefined]);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["character.png", 485, 342]); // default x, y
  });

  test("create with array [text, flags, color, sprite, x] should expose sprite with custom x", () => {
    const id = text.create([
      "WithSpriteX",
      text.Flags.DialogRadio,
      text.Colors.TwinsenBlue,
      "hero.png",
      100,
    ]);
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["hero.png", 100, 342]); // custom x, default y
  });

  test("create with array [text, flags, color, sprite, x, y] should expose sprite with custom x and y", () => {
    const id = text.create([
      "WithSpriteXY",
      text.Flags.DialogRadio,
      text.Colors.Peach,
      "villain.png",
      200,
      150,
    ]);
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["villain.png", 200, 150]); // custom x, y
  });

  test("create with array length > 6 should use first 6 elements for sprite positioning", () => {
    const id = text.create([
      "ExtraIgnored",
      text.Flags.DialogSay,
      text.Colors.TwinsenBlue,
      "test.png",
      300,
      250,
      "ignored",
      999,
    ]);
    text.__get(id);
    const color = text.__getColor(id);
    expect.collectionEqual(color, [
      text.Colors.TwinsenBlue,
      undefined,
      undefined,
    ]);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["test.png", 300, 250]);
  });

  test("update should modify existing text entity", () => {
    const id = text.create("Old");
    text.update(id, "New");
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("New"));
    expect.equal(result[0], text.Flags.DialogDefault);
  });

  test("update can replace with an array or object", () => {
    const id = text.create("Initial");
    text.update(id, ["FromArray", text.Flags.DialogBigNoFrame]);
    const result1 = text.__get(id);
    expect.collectionEqual(result1.slice(1), encodeString("FromArray"));
    expect.equal(result1[0], text.Flags.DialogBigNoFrame);

    text.update(id, {
      text: "FromObject",
      flags: text.Flags.DialogExplainInventory,
    });
    const result2 = text.__get(id);
    expect.collectionEqual(result2.slice(1), encodeString("FromObject"));
    expect.equal(result2[0], text.Flags.DialogExplainInventory);
  });

  test("update should throw for non-registered id", () => {
    expect.throws(() => text.update(9999, "Nope"));
  });

  test("__get should return null and log error for non-registered id", () => {
    const result = text.__get(12345);
    expect.true(result === null);
    expect.true(global.console.error.calls.length > 0);
  });

  test("__getColor should return null if entity is not unwrapped yet", () => {
    const id = text.create({
      text: "Hello",
      color: 1,
      color256Start: 2,
      color256End: 3,
    });
    const colorBefore = text.__getColor(id);
    expect.true(colorBefore === null);
  });

  test("__getColor should return color tuple after __get", () => {
    const id = text.create({
      text: "Hello",
      color: 1,
      color256Start: 2,
      color256End: 3,
    });
    text.__get(id); // unwraps
    const colorAfter = text.__getColor(id);
    expect.collectionEqual(colorAfter, [1, 2, 3]);
  });

  // Object variants
  test("create with object {text} should default flags and undefined color tuple", () => {
    const id = text.create({ text: "ObjText" });
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("ObjText"));
    expect.equal(result[0], text.Flags.DialogDefault);
    const color = text.__getColor(id);
    expect.collectionEqual(color, [undefined, undefined, undefined]);
  });

  test("create with object {text, flags}", () => {
    const id = text.create({ text: "ObjFlags", flags: text.Flags.DialogBig });
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("ObjFlags"));
    expect.equal(result[0], text.Flags.DialogBig);
  });

  test("create with object {text, flags, color}", () => {
    const id = text.create({
      text: "ObjColor",
      flags: text.Flags.DialogBigNoFrame,
      color: text.Colors.CinematicPurple,
    });
    text.__get(id);
    expect.collectionEqual(text.__getColor(id), [
      text.Colors.CinematicPurple,
      undefined,
      undefined,
    ]);
  });

  test("create with object {text, color, color256Start, color256End}", () => {
    const id = text.create({
      text: "ObjFullColor",
      color: text.Colors.MintGreen,
      color256Start: 10,
      color256End: 42,
    });
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("ObjFullColor"));
    expect.equal(result[0], text.Flags.DialogDefault);
    expect.collectionEqual(text.__getColor(id), [
      text.Colors.MintGreen,
      10,
      42,
    ]);
  });

  test("create with object {text, sprite} should expose sprite with default positioning", () => {
    const id = text.create({
      text: "ObjSprite",
      sprite: "npc.png",
    });
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["npc.png", 485, 342]); // default x, y
  });

  test("create with object {text, sprite, x} should expose sprite with custom x", () => {
    const id = text.create({
      text: "ObjSpriteX",
      sprite: "enemy.png",
      x: 123,
    });
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["enemy.png", 123, 342]); // custom x, default y
  });

  test("create with object {text, sprite, y} should expose sprite with custom y", () => {
    const id = text.create({
      text: "ObjSpriteY",
      sprite: "friend.png",
      y: 456,
    });
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["friend.png", 485, 456]); // default x, custom y
  });

  test("create with object {text, sprite, x, y} should expose sprite with custom positioning", () => {
    const id = text.create({
      text: "ObjSpriteXY",
      flags: text.Flags.DialogRadio,
      color: text.Colors.Seafoam,
      sprite: "boss.png",
      x: 50,
      y: 75,
    });
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("ObjSpriteXY"));
    expect.equal(result[0], text.Flags.DialogRadio);
    expect.collectionEqual(text.__getColor(id), [
      text.Colors.Seafoam,
      undefined,
      undefined,
    ]);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["boss.png", 50, 75]); // custom x, y
  });

  // Function variants
  test("function variant returning array [text]", () => {
    const id = text.create(() => ["FArray1"]);
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("FArray1"));
    expect.equal(result[0], text.Flags.DialogDefault);
  });

  test("function variant returning array [text, flags]", () => {
    const id = text.create(() => ["FArray2", text.Flags.DialogRadio]);
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("FArray2"));
    expect.equal(result[0], text.Flags.DialogRadio);
  });

  test("function variant returning array [text, flags, color]", () => {
    const id = text.create(() => [
      "FArray3",
      text.Flags.DialogSay,
      text.Colors.Peach,
    ]);
    text.__get(id);
    expect.collectionEqual(text.__getColor(id), [
      text.Colors.Peach,
      undefined,
      undefined,
    ]);
  });

  test("function variant returning array [text, flags, color, sprite]", () => {
    const id = text.create(() => [
      "FArray4",
      text.Flags.DialogRadio,
      text.Colors.Goldenrod,
      "func-sprite.png",
    ]);
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["func-sprite.png", 485, 342]);
  });

  test("function variant returning array [text, flags, color, sprite, x]", () => {
    const id = text.create(() => [
      "FArray5",
      text.Flags.DialogRadio,
      text.Colors.DustyBlue,
      "func-sprite-x.png",
      999,
    ]);
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["func-sprite-x.png", 999, 342]);
  });

  test("function variant returning array [text, flags, color, sprite, x, y]", () => {
    const id = text.create(() => [
      "FArray6",
      text.Flags.DialogRadio,
      text.Colors.SageGreen,
      "func-sprite-xy.png",
      111,
      222,
    ]);
    text.__get(id);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["func-sprite-xy.png", 111, 222]);
  });

  test("function variant returning object with sprite info", () => {
    const id = text.create(() => ({
      text: "FObjectSprite",
      flags: text.Flags.DialogBig,
      sprite: "func-obj-sprite.png",
      x: 777,
      y: 888,
    }));
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("FObjectSprite"));
    expect.equal(result[0], text.Flags.DialogBig);
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["func-obj-sprite.png", 777, 888]);
  });

  test("function variant returning object with full color info", () => {
    const id = text.create(() => ({
      text: "FObject",
      flags: text.Flags.DialogExplainInventory,
      color: text.Colors.Seafoam,
      color256Start: 3,
      color256End: 7,
    }));
    const result = text.__get(id);
    expect.collectionEqual(result.slice(1), encodeString("FObject"));
    expect.equal(result[0], text.Flags.DialogExplainInventory);
    expect.collectionEqual(text.__getColor(id), [text.Colors.Seafoam, 3, 7]);
  });

  test("__getSprite should return null if entity is not unwrapped yet", () => {
    const id = text.create({
      text: "Hello",
      sprite: "test.png",
      x: 100,
      y: 200,
    });
    const spriteBefore = text.__getSprite(id);
    expect.true(spriteBefore === null);
  });

  test("__getSprite should return empty array if no sprite is specified", () => {
    const id = text.create("No sprite");
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, []);
  });

  test("__getSprite should return empty array if sprite is not a string", () => {
    const id = text.create({
      text: "Invalid sprite",
      sprite: 123, // not a string
      x: 100,
      y: 200,
    });
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, []);
  });

  test("__getSprite should use default x and y when x or y are not numbers", () => {
    const id = text.create({
      text: "Invalid coords",
      sprite: "test.png",
      x: "not a number",
      y: null,
    });
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["test.png", 485, 342]); // defaults
  });

  test("__getSprite should use default x and y when x or y are null", () => {
    const id = text.create({
      text: "Null coords",
      sprite: "test.png",
      x: null,
      y: null,
    });
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["test.png", 485, 342]); // defaults
  });

  test("__getSprite should use default x and y when x or y are undefined", () => {
    const id = text.create({
      text: "Undefined coords",
      sprite: "test.png",
      x: undefined,
      y: undefined,
    });
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["test.png", 485, 342]); // defaults
  });

  test("__getSprite should handle zero coordinates correctly", () => {
    const id = text.create({
      text: "Zero coords",
      sprite: "test.png",
      x: 0,
      y: 0,
    });
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["test.png", 0, 0]);
  });

  test("__getSprite should handle negative coordinates correctly", () => {
    const id = text.create({
      text: "Negative coords",
      sprite: "test.png",
      x: -50,
      y: -100,
    });
    text.__get(id); // unwraps
    const sprite = text.__getSprite(id);
    expect.collectionEqual(sprite, ["test.png", -50, -100]);
  });

  test("_reset should clear registrations and reset id counter", () => {
    // Create some entries
    text.create("A");
    text.create("B");
    text._reset();

    const firstId = ida.getFirstTextId();
    const id = text.create("C");
    expect.equal(id, firstId + 1);

    // Also verify that old ids are not available anymore
    const result = text.__get(id - 1);
    expect.true(result === null);
  });

  // Tests for new replace/restore functionality
  test("replace should replace existing game text with custom text", () => {
    const gameTextId = 1; // Using low game text ID
    const replacedId = text.replace(gameTextId, "Replaced text");
    expect.equal(replacedId, gameTextId);

    const result = text.__get(gameTextId);
    expect.collectionEqual(result.slice(1), encodeString("Replaced text"));
    expect.equal(result[0], text.Flags.DialogDefault);
  });

  test("replace should work with array format", () => {
    const gameTextId = 2;
    text.replace(gameTextId, ["Array replaced", text.Flags.DialogBig]);

    const result = text.__get(gameTextId);
    expect.collectionEqual(result.slice(1), encodeString("Array replaced"));
    expect.equal(result[0], text.Flags.DialogBig);
  });

  test("replace should work with object format", () => {
    const gameTextId = 3;
    text.replace(gameTextId, {
      text: "Object replaced",
      flags: text.Flags.DialogRadio,
      color: text.Colors.ZoeRed,
    });

    const result = text.__get(gameTextId);
    expect.collectionEqual(result.slice(1), encodeString("Object replaced"));
    expect.equal(result[0], text.Flags.DialogRadio);

    const color = text.__getColor(gameTextId);
    expect.collectionEqual(color, [text.Colors.ZoeRed, undefined, undefined]);
  });

  test("replace should work with function format", () => {
    const gameTextId = 4;
    text.replace(gameTextId, () => "Function replaced");

    const result = text.__get(gameTextId);
    expect.collectionEqual(result.slice(1), encodeString("Function replaced"));
    expect.equal(result[0], text.Flags.DialogDefault);
  });

  test("replace should throw error for non-game text IDs", () => {
    const firstTextId = ida.getFirstTextId();
    expect.throws(() => text.replace(firstTextId, "Should fail"));
    expect.throws(() => text.replace(firstTextId + 100, "Should also fail"));
  });

  test("restore should remove replaced game text", () => {
    const gameTextId = 5;

    // First replace the text
    text.replace(gameTextId, "Temporarily replaced");
    const beforeRestore = text.__get(gameTextId);
    expect.collectionEqual(
      beforeRestore.slice(1),
      encodeString("Temporarily replaced")
    );
    expect.equal(beforeRestore[0], text.Flags.DialogDefault);

    // Then restore it
    const restoredId = text.restore(gameTextId);
    expect.equal(restoredId, gameTextId);

    // After restore, __get should return null and log error
    const afterRestore = text.__get(gameTextId);
    expect.true(afterRestore === null);
    expect.true(global.console.error.calls.length > 0);
  });

  test("restore should throw error for non-game text IDs", () => {
    const firstTextId = ida.getFirstTextId();
    expect.throws(() => text.restore(firstTextId));
    expect.throws(() => text.restore(firstTextId + 100));
  });

  test("restore should work even if text was never replaced", () => {
    const gameTextId = 6;
    // Should not throw even if the text was never replaced
    const restoredId = text.restore(gameTextId);
    expect.equal(restoredId, gameTextId);
  });

  test("__isReplaced should return false for non-game text IDs", () => {
    const firstTextId = ida.getFirstTextId();
    expect.false(text.__isReplaced(firstTextId));
    expect.false(text.__isReplaced(firstTextId + 100));
  });

  test("__isReplaced should return false for non-replaced game text", () => {
    const gameTextId = 7;
    expect.false(text.__isReplaced(gameTextId));
  });

  test("__isReplaced should return true for replaced game text with valid text", () => {
    const gameTextId = 8;
    text.replace(gameTextId, "Valid replacement");
    expect.true(text.__isReplaced(gameTextId));
  });

  test("__isReplaced should return false for replaced game text with invalid text values", () => {
    const testCases = [
      { description: "empty text", gameTextId: 9, textEntity: "" },
      { description: "null text", gameTextId: 10, textEntity: { text: null } },
      {
        description: "undefined text",
        gameTextId: 11,
        textEntity: { text: undefined },
      },
      {
        description: "non-string text",
        gameTextId: 12,
        textEntity: { text: 123 },
      },
    ];

    for (const testCase of testCases) {
      text.replace(testCase.gameTextId, testCase.textEntity);
      expect.false(
        text.__isReplaced(testCase.gameTextId),
        `Failed for ${testCase.description}`
      );
    }
  });

  test("__isReplaced should unwrap and cache entity for subsequent calls", () => {
    const gameTextId = 13;
    text.replace(gameTextId, {
      text: "Cached text",
      flags: text.Flags.DialogBig,
      color: text.Colors.TwinsenBlue,
      color256Start: 50,
      color256End: 100,
      sprite: "sprite.png",
      x: 200,
      y: 300,
    });

    // First call to __isReplaced should unwrap and cache
    expect.true(text.__isReplaced(gameTextId));

    // Now __getFlags should work without additional unwrapping
    const flags = text.__getFlags(gameTextId);
    expect.equal(flags, text.Flags.DialogBig);

    // And __getColor should work with all color properties
    const color = text.__getColor(gameTextId);
    expect.collectionEqual(color, [text.Colors.TwinsenBlue, 50, 100]);

    // And __getSprite should work with sprite and positioning data
    const sprite = text.__getSprite(gameTextId);
    expect.collectionEqual(sprite, ["sprite.png", 200, 300]);
  });

  test("__getFlags should return 0 for non-game text IDs", () => {
    const firstTextId = ida.getFirstTextId();
    expect.equal(text.__getFlags(firstTextId), 0);
    expect.equal(text.__getFlags(firstTextId + 100), 0);
  });

  test("__getFlags should return 0 for non-unwrapped entities", () => {
    const gameTextId = 14;
    text.replace(gameTextId, "Not unwrapped yet");
    expect.equal(text.__getFlags(gameTextId), 0);
  });

  test("__getFlags should return correct flags after __isReplaced call", () => {
    const gameTextId = 15;
    text.replace(gameTextId, ["Text with flags", text.Flags.DialogRadio]);

    // __isReplaced unwraps the entity
    text.__isReplaced(gameTextId);

    const flags = text.__getFlags(gameTextId);
    expect.equal(flags, text.Flags.DialogRadio);
  });

  test("__getFlags should return correct flags after __get call", () => {
    const gameTextId = 16;
    text.replace(gameTextId, {
      text: "Object with flags",
      flags: text.Flags.DialogBigNoFrame,
    });

    // __get unwraps the entity
    text.__get(gameTextId);

    const flags = text.__getFlags(gameTextId);
    expect.equal(flags, text.Flags.DialogBigNoFrame);
  });

  test("__getFlags should return 0 when flags are not specified", () => {
    const gameTextId = 17;
    text.replace(gameTextId, "No flags specified");

    text.__isReplaced(gameTextId); // unwrap

    const flags = text.__getFlags(gameTextId);
    expect.equal(flags, 0);
  });

  test("__getFlags should handle null/undefined flags", () => {
    const gameTextId1 = 18;
    const gameTextId2 = 19;

    text.replace(gameTextId1, { text: "Null flags", flags: null });
    text.replace(gameTextId2, { text: "Undefined flags", flags: undefined });

    text.__isReplaced(gameTextId1); // unwrap
    text.__isReplaced(gameTextId2); // unwrap

    expect.equal(text.__getFlags(gameTextId1), 0);
    expect.equal(text.__getFlags(gameTextId2), 0);
  });

  test("complete replace -> check -> get -> restore workflow", () => {
    const gameTextId = 20;

    // Step 1: Replace with complex text object
    text.replace(gameTextId, {
      text: "",
      flags: text.Flags.DialogRadio,
      color: text.Colors.Peach,
      sprite: "integration.png",
      x: 123,
      y: 456,
    });

    // Step 2: Check if replaced
    expect.false(text.__isReplaced(gameTextId));

    // Step 3: Get flags (should work because __isReplaced unwrapped it)
    expect.equal(text.__getFlags(gameTextId), text.Flags.DialogRadio);

    // Step 4: Get the text content (not supposed to be called by game in this scenario, but checking anyways)
    const result = text.__get(gameTextId);
    expect.collectionEqual(result.slice(1), encodeString(""));
    expect.equal(result[0], text.Flags.DialogRadio);

    // Step 5: Get color and sprite info
    const color = text.__getColor(gameTextId);
    expect.collectionEqual(color, [text.Colors.Peach, undefined, undefined]);

    const sprite = text.__getSprite(gameTextId);
    expect.collectionEqual(sprite, ["integration.png", 123, 456]);

    // Step 6: Restore the original text
    text.restore(gameTextId);

    // Step 7: Verify it's no longer replaced
    expect.false(text.__isReplaced(gameTextId));

    // Step 8: Verify __get returns null after restore
    const afterRestore = text.__get(gameTextId);
    expect.true(afterRestore === null);
  });

  test("multiple replace operations on same ID", () => {
    const gameTextId = 21;

    // First replacement
    text.replace(gameTextId, "First replacement");
    expect.true(text.__isReplaced(gameTextId));

    const firstResult = text.__get(gameTextId);
    expect.collectionEqual(
      firstResult.slice(1),
      encodeString("First replacement")
    );
    expect.equal(firstResult[0], text.Flags.DialogDefault);

    // Second replacement (should overwrite)
    text.replace(gameTextId, ["Second replacement", text.Flags.DialogBig]);
    expect.true(text.__isReplaced(gameTextId));

    const secondResult = text.__get(gameTextId);
    expect.collectionEqual(
      secondResult.slice(1),
      encodeString("Second replacement")
    );
    expect.equal(secondResult[0], text.Flags.DialogBig);

    // Third replacement with function
    text.replace(gameTextId, () => ({
      text: "Third replacement",
      flags: text.Flags.DialogSay,
    }));
    expect.true(text.__isReplaced(gameTextId));

    const thirdResult = text.__get(gameTextId);
    expect.collectionEqual(
      thirdResult.slice(1),
      encodeString("Third replacement")
    );
    expect.equal(thirdResult[0], text.Flags.DialogSay);
  });

  test("edge case: replace with function returning empty text", () => {
    const gameTextId = 22;
    text.replace(gameTextId, () => "");
    expect.false(text.__isReplaced(gameTextId));
  });

  test("edge case: replace with function returning non-string text", () => {
    const gameTextId = 23;
    text.replace(gameTextId, () => ({ text: 42 }));
    expect.false(text.__isReplaced(gameTextId));
  });

  test("_reset should clear replaced texts", () => {
    const gameTextId1 = 24;
    const gameTextId2 = 25;

    // Replace some game texts
    text.replace(gameTextId1, "Replaced 1");
    text.replace(gameTextId2, "Replaced 2");

    expect.true(text.__isReplaced(gameTextId1));
    expect.true(text.__isReplaced(gameTextId2));

    // Reset should clear everything
    text._reset();

    expect.false(text.__isReplaced(gameTextId1));
    expect.false(text.__isReplaced(gameTextId2));
  });

  test("update should still throw for game text IDs", () => {
    const gameTextId = 26;
    expect.throws(() => text.update(gameTextId, "Should fail"));
  });
});
