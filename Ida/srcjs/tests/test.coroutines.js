const { test, expect } = require("./idatest");
const { createMockFn, createMockObj } = require("./idamock");

const {
  useSystemStore,
  useGameStore,
  useSceneStore,
  // @ts-ignore
} = require("./srcjs/store");
// @ts-ignore
const epp = require("./srcjs/epp");

const {
  clearAllCoroutines,
  registerCoroutine,
  startCoroutine,
  stopCoroutine,
  isCoroutineRunning,
  isCoroutinePaused,
  pauseCoroutine,
  unpauseCoroutine,
  stopPausedCoroutine,
  handleCoroutine,
  doReduce,
  doMove,
  doAction,
  doGameStore,
  doSceneStore,
  getRunningCoroutineName,
  // @ts-ignore
} = require("./srcjs/coroutines");

test.group("Coroutines Tests", () => {
  // Store original globals to restore later
  let originalIda, originalScene, originalConsole;

  test.beforeEach(() => {
    // Set epp into allowed phase
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);

    // Save originals
    originalIda = global.ida;
    originalScene = global.scene;
    originalConsole = global.console;

    // Reset the real store to clean state
    const systemStore = useSystemStore();
    const gameStore = useGameStore();
    const sceneStore = useSceneStore();

    // Clear all store data
    Object.keys(systemStore).forEach((key) => delete systemStore[key]);
    Object.keys(gameStore).forEach((key) => delete gameStore[key]);
    Object.keys(sceneStore).forEach((key) => delete sceneStore[key]);

    // Mock global objects
    global.ida = createMockObj(originalIda, {
      _isMoveActive: createMockFn(false),
      _cmove: createMockFn(null),
      _move: createMockFn(undefined),
      _enableMove: createMockFn(undefined),
      _disableMove: createMockFn(undefined),
      _stopMove: createMockFn(undefined),
    });

    // @ts-ignore
    global.scene = {
      getObject: createMockFn({
        // @ts-ignore
        getStaticFlags: () => object.Flags.HasIdaMoveScript, // Mock HasIdaMoveScript flag
      }),
    };

    // @ts-ignore
    global.console = {
      debug: createMockFn(undefined),
      warn: createMockFn(undefined),
      error: createMockFn(undefined),
    };

    clearAllCoroutines();
  });

  test.afterEach(() => {
    // Restore originals
    global.ida = originalIda;
    global.scene = originalScene;
    global.console = originalConsole;
  });

  test("registerCoroutine should register a new coroutine successfully", () => {
    const mockGenerator = function* () {
      yield;
    };

    // Should not throw
    registerCoroutine("testCoroutine", mockGenerator);
    expect.true(true);
  });

  test("registerCoroutine should throw error for invalid name", () => {
    const mockGenerator = function* () {
      yield;
    };

    expect.throws(() => registerCoroutine("", mockGenerator));
    expect.throws(() => registerCoroutine("   ", mockGenerator));
    expect.throws(() => registerCoroutine(null, mockGenerator));
    expect.throws(() => registerCoroutine(undefined, mockGenerator));
  });

  test("registerCoroutine should throw error for invalid generator function", () => {
    expect.throws(() => registerCoroutine("test", null));
    expect.throws(() => registerCoroutine("test", "not a function"));
    expect.throws(() => registerCoroutine("test", 123));
    expect.throws(() => registerCoroutine("test", () => {}));
  });

  test("registerCoroutine should throw error when registering duplicate coroutine name", () => {
    const mockGenerator = function* () {
      yield;
    };

    registerCoroutine("testCoroutine", mockGenerator);
    expect.throws(() => registerCoroutine("testCoroutine", mockGenerator));
  });

  test("startCoroutine should start a coroutine successfully", () => {
    const mockGenerator = function* () {
      yield;
    };

    registerCoroutine("testCoroutine", mockGenerator);
    startCoroutine(1, "testCoroutine", "test", 42);

    const systemStore = useSystemStore();
    expect.equal(Object.keys(systemStore.runningCoroutines).length, 1);
    expect.true(systemStore.runningCoroutines[1] !== undefined);
    expect.equal(systemStore.runningCoroutines[1].name, "testCoroutine");
    expect.equal(systemStore.runningCoroutines[1].id, 1);
    expect.equal(systemStore.runningCoroutines[1].pos, -1);
    expect.collectionEqual(systemStore.runningCoroutines[1].args, ["test", 42]);
    expect.equal(global.ida._enableMove.calls.length, 1);
  });

  test("startCoroutine should throw error for invalid objectId", () => {
    expect.throws(() => startCoroutine("not a number", "test"));
    expect.throws(() => startCoroutine(null, "test"));
  });

  test("startCoroutine should throw error for invalid coroutine name", () => {
    expect.throws(() => startCoroutine(1, ""));
    expect.throws(() => startCoroutine(1, null));
  });

  test("startCoroutine should throw error for unregistered coroutine", () => {
    expect.throws(() => startCoroutine(1, "nonExistentCoroutine"));
  });

  test("startCoroutine should stop existing coroutine before starting new one", () => {
    const gen1 = function* () {
      yield;
    };
    const gen2 = function* () {
      yield;
    };

    registerCoroutine("coroutine1", gen1);
    registerCoroutine("coroutine2", gen2);

    const systemStore = useSystemStore();
    startCoroutine(1, "coroutine1");
    expect.equal(systemStore.runningCoroutines[1].name, "coroutine1");

    startCoroutine(1, "coroutine2");
    expect.equal(systemStore.runningCoroutines[1].name, "coroutine2");
    expect.true(global.console.warn.calls.length > 0);
    expect.equal(
      global.console.warn.calls[0][0],
      "Object 1 is already running a coroutine with name coroutine1; stopping it before starting coroutine2"
    );
  });

  test("startCoroutine should not start if paused coroutine with same name exists", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    // Set up a paused coroutine
    const systemStore = useSystemStore();
    systemStore.pausedCoroutines = {
      1: { testCoroutine: { id: 1, name: "testCoroutine" } },
    };

    startCoroutine(1, "testCoroutine");

    expect.true(systemStore.runningCoroutines[1] === undefined);
    expect.true(global.console.error.calls.length > 0);
    expect.equal(
      global.console.error.calls[0][0],
      "Coroutine with name testCoroutine for objectId 1 is already paused. Cannot run a new one. Use stopPausedCoroutine() to stop it first."
    );
  });

  test("stopCoroutine should stop running coroutine", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");
    expect.true(systemStore.runningCoroutines[1] !== undefined);

    // Mock that the move is active so _stopMove gets called
    global.ida._isMoveActive.returnValue = (id) => id === 1;
    stopCoroutine(1);
    expect.true(systemStore.runningCoroutines[1] === undefined);
    expect.equal(global.ida._disableMove.calls.length, 1);
  });

  test("stopCoroutine should throw error for invalid objectId", () => {
    expect.throws(() => stopCoroutine("not a number"));
  });

  test("stopCoroutine should handle stopping non-existent coroutine gracefully", () => {
    // Should not throw error
    stopCoroutine(1);
    expect.true(true);
  });

  test("isCoroutineRunning should return true when coroutine is running", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    expect.true(isCoroutineRunning(1));
    expect.true(isCoroutineRunning(1, "testCoroutine"));
  });

  test("isCoroutineRunning should return false when coroutine is not running", () => {
    expect.false(isCoroutineRunning(1));
    expect.false(isCoroutineRunning(1, "testCoroutine"));
  });

  test("isCoroutineRunning should return false when name doesn't match", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    expect.false(isCoroutineRunning(1, "wrongName"));
  });

  test("isCoroutineRunning should return true if any coroutine is running on the object, if no name is passed", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("someCoroutine", mockGenerator);

    startCoroutine(1, "someCoroutine");

    // Should return true when no name is passed, regardless of actual coroutine name
    expect.true(isCoroutineRunning(1));
  });

  test("isCoroutineRunning should return false if no coroutines are running on the object, if no name is passed", () => {
    // Should return false when no name is passed and no coroutines are running
    expect.false(isCoroutineRunning(1));
  });

  test("getRunningCoroutineName should return coroutine name when running", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    expect.equal(getRunningCoroutineName(1), "testCoroutine");
  });

  test("getRunningCoroutineName should return null when no coroutine is running", () => {
    expect.eq(getRunningCoroutineName(1), null);
  });

  test("clearAllCoroutines should clear all coroutines and state", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");

    clearAllCoroutines();

    expect.objectEqual(systemStore.runningCoroutines, {});
    expect.objectEqual(systemStore.pausedCoroutines, {});
    expect.false(isCoroutineRunning(1));
  });

  test("pauseCoroutine should pause running coroutine successfully", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");
    expect.true(isCoroutineRunning(1, "testCoroutine"));

    pauseCoroutine(1, "testCoroutine");

    expect.false(isCoroutineRunning(1, "testCoroutine"));
    expect.true(systemStore.pausedCoroutines[1] !== undefined);
    expect.true(systemStore.pausedCoroutines[1]["testCoroutine"] !== undefined);
    expect.equal(global.ida._disableMove.calls.length, 1);
  });

  test("pauseCoroutine should pause without name validation if name not provided", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");
    expect.true(isCoroutineRunning(1, "testCoroutine"));

    pauseCoroutine(1); // No name provided

    expect.false(isCoroutineRunning(1, "testCoroutine"));
    expect.true(systemStore.pausedCoroutines[1] !== undefined);
    expect.true(systemStore.pausedCoroutines[1]["testCoroutine"] !== undefined);
  });

  test("pauseCoroutine should throw error for invalid objectId", () => {
    expect.throws(() => pauseCoroutine("not a number"));
    expect.throws(() => pauseCoroutine(null));
  });

  test("pauseCoroutine should error when no coroutine is running", () => {
    pauseCoroutine(1, "testCoroutine");

    expect.true(global.console.error.calls.length > 0);
    expect.equal(
      global.console.error.calls[0][0],
      "Coroutine for objectId 1 is not running or already stopped"
    );
  });

  test("pauseCoroutine should error when name doesn't match running coroutine", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");
    expect.true(isCoroutineRunning(1, "testCoroutine"));

    pauseCoroutine(1, "wrongName");

    expect.true(isCoroutineRunning(1, "testCoroutine")); // Should still be running
    expect.true(global.console.error.calls.length > 0);
    expect.equal(
      global.console.error.calls[0][0],
      "Expected to pause coroutine with name wrongName, but found running testCoroutine"
    );
  });

  test("unpauseCoroutine should unpause coroutine successfully", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");
    pauseCoroutine(1, "testCoroutine");
    expect.false(isCoroutineRunning(1, "testCoroutine"));

    unpauseCoroutine(1, "testCoroutine");

    expect.true(isCoroutineRunning(1, "testCoroutine"));
    expect.true(
      systemStore.pausedCoroutines[1] === undefined ||
        systemStore.pausedCoroutines[1]["testCoroutine"] === undefined
    );
    expect.equal(global.ida._enableMove.calls.length, 2);
    expect.equal(global.ida._disableMove.calls.length, 1);
  });

  test("unpauseCoroutine should throw error for invalid objectId", () => {
    expect.throws(() => unpauseCoroutine("not a number", "test"));
    expect.throws(() => unpauseCoroutine(null, "test"));
  });

  test("unpauseCoroutine should throw error for invalid name", () => {
    expect.throws(() => unpauseCoroutine(1, ""));
    expect.throws(() => unpauseCoroutine(1, null));
    expect.throws(() => unpauseCoroutine(1, undefined));
  });

  test("unpauseCoroutine should error when no paused coroutine exists", () => {
    unpauseCoroutine(1, "nonExistentCoroutine");

    expect.true(global.console.error.calls.length > 0);
    expect.equal(
      global.console.error.calls[0][0],
      "There is no paused coroutine witn name nonExistentCoroutine for objectId 1"
    );
  });

  test("unpauseCoroutine should stop existing running coroutine before unpausing", () => {
    const mockGenerator1 = function* () {
      yield;
    };
    const mockGenerator2 = function* () {
      yield;
    };
    registerCoroutine("coroutine1", mockGenerator1);
    registerCoroutine("coroutine2", mockGenerator2);

    // Start and pause first coroutine
    startCoroutine(1, "coroutine1");
    pauseCoroutine(1, "coroutine1");

    // Start second coroutine
    startCoroutine(1, "coroutine2");
    expect.true(isCoroutineRunning(1, "coroutine2"));

    // Unpause first coroutine
    unpauseCoroutine(1, "coroutine1");

    expect.true(isCoroutineRunning(1, "coroutine1"));
    expect.false(isCoroutineRunning(1, "coroutine2"));
    expect.true(global.console.warn.calls.length > 0);
    expect.equal(
      global.console.warn.calls[0][0],
      "There was a running coroutine for objectId 1, with name coroutine2; stopping it before resuming paused coroutine coroutine1"
    );
  });

  test("isCoroutinePaused should return true when coroutine is paused", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");
    pauseCoroutine(1, "testCoroutine");

    expect.true(isCoroutinePaused(1, "testCoroutine"));
  });

  test("isCoroutinePaused should return false when coroutine is not paused", () => {
    expect.false(isCoroutinePaused(1, "testCoroutine"));
  });

  test("isCoroutinePaused should return false when coroutine is running", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    expect.false(isCoroutinePaused(1, "testCoroutine"));
  });

  test("isCoroutinePaused should throw error for invalid objectId", () => {
    expect.throws(() => isCoroutinePaused("not a number", "test"));
    expect.throws(() => isCoroutinePaused(null, "test"));
  });

  test("isCoroutinePaused should throw error for invalid name", () => {
    expect.throws(() => isCoroutinePaused(1, ""));
    expect.throws(() => isCoroutinePaused(1, null));
    expect.throws(() => isCoroutinePaused(1, undefined));
  });

  test("stopPausedCoroutine should stop paused coroutine", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");
    pauseCoroutine(1, "testCoroutine");
    expect.true(isCoroutinePaused(1, "testCoroutine"));

    stopPausedCoroutine(1, "testCoroutine");

    expect.false(isCoroutinePaused(1, "testCoroutine"));
    expect.false(isCoroutineRunning(1, "testCoroutine"));
    expect.true(
      systemStore.pausedCoroutines[1] === undefined ||
        systemStore.pausedCoroutines[1]["testCoroutine"] === undefined
    );
  });

  test("stopPausedCoroutine should throw error for invalid objectId", () => {
    expect.throws(() => stopPausedCoroutine("not a number", "test"));
    expect.throws(() => stopPausedCoroutine(null, "test"));
  });

  test("stopPausedCoroutine should throw error for invalid name", () => {
    expect.throws(() => stopPausedCoroutine(1, ""));
    expect.throws(() => stopPausedCoroutine(1, null));
    expect.throws(() => stopPausedCoroutine(1, undefined));
  });

  test("stopPausedCoroutine should handle non-existent paused coroutine gracefully", () => {
    // Should not throw error when trying to stop non-existent paused coroutine
    stopPausedCoroutine(1, "nonExistentCoroutine");
    expect.true(true);
  });

  test("handleCoroutine should handle non-existent coroutine gracefully", () => {
    handleCoroutine(1);
    expect.true(true); // Should not throw
  });

  test("handleCoroutine should return early when no store.runningCoroutines exists", () => {
    const systemStore = useSystemStore();
    delete systemStore.runningCoroutines;

    handleCoroutine(1);
    expect.true(true); // Should not throw
  });

  test("handleCoroutine should return early when ida move is active", () => {
    const mockGenerator = function* () {
      yield;
      throw new Error("Should not reach here");
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");
    global.ida._isMoveActive.returnValue = true;

    handleCoroutine(1);
    expect.true(true); // Should not throw
  });

  test("handleCoroutine should call _cmove and save result code when ida move is active", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");

    global.ida._isMoveActive.returnValue = true;
    global.ida._cmove.returnValue = [1, 2, 3];

    handleCoroutine(1);

    expect.true(global.ida._cmove.calls.length > 0);
    expect.equal(global.ida._cmove.calls[0][0], 1);
    expect.collectionEqual(
      systemStore.runningCoroutines[1].savedCode,
      [1, 2, 3]
    );
  });

  test("handleCoroutine should not save code when cmove returns null", () => {
    const mockGenerator = function* () {
      yield;
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");

    global.ida._isMoveActive.returnValue = true;
    global.ida._cmove.returnValue = null;

    handleCoroutine(1);

    expect.true(global.ida._cmove.calls.length > 0);
    expect.true(systemStore.runningCoroutines[1].savedCode === undefined);
  });

  test("handleCoroutine should execute single coroutine step", () => {
    let stepExecuted = false;
    let coroutineArgs = [];
    const mockGenerator = function* (...args) {
      coroutineArgs = args;
      yield () => {
        stepExecuted = true;
      };
    };
    registerCoroutine("testCoroutine", mockGenerator);

    // Need to halt after the first step
    let step = 0;
    global.ida._isMoveActive.returnValue = (objectId) =>
      step++ === 0 ? false : true;

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine", "test", 42);
    expect.equal(systemStore.runningCoroutines[1].pos, -1);

    handleCoroutine(1);

    expect.true(stepExecuted);
    expect.equal(systemStore.runningCoroutines[1].pos, 0);
    expect.true(systemStore.runningCoroutines[1].code === undefined);
    expect.true(systemStore.runningCoroutines[1].savedCode === undefined);
    expect.collectionEqual(coroutineArgs, ["test", 42]);
  });

  test("handleCoroutine should execute multiple steps until completion", () => {
    const executedSteps = [];
    const mockGenerator = function* () {
      yield () => {
        executedSteps.push(1);
      };
      yield () => {
        executedSteps.push(2);
      };
      yield () => {
        executedSteps.push(3);
      };
    };
    registerCoroutine("testCoroutine", mockGenerator);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");

    handleCoroutine(1);

    expect.collectionEqual(executedSteps, [1, 2, 3]);
    expect.false(isCoroutineRunning(1)); // Should be completed and cleaned up
    expect.true(systemStore.runningCoroutines[1] === undefined);
    expect.true(global.console.debug.calls.length > 0);
    expect.equal(global.ida._disableMove.calls.length, 1);

    // Find the completion message
    const completionMessage = global.console.debug.calls.find((call) =>
      call[0].includes("completed")
    );
    expect.true(completionMessage !== undefined);
    expect.equal(completionMessage[0], "Coroutine for objectId 1 completed");
  });

  test("handleCoroutine should log step progression", () => {
    const mockGenerator = function* () {
      yield () => {};
      yield () => {};
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    handleCoroutine(1);

    expect.true(global.console.debug.calls.length >= 2);

    // Find step progression messages
    const stepMessages = global.console.debug.calls.filter((call) =>
      call[0].includes("is now at step")
    );
    expect.true(stepMessages.length >= 2);
    expect.true(stepMessages[0][0].includes("step 0"));
    expect.true(stepMessages[1][0].includes("step 1"));
  });

  test("handleCoroutine should throw on coroutine that yields non-function", () => {
    const mockGenerator = function* () {
      yield "not a function";
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    expect.throws(() => {
      handleCoroutine(1);
    }, new TypeError("cmd.value is not a function"));
  });

  test("handleCoroutine should not re-execute the completed coroutine", () => {
    let stepCount = 0;

    const mockGenerator = function* () {
      yield () => {
        stepCount++;
      };
      yield () => {
        stepCount++;
      };
      yield () => {
        stepCount++;
      };
    };
    registerCoroutine("testCoroutine", mockGenerator);

    startCoroutine(1, "testCoroutine");

    // First execution - should execute all steps
    handleCoroutine(1);
    expect.equal(stepCount, 3);

    // Second execution - coroutine should be completed, no effect
    handleCoroutine(1);
    expect.equal(stepCount, 3); // Should not change
  });

  test("handleCoroutine should clear code and savedCode after each step", () => {
    const mockGenerator = function* () {
      yield (coroutine) => {
        coroutine.code = [1, 2, 3];
        coroutine.savedCode = [4, 5, 6];
      };
      yield (coroutine) => {
        coroutine.code = [1, 2, 3];
        coroutine.savedCode = [4, 5, 6];
      };
      yield () => {};
    };
    registerCoroutine("testCoroutine", mockGenerator);

    let step = 0;
    global.ida._isMoveActive.returnValue = () => (step++ === 0 ? false : true);

    const systemStore = useSystemStore();
    startCoroutine(1, "testCoroutine");

    handleCoroutine(1);
    expect.true(systemStore.runningCoroutines[1].code === undefined);
    expect.true(systemStore.runningCoroutines[1].savedCode === undefined);

    step = 0;
    handleCoroutine(1);
    expect.true(systemStore.runningCoroutines[1].code === undefined);
    expect.true(systemStore.runningCoroutines[1].savedCode === undefined);
  });

  test("doReduce should return function that returns coroutine position to the initial saved one", () => {
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const reducer = doReduce("testKey");
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);

    expect.isFunction(reducer);
    const mockCoroutine = { pos: 10 };

    // First call sets the reducer
    reducer(mockCoroutine);
    expect.equal(mockCoroutine.reducers.testKey, 10);

    // Advance position
    mockCoroutine.pos = 20;

    // Second call resets position
    reducer(mockCoroutine);
    expect.equal(mockCoroutine.pos, 10);
  });

  test("doReduce should use default key if none provided", () => {
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const reducer = doReduce();
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);
    const mockCoroutine = { pos: 5 };

    reducer(mockCoroutine);
    expect.true(mockCoroutine.reducers.__default !== undefined);
  });

  test("doReduce should throw error for invalid key", () => {
    expect.throws(() => doReduce([])({}));
    expect.throws(() => doReduce("   ")({}));
    expect.throws(() => doReduce({})({}));
  });

  test("doMove should return function that calls ida.move", () => {
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const moveCommand = doMove("MOVE_CMD", "arg1", "arg2");
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);
    expect.isFunction(moveCommand);

    const mockCoroutine = { id: 1, code: [] };
    moveCommand(mockCoroutine);

    expect.true(global.ida._move.calls.length > 0);
    expect.equal(global.ida._move.calls[0][0], 1);
    expect.equal(global.ida._move.calls[0][2], "MOVE_CMD");
    expect.equal(global.ida._move.calls[0][3], "arg1");
    expect.equal(global.ida._move.calls[0][4], "arg2");
  });

  test("doMove should pass coroutine code when it exists", () => {
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const moveCommand = doMove("MOVE_CMD");
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);
    global.ida._move.reset(); // Clear previous calls

    const mockCoroutine = { id: 1, code: [1, 2, 3] };
    moveCommand(mockCoroutine);

    expect.true(global.ida._move.calls.length > 0);
    expect.equal(global.ida._move.calls[0][0], 1);
    expect.collectionEqual(global.ida._move.calls[0][1], [1, 2, 3]);
    expect.equal(global.ida._move.calls[0][2], "MOVE_CMD");
  });

  test("doMove should pass empty array when coroutine code is undefined", () => {
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const moveCommand = doMove("MOVE_CMD");
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);

    global.ida._move.reset(); // Clear previous calls

    const mockCoroutine = { id: 1 }; // No code property
    moveCommand(mockCoroutine);

    expect.true(global.ida._move.calls.length > 0);
    expect.equal(global.ida._move.calls[0][0], 1);
    expect.collectionEqual(global.ida._move.calls[0][1], []);
    expect.equal(global.ida._move.calls[0][2], "MOVE_CMD");
  });

  test("doAction should execute callback", () => {
    let executed = false;
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const action = doAction(() => {
      executed = true;
    });
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);

    action();
    expect.true(executed);
  });

  test("doGameStore should call callback with game store", () => {
    let receivedStore = null;
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const action = doGameStore((store) => {
      receivedStore = store;
    });
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);

    action();
    const gameStore = useGameStore();
    expect.eq(receivedStore, gameStore);
  });

  test("doSceneStore should call callback with scene store", () => {
    let receivedStore = null;
    epp.setCurrentPhase(epp.ExecutionPhase.InMove);
    const action = doSceneStore((store) => {
      receivedStore = store;
    });
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);

    action();
    const sceneStore = useSceneStore();
    expect.eq(receivedStore, sceneStore);
  });
});
