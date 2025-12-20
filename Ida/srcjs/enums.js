// Enums and flags faciltators
function FlagsHandler(flags) {
  if (!flags || typeof flags !== "object" || flags instanceof Array) {
    throw new Error("Flags must be a valid object");
  }
  this.flags = flags;
}

FlagsHandler.prototype._validateFlag = function (flags, flag) {
  let result = flag;

  if (typeof flag === "string") {
    if (flag === "$") {
      throw new Error("$ is reserved");
    }

    result = flags[flag];
    if (result === undefined || typeof result !== "number") {
      throw new Error(
        `Flag ${flag} does not exist or cannot be resolved to a number`
      );
    }
  } else if (typeof flag !== "number") {
    throw new Error("Flag must be a string or number");
  }

  if (result < 0 || result > 0xffffffff) {
    throw new Error("Flag value out of range");
  }

  return result;
};

FlagsHandler.prototype._validateFlagsValue = function (flagsValue) {
  if (
    typeof flagsValue !== "number" ||
    flagsValue < 0 ||
    flagsValue > 0xffffffff
  ) {
    throw new Error("Invalid flag value");
  }
};

FlagsHandler.prototype.read = function (flagsValue) {
  this._validateFlagsValue(flagsValue);

  // Iterate through all the keys in flags and check all that are set
  const setFlags = [];
  for (const [key, value] of Object.entries(this.flags)) {
    if (key === "$") {
      continue; // Skip the $ (action) key
    }

    if ((flagsValue & value) === value) {
      setFlags.push(key);
    }
  }

  return setFlags;
};

FlagsHandler.prototype.set = function (flagsValue, flag) {
  this._validateFlagsValue(flagsValue);
  flag = this._validateFlag(this.flags, flag);

  return flagsValue | flag;
};

FlagsHandler.prototype.unset = function (flagsValue, flag) {
  this._validateFlagsValue(flagsValue);
  flag = this._validateFlag(this.flags, flag);

  return flagsValue & ~flag;
};

FlagsHandler.prototype.isSet = function (flagsValue, flag) {
  this._validateFlagsValue(flagsValue);
  flag = this._validateFlag(this.flags, flag);

  return (flagsValue & flag) === flag;
};

function EnumHandler(enumObject) {
  if (
    !enumObject ||
    typeof enumObject !== "object" ||
    enumObject instanceof Array
  ) {
    throw new Error("Flags must be a valid object");
  }
  this.enumObject = enumObject;
}

EnumHandler.prototype._validateEnumValue = function (flagsValue) {
  if (typeof flagsValue !== "number") {
    throw new Error("Enum value must be a number");
  }
};

EnumHandler.prototype.read = function (enumValue) {
  this._validateEnumValue(enumValue);

  for (const [key, value] of Object.entries(this.enumObject)) {
    if (key === "$") {
      continue; // Skip the $ (action) key
    }

    if (value === enumValue) {
      return key;
    }
  }

  return enumValue;
};

module.exports.FlagsHandler = FlagsHandler;
module.exports.EnumHandler = EnumHandler;
