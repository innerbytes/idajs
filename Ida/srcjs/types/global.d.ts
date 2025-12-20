import type { Ida } from "./ida";
import type { Mark } from "./mark";
import type { Scene } from "./scene";
import type { ObjectHelper } from "./objectHelper";
import type { MoveOpcode, MoveOpcodes } from "./ida";
import type { TextApi } from "./text";
import type { Image } from "./image";
import type { ArrayExtensions } from "./arrayExtensions";

declare global {
  /**
   * The global object (same as window and globalThis)
   */
  var global: typeof globalThis;

  /**
   * The global 'ida' object provides access to the mod engine configuration and API.
   *
   * @globalInstance
   */
  var ida: Ida;

  /**
   * The scene object provides methods to interact with the current scene and the world in the game.
   * It's your main interface to the game world.
   *
   * @globalInstance
   */
  var scene: Scene;

  /**
   * The object helper provides methods that help to read and modify scene objects flags and other values.
   *
   * @globalInstance
   */
  var object: ObjectHelper;

  /**
   * The global `text` object API to manage the dialogs in the game
   *
   * @globalInstance
   */
  var text: TextApi;

  /**
   * The global `image` object provides methods to manage images in the game.
   * It allows loading user images and replacing existing game images.
   *
   * @globalInstance
   */
  var image: Image;

  /**
   * The global 'mark' object provides access to testing automation functions.
   *
   * @warning This API is not part of IdaJS modding engine, intended for testing purposes only, and should not be used in the modding code.
   *
   * @globalInstance
   */
  var mark: Mark;

  /**
   * Provides access to the game state object, that you can use to persist any game state variables.
   * Keep the types you use here simple, as they will be serialized to JSON.
   * @param args - Optional path of the subobject in the store. For example `useGameStore("moon", "quests")` will store state in gameSaveData.moon.quests
   */
  var useGameStore: (...args: string[]) => Record<string, any>;

  /**
   * Provides access to the scene state object, that you can use to persist any scene state variables.
   * Scene state is reset every time the scene is reloaded.
   * Keep the types you use here simple, as they will be serialized to JSON.
   * @param args - Optional path of the subobject in the store. For example `useSceneStore("cellar", "interior")` will store state in sceneSaveData.cellar.interior
   */
  var useSceneStore: (...args: string[]) => Record<string, any>;

  /**
   * Registers a coroutine generator with the given name. All coroutines must be registered before using them.
   */
  var registerCoroutine: (name: string, coroutine: CoroutineFunction) => void;

  /**
   * Starts a coroutine on an actor with the given name and arguments.
   *
   * If another coroutine is already running for the same object ID, it will be stopped automatically.
   *
   * The coroutine must be registered with {@link registerCoroutine} before starting it.
   *
   * All the IdaJS functions you can use within the coroutine, are prefixed with do..., for example {@link doMove}, {@link doGameStore}, {@link doSceneStore} etc.
   */
  var startCoroutine: (objectId: number, name: string, ...args: any[]) => void;

  /**
   * Stops the coroutine for the given object ID.
   * This will stop the coroutine execution and clear its state, if it is running.
   */
  var stopCoroutine: (objectId: number) => void;

  /**
   * Stops a paused coroutine for the given object ID and name.
   * Use this if you don't want to unpause a coroutine anymore.
   */
  var stopPausedCoroutine: (objectId: number, name: string) => void;

  /**
   * Pauses the currently running coroutine for the given object ID.
   * The coroutine can be resumed later using {@link unpauseCoroutine}.
   * @param objectId - The object ID whose coroutine to pause
   * @param name - Optional name to verify the expected coroutine is being paused (will be verified to match the currently running coroutine)
   */
  var pauseCoroutine: (objectId: number, name?: string) => void;

  /**
   * Unpauses (resumes) a previously paused coroutine for the given object ID and name.
   * If another coroutine is running for the same object ID, it will be stopped first.
   * @param objectId - The object ID whose coroutine to resume
   * @param name - The name of the paused coroutine to resume
   */
  var unpauseCoroutine: (objectId: number, name: string) => void;

  /**
   * Checks if a coroutine is currently running for the given object ID.
   * @param objectId - The object ID to check
   * @param name - Optional name to verify the expected coroutine is running (will be verified to match the currently running coroutine)
   * @returns true if the coroutine is running on this object and if the name is matching when specified, false otherwise
   */
  var isCoroutineRunning: (objectId: number, name?: string) => boolean;

  /**
   * Gets the name of the currently running coroutine for the given object ID.
   * @param objectId - The object ID to check
   * @returns The name of the running coroutine, or null if no coroutine is running on an object
   */
  var getRunningCoroutineName: (objectId: number) => string | null;

  /**
   * Checks if a coroutine with the given name is paused for the given object ID.
   * @param objectId - The object ID to check
   * @param name - The name of the coroutine to check
   * @returns true if the coroutine is paused, false otherwise
   */
  var isCoroutinePaused: (objectId: number, name: string) => boolean;

  /**
   * **[COROUTINE COMMAND]** Use in the coroutines only; Must be called with yield!
   *
   * This is the main coroutine function in IdaJS. Use it to execute any LBA2 move script command in an actor coroutine.
   *
   * @example
   * ```js
   * // Coroutine function (must have * after function keyword)
   * function* zoeIsExitingTheHouse() {
   *   // Play idle animation
   *   yield doMove(ida.Move.TM_ANIM, 0);
   *   // ... some other coroutine commands...
   * }
   * ```
   *
   * @see {@link MoveOpcodes} for the possible opcodes and their arguments.
   */
  var doMove: (opcode: MoveOpcode, ...args: (number | string)[]) => (coroutine: unknown) => void;

  /**
   * **[COROUTINE COMMAND]** Use in the coroutines only; Must be called with yield!
   *
   * This function is used to reduce the coroutine position in the truly infinite loops, so that the position does not grow indefinitely. The save game system saves the last position in your coroutine, so if the infinite loop is there, the position will keep growing with time. This functions resets the position counter in the beginning of the infinite loop, still allowing the coroutine to load in the right position after loading a save game.
   *
   * A truly infinite loop is a loop that has no exit conditions, or breaks out of it. If your loop has possibility to exit, you usually should not use this function.
   *
   * Use `yield doReduce();` at the beginning of the truly infinite loop, like `while (true)`, to reset the position counter.
   *
   * @param key - optional key to identify the coroutine position reducer. Only needed to be provided in the case, there are several infinite loops in one coroutine.
   *
   * @example
   * ```js
   * // Coroutine function (must have * after function keyword)
   * function* myCoroutineWithInfiniteLoop() {
   *
   *  // Example of some coroutine operations before the infinite loop:
   *
   *  yield doMove(ida.Move.TM_SAMPLE, 16); // Play audio sample 16
   *
   *  // Starting a truly infinite loop
   *  while (true) {
   *   // Reduce position counter to avoid it growing indefinitely
   *   // (will reduce the position to 1 in this case,
   *   // as this is the position of the first doReduce call in this coroutine).
   *   yield doReduce();
   *
   *   // Example of some coroutine operations in the loop:
   *
   *   // Play animation 12
   *   yield doMove(ida.Move.TM_ANIM, 12);
   *
   *   // Wait for 2 seconds
   *   yield doMove(ida.Move.TM_WAIT_NB_SECOND, 2);
   *  }
   * }
   * ```
   *
   */
  var doReduce: (key?: string | number) => (coroutine: unknown) => void;

  /**
   * **[COROUTINE COMMAND]** Use in the coroutines only; Must be called with yield!
   *
   * Executes an external action from within a coroutine.
   *
   * Always use this to do any side effects from the coroutines: to change classic game variables, start other coroutines, or perform other side effects.
   *
   * Wrapping the side effect to the doAction call, ensures that it will not be repeat each time the coroutine is resumed from the saved game, but only once when the coroutine reaches this point.
   *
   * @param callback - The action to execute
   *
   * @see
   * See also special helpers for changing IdaJS variable stores. You can use them instead of doAction when changing the stored variables:
   * - {@link doGameStore} - to change IdaJS game store variables from within a coroutine
   * - {@link doSceneStore} - to change IdaJS scene store variables from within a coroutine
   *
   * @example
   * ```js
   * // Coroutine function (must have * after function keyword)
   * function* myCoroutine() {
   *   // Some other coroutine commands...
   *
   *   // Change the classic LBA2 game variable #40 to have value 5, from within the coroutine
   *   yield doAction(() => scene.setGameVariable(40, 5));
   * }
   * ```
   */
  var doAction: (callback: () => void) => () => void;

  /**
   * **[COROUTINE COMMAND]** Use in the coroutines only; Must be called with yield!
   *
   * Facilitates changing IdaJS game store variables from within a coroutine.
   *
   * Using doGameStore for side effects ensures that the changes will not be repeated each time the coroutine is resumed from a saved game, but only once when the coroutine reaches this point.
   *
   * @param callback - The callback function, that receives the game store as parameter
   *
   * @example
   * ```js
   * // Coroutine function (must have * after function keyword)
   * function* myCoroutine() {
   *   // Some other coroutine commands...
   *
   *   // Change the game store variable to true, from within the coroutine
   *   yield doGameStore((store) => {
   *     store.pharmacistIsInLove = true;
   *   });
   * }
   * ```
   */
  var doGameStore: (callback: (store: Record<string, any>) => void) => () => void;

  /**
   * **[COROUTINE COMMAND]** Use in the coroutines only; Must be called with yield!
   *
   * Facilitates changing IdaJS scene store variables from within a coroutine.
   *
   * Using doSceneStore for side effects ensures that the changes will not be repeated each time the coroutine is resumed from a saved game, but only once when the coroutine reaches this point.
   *
   * @param callback - The callback function, that receives the scene store as parameter
   *
   * @example
   * ```js
   * // Coroutine function (must have * after function keyword)
   * function* myCoroutine() {
   *   // Some other coroutine commands...
   *
   *   // Change the scene store variable to true, from within the coroutine
   *   yield doSceneStore((store) => {
   *     store.doorIsOpen = true;
   *   });
   * }
   * ```
   */
  var doSceneStore: (callback: (store: Record<string, any>) => void) => () => void;

  /**
   * Checks if the specified state has been triggered from false to true.
   * @param store - Any object that will serve as backing state storage (usually scene store)
   * @param stateName - The name of the state in the object to check. The backing state will be prefixed with "__" from this name.
   * @param customState - Optional custom state to check instead of the store state
   * @returns true if the state is triggered from false to true, false otherwise
   */
  var isTriggeredTrue: (
    store: Record<string, any>,
    stateName: string,
    customState?: any
  ) => boolean;

  /**
   * Checks if the specified state has been triggered from true to false.
   * @param store - Any object that will serve as backing state storage (usually scene store)
   * @param stateName - The name of the state in the object to check. The backing state will be prefixed with "__" from this name.
   * @param customState - Optional custom state to check instead of the store state
   * @returns true if the state is triggered from true to false, false otherwise
   */
  var isTriggeredFalse: (
    store: Record<string, any>,
    stateName: string,
    customState?: any
  ) => boolean;

  /**
   * Checks if the specified state is truthy and triggers only once.
   * After the function returns true for the first time, it will return false for all subsequent calls.
   * @param store - Any object that will serve as backing state storage (scene store)
   * @param stateName - The name of the state in the object to check. The backing state will be prefixed with "__1" from this name.
   * @param customState - Optional custom state to check instead of the store state
   * @returns true if the state is truthy and hasn't been triggered before, false otherwise
   */
  var oneIfTrue: (store: Record<string, any>, stateName: string, customState?: any) => boolean;

  /**
   * Checks if the specified state is falsy and triggers only once.
   * After the function returns true for the first time, it will return false for all subsequent calls.
   * @param store - Any object that will serve as backing state storage (scene store)
   * @param stateName - The name of the state in the object to check. The backing state will be prefixed with "__1" from this name.
   * @param customState - Optional custom state to check instead of the store state
   * @returns true if the state is falsy and hasn't been triggered before, false otherwise
   */
  var oneIfFalse: (store: Record<string, any>, stateName: string, customState?: any) => boolean;

  interface Array<T> extends ArrayExtensions<T> {}
}

/**
 * Type definition for a coroutine generator function (used to run Move scripts of the objects).
 *
 * Coroutines are modern replacement for the LBA move scripts.
 * They are designed to control the sequence of object actions.
 *
 * Every coroutine runs its commands one by one until finished or stopped.
 *
 * The coroutines run as asynchronous, multiple step functions, and can be paused and resumed. Also the coroutines persist their execution state and restore automatically during save/load.
 *
 * @remarks
 * **Coroutine Limitations:**
 *
 * Coroutines functions have the following limitations in order to function correctly:
 *
 * - **No outside dynamic state can be used**: Coroutine cannot use or depend on any dynamically changing state outside of the coroutine (no closured variables), except variables passed through the arguments of the coroutine function.
 *   - That means that any loops and conditions within the coroutine cannot use any external variables or call other functions (unless those functions are fully immutable, or do side effects only through specially allowed coroutine mechanisms (see do... functions below)).
 *
 * - **Deterministic execution flow**: When running with the same arguments, the coroutine should always result in the exact same sequence of the yield commands. No outside state should ever change the order or flow of the yield actions within the coroutine.
 *
 * - **Serializable arguments**: Coroutine arguments must be serializable to JSON, in order to be saved / loaded correctly, so they need to be of simple types.
 *
 * - **yield side effects only**: Any action, that causes side-effect, should be called as `yield <coroutineCommand>(...)`.
 *   - Currently supported coroutine commands are: {@link doMove} (low level track script command), {@link doReduce}, {@link doAction}, {@link doGameStore}, {@link doSceneStore}.
 *   - Exception of this rule: technically you can run something within the coroutine that doesn't start with yield (arbitrary code), but it must be a fully idempotent action, because it will re-run again when coroutine is loaded from a save game state, even if the last position in the coroutine is already after this line.
 *
 * - **Supports infinite loops**: Once entered infinite loop, there should be no way to exit it, except terminating the coroutine. If your loop has break statement, it's not a truly infinite loop.
 *   - In the case you use a truly infinite loop, call `yield doReduce()` as a first command in its scope. It will make sure the coroutine saved position doesn't grow infinitely.
 *   - It's not recommended to create complex coroutines with several or nested infinite loops. However, if this is the case, you have to pass different key to each doReduce, so they save the state separately: `yield doReduce(1)`, `yield doReduce("mainLoop")`, and so on.
 *
 * @example
 * ```js
 *
 * // Simple coroutine with arguments
 * function* myCoroutine(arg1, arg2) {
 *   yield doMove(ida.Move.TM_SAMPLE, arg1);
 *   yield doMove(ida.Move.TM_BACKGROUND, arg2);
 *   // ...
 * }
 * ```
 *
 * @example
 * ```js
 * // Coroutine with infinite loop: going infinitely between 2 points
 * function* infinitePatrol() {
 *   while (true) {
 *     yield doReduce(); // Used at start of truly infinite loops to reduce position counter growth
 *     yield doMove(ida.Move.TM_GOTO_POINT, 1);
 *     yield doMove(ida.Move.TM_GOTO_POINT, 2);
 *   }
 * }
 * ```
 */
export type CoroutineFunction = (...args: any[]) => Generator<any, any, any>;

export {
  ida,
  scene,
  object,
  text,
  image,
  useGameStore,
  useSceneStore,
  registerCoroutine,
  startCoroutine,
  stopCoroutine,
  stopPausedCoroutine,
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
  isTriggeredTrue,
  isTriggeredFalse,
  oneIfTrue,
  oneIfFalse,
};
