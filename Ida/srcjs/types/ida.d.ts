import type { EnumHandler } from "./enumHandler";
import type { ControlModes, TwinsenStances } from "./objectHelper";
import type { PaletteAlgorithm, GameVideos, GamePictures, PaletteAlgorithms } from "./image";
import type { GameObject } from "./gameObject";
import type {
  CoroutineFunction,
  startCoroutine,
  stopCoroutine,
  pauseCoroutine,
  unpauseCoroutine,
  registerCoroutine,
  doMove,
} from "./global";

/**
 * Log level options for {@link Ida.setLogLevel}
 *
 * @globalAccess {@link ida.LogLevels}
 */
export interface LogLevels {
  readonly Debug: 0;

  /** (Default) */
  readonly Info: 1;

  readonly Warning: 2;
  readonly Error: 3;
  readonly None: 4;
  readonly $: EnumHandler;
}

/**
 * Log level number
 * @see {@link LogLevels}
 */
export type LogLevel = LogLevels[keyof Omit<LogLevels, "$">];

/**
 * LBA2 Life script opcodes, available in IdaJS.
 *
 * Life opcodes are available in javascript through {@link ida.Life} enum object.
 * Life opcodes can be called using {@link ida.life} function.
 *
 * Life opcodes documentation has special types notation for numeric arguments and return values:
 * - u8 - unsigned 8-bit integer (from 0 to 255)
 * - u16 - unsigned 16-bit integer (from 0 to 65535)
 * - i16 - signed 16-bit integer (from -32768 to 32767)
 * - pc16 - 16-bit signed offset (little-endian) used as a jump destination, absolute
 * - u32 - unsigned 32-bit integer (from 0 to 4294967295)
 *
 * @globalAccess {@link ida.Life}
 */
export interface LifeOpcodes {
  /** Switches the game's palette.
   * @param palette: u8 */
  readonly LM_PALETTE: 0x0a;

  /** Changes the model of the actor.
   * @param model: u8 */
  readonly LM_BODY: 0x11;

  /** Changes the model of another actor.
   * @param actor: u8
   * @param model: u8 */
  readonly LM_BODY_OBJ: 0x12;

  /** Changes the animation of the actor.
   * @param animation: u16 */
  readonly LM_ANIM: 0x13;

  /** Changes the animation of another actor.
   * @param actor: u8
   * @param anim: u16 */
  readonly LM_ANIM_OBJ: 0x14;

  /** Enables or disables a camera zone.
   * @param zone: u8
   * @param flag: u8 */
  readonly LM_SET_CAMERA: 0x15;

  /** Recentres camera.
   * @param angle_adjust: u8 */
  readonly LM_CAMERA_CENTER: 0x16;

  /** Changes this actor's move script track.
   * @param track: i16 */
  readonly LM_SET_TRACK: 0x17;

  /** Changes another actor's move script track.
   * @param actor: u8
   * @param track: i16 */
  readonly LM_SET_TRACK_OBJ: 0x18;

  /** Says a line of dialogue.
   * @param index: i16 */
  readonly LM_MESSAGE: 0x19;

  /** Sets whether actor can fall.
   * @param fall_type: u8 */
  readonly LM_FALLABLE: 0x1a;

  /** Sets this actor's movement mode (Original: LM_SET_DIR).
   * An optional target parameter is needed if mode is one of the following:
   * @param mode: u8 - {@link ControlModes}
   * @param target?: u8 */
  readonly LM_SET_CONTROL: 0x1b;

  /** Sets another actor's movement mode (Original: LM_SET_DIR_OBJ).
   * An optional target parameter is needed if mode is one of the following:
   * @param actor: u8
   * @param mode: u8 - {@link ControlModes}
   * @param target?: u8 */
  readonly LM_SET_CONTROL_OBJ: 0x1c;

  /** Make camera follow an actor.
   * @param actor: u8 */
  readonly LM_CAM_FOLLOW: 0x1d;

  /** Set Twinsen's stance.
   * @param mode: u8 - {@link TwinsenStances} */
  readonly LM_COMPORTEMENT_HERO: 0x1e;

  /** Jumps to a new behaviour block.
   * @param offset: pc16 */
  readonly LM_SET_COMPORTEMENT: 0x21;

  /** Changes the active behaviour of another actor.
   * @param actor: u8
   * @param off: pc16 */
  readonly LM_SET_COMPORTEMENT_OBJ: 0x22;

  /** Kills the given actor.
   * @param actor: u8 */
  readonly LM_KILL_OBJ: 0x25;

  /** Disables this actor from the scene completely.
   * No visuals, collisions, scripts or any other interactions will appear to this actor until the scene restarts.
   */
  readonly LM_SUICIDE: 0x26;

  /** Subtracts one key from the inventory. */
  readonly LM_USE_ONE_LITTLE_KEY: 0x27;

  /** Takes money from Twinsen.
   * @param quantity: i16 */
  readonly LM_GIVE_GOLD_PIECES: 0x28;

  /** Ends the LBA life script execution for this actor.
   * Note, that the Ida life script execution will continue if it's setup
   */
  readonly LM_END_LIFE: 0x29;

  /** Saves the move script track to a hidden variable. */
  readonly LM_STOP_L_TRACK: 0x2a;

  /** Restores the move script track from the hidden variable. */
  readonly LM_RESTORE_L_TRACK: 0x2b;

  /** Another actor says a line of dialogue.
   * @param actor: u8
   * @param message: i16 */
  readonly LM_MESSAGE_OBJ: 0x2c;

  /** Display the "found object" overlay.
   * @param object: u8 */
  readonly LM_FOUND_OBJECT: 0x2e;

  /** Immediately shifts this door to the West (cpp name: LM_SET_DOOR_LEFT)
   * @param distance: i16 */
  readonly LM_SET_DOOR_WEST: 0x2f;

  /** Immediately shifts this door to the East (cpp name: LM_SET_DOOR_RIGHT)
   * @param distance: i16 */
  readonly LM_SET_DOOR_EAST: 0x30;

  /** Immediately shifts this door to the North (cpp name: LM_SET_DOOR_UP)
   * @param distance: i16 */
  readonly LM_SET_DOOR_NORTH: 0x31;

  /** Immediately shifts this door to the South (cpp name: LM_SET_DOOR_DOWN)
   * @param distance: i16 */
  readonly LM_SET_DOOR_SOUTH: 0x32;

  /** Gives this actor's bonus items.
   * @param remove: u8 */
  readonly LM_GIVE_BONUS: 0x33;

  /** Move to a different scene.
   * @param scene: u8 */
  readonly LM_CHANGE_CUBE: 0x34;

  /** Enables or disables object/actor collisions for this actor.
   * @param enabled: u8 */
  readonly LM_OBJ_COL: 0x35;

  /** Enables or disables terrain collisions for this actor.
   * @param collision_type: u8 */
  readonly LM_BRICK_COL: 0x36;

  /** Makes the actor invisible or visible again.
   * @param invisible: u8 */
  readonly LM_INVISIBLE: 0x38;

  /** Enables or disables the shadow for another actor.
   * @param actor: u8
   * @param enabled: u8 */
  readonly LM_SHADOW_OBJ: 0x39;

  /** Moves this actor to a point.
   * @param point: u8 */
  readonly LM_POS_POINT: 0x3a;

  /** Sets Twinsen's magic level.
   * @param level: u8 */
  readonly LM_SET_MAGIC_LEVEL: 0x3b;

  /** Drains some of Twinsen's mana.
   * @param quantity: u8 */
  readonly LM_SUB_MAGIC_POINT: 0x3c;

  /** Sets the health of an actor.
   * @param actor: u8
   * @param value: u8 */
  readonly LM_SET_LIFE_POINT_OBJ: 0x3d;

  /** Subtracts health from another actor.
   * @param actor: u8
   * @param points: u8 */
  readonly LM_SUB_LIFE_POINT_OBJ: 0x3e;

  /** Deals damage to another actor, caused by this actor.
   * @param victim: u8
   * @param damage: u8 */
  readonly LM_HIT_OBJ: 0x3f;

  /**
   * Plays the named cutscene video.
   *
   * @see {@link GameVideos} to use the vanilla game videos.
   *
   * @param name: char[] - the name of the video file to play.
   * */
  readonly LM_PLAY_ACF: 0x40;

  /**
   * Display a lightning flash for some amount of deciseconds. Usefull, for example, to create weather changing effects.
   * This is also used by game scripts on Citadel island to display lightning during the stormy weather.
   *
   * @param duration: u8 - duration in deciseconds
   *
   * @see
   * - {@link ida.enableLightning} and {@link ida.disableLightning} to disable or re-enable the effect of this command.
   */
  readonly LM_ECLAIR: 0x41;

  /** Gives Twinsen another clover box. */
  readonly LM_INC_CLOVER_BOX: 0x42;

  /** Use inventory item.
   * @param item: u8 */
  readonly LM_SET_USED_INVENTORY: 0x43;

  /** Adds choice to the next ask.
   *
   * The first choice added will become default one (in the case the dialog is closed by Esc key or similar).
   *
   * @param message: i16 */
  readonly LM_ADD_CHOICE: 0x44;

  /** Says a line of dialogue and offers choices.
   * @param message: i16 */
  readonly LM_ASK_CHOICE: 0x45;

  /** Sets up Twinsen's car.
   * @param flag: u8 */
  readonly LM_INIT_BUGGY: 0x46;

  /** Adds a picture to the memo slate.
   * @param picture: u8 */
  readonly LM_MEMO_ARDOISE: 0x47;

  /** Adds a marker to the holomap.
   * @param marker: u8 */
  readonly LM_SET_HOLO_POS: 0x48;

  /** Removes a marker from the holomap.
   * @param marker: u8 */
  readonly LM_CLR_HOLO_POS: 0x49;

  /** Enables or disables a terrain chunk.
   * @param zone: u8
   * @param enable: u8 */
  readonly LM_SET_GRM: 0x4c;

  /** Enables or disables a teleport zone.
   * @param zone: u8
   * @param flag: u8 */
  readonly LM_SET_CHANGE_CUBE: 0x4d;

  /** Says a line using Zoe's parameters (like dialog color).
   * @param message: i16 */
  readonly LM_MESSAGE_ZOE: 0x4e;

  /** Restores Twinsen's health, mana and healing horn. */
  readonly LM_FULL_POINT: 0x4f;

  /** Rotates actor.
   * @param angle: i16 */
  readonly LM_BETA: 0x50;

  /** Fades to the given palette.
   * @param palette: u8 */
  readonly LM_FADE_TO_PAL: 0x51;

  /** Triggers Twinsen's action (like pressing the Z key). */
  readonly LM_ACTION: 0x52;

  /** Changes the frame number of this actor's animation.
   * @param frame: u8 */
  readonly LM_SET_FRAME: 0x53;

  /** Changes the sprite used for this actor.
   * @param sprite: u8 */
  readonly LM_SET_SPRITE: 0x54;

  /** Changes the frame number of this actor's animated sprite.
   * @param frame: u8 */
  readonly LM_SET_FRAME_3DS: 0x55;

  /** Plays an impact animation above an actor.
   * @param actor: u8
   * @param anim: i16
   * @param yoffset: i16 */
  readonly LM_IMPACT_OBJ: 0x56;

  /** Plays an impact animation at a point.
   * @param point: u8
   * @param anim: i16 */
  readonly LM_IMPACT_POINT: 0x57;

  /** Enables or disables use of speech balloons.
   * @param enable: u8 */
  readonly LM_BULLE: 0x59;

  /** Enables or disables ignoring hits/damage to this actor.
   * @param enable: u8 */
  readonly LM_NO_CHOC: 0x5a;

  /** Another actor says a line of dialogue and offers choices.
   * @param actor: u8
   * @param message: i16 */
  readonly LM_ASK_CHOICE_OBJ: 0x5b;

  /** Enables or disables cutscene mode.
   * @param enable: u8 */
  readonly LM_CINEMA_MODE: 0x5c;

  /** Saves Twinsen's stance to a hidden variable. */
  readonly LM_SAVE_HERO: 0x5d;

  /** Restores Twinsen's stance from a hidden variable. */
  readonly LM_RESTORE_HERO: 0x5e;

  /** Sets this actor's animation.
   * @param anim: u16 */
  readonly LM_ANIM_SET: 0x5f;

  /** Makes it rain for some amount of deciseconds. Use, for example, to create weather changing effects.
   * @param duration: u8 - duration in deciseconds */
  readonly LM_PLUIE: 0x60;

  /** Kills Twinsen and ends the game. */
  readonly LM_GAME_OVER: 0x61;

  /** Ends the game and shows the credits. */
  readonly LM_THE_END: 0x62;

  /** Enables or disables a conveyor zone.
   * @param zone: u8
   * @param flag: u8 */
  readonly LM_ESCALATOR: 0x63;

  /** Plays a music track.
   * @param track: u8 */
  readonly LM_PLAY_MUSIC: 0x64;

  /** Saves this actor's move script track to a game variable.
   * @param var: u8 */
  readonly LM_TRACK_TO_VAR_GAME: 0x65;

  /** Sets this actor's move script track from a game variable.
   * @param var: u8 */
  readonly LM_VAR_GAME_TO_TRACK: 0x66;

  /** Enable or disable texture animation.
   * @param enable: u8 */
  readonly LM_ANIM_TEXTURE: 0x67;

  /** Ends the game without displaying the credits. */
  readonly LM_BRUTAL_EXIT: 0x69;

  /** Enables or disables a ladder zone.
   * @param zone: u8
   * @param enable: u8 */
  readonly LM_ECHELLE: 0x6b;

  /** Sets this actor's armour value.
   * @param armour: u8 */
  readonly LM_SET_ARMURE: 0x6c;

  /** Sets the armour value of another actor.
   * @param actor: u8
   * @param obj: u8 */
  readonly LM_SET_ARMURE_OBJ: 0x6d;

  /** Adds health to another actor.
   * @param actor: u8
   * @param life: u8 */
  readonly LM_ADD_LIFE_POINT_OBJ: 0x6e;

  /** Changes the state/variant of an inventory object.
   * @param item: u8
   * @param state: u8 */
  readonly LM_STATE_INVENTORY: 0x6f;

  /** Enables or disables a spike/trap zone.
   * @param zone: u8
   * @param damage: u8 */
  readonly LM_SET_HIT_ZONE: 0x77;

  /** Saves this actor's behaviour index to a hidden variable. */
  readonly LM_SAVE_COMPORTEMENT: 0x78;

  /** Restores this actor's behaviour from the hidden variable. */
  readonly LM_RESTORE_COMPORTEMENT: 0x79;

  /** Plays a sound sample coming from this actor.
   * @param sample: i16 */
  readonly LM_SAMPLE: 0x7a;

  /** Like SAMPLE but randomly alters the sample's frequency.
   * @param sample: i16 */
  readonly LM_SAMPLE_RND: 0x7b;

  /** Like SAMPLE but plays the sample continuously.
   * @param sample: i16 */
  readonly LM_SAMPLE_ALWAYS: 0x7c;

  /** Stops the given sample if it is playing from this actor.
   * @param sample: i16 */
  readonly LM_SAMPLE_STOP: 0x7d;

  /** Like SAMPLE but plays the given number of repeats.
   * @param sample: i16
   * @param count: u8 */
  readonly LM_REPEAT_SAMPLE: 0x7e;

  /** Sets or clears the "background" (don't redraw) flag for this actor.
   * @param flag: u8 */
  readonly LM_BACKGROUND: 0x7f;

  /** Enables or disables a rail zone.
   * @param zone: u8
   * @param enable: u8 */
  readonly LM_SET_RAIL: 0x85;

  /** Rotates the actor to face the opposite direction. */
  readonly LM_INVERSE_BETA: 0x86;

  /** Hides the model for this actor. */
  readonly LM_NO_BODY: 0x87;

  /** Gives money to Twinsen.
   * @param quantity: i16 */
  readonly LM_ADD_GOLD_PIECES: 0x88;

  /** Saves the move script track of another actor to a hidden variable.
   * @param actor: u8 */
  readonly LM_STOP_L_TRACK_OBJ: 0x89;

  /** Restores the move script track of another actor from the hidden variable.
   * @param actor: u8 */
  readonly LM_RESTORE_L_TRACK_OBJ: 0x8a;

  /** Saves the life script behaviour of another actor to a hidden variable.
   * @param actor: u8 */
  readonly LM_SAVE_COMPORTEMENT_OBJ: 0x8b;

  /** Restores the life script behaviour of another actor from a hidden variable.
   * @param actor: u8 */
  readonly LM_RESTORE_COMPORTEMENT_OBJ: 0x8c;

  /** Displays a particle animation at a point.
   * @param point: u8
   * @param flow: u8 */
  readonly LM_FLOW_POINT: 0x91;

  /** Displays a particle animation on an actor.
   * @param actor: u8
   * @param flow: u8 */
  readonly LM_FLOW_OBJ: 0x92;

  /** Sets the animation to use when talking.
   * @param anim: u16 */
  readonly LM_SET_ANIM_DIAL: 0x93;

  /** Displays a full-screen image.
   * @param image: u8 - id of the image to display (from SCREEN.HQR, vanilla images have numbers 0..38)
   * @param effect: u8 (0 or 1) - effect to apply (0 - fade, 1 - venetian blinds, but 1 doesn't really work good, so use 0)
   *
   * @see
   * - {@link GamePictures} to use the vanilla game images.
   * - {@link image} to display custom images here.
   */
  readonly LM_PCX: 0x94;

  /** Configures audio sample parameters.
   * @param freq: i16
   * @param vol: u8
   * @param fbase: i16 */
  readonly LM_PARM_SAMPLE: 0x97;

  /** Plays an audio sample on this actor with custom parameters.
   * @param sample: i16
   * @param f: i16
   * @param v: u8
   * @param fb: i16 */
  readonly LM_NEW_SAMPLE: 0x98;

  /** Positions an actor on or near another actor.
   * @param move_actor: u8
   * @param dest: u8 */
  readonly LM_POS_OBJ_AROUND: 0x99;

  /**
   * Show a dialog message on a still image background.
   *
   * - NOTE1: Only images that use LBA2 palette will work good with the dialogs. Some images from SCREEN.HQR are not supposed to work with dialogs, so the colors will be displayed broken.
   * If you use a custom image, please import it using LBA palette.
   *
   * - NOTE2: use the Big dialog flags for the messages in this mode. The small messages might work not good, showing scene actors on top of image.
   * If you want to try a small message, try hiding all the actors in the view by {@link LifeOpcodes.LM_INVISIBLE} command.
   * This doesn't, however, always work.
   *
   * @param img: u8 - id of image to display (from SCREEN.HQR, vanilla images have numbers 0..38)
   * @param fx: u8 - effect (0 - fade or 1 - venetian blinds, but 1 doesn't really work good, so use 0)
   * @param act: u8 - actor id for the dialog message
   * @param msg: i16 - dialog message id, custom dialog is allowed
   *
   * @see
   * - {@link ida.useImages} to import the custom images, allowing to specify the LBA palette.
   * - {@link LifeOpcodes.LM_INVISIBLE}
   * - {@link LifeOpcodes.LM_BULLE}
   * - {@link GamePictures} to use the vanilla game images.
   * - {@link image} to display custom images here.
   * - {@link text} to display custom dialog here.
   */
  readonly LM_PCX_MESS_OBJ: 0x9a;

  /** Contains enum operations for this enum object */
  readonly $: EnumHandler;
}

/**
 * Storm control options for {@link ida.setStorm}
 *
 * @globalAccess {@link ida.StormModes}
 */
export interface StormModes {
  /** Default game behavior - storm is there based on LBA game variables state */
  readonly None: 0;
  /** Forces the storm to be active, no matter LBA game variables state */
  readonly ForceStorm: 1;
  /** Forces the storm to be inactive, no matter LBA game variables state */
  readonly ForceNoStorm: 2;
  /** Contains enum operations for this enum object */
  readonly $: EnumHandler;
}

/**
 * Storm control mode number
 * @see {@link StormModes}
 */
export type StormMode = StormModes[keyof Omit<StormModes, "$">];

/**
 * Island model override options for {@link ida.forceIsland}
 *
 * @globalAccess {@link ida.IslandOverrides}
 *
 */
export interface IslandOverrides {
  /** Default game behavior - island is there based on the storm and LBA game variables state */
  readonly None: 0;
  /**
   * Forces the Citadel before Aliens 3d model (the one without the spaceship) to be active, even after the storm
   *
   * @warning @experimental Experimental feature: currently the visuals of the Citadel in this mode, when it's sunny, are not perfect.
   */
  readonly CitadelBeforeAliens: 1;

  /** Forces the Citadel after Aliens 3d model (the one with the spaceship) to be active, even before the storm */
  readonly CitadelAfterAliens: 2;

  /** Forces the normal Celebration island model to be active */
  readonly CelebrationNormal: 3;

  /** Forces the risen (final) Celebration island model to be active */
  readonly CelebrationRisen: 4;

  /** Contains enum operations for this enum object */
  readonly $: EnumHandler;
}
export type IslandOverride = IslandOverrides[keyof Omit<IslandOverrides, "$">];

/**
 * LBA2 Life script functions, available in IdaJS.
 *
 * Life functions are available in javascript through {@link ida.Life} enum object.
 * Life functions can be called using {@link ida.lifef} function.
 *
 * @see {@link LifeOpcodes} for numeric types reference, used in the life script.
 *
 * @globalAccess {@link ida.Life}
 */
export interface LifeFunctions {
  /** Checks for collision between this actor and any other actor.
   * @returns i8 - Actor this actor collided with (or -1 if none). */
  readonly LF_COL: 0x00;

  /** Checks for collision between a specific actor and any other actor.
   * @param actor: u8
   * @returns i8 - Actor another actor collided with (or -1 if none). */
  readonly LF_COL_OBJ: 0x01;

  /** Calculates the 2D distance between this actor and another actor.
   * @param actor: u8
   * @returns i16 - 2D distance to another actor. */
  readonly LF_DISTANCE: 0x02;

  /** Determines which sceneric zone this actor is currently in.
   * @returns i8 - Index of sceneric zone this actor is within (or -1 if none). */
  readonly LF_ZONE: 0x03;

  /** Determines which sceneric zone another actor is currently in.
   * @param actor: u8
   * @returns i8 - Index of sceneric zone another actor is within (or -1 if none). */
  readonly LF_ZONE_OBJ: 0x04;

  /** Gets the current life script track number for this actor.
   * @returns u8 - Life script track active on this actor. */
  readonly LF_L_TRACK: 0x05;

  /** Gets the current life script track number for another actor.
   * @param actor: u8
   * @returns u8 - Life script track active on another actor. */
  readonly LF_L_TRACK_OBJ: 0x06;

  /** Checks if another actor is visible within this actor's cone of view.
   * @param actor: u8
   * @returns i16 - Distance to another actor, if they are within a 90-degree view cone. */
  readonly LF_CONE_VIEW: 0x07;

  /** Identifies which actor last caused damage to this actor.
   * @returns i8 - Actor that last hit this actor. */
  readonly LF_HIT_BY: 0x08;

  /** Tests if the action key is currently being pressed.
   * @returns i8 - Action key was pressed. */
  readonly LF_ACTION: 0x09;

  /** Calculates the 3D distance between this actor and another actor.
   * @param actor: u8
   * @returns i16 - 3D distance to another actor. */
  readonly LF_DISTANCE_3D: 0x0a;

  /** Gets Twinsen's current behavior/stance mode.
   * @returns i8 - Twinsen's stance. */
  readonly LF_COMPORTEMENT_HERO: 0x0b;

  /** Checks if a specific inventory item is currently being used.
   * Beware that this check might have side effects, the auto-used items will be used automatically when checked.
   * By default only the translator is set to be auto-used in the vanilla game (see INVENT.cpp)
   * @param item: u8
   * @returns i8 - Item being used. */
  readonly LF_USE_INVENTORY: 0x0c;

  /** Gets the player's choice from the most recent dialogue menu.
   * @returns i16 - Choice made in last dialogue. */
  readonly LF_CHOICE: 0x0d;

  /** Checks the enabled state of a ladder zone.
   * @param zone: u8
   * @returns i8 - Whether a ladder zone is enabled. */
  readonly LF_ECHELLE: 0x0e;

  /** Checks the enabled state of a rail zone.
   * @param zone: u8
   * @returns i8 - Whether a rail zone is enabled. */
  readonly LF_RAIL: 0x0f;

  /** Identifies which actor is currently carrying this actor.
   * @returns i8 - Actor carrying this actor. */
  readonly LF_CARRY_BY: 0x10;

  /** Identifies which actor is being carried by another actor.
   * @param actor: u8
   * @returns i8 - Actor carrying another actor. */
  readonly LF_CARRY_OBJ_BY: 0x11;

  /** Calculates the directional angle from this actor to another actor.
   * @param actor: u8
   * @returns i16 - Angle from this actor to another actor. */
  readonly LF_ANGLE: 0x12;

  /** Measures distance to another actor for conversation range checking.
   * @param actor: u8
   * @returns i16 - Distance from another actor, if within an angle suitable for conversation. */
  readonly LF_DISTANCE_MESSAGE: 0x13;

  /** Identifies which actor last caused damage to another actor.
   * @param actor: u8
   * @returns i8 - Actor that last hit another actor. */
  readonly LF_HIT_OBJ_BY: 0x14;

  /** Calculates the clamped directional angle from this actor to another actor.
   * @param actor: u8
   * @returns i16 - Angle from this actor to another, clamped. */
  readonly LF_REAL_ANGLE: 0x15;

  /** Tests if this actor is currently colliding with decorative scenery.
   * @returns i8 - Whether this actor collides with scenery. */
  readonly LF_COL_DECORS: 0x16;

  /** Tests if another actor is currently colliding with decorative scenery.
   * @param actor: u8
   * @returns i8 - Whether another actor collides with scenery. */
  readonly LF_COL_DECORS_OBJ: 0x17;

  /** Checks if an actor was rendered in the current frame.
   * @param actor: u8
   * @returns i8 - Whether this actor was drawn to the screen. */
  readonly LF_OBJECT_DISPLAYED: 0x2c;

  /** Calculates the directional angle from another actor to this actor.
   * @param actor: u8
   * @returns i16 - Angle from another actor to this actor. */
  readonly LF_ANGLE_OBJ: 0x2d;
}

/**
 * LBA2 Move script (coroutine) opcodes, available in IdaJS.
 *
 * @see
 * - {@link registerCoroutine}, {@link startCoroutine}, {@link stopCoroutine}, {@link pauseCoroutine}, {@link unpauseCoroutine} to manage coroutines in IdaJS.
 * - {@link doMove} to call move script opcodes in IdaJS coroutines.
 * - {@link CoroutineFunction} for more details about coroutines in IdaJS.
 * - {@link LifeOpcodes} for type reference of the numeric types, used in the move script.
 *
 * @globalAccess {@link ida.Move}
 */
export interface MoveOpcodes {
  /** Sets this actor's model.
   * @param model: u8 */
  readonly TM_BODY: 0x02;

  /** Sets this actor's current animation.
   * @param anim: u16 */
  readonly TM_ANIM: 0x03;

  /** Actor rotates to face the given point and waits until its animation takes it there.
   * @param point: u8 */
  readonly TM_GOTO_POINT: 0x04;

  /** Waits for the current animation to end. */
  readonly TM_WAIT_ANIM: 0x05;

  /** Actor rotates to the given angle and waits until the rotation completes.
   * @param angle: i16 */
  readonly TM_ANGLE: 0x07;

  /** Instantly teleports the actor to a point.
   * @param point: u8 */
  readonly TM_POS_POINT: 0x08;

  /** Actor rotates to face away from the given point and waits until its animation takes it there.
   * @param point: u8 */
  readonly TM_GOTO_SYM_POINT: 0x0c;

  /** Waits for the actor's animation to have played a number of times.
   * @param count: u8
   * @param zero: u8 */
  readonly TM_WAIT_NB_ANIM: 0x0d;

  /** Plays a sound sample.
   * @param sample: i16 */
  readonly TM_SAMPLE: 0x0e;

  /** Actor moves to the given point, if it's a 3D sprite.
   * @param point: u8 */
  readonly TM_GOTO_POINT_3D: 0x0f;

  /** Sets the rotation speed of the actor.
   * @param speed: i16 */
  readonly TM_SPEED: 0x10;

  /** Enables or disables the "background" flag for this actor.
   * @param enabled: u8 */
  readonly TM_BACKGROUND: 0x11;

  /** Waits for the number of seconds.
   * @param count: u8
   * @param zero: u32
   */
  readonly TM_WAIT_NB_SECOND: 0x12;

  /** Sets this actor to have no model. */
  readonly TM_NO_BODY: 0x13;

  /** Rotates this actor instantly.
   * @param angle: i16 */
  readonly TM_BETA: 0x14;

  /** Door slides to the West (cpp name: TM_OPEN_LEFT)
   * @param distance: i16 */
  readonly TM_OPEN_WEST: 0x15;

  /** Door slides to the East (cpp name: TM_OPEN_RIGHT)
   * @param distance: i16 */
  readonly TM_OPEN_EAST: 0x16;

  /** Door slides to the North (cpp name: TM_OPEN_UP)
   * @param distance: i16 */
  readonly TM_OPEN_NORTH: 0x17;

  /** Door slides to the South (cpp name: TM_OPEN_DOWN)
   * @param distance: i16 */
  readonly TM_OPEN_SOUTH: 0x18;

  /** Restores door's original position. */
  readonly TM_CLOSE: 0x19;

  /** Waits until door finishes moving. */
  readonly TM_WAIT_DOOR: 0x1a;

  /** Plays a sound sample with a random frequency adjustment.
   * @param sample: i16 */
  readonly TM_SAMPLE_RND: 0x1b;

  /** Plays a sound sample forever.
   * @param sample: i16 */
  readonly TM_SAMPLE_ALWAYS: 0x1c;

  /** Stops a particular sound sample.
   * @param sample: i16 */
  readonly TM_SAMPLE_STOP: 0x1d;

  /**
   * Plays a cutscene video.
   * @see {@link GameVideos} to use the vanilla game videos.
   * @param name: string
   */
  readonly TM_PLAY_ACF: 0x1e;

  /** Sets the number of repeats for SIMPLE_SAMPLE.
   * @param count: i16 */
  readonly TM_REPEAT_SAMPLE: 0x1f;

  /** Plays a sample according to REPEAT_SAMPLE and resets the repeat count to 1.
   * @param sample: i16 */
  readonly TM_SIMPLE_SAMPLE: 0x20;

  /** Actor rotates to face Twinsen and waits until the rotation completes.
   * @param negative_one: i16 */
  readonly TM_FACE_TWINSEN: 0x21;

  /** Actor rotates to a random angle and waits until the rotation completes.
   * @param angle: i16
   * @param negative_one: i16 */
  readonly TM_ANGLE_RND: 0x22;

  /** Waits for a number of deciseconds (tenths of a second).
   * @param count: u8
   * @param zero: u32
   */
  readonly TM_WAIT_NB_DIZIEME: 0x24;

  /** Sets this actor's sprite.
   * @param sprite: i16 */
  readonly TM_SPRITE: 0x26;

  /** Waits for a random number of seconds, up to a maximum.
   * @param max: u8
   * @param zero: u32
   */
  readonly TM_WAIT_NB_SECOND_RND: 0x27;

  /** Sets the actor's animation frame.
   * @param frame: u8 */
  readonly TM_SET_FRAME: 0x29;

  /** Sets the actor's 3D sprite animation frame.
   * @param frame: u8 */
  readonly TM_SET_FRAME_3DS: 0x2a;

  /** Sets the start frame of the actor's 3D sprite animation.
   * @param frame: u8 */
  readonly TM_SET_START_3DS: 0x2b;

  /** Sets the end frame of the actor's 3D sprite animation.
   * @param frame: u8 */
  readonly TM_SET_END_3DS: 0x2c;

  /** Starts the actor's 3D sprite animation.
   * @param fps: u8 */
  readonly TM_START_ANIM_3DS: 0x2d;

  /** Stops the actor's 3D sprite animation. */
  readonly TM_STOP_ANIM_3DS: 0x2e;

  /** Waits until the actor's 3D sprite animation ends or is stopped. */
  readonly TM_WAIT_ANIM_3DS: 0x2f;

  /** Waits until the actor's 3D sprite animation reaches the given frame.
   * @param frame: u8 */
  readonly TM_WAIT_FRAME_3DS: 0x30;

  /** Waits for a random number of deciseconds, up to a maximum.
   * @param max: u8
   * @param zero: u32
   */
  readonly TM_WAIT_NB_DIZIEME_RND: 0x31;

  /** Sets the interval between sample repeats.
   * @param interval: i16 */
  readonly TM_DECALAGE: 0x32;

  /** Sets the frequency for sample playback.
   * @param frequency: i16 */
  readonly TM_FREQUENCE: 0x33;

  /** Sets the volume for sample playback.
   * @param volume: u8 */
  readonly TM_VOLUME: 0x34;

  /** Contains enum operations for this enum object */
  readonly $: EnumHandler;
}

/** Life script opcode number
 * @see {@link LifeOpcodes}
 */
export type LifeOpcode = LifeOpcodes[keyof Omit<LifeOpcodes, "$">];

/** Life script function opcode number
 * @see {@link LifeFunctions}
 */
export type LifeFunction = LifeFunctions[keyof LifeFunctions];

/** Move script opcode number
 * @see {@link MoveOpcodes}
 */
export type MoveOpcode = MoveOpcodes[keyof Omit<MoveOpcodes, "$">];

/**
 * Configuration for palette conversion.
 */
export interface PaletteConfiguration {
  /**
   * The index of the palette to use.
   * For sprites doesn't matter, as they will always be converted to the LBA palette.
   * For images use 0, to convert them to the LBA palette. If not specified, the palette will be built automatically.
   * Convert images to the LBA palette only if you need to use dialogs on top of them ({@link LifeOpcodes.LM_PCX_MESS_OBJ}).
   */
  paletteIndex?: number;

  /**
   * The algorithm to use for palette conversion. If not specified, a default one will be used.
   *
   * @see
   * - {@link PaletteAlgorithms.WeightedEuclidean} is default for sprites
   * - {@link PaletteAlgorithms.WeightedEuclideanDithered} is default for images
   */
  algorithm?: PaletteAlgorithm;

  /**
   * Only valid for the sprites.
   * Consider all the pixels with alpha below this treshold as transparent.
   * Default: 200.
   */
  alphaTreshold?: number;
}

/**
 * Configuration for image processing.
 */
export interface ImagesConfiguration {
  /** Sprites can be used as smaller images on top of dialogs */
  sprites?: Record<string, PaletteConfiguration>;
  /** Images can be used as full screen backgrounds for dialogs */
  images?: Record<string, PaletteConfiguration>;
}

/**
 * The global {@link ida} object provides access to the mod engine configuration and API.
 */
export interface Ida {
  /**
   * Returns the language, currently used in the game for text ("en", "fr", "de", "es", "it", "pt").
   *
   * You can use it for localizing your mod dialogs and text.
   */
  getTextLanguage(): "en" | "fr" | "de" | "es" | "it" | "pt";

  /**
   * Returns the language, currently used in the game for voice ("en", "fr", "de").
   */
  getVoiceLanguage(): "en" | "fr" | "de";

  /**
   * Returns the lowest free text ID, which is allowed for the mod engine to use.
   */
  getFirstTextId(): number;

  /**
   * Returns the lowest free image ID, which is allowed for the mod engine to use.
   */
  getFirstImageId(): number;

  /**
   * Executes a low level life script command of the game.
   *
   * Can be used only within the lifeHandler call.
   *
   * @param objectId - The ID of the object that executes this command. This should be always the id of the object on which this life handler is executed. Life handler callback function has it as the first parameter.
   *
   * @param opcode - The life script opcode to execute. Use one LM_* opcodes from the {@link ida.Life} ({@link LifeOpcodes}) enum object.
   *
   * @param args - The arguments for the life script command. Use {@link LifeOpcodes} documentation to know which arguments are needed for each opcode.
   *
   * @see
   * - {@link GameObject.handleLifeScript } to set up a life script handler.
   *
   * @example
   * ```javascript
   *  ida.life(objectId, ida.Life.LM_CAMERA_CENTER, 0);
   * ```
   */
  life(objectId: number, opcode: LifeOpcode, ...args: (number | string)[]): void;

  /**
   * Executes a low level life script function of the game, returning a result.
   *
   * @param objectId - The ID of the object that executes this function. This should be always the id of the object on which this life handler is executed. Life handler callback function has it as the first parameter.
   *
   * @param opcode - The life script function opcode to execute. Use one LF_* opcodes from the {@link ida.Life} ({@link LifeFunctions}) enum object.
   *
   * @param args - The arguments for the life script function. Use {@link LifeFunctions} documentation to know which arguments are needed for each function.
   *
   * @returns The result of the life script function execution. Use {@link LifeFunctions} documentation to know the return type for each function.
   *
   * Can be used only within the lifeHandler call.
   * @see
   * - {@link GameObject.handleLifeScript } to set up a life script handler.
   *
   * @example
   * ```javascript
   *  if (ida.lifef(objectId, ida.Life.LF_DISTANCE, twinsenId) > 1200)) {
   *     // do something if distance to Twinsen is more than 1200 units away from this actor
   *  }
   * ```
   */
  lifef(objectId: number, opcode: LifeFunction, ...args: number[]): number;

  /**
   * Allows to force stormy or sunny weather, independently of LBA2 game variables state.
   *
   * @warning @experimental Experimental feature: The stormy weather was designed for the Citadel island. Overall, it works on other islands too, but is not guaranteed to look good there.
   *
   * @see {@link StormModes} for the possible modes.
   */
  setStorm(mode: StormMode): void;

  /**
   * Forces the game to use a specific island 3D model for Citadel and Celebration, overriding what is dictated by the game variables.
   *
   * @see {@link IslandOverrides} for the possible overrides.
   */
  forceIsland(islandOverride: IslandOverride): void;

  /**
   * Disables the lightning effect in the game life script. This is usefull when you called setStorm(StormModes.ForceNoStorm) and do not want to disable lightning actors on each separate scene.
   *
   * @see
   * - {@link ida.setStorm}
   * - {@link ida.enableLightning}
   */
  disableLightning(): void;

  /**
   * Enables the lightning effect in the game life script. Enabled by default. Call it to re-enable if it was disabled.
   *
   * @see {@link ida.disableLightning}
   */
  enableLightning(): void;

  /**
   * Sets the current log level to display for console logs.
   *
   * Default is {@link LogLevels.Info}.
   *
   * The messages with a lower level will not be displayed.
   */
  setLogLevel(level: LogLevel): void;

  /**
   * Returns the current log level, which is used to filter console logs.
   */
  getLogLevel(): LogLevel;

  /**
   * Halts the mod engine, stopping all scripts.
   * Put it into the beginning of your index.js to temporarily stop your mod logic.
   * Usefull for debugging purposes.
   */
  halt(): void;

  /**
   * Enables or disables the Execution Protection Policy (EPP) system (enabled by default).
   * EPP protects the game from crashes and abnormal behavior caused by executing commands in wrong contexts.
   *
   * @warning Disabling EPP might cause crashes and other issues in the game. Only disable if you know what you are doing.
   *
   * @param enabled true to enable, false to disable
   */
  setEppEnabled(enabled: boolean): void;

  /**
   * Imports user PNG images and sprites from the media folder to be used in the game.
   * Please run this in the beginning of your mod script, if you are using custom dialog sprites or images anywhere in your mod.
   *
   * @param configuration - Optional configuration for images import.
   * @see {@link ImagesConfiguration} for the configuration options.
   */
  useImages(configuration?: ImagesConfiguration): void;

  /**
   * Sets the starting scene ID for the game. By default, it's 0 (Twinsen's house).
   * Call it at the beginning of your mod script to start the game in a different scene.
   *
   * @param sceneId The ID of the scene to start the game in.
   */
  setStartSceneId(sceneId: number): void;

  /**
   * Sets the intro video to play at the start of the new game. By default, it's "INTRO".
   *
   * @param name The name of the video file to play (with or without extension).
   *
   * @see {@link GameVideos} to select from the vanilla game videos.
   */
  setIntroVideo(name: string): void;

  /**
   * The log levels, which can be used to filter console logs.
   */
  LogLevels: LogLevels;

  /**
   * The string => number enum object, containing Life Script opcodes.
   */
  Life: LifeOpcodes & LifeFunctions;

  /**
   * The string => number enum object, containing Move Script opcodes.
   */
  Move: MoveOpcodes;

  /**
   * The force storm modes, which can be used with setStorm().
   *
   * @see {@link ida.setStorm}
   */
  StormModes: StormModes;

  /**
   * The island overrides options, which can be used with forceIsland().
   *
   * @see {@link ida.forceIsland}
   */
  IslandOverrides: IslandOverrides;

  /**
   * Sets an Ida move handler callback to handle Move scripts for all the objects.
   *
   * @private
   * @warning This is managed by Ida coroutines system internally. Only use this function, if you know what you are doing.
   */
  _setMoveHandler(callback: (objectId: number) => void): void;

  /**
   * Starts execution of a low level move script command on an actor. Can be used only within the moveHandler call.
   *
   * @private
   * @warning Do not use! This function is normally executed by the coroutine system. Only call it directly if you are implementing your own coroutine system and now what you are doing.
   *
   * @see {@link MoveOpcodes} for the possible opcodes (MO_*) and their arguments.
   */
  _move(
    objectId: number,
    savedCode: number[],
    opcode: MoveOpcode,
    ...args: (number | string)[]
  ): void;

  /**
   * Continues execution of the current move script command on the object, if it's not finished yet.
   *
   * @private
   * @warning Do not use! This is a system level function, and is used in the coroutine system. Only use it directly if you are implementing your own coroutine system and know what you are doing.
   * @param objectId The ID of the object to move.
   * @return Move opcodes being executed including the in-memory changes for persistent move commands, otherwise undefined.
   */
  _cmove(objectId: number): Uint8Array | undefined;

  /**
   * Stops the current move script command on the object, if it's running.
   *
   * @private
   * @warning Do not use! This is a system level function, and is used in the coroutine system. Only use it directly if you are implementing your own coroutine system and know what you are doing.
   * @param objectId The ID of the object to stop moving.
   */
  _stopMove(objectId: number): void;

  /**
   * Re-enables further Ida move script executions on the object.
   *
   * @private
   * @warning Do not use! This is a system level function, and is used in the Ida coroutine system. Only use it directly if you are implementing your own coroutine system and know what you are doing.
   * @param objectId The ID of the object to enable move scripts on.
   */
  _enableMove(objectId: number): void;

  /**
   * Disables further Ida move script executions on the object, until re-enabled. Also does the stopMove() internally.
   *
   * @private
   * @warning Do not use! This is a system level function, and is used in the coroutine system. Only use it directly if you are implementing your own coroutine system and know what you are doing.
   * @param objectId The ID of the object to disable move scripts on.
   */
  _disableMove(objectId: number): void;

  /**
   * Checks if the object is currently running a move script command.
   *
   * @private
   * @warning Do not rely on! This is a system level function, and is used in the coroutine system. Only use it directly if you are implementing your own coroutine system and know what you are doing.
   * @param objectId The ID of the object to check.
   */
  _isMoveActive(objectId: number): boolean;
}
