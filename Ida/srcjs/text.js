const { EnumHandler, FlagsHandler } = require("./enums");
const { deepFreeze } = require("./utils");
const { encoding, restrictedAscii } = require("./encoding");

// A free id after all the LBA texts, but always more than 1000
var currentTextId = ida.getFirstTextId();

// All entities user registerd (id => function)
const registeredEntities = new Map();

// Entities that are currently being used in the dialog (id => object)
const unwrappedEntities = new Map();

const encodeMap = new Map();

/**
 * Convert the entity argument to an object.
 * @param {string|array|object} entityArgument - The entity argument from the user
 * @returns {object} The converted object
 */
const convertToObject = (entityArgument) => {
  if (Array.isArray(entityArgument)) {
    if (entityArgument.length === 1) {
      return { text: entityArgument[0] };
    }
    if (entityArgument.length === 2) {
      return { text: entityArgument[0], flags: entityArgument[1] };
    }
    if (entityArgument.length === 3) {
      return {
        text: entityArgument[0],
        flags: entityArgument[1],
        color: entityArgument[2],
      };
    }
    if (entityArgument.length === 4) {
      return {
        text: entityArgument[0],
        flags: entityArgument[1],
        color: entityArgument[2],
        sprite: entityArgument[3],
      };
    }
    if (entityArgument.length === 5) {
      return {
        text: entityArgument[0],
        flags: entityArgument[1],
        color: entityArgument[2],
        sprite: entityArgument[3],
        x: entityArgument[4],
      };
    }
    if (entityArgument.length >= 6) {
      return {
        text: entityArgument[0],
        flags: entityArgument[1],
        color: entityArgument[2],
        sprite: entityArgument[3],
        x: entityArgument[4],
        y: entityArgument[5],
      };
    }

    throw new Error(
      "Text array must not be empty and should contain (text, [flags, [color]])"
    );
  }
  if (typeof entityArgument === "string") {
    return { text: entityArgument };
  }
  if (typeof entityArgument === "object") {
    return entityArgument;
  }

  throw new Error(
    "Text entity must be a string, an array or an object. If you want to use a function, wrap it in a function."
  );
};

const wrap = (textEntity) => {
  if (typeof textEntity !== "function") {
    return () => textEntity;
  }

  return textEntity;
};

const unwrap = (textId) => {
  const entityArgument = registeredEntities.get(textId)();
  const entityObject = convertToObject(entityArgument);

  return entityObject;
};

const encodeText = (self, textValue, flagsByte) => {
  if (encodeMap.size === 0) {
    self.loadEncoding();
  }

  // The line break should be in the beginning of the new word so that LBA messsage system recoginizes it
  textValue = textValue.replaceAll("\n", " \n");

  var result = new Uint8Array(textValue.length + 1);
  var index = 0;
  result[index++] = flagsByte;

  var notSupported = "";
  const fallbackCharCode = 46; // dot

  // Convert textValue to sequence of bytes, using the encodeMap
  for (let i = 0; i < textValue.length; i++) {
    var charCode = textValue.charCodeAt(i);

    // Ascii range, use the char code directly, except the restricted ones
    if (charCode >= 32 && charCode <= 126) {
      if (restrictedAscii.has(charCode)) {
        notSupported += `${textValue[i]} at index ${i}; `;
        charCode = fallbackCharCode;
      }

      result[index++] = charCode;
      continue;
    }

    // Non ascii range, use the encode map
    var char = textValue[i];
    charCode = encodeMap.get(char);
    if (charCode === undefined) {
      notSupported += `${char} at index ${i}; `;
      charCode = fallbackCharCode;
    }
    result[index++] = charCode;
  }

  if (notSupported.length > 0) {
    console.warn(
      `Text contained characters that are not supported by the LBA2 font and were replaced by a dot: ${notSupported}`
    );
  }

  return result;
};

const text = {
  Flags: {
    DialogDefault: 1 << 0,
    DialogBig: 1 << 1, // Full screen dialog
    DialogBigNoFrame: 1 << 2, // Full screen dialog without frame
    DialogSay: 1 << 3, // Say something in place: without frame, text attached above the character for a few seconds, non blocking the game
    DialogRadio: 1 << 5, // Radio dialog will show sprite. If no custom sprite is provided, Baldino is used
    DialogExplainInventory: 1 << 6, // Explaining inventory item
    DialogPcxDemo: 1 << 7, // Used on PCX for demo
  },
  Colors: {
    CinematicPurple: 0,
    CocoaBrown: 1,
    PaleSand: 2,
    LightGray: 3,
    ZoeRed: 4,
    Peach: 5,
    Goldenrod: 6,
    SageGreen: 7,
    MintGreen: 8,
    TealGreen: 9,
    Seafoam: 10,
    DustyBlue: 11,
    TwinsenBlue: 12,
    LavenderGray: 13,
    WarmTaupe: 14,
    CinematicWhiteGold: 15,
  },
  loadEncoding(customEncoding = null) {
    encodeMap.clear();
    const encodingToUse =
      customEncoding && Array.isArray(customEncoding)
        ? customEncoding
        : encoding;

    for (const item of encodingToUse) {
      encodeMap.set(item.key, item.val);
    }
  },
  create(textEntity = undefined) {
    const nextTextId = currentTextId + 1;
    if (nextTextId >= 32768) {
      throw new Error(
        "Impossible to register new text. All text IDs were used."
      );
    }

    if (textEntity === undefined) {
      textEntity = "";
    }

    currentTextId = nextTextId;
    registeredEntities.set(currentTextId, wrap(textEntity));

    return currentTextId;
  },
  update(textId, textEntity) {
    if (textId < ida.getFirstTextId()) {
      throw new Error(
        `Text ID ${textId} is already part of the existing game texts. Use replace instead.`
      );
    }

    if (registeredEntities.has(textId)) {
      registeredEntities.set(textId, wrap(textEntity));
    } else {
      throw new Error(`Text ID ${textId} is not registered.`);
    }

    return textId;
  },
  replace(gameTextId, textEntity) {
    if (gameTextId < ida.getFirstTextId()) {
      registeredEntities.set(gameTextId, wrap(textEntity));
    } else {
      throw new Error(
        `Text ID ${gameTextId} is not part of the existing game texts.`
      );
    }

    return gameTextId;
  },
  restore(gameTextId) {
    if (gameTextId < ida.getFirstTextId()) {
      registeredEntities.delete(gameTextId);
    } else {
      throw new Error(
        `Text ID ${gameTextId} is not part of the existing game texts.`
      );
    }

    return gameTextId;
  },
  createChoices() {
    const choices = [];

    // 10 choices is maximum LBA2 supports
    for (let i = 0; i < 10; i++) {
      choices.push(this.create());
    }

    return choices;
  },
  /**
   * Called whenever scene is loaded / changed
   */
  _reset() {
    currentTextId = ida.getFirstTextId();
    registeredEntities.clear();
    unwrappedEntities.clear();
  },
  /**
   * Called from Ida/cpp.
   * Checks if the original game text is replaced by the mod script.
   */
  __isReplaced(gameTextId) {
    // Check if this is a game text
    if (gameTextId >= ida.getFirstTextId()) {
      return false;
    }

    // Check if the text is registered
    if (!registeredEntities.has(gameTextId)) {
      return false;
    }

    // Unwrapping the text to check if it's empty
    const entityObject = unwrap(gameTextId);

    // Saving the unwrapped text to the unwrappedEntities map so the next calls to __getColor and __getSprite can use it
    unwrappedEntities.set(gameTextId, entityObject);

    if (!entityObject.text) {
      return false;
    }

    return typeof entityObject.text === "string";
  },

  /**
   * Called from Ida/cpp.
   * Returns the flags byte of the internal game dialog if it's controlled by Ida
   * At this point __isReplaced should be already called, so we can access the unwrapped entity
   */
  __getFlags(gameTextId) {
    if (gameTextId >= ida.getFirstTextId()) {
      return 0;
    }

    if (!unwrappedEntities.has(gameTextId)) {
      return 0;
    }

    const entityObject = unwrappedEntities.get(gameTextId);
    return entityObject.flags ?? 0;
  },

  /**
   * Called from Ida/cpp after __isReplaced call if the original text is replaced or if it's higher id (Ida controlled dialog)
   * Returns the text together with the flags byte of the dialog
   * @returns {[string, number]} The text and the flags of the dialog
   */
  __get(textId) {
    if (registeredEntities.has(textId)) {
      // Unwrapping and saving the text to the unwrappedEntities map so the next calls to __getColor and __getSprite can use it
      const entityObject = unwrap(textId);
      unwrappedEntities.set(textId, entityObject);

      return encodeText(
        this,
        entityObject.text,
        entityObject?.flags ?? this.Flags.DialogDefault
      );
    }

    console.error(`Text ID ${textId} is not registered`);
    return null;
  },

  /**
   * Called from Ida/cpp after __get call, at this point the __get or __isReplaced is already supposed to unwrap the text
   * Returns the text color of the dialog if specified
   * @returns {[number, number, number]} The text colors of the dialog
   */
  __getColor(textId) {
    if (!unwrappedEntities.has(textId)) {
      return null;
    }

    const entityObject = unwrappedEntities.get(textId);
    return [
      entityObject.color,
      entityObject.color256Start,
      entityObject.color256End,
    ];
  },

  /**
   * Called from Ida/cpp after __get call, at this point the __get or __isReplaced is already supposed to unwrap the text
   * Returns the sprite information of the dialog if specified
   * @returns {[] | [string, number, number]} The sprite information of the dialog
   */
  __getSprite(textId) {
    if (!unwrappedEntities.has(textId)) {
      return null;
    }

    const entityObject = unwrappedEntities.get(textId);
    if (!entityObject.sprite || typeof entityObject.sprite !== "string") {
      return [];
    }

    const xOfs =
      entityObject.x !== undefined && typeof entityObject.x === "number"
        ? entityObject.x
        : 485;
    const yOfs =
      entityObject.y !== undefined && typeof entityObject.y === "number"
        ? entityObject.y
        : 342;

    return [entityObject.sprite, xOfs, yOfs];
  },
};

text.Colors.$ = new EnumHandler(text.Colors);
text.Flags.$ = new FlagsHandler(text.Flags);
deepFreeze(text);

module.exports.text = text;
