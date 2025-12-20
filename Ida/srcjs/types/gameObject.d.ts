import type {
  ControlMode,
  ControlModes,
  ObjectHelper,
  StaticFlags,
  BonusFlags,
} from "./objectHelper";
import type { DialogColor } from "./text";
import type { ZoneDirection, ZoneDirections } from "./objectHelper";
import type { LifeOpcodes } from "./ida";
import type { SceneEvents } from "./scene";

/**
 * Interface representing a game object (actor) in the scene.
 *
 * The player, NPCs, but also doors, interractable items, anything that can move or interract in the 3D space of the scene - those are all game objects.
 *
 * The setters in the object can only be used in the scene setup phase (see {@link SceneEvents.afterLoadScene} event).
 */
export interface GameObject {
  /**
   * Returns the id of the object (the index of the object in the scene).
   */
  getId(): number;

  /**
   * Returns the static flags of the object.
   * @see {@link StaticFlags}
   */
  getStaticFlags(): number;

  /**
   * Returns the bonus flags of the object.
   * @see {@link BonusFlags}
   */
  getBonusFlags(): number;

  /**
   * Returns the current position of the object in the world.
   */
  getPos(): [number, number, number];

  /**
   * Returns array of 4 values that represent the object info registers
   * When clipping is used, it is clipping information of the object as: [Left, Top, Right, Bottom].
   * When Move randomly mode is used, the #3 register contains the random interval.
   * When following on actor the #3 register contains the actor ID.
   */
  getRegisters(): [number, number, number, number];

  /**
   * Returns the current angle of the object around Y in 0-4096 degrees.
   */
  getAngle(): number;

  /**
   * Returns the life points of the object.
   */
  getLifePoints(): number;

  /**
   * Returns the armor value of the object.
   */
  getArmor(): number;

  /**
   * Returns the hit power of the object.
   */
  getHitPower(): number;

  /**
   * Returns the rotation speed of the object.
   * LBAArchitect shows rotation delay instead. Rotation speed is connected to the delay by the formula:
   * `speed = 50 * 1024 / delay`
   */
  getRotationSpeed(): number;

  /**
   * Returns the talk color of the object.
   */
  getTalkColor(): DialogColor;

  /**
   * Returns the entity index of a 3D object.
   */
  getEntity(): number;

  /**
   * Returns the body type of a 3D object.
   */
  getBody(): number;

  /**
   * Returns the animation id of a 3D object.
   */
  getAnimation(): number;

  /**
   * Returns the bonus quantity of the object.
   */
  getBonusQuantity(): number;

  /**
   * Returns the control mode of the object.
   * @see {@link ControlModes}
   */
  getControlMode(): ControlMode;

  /**
   * Returns the sprite ID for a sprite object.
   */
  getSpriteId(): number;

  /**
   * Returns true if the life script is present for this object.
   */
  getLifeScript(): boolean;

  /**
   * Returns true if the move script is present for this object.
   */
  getMoveScript(): boolean;

  /**
   * Returns true if the object is facing the specified zone direction.
   * This should usually be used with the sceneric zones, when you already checked the player is inside the zone.
   * @param zoneId The ID of the zone to check.
   * @param direction The direction to check against this zone.
   *  If not specified or 0, it checks if the object is facing the direction from Info2 register of the zone.
   * @see {@link ZoneDirections}
   */
  isFacingZoneDirection(zoneId: number, direction?: ZoneDirection): boolean;

  /**
   * Sets the control mode of the object.
   * Might have no effect for some objects, for example, the hero, when set through the scene setup.
   * In this case should be set through the life script, {@link LifeOpcodes.LM_SET_CONTROL}.
   * @see {@link ControlModes}
   */
  setControlMode(controlMode: ControlMode): void;

  /**
   * Sets the static flags of the object.
   * @param staticFlags The numeric value representing the static flags.
   * @see {@link StaticFlags}
   */
  setStaticFlags(staticFlags: number): void;

  /**
   * Sets the bonus flags of the object.
   * @param bonusFlags The numeric value representing the bonus flags.
   * @see {@link BonusFlags}
   */
  setBonusFlags(bonusFlags: number): void;

  /**
   * Sets the bonus quantity of the object.
   * @param bonusQuantity The number of bonus items for the object.
   */
  setBonusQuantity(bonusQuantity: number): void;

  /**
   * Sets the position of the object in the world.
   * @param pos Array of 3 numbers: [x, y, z].
   */
  setPos(pos: [number, number, number]): void;

  /**
   * Sets the angle of the object around Y in 0-4096 degrees.
   * @param angle The angle value.
   */
  setAngle(angle: number): void;

  /**
   * Sets the object info registers.
   * @param registers Array of 4 numbers: [Info, Info1, Info2, Info3].
   */
  setRegisters(registers: [number, number, number, number]): void;

  /**
   * Sets the life points of the object.
   * @param lifePoints The life points value.
   */
  setLifePoints(lifePoints: number): void;

  /**
   * Sets the armor value of the object.
   * @param armor The armor value.
   */
  setArmor(armor: number): void;

  /**
   * Sets the hit power of the object.
   * @param hitPower The hit power value.
   */
  setHitPower(hitPower: number): void;

  /**
   * Sets the rotation speed of the object.
   * @param rotationSpeed The rotation speed value should be an integer from -32768 to 32767.
   * LBAArchitect shows rotation delay instead. Rotation speed is connected to the delay by the formula:
   * `speed = 50 * 1024 / delay`
   */
  setRotationSpeed(rotationSpeed: number): void;

  /**
   * Sets the talk color of the object.
   * @param talkColor The talk color value from 0 to 15.
   */
  setTalkColor(talkColor: DialogColor): void;

  /**
   * Sets the entity index of a 3D object.
   * @param entity The entity index.
   */
  setEntity(entity: number): void;

  /**
   * Sets the body type of a 3D object.
   * @param body The body type value.
   */
  setBody(body: number): void;

  /**
   * Sets the animation id of a 3D object.
   * @param animation The animation id.
   */
  setAnimation(animation: number): void;

  /**
   * Sets the sprite ID for a sprite object.
   * @param spriteId The sprite ID value.
   */
  setSpriteId(spriteId: number): void;

  /**
   * Checks if the object is disabled (dead)
   * @see {@link disable}
   */
  isDisabled(): boolean;

  /**
   * Disables the object, making it inactive (dead) in the scene.
   *
   * Use this in the scene setup, when you need to delete an object from the scene permanently or temporarily.
   *
   * This is analogous to calling {@link LifeOpcodes.LM_KILL_OBJ} life script function later, in a life handler.
   *
   * The object will not be updated or rendered, but can be still resurrected later by {@link LifeOpcodes.LM_SET_LIFE_POINT_OBJ} or {@link LifeOpcodes.LM_ADD_LIFE_POINT_OBJ} life script functions.
   */
  disable(): void;

  /**
   * If called, the life script of this object will be handled by Ida.
   * It is still possible to execute the vanilla life script of the object afterwards (controlled by the callback return value).
   
   * @param callback The user function containing custom life commands for this object, will be called each frame.
   * This function should return true if the vanilla life script should be executed afterwards, false or nothing otherwise.
   * If callback is not specified, no life scripts will be executed for this object.
   */
  handleLifeScript(callback?: (objectId: number) => boolean | void): void;

  /**
   * If called, the move script of this object will be handled by Ida, so it will enable Ida coroutines for this object.
   * This action is irreversible in the context of the current loaded scene.
   * No more vanilla move script will be executed for this object until the scene is reloaded.
   */
  handleMoveScript(): void;
}
