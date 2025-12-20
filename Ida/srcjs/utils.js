function deepFreeze(o) {
  Object.freeze(o);
  if (o === undefined) {
    return o;
  }

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (
      o[prop] !== null &&
      (typeof o[prop] === "object" || typeof o[prop] === "function") &&
      !Object.isFrozen(o[prop])
    ) {
      deepFreeze(o[prop]);
    }
  });

  return o;
}

function isTriggeredTrue(store, stateName, customState = undefined) {
  var currentState = customState !== undefined ? customState : store[stateName];
  var previousStateName = `__${stateName}`;
  var previousState = store[previousStateName];
  store[previousStateName] = currentState;
  return Boolean(!previousState && currentState);
}

function isTriggeredFalse(store, stateName, customState = undefined) {
  var currentState = customState !== undefined ? customState : store[stateName];
  var previousStateName = `__${stateName}`;
  var previousState = store[previousStateName];
  store[previousStateName] = currentState;
  return Boolean(previousState && !currentState);
}

function oneIfTrue(store, stateName, customState = undefined) {
  var currentState = customState !== undefined ? customState : store[stateName];
  var conditionMarkerName = `__1${stateName}`;
  var hasBeenFulfilled = store[conditionMarkerName];

  if (hasBeenFulfilled) {
    return false;
  }

  if (currentState) {
    store[conditionMarkerName] = true;
    return true;
  }

  return false;
}

function oneIfFalse(store, stateName, customState = undefined) {
  var currentState = customState !== undefined ? customState : store[stateName];
  var conditionMarkerName = `__1${stateName}`;
  var hasBeenFulfilled = store[conditionMarkerName];

  if (hasBeenFulfilled) {
    return false;
  }

  if (!currentState) {
    store[conditionMarkerName] = true;
    return true;
  }

  return false;
}

function initArrayExtensions() {
  // Extend Array prototype with element-wise addition
  // @ts-ignore
  Array.prototype.plus = function (other) {
    if (!Array.isArray(other)) {
      throw new Error("Argument must be an array");
    }
    if (this.length !== other.length) {
      throw new Error("Arrays must have equal length");
    }

    return this.map((value, index) => value + other[index]);
  };

  // Extend Array prototype with element-wise subtraction
  // @ts-ignore
  Array.prototype.minus = function (other) {
    if (!Array.isArray(other)) {
      throw new Error("Argument must be an array");
    }
    if (this.length !== other.length) {
      throw new Error("Arrays must have equal length");
    }

    return this.map((value, index) => value - other[index]);
  };

  Array.prototype.sqrMagnitude = function () {
    return this.reduce((sum, value) => sum + value * value, 0);
  };

  Array.prototype.magnitude = function () {
    return Math.sqrt(this.sqrMagnitude());
  };

  // Extend Array prototype with scalar multiplication
  // @ts-ignore
  Array.prototype.mul = function (scalar) {
    if (typeof scalar !== "number") {
      throw new Error("Argument must be a number");
    }

    return this.map((value) => value * scalar);
  };

  // Extend Array prototype with scalar division
  // @ts-ignore
  Array.prototype.div = function (scalar) {
    if (typeof scalar !== "number") {
      throw new Error("Argument must be a number");
    }
    if (scalar === 0) {
      throw new Error("Cannot divide by zero");
    }

    return this.map((value) => value / scalar);
  };

  // Extend Array prototype with random element selection
  // @ts-ignore
  Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
  };
}

function initExtensions() {
  initArrayExtensions();
}

module.exports.deepFreeze = deepFreeze;
module.exports.initExtensions = initExtensions;
module.exports.isTriggeredTrue = isTriggeredTrue;
module.exports.isTriggeredFalse = isTriggeredFalse;
module.exports.oneIfTrue = oneIfTrue;
module.exports.oneIfFalse = oneIfFalse;
