const epp = require("./epp.js");

const store = {};

// Non-persistent scene store
const tempStore = {};

function resetAll() {
  store.data = {
    game: {},
    scene: {},
    system: {},
  };

  tempStore.data = {};
}
resetAll();

const useStoreInternal = (root, ...args) => {
  if (args.length === 0) {
    return root;
  }

  let current = root;
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] !== "string") {
      throw new Error(`Invalid argument at index ${i}: expected a string, got ${typeof args[i]}`);
    }

    if (current[args[i]] === undefined) {
      current[args[i]] = {};
    }

    if (i === args.length - 1) {
      return current[args[i]];
    }

    current = current[args[i]];
  }

  return undefined;
};

const useGameStore = (...args) => {
  var ep = epp.ExecutionPhase;
  epp.allowInPhases(ep.BeforeScene, ep.InScene, ep.InYield);
  return useStoreInternal(store.data, "game", ...args);
};

const useSceneStore = (...args) => {
  var ep = epp.ExecutionPhase;
  epp.allowInPhases(ep.BeforeScene, ep.InScene, ep.InYield);
  return useStoreInternal(store.data, "scene", ...args);
};

const useTempStore = (...args) => {
  var ep = epp.ExecutionPhase;
  epp.allowInPhases(ep.BeforeScene, ep.InScene, ep.InYield);
  return useStoreInternal(tempStore.data, ...args);
};

const useSystemStore = (...args) => useStoreInternal(store.data, "system", ...args);

const resetScene = () => {
  store.data.scene = {};
  tempStore.data = {};
};

const resetGame = () => {
  store.data.game = {};
};

const resetSystem = () => {
  store.data.system = {};
};

const saveToJson = () => {
  return JSON.stringify(store.data, null, 2);
};

const saveBackup = () => {
  // Clone all the data
  const backup = JSON.parse(JSON.stringify(store.data));

  // Delete the backup from the system part
  delete backup.system.backup;

  // Store the backup
  store.data.system.backup = backup;
};

const loadBackup = () => {
  const backup = store.data.system.backup;
  if (backup) {
    store.data = JSON.parse(JSON.stringify(backup));
  } else {
    resetAll();
    console.error("No backup found to load");
  }
};

const loadFromJson = (json) => {
  if (!json) {
    resetAll();
    return;
  }

  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Invalid JSON format for store");
    }
    store.data = parsed;
  } catch (error) {
    console.error("Failed to load store from JSON:", error);
  }
};

module.exports.resetScene = resetScene;
module.exports.resetGame = resetGame;
module.exports.resetSystem = resetSystem;
module.exports.saveToJson = saveToJson;
module.exports.loadFromJson = loadFromJson;
module.exports.saveBackup = saveBackup;
module.exports.loadBackup = loadBackup;
module.exports.useGameStore = useGameStore;
module.exports.useSceneStore = useSceneStore;
module.exports.useTempStore = useTempStore;
module.exports.useSystemStore = useSystemStore;
