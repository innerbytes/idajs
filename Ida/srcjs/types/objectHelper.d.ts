import type { FlagsHandler } from "./flagsHandler";
import type { EnumHandler } from "./enumHandler";
import type { LifeOpcodes, LifeFunctions, MoveOpcodes } from "./ida";
import type { GameObject } from "./gameObject";

/**
 * All static flags of the Game Object, that are allowed by Ida to read or modify.
 * Use this to change how object behaves in the scene and interacts with other objects and environment.
 *
 * NB: setting some of those flags on the Twinsen object in the scene setup might have no effect,
 * as the twinsen flags are initialized later. You will need to use life commands to change them at scene runtime.
 *
 * @globalAccess {@link object.Flags}.
 */
export interface StaticFlags {
  /**
   * Contains helper methods to read and modify the static flags.
   */
  readonly $: FlagsHandler;

  /**
   * Can collide with other objects.
   *
   * If this flag is set, the Actor object will behave like a real-world object, colliding with other actor objects.
   * If the flag is not set, the actor will push other actor objects as if they don't exist and won't be able
   * to attack or damage them. If 2 actor objects have this flag unset, they can walk through each other like ghosts.
   *
   * This flag can be changed at runtime using the {@link LifeOpcodes.LM_OBJ_COL} life script command.
   */
  readonly CheckCollisionsWithActors: 0x01;

  /**
   * Can collide with bricks.
   *
   * If this flag is set, the Actor object will be bound by world physics, such as gravity, and walls will be solid.
   * If the flag is not set, the Actor object can walk through walls, float in the air, and won't fall or jump to higher levels.
   *
   * This flag can be changed at runtime using the {@link LifeOpcodes.LM_BRICK_COL} Life Script command.
   */
  readonly CheckCollisionsWithScene: 0x02;

  /**
   * Can detect zones.
   *
   * If this flag is set, the Actor object can detect if it is inside a Sceneric Zone.
   *
   * Otherwise, the Life Script {@link LifeFunctions.LF_ZONE} life function will always report that the Actor object is not inside any Zone.
   */
  readonly CheckScenericZones: 0x04;

  /**
   * Uses clipping.
   *
   * This flag applies to Sprite Actor objects only. If set, the Actor object will be invisible (clipped) outside the clipping rectangle.
   *
   * This is used to make doors slide "into" walls and not appear on the other side.
   *
   * The clipping rectangle in this case is defined in the first 4 registers of the Actor object (x1, y1, x2, y2).
   */
  readonly SpriteClipping: 0x08;

  /**
   * Can be pushed.
   *
   * If this flag is set, other Actor objects will push the Actor object if it stands in their way. This flag is intended for Sprites.
   * If used for a 3D Actor object, it may behave unpredictably, depending on the `Can collide with objects` flag.
   */
  readonly Pushable: 0x10;

  /**
   * Low collision only.
   *
   * If the flag is set, high collisions will be ignored. This might be useful for certain Game Objects.
   *
   * Exact behavior is not documented, maybe is useful for small animals or for crawling animations.
   */
  readonly CheckLowCollisionsOnly: 0x20;

  /**
   * Enables some special game behaviors checks: for example, dying in the water or lava.
   */
  readonly CheckDrowning: 0x40;

  /**
   * Floor collision only.
   *
   * If this flag is set, the Actor object will only check for collisions with the floor. This is useful for certain Actor objects.
   */
  readonly CheckFloorCollisionsOnly: 0x80;

  /**
   * Hidden.
   *
   * If this flag is set, the Actor object will not be visible in the world. However, it will still act as an obstacle, play animations, and emit sounds.
   *
   * This flag can be changed at runtime using the {@link LifeOpcodes.LM_INVISIBLE} Life Script command.
   */
  readonly Invisible: 0x0200;

  /**
   * Is Sprite.
   *
   * If this flag is set, the Actor object will be a Sprite Actor object. Sprite Actor objects use static images (sprites) instead of Bodies or Animations.
   *
   * The object uses {@link GameObject.setSpriteId} value to determine which sprite to use.
   */
  readonly IsSprite: 0x0400;

  /**
   * Can fall.
   *
   * If this flag is set, the Actor object can fall if it is not standing on the ground.
   * This flag can be changed at runtime using the {@link LifeOpcodes.LM_FALLABLE} Life Script command.
   */
  readonly CanFall: 0x0800;

  /**
   * Doesn't cast shadow.
   *
   * If this flag is not set, the Actor object will cast a shadow: a small semi-transparent gray circle on the ground below the Actor object.
   */
  readonly NoShadow: 0x1000;

  /**
   * Backgrounded.
   *
   * If this flag is set, the Actor object will not be redrawn continuously. It will only be redrawn when the screen is refreshed by another event, such as another Actor object passing by or a conversation text being drawn.
   *
   * This flag can be changed at runtime using the {@link LifeOpcodes.LM_BACKGROUND} Life Script or {@link MoveOpcodes.TM_BACKGROUND} Move Script commands.
   */
  readonly Backgrounded: 0x2000;

  /**
   * Carrier.
   *
   * If this flag is set, the Actor object can carry another Actor object on its top. Otherwise, no other Actor object can stand on top of it.
   */
  readonly CanCarry: 0x4000;

  /**
   * Uses Mini ZV.
   *
   * "ZV" stands for Zone Volume. If this flag is set, the Actor object's bounding box dimensions in the X and Z axes will be set to the smaller of the two dimensions. If unset, the average of the X and Z dimensions will be used. Might be useful for bigger objects so they don't get stuck.
   *
   * This flag does not affect the Y (vertical) axis and applies to 3D Actor objects only.
   */
  readonly SmallZV: 0x8000;

  /**
   * Invalid position.
   *
   * If this flag is set, the Carrier position is considered invalid.
   */
  readonly InvalidCarrierPosition: 0x010000;

  /**
   * No shock animation.
   *
   * If this flag is set, the Actor object will not trigger a shock animation.
   */
  readonly NoShock: 0x020000;

  /**
   * Uses 3DS animation.
   *
   * If this flag is set, the Actor object uses 3DS (sprite) animations.
   */
  readonly HasSpriteAnimation: 0x040000;

  /**
   * No pre-clipping.
   *
   * If this flag is set, the Actor object will not be pre-clipped. This is useful for large objects.
   */
  readonly NoPreClipping: 0x080000;

  /**
   * Uses Z-buffer.
   *
   * If this flag is set, the Actor object will be rendered using the Z-buffer, but only for exterior scenes.
   */
  readonly UseZBuffer: 0x100000;

  /**
   * In water.
   *
   * If this flag is set, the Actor object will be rendered using the Z-buffer while in water, but only for exterior scenes.
   */
  readonly IsInWater: 0x200000;
}

/**
 * The bonuses an actor object or zone can give.
 *
 * @see
 * - {@link GameObject.setBonusFlags} and {@link GameObject.setBonusQuantity} to set bonuses on Game Objects (loot when they die).
 * - Zones should have type {@link ZoneTypes.Bonus} and use registers to set bonus type and quantity. Please look at the LBAArchitect on how bonuses are setup on the zones.
 *
 * @globalAccess {@link object.Bonuses}.
 */
export interface BonusFlags {
  /** Flag operations for this flag object */
  readonly $: FlagsHandler;
  readonly NOTHING: 0x0001;
  readonly MONEY: 0x0010;
  readonly LIFE: 0x0020;
  readonly MAGIC: 0x0040;
  readonly KEY: 0x0080;
  readonly CLOVER: 0x0100;
}

/**
 * Zone types available in the game.
 *
 * This is not documented enough yet. Please look in the LBAArchitect tool on how the zones are setup.
 *
 * @globalAccess {@link object.ZoneTypes}.
 */
export interface ZoneTypes {
  readonly Disabled: -1;
  readonly Teleport: 0;
  readonly Camera: 1;
  readonly Sceneric: 2;
  readonly Fragment: 3;
  readonly Bonus: 4;
  readonly Text: 5;
  readonly Ladder: 6;
  readonly Conveyor: 7;
  readonly Spike: 8;
  readonly Rail: 9;
  readonly $: EnumHandler;
}

/**
 * A number value, representing ZoneType
 * @see {@link ZoneTypes}
 */
export type ZoneType = ZoneTypes[keyof Omit<ZoneTypes, "$">];

/**
 * Directions used for zones that require them.
 *
 * @globalAccess {@link object.ZoneDirections}.
 */
export interface ZoneDirections {
  readonly None: 0;
  readonly North: 1;
  readonly South: 2;
  readonly East: 4;
  readonly West: 8;
  readonly $: EnumHandler;
}

/**
 * A number value, representing ZoneDirection
 * @see {@link ZoneDirections}
 */
export type ZoneDirection = ZoneDirections[keyof Omit<ZoneDirections, "$">];

/**
 * Control modes available for Game Objects (actors).
 *
 * This is not documented enough yet. Please look in the LBAArchitect, IdaJS samples, and original game scripts to see which control modes are setup for different objects.
 *
 * @globalAccess {@link object.ControlModes}.
 */
export interface ControlModes {
  readonly $: EnumHandler;
  readonly NoMovement: 0;
  readonly PlayerControl: 1;
  readonly FollowActor: 2;
  readonly SameXZAsActor: 6;
  readonly MecaPenguin: 7;
  readonly RailCart: 8;
  readonly CirclePoint: 9;
  readonly CirclePointFace: 10;
  readonly SameXZAndAngleAsActor: 11;
  readonly Car: 12;
  readonly CarPlayerControl: 13;
}

/** A number value, representing ControlMode
 * @see {@link ControlModes}
 */
export type ControlMode = ControlModes[keyof Omit<ControlModes, "$">];

/**
 * Twinsen's stances.
 *
 * Used in {@link LifeOpcodes.LM_COMPORTEMENT_HERO} life command.
 *
 * @globalAccess {@link object.TwinsenStances}.
 */
export interface TwinsenStances {
  readonly $: EnumHandler;
  readonly Normal: 0;
  readonly Athletic: 1;
  readonly Aggressive: 2;
  readonly Discreet: 3;
  readonly Protopack: 4;
  readonly Double: 5;
  readonly Horn: 6;
  readonly SpaceNormalIndoor: 7;
  readonly Jetpack: 8;
  readonly SpaceAthleticIndoor: 9;
  readonly SpaceNormalOutdoor: 10;
  readonly SpaceAthleticOutdoor: 11;
  readonly Buggy: 12;
  readonly Skeleton: 13;
}

/**
 * Helper object containing useful enums and functions for operating with scene objects and zones.
 *
 * Available globally as {@link object}.
 */
export interface ObjectHelper {
  /**
   * The movement control modes for the Game Object.
   */
  ControlModes: ControlModes;

  /**
   * All static flags of the Game Object, that are allowed by Ida to read or modify.
   */
  Flags: StaticFlags;

  /**
   * All bonuses the Game Object can give.
   */
  Bonuses: BonusFlags;

  /**
   * The string => number "enum", containing Zone types.
   */
  ZoneTypes: ZoneTypes;

  /**
   * The string => number "enum", containing scene directions.
   *
   * If used with custom created zones, then the zone direction can be put into Info2 register of the zone.
   */
  ZoneDirections: ZoneDirections;

  /**
   * The string => number "enum", containing Twinsen's stance modes.
   */
  TwinsenStances: TwinsenStances;

  /** North direction vector (negative Z axis) */
  readonly North: [0, 0, -1];
  /** South direction vector (positive Z axis) */
  readonly South: [0, 0, 1];
  /** East direction vector (positive X axis) */
  readonly East: [1, 0, 0];
  /** West direction vector (negative X axis) */
  readonly West: [-1, 0, 0];
  /** Up direction vector (positive Y axis) */
  readonly Up: [0, 1, 0];
  /** Down direction vector (negative Y axis) */
  readonly Down: [0, -1, 0];

  /**
   * Converts a zone direction or 3D vector to the game angle value (0..4096 system)
   * @param direction The zone direction enum value or a 3D vector [x, y, z]
   * @returns The corresponding angle value
   *
   * For zone directions: SENW (0, 1024, 2048, or 3072).
   *
   * For vectors: Calculated angle of the vector (Z+ is 0°, X+ is 90°, Z- is 180°, X- is 270°).
   *
   * The Y component of vectors is ignored in the calculation.
   */
  directionToAngle(direction: ZoneDirection | [number, number, number]): number;

  /**
   * Converts Euler degrees (0-360) to the game's angle system (0-4096)
   * @param degrees The degrees value to convert.
   * @returns The corresponding angle value (0-4096)
   */
  degreesToAngle(degrees: number): number;

  /**
   * Converts the LBA angle to degrees.
   * @param angle The angle value to convert (0-4096)
   * @returns The corresponding degrees value (0-360)
   */
  angleToDegrees(angle: number): number;

  /**
   * Converts radians to the LBA angle system (0..4096)
   * @param radians The radians value to convert.
   * @returns The corresponding angle value (0-4096)
   */
  radiansToAngle(radians: number): number;

  /**
   * Converts the LBA angle system to radians.
   * @param angle The angle value to convert (0-4096)
   * @returns The corresponding radians value (0-2π)
   */
  angleToRadians(angle: number): number;
}
