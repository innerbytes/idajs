import type { EnumHandler } from "./enumHandler";
import type { LifeOpcodes, MoveOpcodes } from "./ida";

/**
 * Palette conversion algorithms for image importing (if you want to customize the style and improve the quality).
 *
 * @globalAccess {@link image.PaletteAlgorithms}.
 */
export interface PaletteAlgorithms {
  /** The fastest, but the least careful. Good for simple icons, also must be used for PNGs that already use LBA2 scene palette */
  readonly Euclidean: 0;
  /** Fast conversion with dithering - better results for bigger images */
  readonly EuclideanDithered: 1;
  /** Weighted RGB distance considering human perception - slightly slower than Euclidean, but better */
  readonly WeightedEuclidean: 2;
  /** Weighted RGB distance considering human perception with dithering - the best balance between speed an quality */
  readonly WeightedEuclideanDithered: 3;
  /** CIE LAB Delta E color difference. Experimental. Most accurate but slow */
  readonly CIELABDeltaE: 4;
  /** CIE LAB Delta E color difference with dithering. Experimental. Most accurate but slow */
  readonly CIELABDeltaEDithered: 5;
  /** Enum handler for this enum object */
  readonly $: EnumHandler;
}

/**
 * PaletteAlgorithm type representing the values of PaletteAlgorithms enum
 *
 * @see {@link PaletteAlgorithms}
 */
export type PaletteAlgorithm = PaletteAlgorithms[keyof Omit<PaletteAlgorithms, "$">];

/**
 * Picture IDs from SCREEN.HQR of the vanilla LBA2 game.
 *
 * Can be used in {@link LifeOpcodes.LM_PCX} and {@link LifeOpcodes.LM_PCX_MESS_OBJ} life commands to display full-screen pictures.
 *
 * Note, that not all of those pictures have palette that is suitable for displaying dialogs on top of them.
 *
 * @globalAccess {@link image.Pictures}.
 */
export interface GamePictures {
  /** First logo picture (Adeline logo) */
  readonly FirstLogo: 0;
  /** LBA2 DEMO picture */
  readonly LBA2Demo: 1;
  /** Menu background (Stormy sea image) */
  readonly MenuBackground: 2;
  /** Magic slate picture */
  readonly MagicSlate: 3;
  /** Map of the sewers */
  readonly MapSewers: 4;
  /** Map of the sewers (on the slate) */
  readonly MapSewersCopy: 5;
  /** Map of the Dome of the slate */
  readonly MapDome: 6;
  /** Copy of the map of the Dome of the slate */
  readonly MapDomeCopy: 7;
  /** Map of Emerald Moon */
  readonly MapEmeraldMoon: 8;
  /** Copy of the map of Emerald moon */
  readonly MapEmeraldMoonCopy: 9;
  /** View of the island across the hacienda */
  readonly ViewHaciendaIsland: 10;
  /** View of the lighthouse (night) */
  readonly LighthouseNight: 11;
  /** View of the lighthouse (day) */
  readonly LighthouseDay: 12;
  /** 1st presentation picture (Zeelich) */
  readonly Presentation1: 13;
  /** 2nd presentation picture (Researchers) */
  readonly Presentation2: 14;
  /** 3rd presentation picture (Picnic) */
  readonly Presentation3: 15;
  /** View of Emerald Moon */
  readonly ViewEmeraldMoon: 16;
  /** Temple on the Island of the Wannies */
  readonly TempleWannies: 17;
  /** Dissection of Twinsun */
  readonly DissectionTwinsen: 18;
  /** Mona Twinsen */
  readonly MonaTwinsen: 19;
  /** Dissection of Zeelich */
  readonly DissectionZeelich: 20;
  /** Copy of the dissection of Zeelich on slate */
  readonly DissectionZeelichCopy: 21;
  /** Wanted: Twinsen */
  readonly WantedTwinsen: 22;
  /** 4th presentation picture (Bust of the Emperor) */
  readonly Presentation4: 23;
  /** 5th presentation picture (Parade) */
  readonly Presentation5: 24;
  /** 6th presentation picture (Disco) */
  readonly Presentation6: 25;
  /** 7th presentation picture (Celebration) */
  readonly Presentation7: 26;
  /** 8th presentation picture (Dark Monk's statue) */
  readonly Presentation8: 27;
  /** 9th presentation picture (Zeelich + UFO) */
  readonly Presentation9: 28;
  /** 10th presentation picture (Casino) */
  readonly Presentation10: 29;
  /** Twinsen + Zoé on CD */
  readonly TwinsenZoeCD: 30;
  /** Sendell's Ball */
  readonly SendellsBall: 31;
  /** Plan of island CX */
  readonly PlanIslandCX: 32;
  /** Copy of the plan of island CX */
  readonly PlanIslandCXCopy: 33;
  /** Twinsen on the well of Sendell */
  readonly TwinsenWell: 34;
  /** Sendell on the well of Sendell */
  readonly SendellWell: 35;
  /** Second logo picture (Activision logo) */
  readonly SecondLogo: 36;
  /** Alternative second logo picture (EA logo) */
  readonly SecondLogoEA: 37;
  /** Second alternative second logo picture (Virgin logo) */
  readonly SecondLogoVirgin: 38;

  /** Enum handler for this enum object */
  readonly $: EnumHandler;
}

/**
 * Video file names for all the cutscenes in the vanilla LBA2 game.
 *
 * Can be used in {@link LifeOpcodes.LM_PLAY_ACF} life command and {@link MoveOpcodes.TM_PLAY_ACF} move command to play cutscene videos.
 *
 * @globalAccess {@link image.Videos}.
 */
export interface GameVideos {
  /** Going down with the elevator */
  readonly ASCENSEU: "ASCENSEU";
  /** Going up with the elevator */
  readonly ASRETOUR: "ASRETOUR";
  /** Escape with Baldino */
  readonly BALDINO: "BALDINO";
  readonly BOAT1: "BOAT1";
  readonly BOAT2: "BOAT2";
  readonly BOAT3: "BOAT3";
  readonly BOAT4: "BOAT4";
  /** Temple of Bu ride */
  readonly BU: "BU";
  /** Twinsen crashes with the shuttle */
  readonly CRASH: "CRASH";
  /** Dark Monk statue rises */
  readonly DARK: "DARK";
  /** The bad ending */
  readonly DELUGE: "DELUGE";
  /** End movie part 1 */
  readonly END: "END";
  /** End movie part 2 */
  readonly END2: "END2";
  readonly ENFA: "ENFA";
  /** Twinsen takes the Wannies fragment */
  readonly FRAGMENT: "FRAGMENT";
  /** Exit the cliffs with Zoe */
  readonly GROTTE: "GROTTE";
  /** Intro movie */
  readonly INTRO: "INTRO";
  /** Emerald moon moving 1 */
  readonly LUNES1: "LUNES1";
  /** Emerald moon moving 2 */
  readonly LUNES2: "LUNES2";
  readonly MONTCH: "MONTCH";
  /** Landing on the moon */
  readonly MOON: "MOON";
  /** The lava ferryman */
  readonly PASSEUR: "PASSEUR";
  readonly PUB1: "PUB1";
  readonly PUB2: "PUB2";
  readonly PUB3: "PUB3";
  readonly PUB4A6: "PUB4A6";
  /** Sendell's ball */
  readonly SENDELL: "SENDELL";
  readonly SORT: "SORT";
  readonly SURSAUT: "SURSAUT";
  readonly TAXI: "TAXI";
  readonly TAXI_J: "TAXI_J";
  readonly VOYAGEZ: "VOYAGEZ";
  readonly ZEELP: "ZEELP";
  /** The ending credits baby view */
  readonly BABY: "BABY";
}

/**
 * The global {@link image} object provides methods to manage custom images in the mod.
 *
 * It allows loading user images and replacing existing game images.
 */
export interface Image {
  /**
   * Sets the current user image to be used in {@link LifeOpcodes.LM_PCX} and {@link LifeOpcodes.LM_PCX_MESS_OBJ} life commands.
   * The image file should be located in the mod's media/images folder, subfolders are allowed.
   *
   * The image size should be 640x480.
   *
   * @param imageName The name of the image file to use (without path).
   *                  Should be a valid filename without backslashes.
   * @returns The image ID that can be used to reference this image, or undefined if the image name is invalid.
   *
   * @example
   * ```javascript
   * ida.life(objectId, ida.Life.LM_PCX, image.use("my-custom-image.png"), 0);
   * ```
   */
  use(imageName: string): number | undefined;

  /**
   * Replaces a vanilla game image with a custom image.
   * This allows overriding existing game images from SCREEN.HQR with custom ones.
   * The replacement happens in runtime only, no HQR file is changed.
   *
   * The image size should be 640x480.
   *
   * @param gameImageId The ID of the game image to replace (0 to 38 for vanilla game files).
   * @param imageName The name of the custom image file to use as replacement.
   *                  Should be located in the mod's media/images folder, subfolders are allowed.
   * @returns The game image ID if successful, or undefined if parameters are invalid.
   *
   * @example
   * ```javascript
   * image.replace(image.Pictures.MapEmeraldMoon, "myEmeraldMoonMap.png");
   * ```
   */
  replace(gameImageId: number, imageName: string): number | undefined;

  /**
   * Restores a previously replaced game image to its original state.
   * This removes the custom image replacement for the specified game image ID.
   *
   * @param gameImageId The ID of the game image to restore to original.
   *
   * @example
   * ```javascript
   * image.restore(image.Pictures.MapEmeraldMoon); // Restores game image MapEmeraldMoon to its original state
   * ```
   */
  restore(gameImageId: number): void;

  /**
   * Picture IDs from SCREEN.HQR in the vanilla LBA2 game.
   */
  Pictures: GamePictures;

  /**
   * Video file names for cutscenes in the vanilla LBA2 game (from VIDEO.HQR)
   */
  Videos: GameVideos;

  /**
   * Palette conversion algorithms for png images importing (if you want to customize the style and improve the quality).
   */
  PaletteAlgorithms: PaletteAlgorithms;

  /**
   * Resets all image data.
   *
   * @private
   * @warning This is an internal method and should not be used directly. Use only if you know what you are doing.
   */
  _reset(): void;
}
