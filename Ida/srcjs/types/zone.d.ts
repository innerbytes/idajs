import type { ZoneType, ZoneTypes } from "./objectHelper";
import type { SceneEvents } from "./scene";

/**
 * The Zone object provides the API to read and modify scene zones properties.
 *
 * Zones are invisible bounded boxes on the scene, that recognize when player or other actors are inside them. They can be used to interract, trigger events, display text, give items, etc.
 *
 * The setters of the zone can only be used in the scene setup phase (see {@link SceneEvents.afterLoadScene} event).
 *
 * @see {@link ZoneTypes} - to see all possible zone types.
 */
export interface Zone {
  /**
   * Returns the id of the zone (the index of the zone in the scene).
   */
  getId(): number;

  /**
   * Returns the lowest bounding box corner of the zone as [x, y, z] (West, Down, North)
   * @returns Array of 3 values representing the position as [x, y, z]
   */
  getPos1(): number[];

  /**
   * Returns the highest bounding box corner of the zone as [x, y, z] (East, Up, South)
   * @returns Array of 3 values representing the position as [x, y, z]
   */
  getPos2(): number[];

  /**
   * Returns the registers of the zone as an array of 8 numbers.
   *
   * The meaning of the registers depends on the zone type.
   *
   * This is not documented enough yet. You will need to open the scene in LBArchitect tool, in order to see what each register means for each zone type.
   *
   * @see {@link setRegisters} - to set the zone registers.
   */
  getRegisters(): [number, number, number, number, number, number, number, number];

  /**
   * The zone value is an extra register of the zone, that can have different meaning depending on zone type.
   *
   * This is not documented enough yet. You will need to open the scene in LBArchitect tool, in order to see what the zone value means for each zone type.
   *
   * @see {@link setZoneValue} - to set the zone value.
   */
  getZoneValue(): number;

  /**
   * Returns the type of the zone.
   */
  getType(): ZoneType;

  /**
   * Sets the lowest bounding box corner of the zone (West, Down, North).
   * @param pos Array of 3 numbers: [x, y, z].
   */
  setPos1(pos: number[]): void;

  /**
   * Sets the highest bounding box corner of the zone (East, Up, South).
   * @param pos Array of 3 numbers: [x, y, z].
   */
  setPos2(pos: number[]): void;

  /**
   * Sets the registers of the zone.
   * The meaning of the registers depends on the zone type.
   * @param registers Array of 8 numbers representing the zone registers.
   *
   * @see {@link getRegisters} - for more information.
   */
  setRegisters(registers: [number, number, number, number, number, number, number, number]): void;

  /**
   * Sets the zone value, which is an extra register of the zone.
   * The meaning depends on the zone type.
   * @param value The zone value to set.
   *
   * @see {@link getZoneValue} - for more information.
   */
  setZoneValue(value: number): void;

  /**
   * Sets the type of the zone.
   *
   * To disable a zone, set its type to {@link ZoneTypes.Disabled}.
   *
   * @param type The zone type value.
   */
  setType(type: ZoneType): void;
}
