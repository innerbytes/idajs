const { EventHandler } = require("./events");
const { EnumHandler } = require("./enums");
const { deepFreeze } = require("./utils");
const epp = require("./epp");

var saveFunction = () => {};
var loadFunction = () => {};

// Helper function to create array-like iterators with length and index access
function createArrayLikeIterator(scene, getNumFunction, getItemFunction) {
  const iterator = {
    *[Symbol.iterator]() {
      const numItems = getNumFunction.call(scene);
      for (let i = 0; i < numItems; i++) {
        yield getItemFunction.call(scene, i);
      }
    },

    get length() {
      return getNumFunction?.call(scene);
    },
  };

  // Add index operator using Proxy
  return new Proxy(iterator, {
    get(target, prop) {
      // If it's a numeric property, return the item at that index
      if (typeof prop === "string" && !isNaN(Number(prop))) {
        const index = Number(prop);
        return getItemFunction.call(scene, index);
      }
      // Otherwise return the original property
      return target[prop];
    },
  });
}

const sceneProto = {
  // Scene load modes
  LoadModes: {
    NewGameStarted: 0,
    PlayerMovedHere: 1,
    PlayerTeleportedHere: 2,
    WillLoadSavedState: 4,
  },

  // Game variables with special meaning
  GameVariables: {
    INV_HOLOMAP: 0,
    INV_MAGIC_BALL: 1,
    INV_DARTS: 2, // Darts
    INV_SENDELL_BALL: 3,
    INV_TUNIC: 4,
    INV_PEARL: 5,
    INV_PYRAMID_KEY: 6,
    INV_STEERING_WHEEL: 7,
    INV_MONEY: 8, // Gold or zlitos, depending on the current planet it will read and set either gold or zlitos, but never both. This should not be written from Ida, use scene API instead
    INV_PISTOLASER: 9, // PistoLaser
    INV_SABER: 10, // The Saber
    INV_GLOVE: 11, // Glove
    INV_PROTOPACK: 12,
    INV_FERRY_TICKET: 13,
    INV_MECA_PENGUIN: 14,
    INV_GAZOGEM: 15, // GazoGem
    INV_HALF_MEDALLION: 16,
    INV_GALLIC_ACID: 17,
    INV_SONG: 18,
    INV_LIGHTNING_RING: 19,
    INV_UMBRELLA: 20,
    INV_GEM: 21,
    INV_CONCH: 22,
    INV_BLOWGUN: 23,
    INV_ROAD_DISC: 24, // Road Disc
    INV_MEMORY_VIEWER: 24, // ACF Viewer
    INV_LUCI_TART: 25,
    INV_RADIO: 26,
    INV_FLOWER: 27,
    INV_SLATE: 28,
    INV_TRANSLATOR: 29,
    INV_DIPLOMA: 30,
    INV_KEY_KNARTA: 31,
    INV_KEY_SUP: 32,
    INV_KEY_MOSQUI: 33,
    INV_KEY_BLAFARD: 34,
    INV_QUEEN_KEY: 35, // Queen Mosquibees Key
    INV_PICKAXE: 36,
    INV_MAYOR_KEY: 37,
    INV_MAYOR_NOTE: 38,
    INV_PROTECTION: 39, // Protection Spell

    VAR_CELEBRATION: 79, // Used to switch Celebration Island state between normal and final
    VAR_DINO_JOURNEY: 94, // Used for Dino on Holomap, investigate how it works

    VAR_ACF: 235, // Used to play ACF files, don't use
    VAR_ACF2: 236, // Used to play ACF files, don't use
    VAR_ACF3: 237, // Doesn't seem to be used.
    VAR_ESC: 249, // Set if the player pressed Escape key during an automatic scene. Use as read only.
    VAR_CLOVER: 251, // The number of full clover boxes.
    VAR_VEHICLE_TAKEN: 252, // Is not used in the game engine, might be used in the script
    VAR_CHAPTER: 253, // Use to read and set the current game chapter
    VAR_PLANET_ESMER: 254, // Switches type of rails to be either like in Bu temple or like in the Zeelich mine, can also be used in the script
    VAR_DONT_USE: 255, // Don't use, used for inventory, don't use
  },

  _setSaveHandler: function (saveHandler) {
    epp.allowInPhases(epp.ExecutionPhase.None, epp.ExecutionPhase.InScene);

    if (typeof saveHandler !== "function") {
      throw new Error("saveHandler must be a function");
    }
    saveFunction = saveHandler;
  },

  _setLoadHandler: function (loadHandler) {
    epp.allowInPhases(epp.ExecutionPhase.None, epp.ExecutionPhase.InScene);

    if (typeof loadHandler !== "function") {
      throw new Error("loadHandler must be a function");
    }
    loadFunction = loadHandler;
  },

  findFreeZoneValue: function (zoneType, exceptZoneId) {
    let maxZoneValue = -1;

    for (let i = 0; i < this.getNumZones(); i++) {
      if (exceptZoneId !== undefined && i === exceptZoneId) {
        continue;
      }

      const zone = this.getZone(i);
      if (zone.getType() === zoneType) {
        maxZoneValue = Math.max(maxZoneValue, zone.getZoneValue());
      }
    }

    return maxZoneValue + 1;
  },

  get objects() {
    return createArrayLikeIterator(this, this.getNumObjects, this.getObject);
  },

  get zones() {
    return createArrayLikeIterator(this, this.getNumZones, this.getZone);
  },

  get waypoints() {
    return createArrayLikeIterator(this, this.getNumWaypoints, this.getWaypoint);
  },

  __save: () => saveFunction(false),
  __load: (json) => loadFunction(json),
  __saveBackup: () => saveFunction(true),
  __loadBackup: () => loadFunction(),
};

sceneProto.LoadModes.$ = new EnumHandler(sceneProto.LoadModes);
sceneProto.GameVariables.$ = new EnumHandler(sceneProto.GameVariables);
Object.setPrototypeOf(sceneProto, new EventHandler());
deepFreeze(sceneProto);

module.exports.sceneProto = sceneProto;
