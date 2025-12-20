const { EnumHandler, FlagsHandler } = require("./enums");
const { deepFreeze } = require("./utils");

// Scene objects facilitators
const object = {
  ControlModes: {
    NoMovement: 0,
    PlayerControl: 1,
    FollowActor: 2, // opcode has extra param: uint8: actor to follow
    SameXZAsActor: 6,
    MecaPenguin: 7,
    RailCart: 8,
    CirclePoint: 9, // opcode has extra param: uint8: point index
    CirclePointFace: 10, // opcode has extra param: uint8: point index
    SameXZAndAngleAsActor: 11,
    Car: 12,
    CarPlayerControl: 13,
  },
  Flags: {
    CheckCollisionsWithActors: 1 << 0, // test des collisions et hit obj - Cpp original name: CHECK_OBJ_COL
    CheckCollisionsWithScene: 1 << 1, // test des collisions decors - Cpp original name: CHECK_BRICK_COL
    CheckScenericZones: 1 << 2, // test des zones scenariques - Cpp original name: CHECK_ZONE
    SpriteClipping: 1 << 3, // (portes) zone de clip fixe - Cpp original name: SPRITE_CLIP
    Pushable: 1 << 4, // poussable - Cpp original name: PUSHABLE
    CheckLowCollisionsOnly: 1 << 5, // 1 = pas test des collisions hautes TWINSEN - Cpp original name: COL_BASSE
    CheckDrowning: 1 << 6, // Special checks, for example drowning in water, lava, etc - Cpp original name: CHECK_CODE_JEU
    CheckFloorCollisionsOnly: 1 << 7, // test uniquement les collisions au sol - Cpp original name: CHECK_ONLY_FLOOR
    Invisible: 1 << 9, // not drawn but all computed - Cpp original name: INVISIBLE
    IsSprite: 1 << 10, // un sprite pas un 3DO - Cpp original name: SPRITE_3D
    CanFall: 1 << 11, // peut tomber - Cpp original name: OBJ_FALLABLE
    NoShadow: 1 << 12, // pas d'ombre auto - Cpp original name: NO_SHADOW
    Backgrounded: 1 << 13, // s'incruste dans le decor la 1er fois - Cpp original name: OBJ_BACKGROUND
    CanCarry: 1 << 14, // peut porter et deplacer un obj - Cpp original name: OBJ_CARRIER
    SmallZV: 1 << 15, // zv carre sur plus petit cote (si 3DO) - Cpp original name: MINI_ZV
    InvalidCarrierPosition: 1 << 16, // Carrier considéré comme Pos invalide - Cpp original name: POS_INVALIDE
    NoShock: 1 << 17, // Ne déclenche pas d'anim choc - Cpp original name: NO_SHOCK
    HasSpriteAnimation: 1 << 18, // Animation 3DS (extension de sprite_3D) - Cpp original name: ANIM_3DS
    NoPreClipping: 1 << 19, // Ne préclippe pas l'objet (pour les grands objets) - Cpp original name: NO_PRE_CLIP
    UseZBuffer: 1 << 20, // Affiche objet en ZBuffer (extérieur only !) - Cpp original name: OBJ_ZBUFFER
    IsInWater: 1 << 21, // Affiche objet en ZBuffer dans l'eau (extérieur only !) - Cpp original name: OBJ_IN_WATER
  },
  Bonuses: {
    NOTHING: 1 << 0,
    MONEY: 1 << 4,
    LIFE: 1 << 5,
    MAGIC: 1 << 6,
    KEY: 1 << 7,
    CLOVER: 1 << 8,
  },
  ZoneTypes: {
    Disabled: -1,
    Teleport: 0,
    Camera: 1,
    Sceneric: 2,
    Fragment: 3,
    Bonus: 4,
    Text: 5,
    Ladder: 6,
    Conveyor: 7,
    Spike: 8,
    Rail: 9,
  },
  ZoneDirections: {
    None: 0,
    North: 1,
    South: 2,
    East: 4,
    West: 8,
  },
  TwinsenStances: {
    Normal: 0, // C_NORMAL
    Athletic: 1, // C_SPORTIF
    Aggressive: 2, // C_AGRESSIF
    Discreet: 3, // C_DISCRET
    Protopack: 4, // C_PROTOPACK
    Double: 5, // C_DOUBLE - Twinsen + Zoé
    Horn: 6, // C_CONQUE
    SpaceNormalIndoor: 7, // C_SCAPH_INT_NORM - Scaphandre Interieur Normal
    Jetpack: 8, // C_JETPACK - SuperJetPack
    SpaceAthleticIndoor: 9, // C_SCAPH_INT_SPOR - Scaphandre Interieur Sportif
    SpaceNormalOutdoor: 10, // C_SCAPH_EXT_NORM - Scaphandre Exterieur Normal
    SpaceAthleticOutdoor: 11, // C_SCAPH_EXT_SPOR - Scaphandre Exterieur Sportif
    Buggy: 12, // C_BUGGY - Conduite du buggy
    Skeleton: 13, // C_SKELETON - Squelette Electrique
  },

  // Direction vectors
  North: [0, 0, -1],
  South: [0, 0, 1],
  East: [1, 0, 0],
  West: [-1, 0, 0],
  Up: [0, 1, 0],
  Down: [0, -1, 0],

  directionToAngle: function (direction) {
    // Check if it's a vector [x, y, z]
    if (Array.isArray(direction) && direction.length === 3) {
      const [x, , z] = direction; // Ignore y component

      // Handle zero vector case
      if (x === 0 && z === 0) {
        console.warn("Zero vector passed to directionToAngle, returning 0");
        return 0;
      }

      // Calculate angle using atan2: Z+ is 0°, X+ is 90°, Z- is 180°, X- is 270°
      // atan2(x, z) gives us the correct mapping where:
      // - Z+ (0, 0, 1) -> atan2(0, 1) = 0° -> 0 angle units
      // - X+ (1, 0, 0) -> atan2(1, 0) = 90° -> 1024 angle units
      // - Z- (0, 0, -1) -> atan2(0, -1) = 180° -> 2048 angle units
      // - X- (-1, 0, 0) -> atan2(-1, 0) = -90° = 270° -> 3072 angle units
      const radians = Math.atan2(x, z);
      return this.radiansToAngle(radians);
    }

    // Handle zone direction enum values
    switch (direction) {
      case this.ZoneDirections.South:
        return 0;
      case this.ZoneDirections.East:
        return 1024;
      case this.ZoneDirections.North:
        return 2048;
      case this.ZoneDirections.West:
        return 3072;
      default:
        console.error("Unknown zone direction: ", direction);
        return 0;
    }
  },
  degreesToAngle: function (degrees) {
    return Math.round((degrees * 4096) / 360.0);
  },
  angleToDegrees: function (angle) {
    return (angle * 360) / 4096.0;
  },
  radiansToAngle: function (radians) {
    return Math.round((radians * 4096) / (2 * Math.PI));
  },
  angleToRadians: function (angle) {
    return (angle * (2 * Math.PI)) / 4096.0;
  },
};
object.ControlModes.$ = new EnumHandler(object.ControlModes);
object.Flags.$ = new FlagsHandler(object.Flags);
object.Bonuses.$ = new FlagsHandler(object.Bonuses);
object.ZoneTypes.$ = new EnumHandler(object.ZoneTypes);
object.ZoneDirections.$ = new EnumHandler(object.ZoneDirections);
object.TwinsenStances.$ = new EnumHandler(object.TwinsenStances);
deepFreeze(object);

module.exports.object = object;
