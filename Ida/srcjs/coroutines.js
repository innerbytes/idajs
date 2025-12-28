const epp = require("./epp");
const { useSystemStore, useGameStore, useSceneStore } = require("./store");

const generatorRegistry = new Map();
const runningIterators = new Map();

// Some of the coroutine commands, like timers, can be implemented in js
// NOTE - not used at the moment
const handlers = new Set();

const registerCoroutine = (name, generatorFunction) => {
  epp.allowInPhases(epp.ExecutionPhase.InScene);

  validateName(name);

  if (
    typeof generatorFunction !== "function" ||
    generatorFunction.constructor.name !== "GeneratorFunction"
  ) {
    throw new Error(`Generator function for ${name} must be a generator function`);
  }
  if (generatorRegistry.has(name)) {
    throw new Error(`Coroutine with name ${name} is already registered`);
  }

  generatorRegistry.set(name, generatorFunction);
};

const startCoroutine = (objectId, name, ...args) => {
  epp.allowInPhases(epp.ExecutionPhase.InScene, epp.ExecutionPhase.InYield);
  validateObjectId(objectId);
  validateName(name);

  const generator = generatorRegistry.get(name);
  if (!generator) {
    throw new Error(`Coroutine with name ${name} is not registered`);
  }

  console.debug(`Starting coroutine ${name} for objectId ${objectId}`);

  const store = useSystemStore();
  if (!store.runningCoroutines) {
    store.runningCoroutines = {};
  }

  if (findPausedCoroutine(store, objectId, name)) {
    console.error(
      `Coroutine with name ${name} for objectId ${objectId} is already paused. Cannot run a new one. Use stopPausedCoroutine() to stop it first.`
    );
    return;
  }

  if (store.runningCoroutines[objectId]) {
    console.warn(
      `Object ${objectId} is already running a coroutine with name ${store.runningCoroutines[objectId].name}; stopping it before starting ${name}`
    );
    stopCoroutine(objectId);
  }

  const coroutine = {
    id: objectId,
    name: name,
    pos: -1,
    args: args,
  };

  store.runningCoroutines[objectId] = coroutine;
  runningIterators.set(objectId, generator(...args));
  ida._enableMove(objectId);
};

// This should be called when the game is loaded from a save file
const resumeCoroutines = () => {
  resetCoroutineSystem();

  const store = useSystemStore();
  if (!store.runningCoroutines) {
    return;
  }

  Object.values(store.runningCoroutines).forEach((coroutine) => resumeCoroutine(coroutine));
};

// Name is optional, to control we pause the expected coroutine
const pauseCoroutine = (objectId, name) => {
  epp.allowInPhases(epp.ExecutionPhase.InScene, epp.ExecutionPhase.InYield);

  validateObjectId(objectId);
  if (name) validateName(name);
  const store = useSystemStore();
  if (!store.runningCoroutines || !store.runningCoroutines[objectId]) {
    console.error(`Coroutine for objectId ${objectId} is not running or already stopped`);
    return;
  }

  const runningCoroutines = store.runningCoroutines;
  var coroutine = runningCoroutines[objectId];
  if (name && coroutine.name !== name) {
    console.error(
      `Expected to pause coroutine with name ${name}, but found running ${coroutine.name}`
    );
    return;
  }

  console.debug(`Pausing coroutine for objectId ${objectId} with name ${coroutine.name}`);

  stopCoroutine(objectId);
  savePausedCoroutine(store, coroutine);
};

// Name is obligatory, to because many different coroutines can be paused per objectId
const unpauseCoroutine = (objectId, name) => {
  epp.allowInPhases(epp.ExecutionPhase.InScene, epp.ExecutionPhase.InYield);

  validateObjectId(objectId);
  validateName(name);

  const store = useSystemStore();
  const pausedCoroutine = findPausedCoroutine(store, objectId, name);

  if (!pausedCoroutine) {
    console.error(`There is no paused coroutine witn name ${name} for objectId ${objectId}`);
    return;
  }

  console.debug(`Unpausing coroutine for objectId ${objectId} with name ${name}`);

  // Stop any running coroutine for this objectId if exists
  if (store.runningCoroutines[objectId]) {
    console.warn(
      `There was a running coroutine for objectId ${objectId}, with name ${store.runningCoroutines[objectId].name}; stopping it before resuming paused coroutine ${name}`
    );
    stopCoroutine(objectId);
  }

  store.runningCoroutines[objectId] = pausedCoroutine;
  deletePausedCoroutine(store, pausedCoroutine.id, pausedCoroutine.name);
  resumeCoroutine(pausedCoroutine);
};

// If you don't want to unpause the coroutine anymore, use this function
const stopPausedCoroutine = (objectId, name) => {
  epp.allowInPhases(epp.ExecutionPhase.InScene, epp.ExecutionPhase.InYield);

  validateObjectId(objectId);
  validateName(name);
  const store = useSystemStore();
  console.debug(`Stopping paused coroutine for objectId ${objectId} with name ${name}`);
  deletePausedCoroutine(store, objectId, name);
};

const stopCoroutine = (objectId) => {
  epp.allowInPhases(epp.ExecutionPhase.InScene, epp.ExecutionPhase.InYield);

  validateObjectId(objectId);

  var store = useSystemStore();
  if (store.runningCoroutines) {
    delete store.runningCoroutines[objectId];
  }

  runningIterators.delete(objectId);
  handlers.delete(objectId);
  ida._disableMove(objectId);
};

const isCoroutineRunning = (objectId, name) => {
  validateObjectId(objectId);
  if (name) validateName(name);
  const store = useSystemStore();
  if (store.runningCoroutines && store.runningCoroutines[objectId]) {
    return !name || name === store.runningCoroutines[objectId].name;
  }
  return false;
};

const getRunningCoroutineName = (objectId) => {
  validateObjectId(objectId);
  const store = useSystemStore();
  if (!store.runningCoroutines || !store.runningCoroutines[objectId]) {
    return null;
  }
  return store.runningCoroutines[objectId].name;
};

const isCoroutinePaused = (objectId, name) => {
  validateObjectId(objectId);
  validateName(name);
  const store = useSystemStore();
  if (findPausedCoroutine(store, objectId, name)) {
    return true;
  }
  return false;
};

// This should be called only when the new scene is loaded, thus no need to reset the movement on the objects
const clearAll = () => {
  const store = useSystemStore();
  store.runningCoroutines = {};
  store.pausedCoroutines = {};
  generatorRegistry.clear();

  resetCoroutineSystem();
};

// This is called every frame for every actor that handles Ida move scripts, keep efficient
const handleCoroutine = (objectId) => {
  var store = useSystemStore();
  if (!store.runningCoroutines) {
    return;
  }
  var runningCoroutines = store.runningCoroutines;
  var coroutine = runningCoroutines[objectId];

  if (!coroutine || !runningIterators.has(objectId)) {
    return;
  }

  // Will try to execute as many steps as possible until multi-frame command becomes active
  while (true) {
    if (ida._isMoveActive(objectId)) {
      // Continue executing multi-frame command and update its state in the coroutine
      var resultCode = ida._cmove(objectId);
      if (resultCode) {
        coroutine.savedCode = Array.from(resultCode);
      }
      return;
    } else if (handlers.has(objectId)) {
      return;
    }

    coroutine.pos++;

    var iterator = runningIterators.get(objectId);
    console.debug(
      `Coroutine for objectId ${objectId} named ${coroutine.name} is now at step ${coroutine.pos}`
    );

    var cmd = iterator.next();
    if (cmd.done) {
      console.debug(`Coroutine for objectId ${objectId} completed`);
      delete runningCoroutines[objectId];
      runningIterators.delete(objectId);
      ida._disableMove(objectId);
      return;
    }

    epp.setCurrentPhase(epp.ExecutionPhase.InYield);
    try {
      cmd.value(coroutine);
    } finally {
      epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    }

    // Clear the coroutine code for the next step
    coroutine.code = undefined;
    coroutine.savedCode = undefined;
  }
};

// User should run LBA move commands through this function
const doMove = (cmd, ...args) => {
  epp.allowInPhases(epp.ExecutionPhase.InMove);

  return (coroutine) => ida._move(coroutine.id, coroutine.code ?? [], cmd, ...args);
};

// Allows user to do an external action from the coroutine. For example change a variable, or start another coroutine.
const doAction = (callback) => {
  epp.allowInPhases(epp.ExecutionPhase.InMove);

  return () => callback();
};

// Facilitator to change game variable
const doGameStore = (callback) => {
  epp.allowInPhases(epp.ExecutionPhase.InMove);

  return () => {
    const store = useGameStore();
    callback(store);
  };
};

// Facilitator to change scene variable
const doSceneStore = (callback) => {
  epp.allowInPhases(epp.ExecutionPhase.InMove);

  return () => {
    const store = useSceneStore();
    callback(store);
  };
};

// This should be used in the beginning of truly infinite loop, like while (true).
// It will reduce the coroutine position, so the position number will not grow indefinitely
const doReduce = (key) => {
  epp.allowInPhases(epp.ExecutionPhase.InMove);

  return (coroutine) => {
    if (!key) {
      key = "__default";
    }

    if (typeof key !== "number" && (typeof key !== "string" || key.trim() === "")) {
      throw new Error("Key must be a non-empty string or a number");
    }

    if (!coroutine.reducers) {
      coroutine.reducers = {};
    }

    if (!coroutine.reducers[key]) {
      coroutine.reducers[key] = coroutine.pos;
    } else {
      coroutine.pos = coroutine.reducers[key];
    }
  };
};

// *** Private area ***

function resetCoroutineSystem() {
  runningIterators.clear();
  handlers.clear();
}

function resumeCoroutine(coroutine) {
  const generator = generatorRegistry.get(coroutine.name);
  if (!generator) {
    throw new Error(`Coroutine with name ${coroutine.name} is not registered`);
  }

  console.debug(`Resuming coroutine for objectId ${coroutine.id} with name ${coroutine.name}`);

  ida._stopMove(coroutine.id);

  const iterator = generator(...coroutine.args);
  runningIterators.set(coroutine.id, iterator);

  // Restoring the intermediate state of the current command, if exists
  coroutine.code = coroutine.savedCode;

  // Skip up to the current step
  if (coroutine.pos > 0) {
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);

    try {
      for (let i = 0; i < coroutine.pos; i++) {
        const result = iterator.next();
        if (result.done) {
          console.warn(
            `Coroutine ${coroutine.name} for objectId ${coroutine.id} is already completed`
          );
          return;
        }
      }
    } finally {
      epp.setCurrentPhase(epp.ExecutionPhase.InScene);
    }
  }

  // Roll back one step as the coroutine handler will increment it
  if (coroutine.pos > -1) {
    coroutine.pos--;
  }

  ida._enableMove(coroutine.id);
}

function savePausedCoroutine(store, coroutine) {
  if (!store.pausedCoroutines) {
    store.pausedCoroutines = {};
  }

  if (!store.pausedCoroutines[coroutine.id]) {
    store.pausedCoroutines[coroutine.id] = {};
  }

  store.pausedCoroutines[coroutine.id][coroutine.name] = coroutine;
}

function findPausedCoroutine(store, objectId, coroutineName) {
  if (!store.pausedCoroutines || !store.pausedCoroutines[objectId]) {
    return null;
  }

  return store.pausedCoroutines[objectId][coroutineName];
}

function deletePausedCoroutine(store, objectId, coroutineName) {
  if (!store.pausedCoroutines || !store.pausedCoroutines[objectId]) {
    return;
  }

  delete store.pausedCoroutines[objectId][coroutineName];
}

function validateName(name) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Coroutine name must be a non-empty string");
  }
}

function validateObjectId(objectId) {
  if (typeof objectId !== "number") {
    throw new Error("Object ID must be a number");
  }
}

// *** Exports ***
module.exports.startCoroutine = startCoroutine;
module.exports.handleCoroutine = handleCoroutine;
module.exports.resumeCoroutines = resumeCoroutines;
module.exports.stopCoroutine = stopCoroutine;

module.exports.stopPausedCoroutine = stopPausedCoroutine;
module.exports.pauseCoroutine = pauseCoroutine;
module.exports.isCoroutinePaused = isCoroutinePaused;
module.exports.unpauseCoroutine = unpauseCoroutine;

module.exports.isCoroutineRunning = isCoroutineRunning;
module.exports.getRunningCoroutineName = getRunningCoroutineName;
module.exports.clearAllCoroutines = clearAll;
module.exports.registerCoroutine = registerCoroutine;

module.exports.doReduce = doReduce;
module.exports.doMove = doMove;
module.exports.doAction = doAction;
module.exports.doGameStore = doGameStore;
module.exports.doSceneStore = doSceneStore;
