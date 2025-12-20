import type { FlagsHandler } from "./flagsHandler";
import type { EnumHandler } from "./enumHandler";
import type { SceneEvents } from "./scene";
import type { LifeOpcodes, LifeFunctions } from "./ida";

/**
 * The string => number enum object, containing LBA2 Dialog colors.
 *
 * @globalAccess {@link text.Colors}.
 */
export interface DialogColors {
  /**
   * Cinematic Purple (#7C00DC)
   */
  readonly CinematicPurple: 0;
  /**
   * Cocoa Brown (#80583C)
   */
  readonly CocoaBrown: 1;
  /**
   * Pale Sand (#E8D8A8)
   */
  readonly PaleSand: 2;
  /**
   * Light Gray (#B8B8B4)
   */
  readonly LightGray: 3;
  /**
   * Zoe Red (#D46460), aka Zoe color
   */
  readonly ZoeRed: 4;
  /**
   * Peach (#F8B890)
   */
  readonly Peach: 5;
  /**
   * Goldenrod (#F4C46C)
   */
  readonly Goldenrod: 6;
  /**
   * Sage Green (#98A878)
   */
  readonly SageGreen: 7;
  /**
   * Mint Green (#74B47C)
   */
  readonly MintGreen: 8;
  /**
   * Teal Green (#40A488)
   */
  readonly TealGreen: 9;
  /**
   * Seafoam (#44ACB0)
   */
  readonly Seafoam: 10;
  /**
   * Dusty Blue (#749CA0)
   */
  readonly DustyBlue: 11;
  /**
   * Twinsen Blue (#64A4C8), aka Twinsen color
   */
  readonly TwinsenBlue: 12;
  /**
   * Lavender Gray (#A098AC)
   */
  readonly LavenderGray: 13;
  /**
   * Warm Taupe (#B0A4A0)
   */
  readonly WarmTaupe: 14;
  /**
   * Cinematic White Gold (#FCFCFC)
   */
  readonly CinematicWhiteGold: 15;

  /** Handler functions for this enum object */
  readonly $: EnumHandler;
}

/**
 * Number type, representing all dialog colors values.
 * @see {@link DialogColors}
 */
export type DialogColor = DialogColors[keyof Omit<DialogColors, "$">];

/**
 * Flags for the LBA2 dialog display.
 *
 * @globalAccess {@link text.Flags}.
 */
export interface TextFlags {
  /** Default dialog. */
  readonly DialogDefault: 0x01;

  /** Full screen dialog. */
  readonly DialogBig: 0x02;

  /** Full screen dialog, but without frame. */
  readonly DialogBigNoFrame: 0x04;

  /** Say something in place (above character, non-blocking). */
  readonly DialogSay: 0x08;

  /**
   * Dialog with an image. Adds an image to the dialog:
   *
   * Baldino by default, or custom sprite if defined.
   * Also, it will display Zoe sprite, if the text color is set to {@link DialogColors.ZoeRed},
   */
  readonly DialogRadio: 0x20;

  /** Explaining inventory item. */
  readonly DialogExplainInventory: 0x40;

  /**
   * Contains helper methods to read and modify the flags.
   */
  readonly $: FlagsHandler;
}

/**
 * Full definition of the text you would like to display in a dialog.
 */
export interface TextObject {
  /**
   * The text to display. Your text should be an UTF-8 string, but using only the characters supported by the LBA2 classic game font.
   *
   * It means extended latin, like French, Spanish, German accented and special characters are supported at the moment, but not, for example, Cyrillic, Baltic, Greek or Asian characters.
   *
   * The text string also supports special control sequences:
   * - `\n` - line break
   * - `@` - line break with space
   * - `@P` - page break.
   *
   * Additional special characters supported:
   * - ← - a left arrow
   * - ✓ - LBA "ok" symbol
   * - © - a copyright symbol
   * - ™ - a trademark symbol
   */
  text: string;

  /** The dialog flags. Default will be used if not defined. */
  flags?: number | undefined;

  /**
   * The main 16-colors dialog color.
   * Default will be used if not defined.
   *
   * @see {@link DialogColors}
   */
  color?: DialogColor | undefined;

  /**
   * If you don't specify the main color, you can specify the 256-color range color here to have wider variety.
   */
  color256Start?: number | undefined;

  /**
   * If you specified the color256Start, you can also specify the color256End to have an animated color effect on the text.
   */
  color256End?: number | undefined;

  /**
   * The custom sprite to display. Expected a Unix path, relative to `media/sprites` folder in the mod.
   *
   * For example if it's `yourmod\media\sprites\my.png`, the string here should be just `my.png`.
   * If it's `yourmod\media\sprites\subfolder\my.png`, it should be `subfolder/my.png`.
   *
   * The sprite image format must be png. The sprite width and height can be up to 255 pixels each, but the standard dialog sprite size game uses is 147x125.
   *
   * You will also have to call {@link ida.useImages} function in the top of your mod script, to enable custom image support.
   */
  sprite?: string | undefined;

  /**
   * The X offset of the sprite on the screen.
   *
   * 485 by default, which corresponds to normal small dialog position.
   */
  x?: number | undefined;

  /**
   * The Y offset of the sprite on the screen.
   *
   * 342 by default, which corresponds to normal small dialog position.
   */
  y?: number | undefined;
}

/**
 * The user can specify the text entity in various forms, from just a string, to a full object.
 *
 * This is a union type that covers all the possible ways to define a text entity.
 *
 * - string - just a plain text with all the rest is default
 * The text supports: `\n` - line break, special word `@` - line break with space, special word `@P` - page break.
 * - [string]: just a plain text with all the rest is default
 * - [string, number]: [text, {@link TextFlags}]
 * - [string, number, {@link DialogColor}]: [text, {@link TextFlags}, color]
 * - [string, number, {@link DialogColor}, string]: [text, {@link TextFlags}, color, sprite]
 * - [string, number, {@link DialogColor}, string, number]: [text, {@link TextFlags}, color, sprite, spriteOffsetX]
 * - [string, number, {@link DialogColor}, string, number, number]: [text, {@link TextFlags}, color, sprite, spriteOffsetX, spriteOffsetY]
 * - {@link TextObject}: full definition of what you would like to display in a dialog
 *
 * @see {@link TextObject} - for documentation about DialogColors, flags, sprite, offsets, etc.
 */
export type UserText =
  | string // Just a plain text with all the rest is default
  | [string] // Just a plain text with all the rest is default
  | [string, number] // [text, flags]
  | [string, number, DialogColor] // [text, flags, color]
  | [string, number, DialogColor, string] // [text, flags, color, sprite]
  | [string, number, DialogColor, string, number] // [text, flags, color, sprite, spriteOffsetX]
  | [string, number, DialogColor, string, number, number] // [text, flags, color, sprite, spriteOffsetX, spriteOffsetY]
  | TextObject; // Full definition of what you would like to display in a dialog

/**
 * A function that returns a {@link UserText} entity.
 *
 * Can be passed instead of {@link UserText} to provide dynamic text content, that depends on some conditions.
 *
 * This is not needed in the life handlers, since there you already can use {@link text.update} on every call to change the text dynamically.
 *
 * This is useful for the text zones on the scene, since the text zone can be only setup with the text ID once in the {@link SceneEvents.afterLoadScene} event, but then it returns the same text always. To make it more dynamic (for example, display a randomized text), create a text entity with this function instead.
 */
export type UserTextFunction = () => UserText;

/**
 * The global {@link text} object API to provide the custom dialogs in IdaJS mod.
 */
export interface TextApi {
  /**
   * Flags for dialog text display.
   */
  Flags: TextFlags;

  /**
   * The string => number "enum", containing Dialog colors.
   */
  Colors: DialogColors;

  /**
   * Register a new text entity and return its text ID.
   * @param textEntity The text entity content. Empty string by default.
   * @returns The new text ID, that can be used in text zones or scripts.
   *
   * NB. If you want to use custom text in the life handlers, you should create just one text entity Id in the {@link SceneEvents.afterLoadScene} event, using this create function, store its Id to a variable, and then reuse it, by calling {@link text.update} function.
   */
  create(textEntity?: UserText | UserTextFunction): number;

  /**
   * Update a registered text entity by its text ID.
   *
   * Use this in the life handlers. Create a dedicated text entity for life scripts once with {@link text.create} in the {@link SceneEvents.afterLoadScene} event, and then update its content dynamically in the life scripts with this function, each time you need to display some dialog.
   *
   * @param textId The text ID of the entity you created with {@link text.create}.
   * @param textEntity The new text entity content.
   * @returns The text ID.
   */
  update(textId: number, textEntity: UserText | UserTextFunction): number;

  /**
   * Replace an existing LBA game text entity by IdaJS controlled text.
   *
   * Leave the text empty to use the original game text, but change other parameters.
   *
   * If you also specify a custom text, you must specify the flags as well, or they will be set to default.
   *
   * @param textId The text ID of the original game. See original game life scripts to see which text IDs are used in which situations, or read the Text.hqr file in an HQR editor.
   * @param textEntity The text entity content to replace the original game text with.
   * @returns The text ID
   */
  replace(textId: number, textEntity: UserText | UserTextFunction): number;

  /**
   * Restore a game text entity to its original state.
   * @param textId The text ID
   * @returns The text ID
   */
  restore(textId: number): number;

  /**
   * A helper function that creates 10 text entities and returns their IDs in an array.
   * This is useful for implementing dialog choices, where you need to have multiple text entities on the screen.
   *
   * @see
   *
   * - See the Bathroom or Storm samples for examples, on how to use custom dialog choices.
   * - Use {@link LifeOpcodes.LM_ADD_CHOICE}, {@link LifeOpcodes.LM_ASK_CHOICE}, {@link LifeOpcodes.LM_ASK_CHOICE_OBJ }, {@link LifeFunctions.LF_CHOICE} to create choice-based dialogs in life scripts.
   *
   * @returns An array of text IDs, that can be used in the dialog choices life calls.
   */
  createChoices(): number[];

  /**
   * Reset all the text data.
   * @private
   *
   * @warning This is an internal method. Only call it if you know what you are doing.
   */
  _reset(): void;
}
