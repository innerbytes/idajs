import type { GameObject } from "./gameObject";
import type { Zone } from "./zone";
import type { EnumHandler } from "./enumHandler";
import type { Ida } from "./ida";
import type { ZoneType } from "./objectHelper";

/**
 * Scene events the mod can subscribe to to perform necessary setup actions.
 *
 * @globalAccess {@link scene.Events}.
 */
export interface SceneEvents {
  /**
   * Fired right before a scene is loaded by any reason.
   *
   * This is not needed often in the mods.
   * Can be used to initialize storm state, palette, and verify the compatibility of saved games.
   *
   * The example of this event handler usage can be seen in the `storm` sample.
   *
   * @see {@link BeforeLoadSceneCallback}
   */
  readonly beforeLoadScene: "beforeLoadScene";

  /**
   * Fired right after a scene is loaded by any reason.
   *
   * This is the main entry point for the mod to setup everything in the scene.
   *
   * Use to setup scene objects, zones and waypoints, custom life handlers, register coroutines, and do other initial setup.
   *
   * @see {@link AfterLoadSceneCallback}
   */
  readonly afterLoadScene: "afterLoadScene";

  /**
   * Fired after a saved game is loaded from a save file to this scene. Happens after {@link SceneEvents.afterLoadScene}
   *
   * The mod should not need to subscribe to this event, but it's used by the system.
   *
   * @warning This event is for internal usage. Only use it if you know what you are doing.
   * @see {@link AfterLoadSavedStateCallback}
   */
  readonly afterLoadSavedState: "afterLoadSavedState";
}

/**
 * A string type representing all possible scene events
 * @see {@link SceneEvents}
 */
export type AllSceneEvents = SceneEvents[keyof SceneEvents];

/**
 * Used in the scene event to let the mod developer know the reason why the scene is being loaded.
 * @see
 * - {@link SceneEvents.afterLoadScene}
 * - {@link SceneEvents.beforeLoadScene}
 *
 * @globalAccess {@link scene.LoadModes}.
 */
export interface SceneLoadModes {
  /** This scene was loaded because a new game started. */
  readonly NewGameStarted: 0;

  /** Player normally moved here by walking. */
  readonly PlayerMovedHere: 1;

  /** Player teleported here by a script */
  readonly PlayerTeleportedHere: 2;

  /**
   * We are loading a saved game from a save file.
   *
   * The game will be loaded from a saved state after this callback finishes (either save file or a backup state).
   *
   * Do not initialize scene and game variables or start new coroutines in this mode, as they will be restored from the save file afterwards.
   *
   * You should still do other scene initializations in this mode: initialize your objects, zones and waypoints, register handlers, register the coroutines, etc.
   *
   * Some objects and zone states will be overwritten afterwards, by loading the saved game state.
   */
  readonly WillLoadSavedState: 4;

  /** Enum handler functions for this object */
  readonly $: EnumHandler;
}

/**
 * A type representing all possible scene load modes.
 * @see {@link SceneLoadModes}
 */
export type SceneLoadMode = SceneLoadModes[keyof Omit<SceneLoadModes, "$">];

/**
 * Callback for beforeLoadScene event
 * @param sceneId The ID of the scene that will be loaded
 * @param sceneLoadMode The mode of the scene loading
 * @see {@link SceneLoadModes}
 */
export type BeforeLoadSceneCallback = (sceneId: number, sceneLoadMode: SceneLoadMode) => void;

/**
 * Callback for afterLoadScene event
 * @param sceneId The ID of the scene that was loaded
 * @param sceneLoadMode The mode of the scene loading
 * @see {@link SceneLoadModes}
 */
export type AfterLoadSceneCallback = (sceneId: number, sceneLoadMode: SceneLoadMode) => void;

/**
 * Callback for afterLoadSavedState event
 * @param sceneId The ID of the scene that was loaded. Will be -1 if the game state is restored from the backup.
 * @param filePath The path to the save file that was loaded. Will be an empty string if the game state is restored from the backup.
 *
 * @warning This is intended for internal usage only. Use this only if you know what you are doing.
 */
export type AfterLoadSavedStateCallback = (sceneId: number, filePath: string) => void;

/**
 * Some important vanilla LBA2 game variables, such as inventory items, chapter, and others.
 *
 * Use {@link Scene.setGameVariable} to set such variables.
 *
 * The inventory items are not fully documented yet, but should be clear from their names.
 *
 * @globalAccess {@link scene.GameVariables}.
 */
export interface GameVariables {
  readonly $: EnumHandler;

  // Inventory items
  readonly INV_HOLOMAP: 0;
  readonly INV_MAGIC_BALL: 1;

  /** Darts */
  readonly INV_DARTS: 2;

  readonly INV_SENDELL_BALL: 3;
  readonly INV_TUNIC: 4;
  readonly INV_PEARL: 5;
  readonly INV_PYRAMID_KEY: 6;
  readonly INV_STEERING_WHEEL: 7;

  /**
   * Foreign money in the inventory: gold or zlitos, depending on the current planet.
   *
   * This variable should not be set directly. Use scene.setForeignMoney() instead.
   *
   * @see {@link Scene.setForeignMoney}
   */
  readonly INV_MONEY: 8;

  /** PistoLaser */
  readonly INV_PISTOLASER: 9;

  /** The Saber */
  readonly INV_SABER: 10;

  /** Glove */
  readonly INV_GLOVE: 11;

  readonly INV_PROTOPACK: 12;
  readonly INV_FERRY_TICKET: 13;
  readonly INV_MECA_PENGUIN: 14;

  /** GazoGem */
  readonly INV_GAZOGEM: 15;

  readonly INV_HALF_MEDALLION: 16;
  readonly INV_GALLIC_ACID: 17;
  readonly INV_SONG: 18;
  readonly INV_LIGHTNING_RING: 19;
  readonly INV_UMBRELLA: 20;
  readonly INV_GEM: 21;
  readonly INV_CONCH: 22;
  readonly INV_BLOWGUN: 23;

  /** Road Disc */
  readonly INV_ROAD_DISC: 24;

  /** ACF Viewer */
  readonly INV_MEMORY_VIEWER: 24;

  readonly INV_LUCI_TART: 25;
  readonly INV_RADIO: 26;
  readonly INV_FLOWER: 27;
  readonly INV_SLATE: 28;
  readonly INV_TRANSLATOR: 29;
  readonly INV_DIPLOMA: 30;
  readonly INV_KEY_KNARTA: 31;
  readonly INV_KEY_SUP: 32;
  readonly INV_KEY_MOSQUI: 33;
  readonly INV_KEY_BLAFARD: 34;

  /** Queen Mosquibees Key */
  readonly INV_QUEEN_KEY: 35;

  readonly INV_PICKAXE: 36;
  readonly INV_MAYOR_KEY: 37;
  readonly INV_MAYOR_NOTE: 38;

  /** Protection Spell */
  readonly INV_PROTECTION: 39;

  /** Used to switch Celebration Island state between normal and final */
  readonly VAR_CELEBRATION: 79;

  /** Used for Dino on Holomap, investigate how it works */
  readonly VAR_DINO_JOURNEY: 94;

  /** Set if the player pressed Escape key during an automatic scene. Use as read only. */
  readonly VAR_ESC: 249;

  /** The number of full clover boxes. Do not set more than 10, looks ugly in the UI. */
  readonly VAR_CLOVER: 251;

  /** Use to read and set the current game chapter */
  readonly VAR_CHAPTER: 253;

  /** Switches type of rails to be either like in Bu temple or like in the Zeelich mine, can also be used in the script */
  readonly VAR_PLANET_ESMER: 254;
}

/**
 * Represents a scene in the LBA game.
 * Provides access to the scene life cycle events.
 * Allows to do the scene setup operations with objects, zones and waypoints.
 * Provides access to the LBA2 classic scene and game variables.
 *
 * This object is globally accessible through {@link scene}.
 */
export interface Scene {
  /**
   * Returns the number of the current scene objects, if the scene is loaded.
   */
  getNumObjects(): number;

  /**
   * Returns the number of the current scene zones, if the scene is loaded.
   */
  getNumZones(): number;

  /**
   * Returns the number of waypoints in the current scene.
   * The waypoints are used by the original game scripts to navigate.
   */
  getNumWaypoints(): number;

  /**
   * Returns a scene GameObject at the given index.
   * The index is zero-based. The player object is 0. The NitroMecaPingouin is 1.
   *
   * @param objectIndex The index of the object to get.
   * @returns The object at the given index.
   */
  getObject(objectIndex: number): GameObject;

  /**
   * Returns a Zone from the scene, at the given index.
   * The index is zero-based.
   *
   * @param zoneIndex The index of the zone to get.
   * @returns The zone at the given index.
   */
  getZone(zoneIndex: number): Zone;

  /**
   * Returns a waypoint from the scene, at the given index.
   * The index is zero-based.
   *
   * @param waypointIndex The index of the waypoint to get.
   * @returns The waypoint at the given index as an array of three numbers (x, y, z).
   */
  getWaypoint(waypointIndex: number): [number, number, number];

  /**
   * Returns the start position of the player in the current scene.
   * The start position is used in the new game or if player teleports to this scene.
   */
  getStartPos(): [number, number, number];

  /**
   * Returns a scene variable value by its index
   * The scene variables (aka VAR_CUBE) are used by the original game scripts in the scope of the current scene.
   * They reset to their default values when the scene is reloaded (also when navigating between scenes).
   * @param variableIndex The index of the variable to get from 0 to 79
   */
  getVariable(variableIndex: number): number;

  /**
   * Returns a game variable value by its index
   * The game variables (aka VAR_GAME) are used by the original game scripts in the scope of the whole game.
   * They are not reset when the scene is reloaded, or when navigating between scenes.
   *
   * The whole legacy inventory of the game is managed by the game variables, as well as current chapter, and some other game states.
   * @see {@link GameVariables}
   *
   * @param variableIndex The index of the variable to get from 0 to 255
   */
  getGameVariable(variableIndex: number): number;

  /**
   * Sets a start position of the hero
   * The start position is used in the new game or if player teleports to this scene.
   */
  setStartPos(pos: [number, number, number]): void;

  /**
   * Sets a scene variable value by its index.
   *
   * @warning
   * You should not use this for your new variables in the mods. Use the javascript variables instead:
   * - Use {@link useSceneStore} to create and manage your IdaJS scene-specific mod variables.
   *
   * The classic scene variables (aka VAR_CUBE) are used by the original game scripts in the scope of the current scene.
   *
   * They reset to their default values when the scene is reloaded (also when navigating between scenes).
   * @param variableIndex The index of the variable to set from 0 to 79
   * @param value The value to set the variable to, from 0 to 255
   */
  setVariable(variableIndex: number, value: number): void;

  /**
   * Sets a game variable value by its index.
   *
   *
   * @warning
   * Only use it to read / set inventory and existing LBA game variables in order to integrate your mod with the rest of the game.
   *
   * Do not create new game variables for your mod, using this function! Use the javascript store variables instead to persist your mod state.
   * - Use {@link useGameStore} to create and manage your IdaJS game variables.
   *
   * The classic game variables (aka VAR_GAME) are used by the original game scripts in the scope of the whole game.
   * They are not reset when the scene is reloaded, or when navigating between scenes.
   *
   * The whole legacy inventory of the game is managed by the game variables, as well as current chapter, and some other game states.
   * @see {@link GameVariables}
   *
   * @param variableIndex The index of the variable to set from 0 to 255
   * @param value The value to set the variable to, from -32,768 to 32,767
   */
  setGameVariable(variableIndex: number, value: number): void;

  /**
   * Adds one or several new GameObjects (actors) to the scene.
   * The objects will be added at the end of the scene objects list.
   * The objects will be initialized with default values, so you need to set its properties before using it.
   *
   * @param count The number of objects to add. If not specified, it will try to add one object.
   * @returns The id of the first added object. The subsequent objects will have consecutive ids (i.e., firstId + 1, firstId + 2, etc.)
   */
  addObjects(count?: number): number;

  /**
   * Adds one or several new Zones to the scene.
   * The zones will be added at the end of the scene zones list.
   * The zones will be initialized with zeros, so you need to set its properties before using it.
   *
   * @param count The number of zones to add. If not specified, it will try to add one zone.
   * @returns The id of the first added zone. The subsequent zones will have consecutive ids (i.e., firstId + 1, firstId + 2, etc.)
   */
  addZones(count?: number): number;

  /**
   * Adds one or several new waypoints to the scene.
   * The waypoints will be added at the end of the scene waypoints list.
   * The waypoints will be initialized with zeros, so you need to call {@link Scene.updateWaypoint} to set their positions before using them.
   *
   * @param count The number of waypoints to add. If not specified, it will try to add one waypoint.
   * @returns The id of the first added waypoint. The subsequent waypoints will have consecutive ids (i.e., firstId + 1, firstId + 2, etc.)
   */
  addWaypoints(count?: number): number;

  /**
   * Subscribe to beforeLoadScene event. This event is called right before a scene is loaded by any reason.
   *
   * @param event Must be {@link SceneEvents.beforeLoadScene}
   * @param callback The callback that receives the arguments.
   * @param name A name can be given to the event listener to unregister it later.
   */
  addEventListener(
    event: SceneEvents["beforeLoadScene"],
    callback: BeforeLoadSceneCallback,
    name?: string
  ): void;

  /**
   * Subscribe to afterLoadScene event.
   *
   * This is the main entry point for the mod for each particular scene.
   *
   * This event is called right after the scene is fully loaded from SCENE.hqr, but before any previously saved game state is applied.
   *
   * This is called when new game is started, when game is loaded, and also during the game, when you move between scenes.
   *
   * In this call the scene state is allowed to be modified.
   *
   * Use this call to setup everything in your mode: modify scene objects, zones, variables, as if the HQR file itself would have contained the desired modifications.
   *
   * Also in this call you will have to register life handlers, coroutines and do other mod initializations.
   *
   * See Samples for examples of usage of this event.
   *
   * @param event Must be {@link SceneEvents.afterLoadScene}
   * @param callback The callback that receives the arguments.
   * @param name A name can be given to the event listener to unregister it later.
   */
  addEventListener(
    event: SceneEvents["afterLoadScene"],
    callback: AfterLoadSceneCallback,
    name?: string
  ): void;

  /**
   * Subscribe to afterLoadSavedState event.
   *
   * This event is called right after the game is loaded from a save file or a backup state.
   *
   * @warning Only use this if you know what you are doing.
   *
   * This is called only when the game is loaded from a saved state, not when a new game is started or when moving between scenes.
   *
   * If the game is loaded, this is called after {@link SceneEvents.afterLoadScene} event,
   * so at this point, any modifications you might have made to the scene objects, zones, and variables in the {@link SceneEvents.afterLoadScene}, will have been overwritten by the saved game state.
   *
   * @param event Must be {@link SceneEvents.afterLoadSavedState}
   * @param callback The callback of the event
   * @param name A name can be given to the event listener to unregister it later.
   */
  addEventListener(
    event: SceneEvents["afterLoadSavedState"],
    callback: AfterLoadSavedStateCallback,
    name?: string
  ): void;

  /**
   * Unregisters a previously registered event callback.
   */
  removeEventListener(
    event: AllSceneEvents,
    callbackOrName: ((...args: any[]) => void) | string
  ): void;

  /**
   * Returns the first unused zone value (zone number) for the given zone type.
   *
   * The zone value are used in the script commands for sceneric, camera, ladder, and other zones.
   *
   * One zone value can be assigned to one or multiple zones of a particular type, so they act the same way, as a group of zones.
   *
   * @param zoneType The type of the zone to find a free value for
   * @param exceptZoneId The ID of a zone to exclude from the search
   */
  findFreeZoneValue(zoneType: ZoneType, exceptZoneId?: number): number;

  /**
   * Returns the current scene ID.
   */
  getId(): number;

  /**
   * Returns the current island ID.
   */
  getIsland(): number;

  /**
   * Returns the current planet ID.
   */
  getPlanet(): number;

  /**
   * Returns the amount of Gold (Twinsun currency) the hero currently has.
   * @returns The amount of gold in the hero's possession
   */
  getGold(): number;

  /**
   * Returns the amount of Zlitos (Zeelich currency) the hero currently has.
   * @returns The amount of zlitos in the hero's possession
   */
  getZlitos(): number;

  /**
   * Returns the amount of current planet's money the hero has.
   * If the hero is on Twinsun, this returns Gold. If on Zeelich, this returns Zlitos.
   * This is the currency displayed in the main hero menu.
   * @returns The amount of current planet's currency
   */
  getCurrentMoney(): number;

  /**
   * Returns the amount of foreign planet's money the hero has.
   * If the hero is on Twinsun, this returns Zlitos. If on Zeelich, this returns Gold.
   * This currency is displayed as an inventory item.
   * @returns The amount of foreign planet's currency
   */
  getForeignMoney(): number;

  /**
   * Sets the amount of Gold (Twinsun currency) the hero has.
   * @param amount The amount of gold to set
   */
  setGold(amount: number): void;

  /**
   * Sets the amount of Zlitos (Zeelich currency) the hero has.
   * @param amount The amount of zlitos to set
   */
  setZlitos(amount: number): void;

  /**
   * Sets the amount of current planet's money the hero has.
   * If the hero is on Twinsun, this sets Gold. If on Zeelich, this sets Zlitos.
   * This is the currency displayed in the main hero menu.
   * @param amount The amount of current planet's currency to set
   */
  setCurrentMoney(amount: number): void;

  /**
   * Sets the amount of foreign planet's money the hero has.
   * If the hero is on Twinsun, this sets Zlitos. If on Zeelich, this sets Gold.
   * This currency is displayed as an inventory item.
   * @param amount The amount of foreign planet's currency to set
   */
  setForeignMoney(amount: number): void;

  /**
   * Returns the number of the small keys the hero has.
   * To change this value use Life script commands.
   * @returns The number of keys the hero has
   */
  getNumKeys(): number;

  /**
   * Returns the current magic level of the hero.
   * To change this value use Life script commands.
   * @returns The current magic level of the hero
   */
  getMagicLevel(): number;

  /**
   * Returns the current magic points of the hero.
   * To change this value use Life script commands.
   * @returns The current magic points of the hero
   */
  getMagicPoints(): number;

  /**
   * Updates the position of a waypoint in the scene. Any changes to the waypoints are not saved to the saved game file.
   *
   * This function can be used outside of scene setup, during move and life flows.
   * However, if you are using it outside of the scene setup, use it with caution, and make sure to persist any changes in your custom scene variable, if you need them.
   * The updated waypoint coordinate will not be saved to the saved game file automatically.
   *
   * This allows to have dynamic waypoints that can be updated during the game.
   *
   * Be careful to not update waypoints that are used by current running scripts, as it may lead to unexpected behavior.
   *
   * @param id The index of the waypoint to update
   * @param pos The new position of the waypoint as an array of three numbers (x, y, z)
   */
  updateWaypoint(id: number, pos: [number, number, number]): void;

  /**
   * An iterable property that allows iteration over all objects (actors) in the scene.
   * This provides a convenient way to iterate through all scene objects using for...of loops.
   * Also provides length property and [index] operator.
   *
   * @example
   * ```javascript
   * for (const obj of scene.objects) {
   *   console.log(obj.getId());
   * }
   * scene.objects.length; // The same as scene.getNumObjects()
   * scene.objects[0]; // The same as scene.getObject(0)
   * ```
   */
  readonly objects: GameObject[];

  /**
   * An iterable property that allows iteration over all zones in the scene.
   * This provides a convenient way to iterate through all scene zones using for...of loops.
   * Also provides length propery and [index] operator.
   *
   * @example
   * ```javascript
   * for (const zone of scene.zones) {
   *   console.log(zone.getType());
   * }
   * scene.zones.length; // The same as scene.getNumZones()
   * scene.zones[0]; // The same as scene.getZone(0)
   * ```
   */
  readonly zones: Zone[];

  /**
   * An iterable property that allows iteration over all waypoints in the scene.
   * This provides a convenient way to iterate through all scene waypoints using for...of loops.
   * Also provides length propery and [index] operator.
   *
   * @example
   * ```javascript
   * for (const waypoint of scene.waypoints) {
   *   console.log(waypoint); // [x, y, z] coordinates
   * }
   * scene.waypoints.length; // The same as scene.getNumWaypoints()
   * scene.waypoints[0]; // The same as scene.getWaypoint(0)
   * ```
   */
  readonly waypoints: [number, number, number][];

  /**
   * All the possible scene load modes (why the scene is being loaded).
   */
  LoadModes: SceneLoadModes;

  /**
   * Special game variables: vanilla inventory items, chapter, etc.
   * The sceneric game variables, used to control the game state, are not in this enum.
   */
  GameVariables: GameVariables;

  /**
   * All the possible scene events.
   */
  Events: SceneEvents;

  /**
   * Sets an Ida save handler callback to handle saving the game state to a file.
   *
   * @private
   *
   * @warning This is managed by Ida internally. Only use this function, if you know what you are doing.
   * @param callback The callback that receives isBackupSave as an argument.
   *
   * - If isBackupSave is false, the callback should return a json string representing the game state to be saved.
   * - If isBackupSave is true, the callback should save the backup state internally, and is not expected to return anything.
   */
  _setSaveHandler(callback: (isBackupSave: boolean) => string | void): void;

  /**
   * Sets an Ida load handler callback to handle loading the game state from a json string.
   *
   * @private
   * @warning This is managed by Ida internally. Only use this function, if you know what you are doing.
   */
  _setLoadHandler(callback: (json: string) => void): void;
}
