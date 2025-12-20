import type { EnumHandler } from "./enumHandler";
import type { FlagsHandler } from "./flagsHandler";

/**
 * Interface for dialog spy information returned by getDialogSpyInfo()
 */
export interface DialogSpyInfo {
  /**
   * The text content of the dialog
   */
  text: string;

  /**
   * The dialog flags (like DialogDefault, DialogRadio, etc.)
   */
  flags: number;

  /**
   * The minimum color value for the dialog
   */
  minColor: number;

  /**
   * The maximum color value for the dialog
   */
  maxColor: number;

  /**
   * The sprite ID for the dialog
   */
  spriteId: number;

  /**
   * The X offset for the sprite
   */
  spriteXOfs: number;

  /**
   * The Y offset for the sprite
   */
  spriteYOfs: number;

  /**
   * The sprite bytes for the dialog
   */
  spriteBytes: Uint8Array;
}

export interface ImageSpyInfo {
  /**
   * The effect ID of the spied image.
   */
  effectId: number;

  /**
   * The byte data of the spied PCX image.
   */
  imageBytes: Uint8Array;

  /**
   * The byte data of the spied PCX image palette.
   */
  paletteBytes: Uint8Array;
}

/**
 * Game loop types
 *
 * @globalAccess {@link mark.GameLoops}.
 */
export interface GameLoops {
  readonly None: 0;
  readonly GameMenu: 1;
  readonly Game: 2;
  readonly $: EnumHandler;
}

export type GameLoop = GameLoops[keyof Omit<GameLoops, "$">];

/**
 * Input flags for game controls
 *
 * @globalAccess {@link mark.InputFlags}.
 */
export interface InputFlags {
  readonly UP: 1; // Move Forward
  readonly DOWN: 2; // Move Backward
  readonly LEFT: 4; // Turn Left
  readonly RIGHT: 8; // Turn Right
  readonly THROW: 16; // Use Weapon
  readonly BEHAVIOR: 32; // Behavior Menu
  readonly INVENTORY: 64; // Inventory
  readonly ACTION_MODAL: 128; // Behavior Action
  readonly ACTION_ALWAYS: 256; // Dialogue/Search
  readonly RETURN: 512; // Camera Recenter
  readonly MENUS: 1024; // Menus
  readonly HOLOMAP: 2048; // Holomap
  readonly PAUSE: 4096; // Pause
  readonly DODGE: 8192; // Dodge
  readonly NORMAL: 16384; // Normal Behavior
  readonly ATHLETIC: 32768; // Athletic Behavior
  readonly AGGRESSIVE: 65536; // Aggressive Behavior
  readonly DISCREET: 131072; // Discreet Behavior
  readonly HELP: 262144; // Online Help
  readonly SAVE: 524288; // Save
  readonly LOAD: 1048576; // Load
  readonly OPTIONS: 2097152; // Options Menu
  readonly CAMERA: 4194304; // Rotate Camera
  readonly CAMERA_LEVEL_UP: 8388608; // Next Camera Level
  readonly CAMERA_LEVEL_DOWN: 16777216; // Previous Camera Level
  readonly WEAPON_1: 33554432; // Weapon 1 (Magic Ball)
  readonly WEAPON_2: 67108864; // Weapon 2 (Magic Ball)
  readonly WEAPON_3: 134217728; // Weapon 3 (Magic Ball)
  readonly WEAPON_4: 268435456; // Weapon 4 (Magic Ball)
  readonly WEAPON_5: 536870912; // Weapon 5 (Magic Ball)
  readonly WEAPON_6: 1073741824; // Weapon 6 (Magic Ball)
  readonly WEAPON_7: 2147483648; // Weapon 7 (Magic Ball)
  readonly $: FlagsHandler;
}

/**
 * The global 'mark' object provides access to LBA2 application control functions, that can be used in the automated tests.
 *
 * @warning
 * Those functions should not be used in the modding, as they are not part of the game API.
 */
export interface Mark {
  /**
   * Exits the process with the specified exit code.
   * Prefer using @see{@link exit} instead, as it provides a more controlled way to exit the game.
   * @param exitCode The exit code to use when terminating the process.
   */
  exitProcess(exitCode: number): void;

  /**
   * Exits the game with an optional exit code.
   * Can only be called when in the main menu.
   * @param exitCode Optional exit code (0-255). Defaults to 0 if not provided.
   */
  exit(exitCode?: number): void;

  /**
   * Starts a new game.
   * Can only be called when in the main menu.
   */
  newGame(): void;

  /**
   * Saves the current game with the specified save name.
   * Can only be called when in the main menu.
   * @param saveName The name for the save game (maximum 100 characters).
   */
  saveGame(saveName: string): void;

  /**
   * Loads a saved game with the specified save name.
   * Can only be called when in the main menu.
   * @param saveName The name of the save game to load (maximum 100 characters).
   */
  loadGame(saveName: string): void;

  /**
   * Skips the next video that would be played.
   */
  skipVideoOnce(): void;

  /**
   * Sets a game input to be processed once on the next frame.
   * @param input The input flags to set.
   * @see {@link Mark.InputFlags} for available input flag values.
   */
  setGameInputOnce(input: number): void;

  /**
   * Gets the current game loop type.
   * @returns The current game loop type.
   * @see {@link Mark.GameLoops} for comparison values.
   */
  getGameLoop(): GameLoop;

  /**
   * Checks if hot reload is currently enabled.
   * @returns true if hot reload is enabled, false otherwise.
   */
  isHotReloadEnabled(): boolean;

  /**
   * Disables javascript hot reload functionality when the game is reloaded.
   * Usefull to run tests.
   */
  disableHotReload(): void;

  /**
   * Enables javascript hot reload when the game is reloaded.
   * A default setting in game mode.
   */
  enableHotReload(): void;

  /**
   * Starts dialog spying for the specified duration. When the time is up, the dialog will be automatically closed.
   * @param timeMs The time in milliseconds to display the dialog.
   */
  doDialogSpy(timeMs: number): void;

  /**
   * Gets information about the last dialog that was spied on.
   * @returns An object containing dialog information including text, flags, and color values.
   */
  getDialogSpyInfo(): DialogSpyInfo;

  /**
   * Enables image spying for the specified duration. When the time is up, the image will be automatically closed.
   * @param timeMs The time in milliseconds to display the image
   */
  doImageSpy(timeMs: number): void;

  /**
   * Gets information about the last image that was spied on.
   * @returns An object containing image information including effect ID and byte data.
   */
  getImageSpyInfo(): ImageSpyInfo;

  /**
   * Game loop types for comparing with getGameLoop() results
   */
  GameLoops: GameLoops;

  /**
   * Input flags for use with setGameInputOnce()
   */
  InputFlags: InputFlags;
}
