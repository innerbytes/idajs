const epp = require("./epp");

const {
  initExtensions,
  isTriggeredTrue,
  isTriggeredFalse,
  oneIfTrue,
  oneIfFalse,
} = require("./utils");
const { text } = require("./text");
const { image } = require("./image");
const { sceneProto } = require("./scene");
const { idaProto } = require("./ida");
const { markProto } = require("./mark");
const { object } = require("./objectHelper");
const {
  handleCoroutine,
  clearAllCoroutines,
  startCoroutine,
  stopCoroutine,
  stopPausedCoroutine,
  resumeCoroutines,
  registerCoroutine,
  pauseCoroutine,
  unpauseCoroutine,
  isCoroutineRunning,
  getRunningCoroutineName,
  isCoroutinePaused,
  doMove,
  doReduce,
  doAction,
  doGameStore,
  doSceneStore,
} = require("./coroutines");

const {
  resetScene,
  resetGame,
  resetSystem,
  saveToJson,
  loadFromJson,
  saveBackup,
  loadBackup,
  useGameStore,
  useSceneStore,
} = require("./store");

Object.setPrototypeOf(scene, sceneProto);
Object.setPrototypeOf(ida, idaProto);
Object.setPrototypeOf(mark, markProto);
ida.setLogLevel(1);
initExtensions();

text.loadEncoding();

// Here the Ida Core API is extended by the default behavior and by the Ida Scenario API
// TODO - expose some of this functionality to the mod creator, so she can set up her own scenario API and global behavior

// Subscribing the inner objects to events

scene.addEventListener("beforeLoadScene", (sceneId, startMode) => {
  epp.setCurrentPhase(epp.ExecutionPhase.BeforeScene);
});

scene.addEventListener("afterLoadScene", (sceneId, startMode) => {
  text._reset();
  image._reset();
  clearAllCoroutines();
  resetScene();

  if (startMode === scene.LoadModes.NewGameStarted) {
    resetGame();
    resetSystem();
  }

  epp.setCurrentPhase(epp.ExecutionPhase.InScene);
});

// TODO - might not need this event to be exposed to the modder at all
scene.addEventListener("afterLoadSavedState", () => {
  resumeCoroutines();
});

// Epp - all handler setter functions are limited to None and Scene phases
ida._setMoveHandler((objectId) => {
  epp.setCurrentPhase(epp.ExecutionPhase.InMove);
  try {
    handleCoroutine(objectId);
  } finally {
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);
  }
});

scene._setSaveHandler((isBackupSave) =>
  isBackupSave ? saveBackup() : saveToJson()
);
scene._setLoadHandler((json) =>
  json !== undefined ? loadFromJson(json) : loadBackup()
);

// Expose global entities

// Helper objects
globalThis.object = object;
globalThis.text = text;
globalThis.image = image;

// Coroutines control
// Epp limit: inScene, inYield
globalThis.startCoroutine = startCoroutine;
globalThis.stopCoroutine = stopCoroutine;
globalThis.stopPausedCoroutine = stopPausedCoroutine;
globalThis.pauseCoroutine = pauseCoroutine;
globalThis.unpauseCoroutine = unpauseCoroutine;
// No limit
globalThis.isCoroutineRunning = isCoroutineRunning;
globalThis.getRunningCoroutineName = getRunningCoroutineName;
globalThis.isCoroutinePaused = isCoroutinePaused;
// Epp limit: in scene
globalThis.registerCoroutine = registerCoroutine;

// Coroutines operations
// Epp limit: InMove
globalThis.doMove = doMove;
globalThis.doReduce = doReduce;
globalThis.doAction = doAction;
globalThis.doGameStore = doGameStore;
globalThis.doSceneStore = doSceneStore;

// Store
// Epp limit: inScene, inYield
globalThis.useGameStore = useGameStore;
globalThis.useSceneStore = useSceneStore;

// Utils
globalThis.isTriggeredTrue = isTriggeredTrue;
globalThis.isTriggeredFalse = isTriggeredFalse;
globalThis.oneIfTrue = oneIfTrue;
globalThis.oneIfFalse = oneIfFalse;
