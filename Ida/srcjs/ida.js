const { EnumHandler, FlagsHandler } = require("./enums");
const { deepFreeze } = require("./utils");
const epp = require("./epp");

const idaProto = {
  LogLevels: {
    Debug: 0,
    Info: 1,
    Warning: 2,
    Error: 3,
    None: 4,
  },
  Life: {
    // Life operations (LM_*)
    LM_PALETTE: 0x0a,
    LM_BODY: 0x11,
    LM_BODY_OBJ: 0x12,
    LM_ANIM: 0x13,
    LM_ANIM_OBJ: 0x14,
    LM_SET_CAMERA: 0x15,
    LM_CAMERA_CENTER: 0x16,
    LM_SET_TRACK: 0x17,
    LM_SET_TRACK_OBJ: 0x18,
    LM_MESSAGE: 0x19,
    LM_FALLABLE: 0x1a,
    LM_SET_CONTROL: 0x1b,
    LM_SET_CONTROL_OBJ: 0x1c,
    LM_CAM_FOLLOW: 0x1d,
    LM_COMPORTEMENT_HERO: 0x1e,
    LM_SET_COMPORTEMENT: 0x21,
    LM_SET_COMPORTEMENT_OBJ: 0x22,
    LM_KILL_OBJ: 0x25,
    LM_SUICIDE: 0x26,
    LM_USE_ONE_LITTLE_KEY: 0x27,
    LM_GIVE_GOLD_PIECES: 0x28,
    LM_END_LIFE: 0x29,
    LM_STOP_L_TRACK: 0x2a,
    LM_RESTORE_L_TRACK: 0x2b,
    LM_MESSAGE_OBJ: 0x2c,
    LM_FOUND_OBJECT: 0x2e,
    LM_SET_DOOR_WEST: 0x2f,
    LM_SET_DOOR_EAST: 0x30,
    LM_SET_DOOR_NORTH: 0x31,
    LM_SET_DOOR_SOUTH: 0x32,
    LM_GIVE_BONUS: 0x33,
    LM_CHANGE_CUBE: 0x34,
    LM_OBJ_COL: 0x35,
    LM_BRICK_COL: 0x36,
    LM_INVISIBLE: 0x38,
    LM_SHADOW_OBJ: 0x39,
    LM_POS_POINT: 0x3a,
    LM_SET_MAGIC_LEVEL: 0x3b,
    LM_SUB_MAGIC_POINT: 0x3c,
    LM_SET_LIFE_POINT_OBJ: 0x3d,
    LM_SUB_LIFE_POINT_OBJ: 0x3e,
    LM_HIT_OBJ: 0x3f,
    LM_PLAY_ACF: 0x40,
    LM_ECLAIR: 0x41,
    LM_INC_CLOVER_BOX: 0x42,
    LM_SET_USED_INVENTORY: 0x43,
    LM_ADD_CHOICE: 0x44,
    LM_ASK_CHOICE: 0x45,
    LM_INIT_BUGGY: 0x46,
    LM_MEMO_ARDOISE: 0x47,
    LM_SET_HOLO_POS: 0x48,
    LM_CLR_HOLO_POS: 0x49,
    LM_SET_GRM: 0x4c,
    LM_SET_CHANGE_CUBE: 0x4d,
    LM_MESSAGE_ZOE: 0x4e,
    LM_FULL_POINT: 0x4f,
    LM_BETA: 0x50,
    LM_FADE_TO_PAL: 0x51,
    LM_ACTION: 0x52,
    LM_SET_FRAME: 0x53,
    LM_SET_SPRITE: 0x54,
    LM_SET_FRAME_3DS: 0x55,
    LM_IMPACT_OBJ: 0x56,
    LM_IMPACT_POINT: 0x57,
    LM_BULLE: 0x59,
    LM_NO_CHOC: 0x5a,
    LM_ASK_CHOICE_OBJ: 0x5b,
    LM_CINEMA_MODE: 0x5c,
    LM_SAVE_HERO: 0x5d,
    LM_RESTORE_HERO: 0x5e,
    LM_ANIM_SET: 0x5f,
    LM_PLUIE: 0x60,
    LM_GAME_OVER: 0x61,
    LM_THE_END: 0x62,
    LM_ESCALATOR: 0x63,
    LM_PLAY_MUSIC: 0x64,
    LM_TRACK_TO_VAR_GAME: 0x65,
    LM_VAR_GAME_TO_TRACK: 0x66,
    LM_ANIM_TEXTURE: 0x67,
    LM_BRUTAL_EXIT: 0x69,
    LM_ECHELLE: 0x6b,
    LM_SET_ARMURE: 0x6c,
    LM_SET_ARMURE_OBJ: 0x6d,
    LM_ADD_LIFE_POINT_OBJ: 0x6e,
    LM_STATE_INVENTORY: 0x6f,
    LM_SET_HIT_ZONE: 0x77,
    LM_SAVE_COMPORTEMENT: 0x78,
    LM_RESTORE_COMPORTEMENT: 0x79,
    LM_SAMPLE: 0x7a,
    LM_SAMPLE_RND: 0x7b,
    LM_SAMPLE_ALWAYS: 0x7c,
    LM_SAMPLE_STOP: 0x7d,
    LM_REPEAT_SAMPLE: 0x7e,
    LM_BACKGROUND: 0x7f,
    LM_SET_RAIL: 0x85,
    LM_INVERSE_BETA: 0x86,
    LM_NO_BODY: 0x87,
    LM_ADD_GOLD_PIECES: 0x88,
    LM_STOP_L_TRACK_OBJ: 0x89,
    LM_RESTORE_L_TRACK_OBJ: 0x8a,
    LM_SAVE_COMPORTEMENT_OBJ: 0x8b,
    LM_RESTORE_COMPORTEMENT_OBJ: 0x8c,
    LM_FLOW_POINT: 0x91,
    LM_FLOW_OBJ: 0x92,
    LM_SET_ANIM_DIAL: 0x93,
    LM_PCX: 0x94,
    LM_PARM_SAMPLE: 0x97,
    LM_NEW_SAMPLE: 0x98,
    LM_POS_OBJ_AROUND: 0x99,
    LM_PCX_MESS_OBJ: 0x9a,

    // Life Functions (LF_*)
    LF_COL: 0x00,
    LF_COL_OBJ: 0x01,
    LF_DISTANCE: 0x02,
    LF_ZONE: 0x03,
    LF_ZONE_OBJ: 0x04,
    LF_L_TRACK: 0x09,
    LF_L_TRACK_OBJ: 0x0a,
    LF_CONE_VIEW: 0x0c,
    LF_HIT_BY: 0x0d,
    LF_ACTION: 0x0e,
    LF_COMPORTEMENT_HERO: 0x14,
    LF_DISTANCE_3D: 0x16,
    LF_USE_INVENTORY: 0x19,
    LF_CHOICE: 0x1a,
    LF_CARRY_BY: 0x1c,
    LF_ECHELLE: 0x1e,
    LF_RAIL: 0x20,
    LF_CARRY_OBJ_BY: 0x23,
    LF_ANGLE: 0x24,
    LF_DISTANCE_MESSAGE: 0x25,
    LF_HIT_OBJ_BY: 0x26,
    LF_REAL_ANGLE: 0x27,
    LF_COL_DECORS: 0x29,
    LF_COL_DECORS_OBJ: 0x2a,
    LF_OBJECT_DISPLAYED: 0x2c,
    LF_ANGLE_OBJ: 0x2d,
  },
  Move: {
    // Move operations (TM_*)
    TM_BODY: 0x02,
    TM_ANIM: 0x03,
    TM_GOTO_POINT: 0x04,
    TM_WAIT_ANIM: 0x05,
    TM_ANGLE: 0x07,
    TM_POS_POINT: 0x08,
    TM_GOTO_POINT_BACK: 0x0c,
    TM_WAIT_NB_ANIM: 0x0d,
    TM_SAMPLE: 0x0e,
    TM_GOTO_POINT_3D: 0x0f,
    TM_SPEED: 0x10,
    TM_BACKGROUND: 0x11,
    TM_WAIT_NB_SECOND: 0x12,
    TM_NO_BODY: 0x13,
    TM_BETA: 0x14,
    TM_OPEN_WEST: 0x15,
    TM_OPEN_EAST: 0x16,
    TM_OPEN_NORTH: 0x17,
    TM_OPEN_SOUTH: 0x18,
    TM_CLOSE: 0x19,
    TM_WAIT_DOOR: 0x1a,
    TM_SAMPLE_RND: 0x1b,
    TM_SAMPLE_ALWAYS: 0x1c,
    TM_SAMPLE_STOP: 0x1d,
    TM_PLAY_ACF: 0x1e,
    TM_REPEAT_SAMPLE: 0x1f,
    TM_SIMPLE_SAMPLE: 0x20,
    TM_FACE_TWINSEN: 0x21,
    TM_ANGLE_RND: 0x22,
    TM_WAIT_NB_DIZIEME: 0x24,
    TM_SPRITE: 0x26,
    TM_WAIT_NB_SECOND_RND: 0x27,
    TM_SET_FRAME: 0x29,
    TM_SET_FRAME_3DS: 0x2a,
    TM_SET_START_3DS: 0x2b,
    TM_SET_END_3DS: 0x2c,
    TM_START_ANIM_3DS: 0x2d,
    TM_STOP_ANIM_3DS: 0x2e,
    TM_WAIT_ANIM_3DS: 0x2f,
    TM_WAIT_FRAME_3DS: 0x30,
    TM_WAIT_NB_DIZIEME_RND: 0x31,
    TM_DECALAGE: 0x32,
    TM_FREQUENCE: 0x33,
    TM_VOLUME: 0x34,
  },

  StormModes: {
    None: 0,
    ForceStorm: 1,
    ForceNoStorm: 2,
  },

  IslandOverrides: {
    None: 0,
    CitadelBeforeAliens: 1,
    CitadelAfterAliens: 2,
    CelebrationNormal: 3,
    CelebrationRisen: 4,
  },

  getBodies: function (entityId) {
    const allBodies = this._getBodies(entityId);
    if (Object.keys(allBodies).length === 0) {
      return {};
    }

    const lba2Body = require("./lba2Body");

    return Object.fromEntries(
      Object.entries(allBodies).map(([key, hqrBodyId]) => [
        key,
        lba2Body[hqrBodyId] || `Unknown Body (${hqrBodyId})`,
      ])
    );
  },
  setLogLevel: function (level) {
    if (typeof level !== "number" || level < 0 || level > 4) {
      throw new Error("Invalid log level. Must be a number between 0 and 4.");
    }
    globalThis._logLevel = level;
    this._setLogLevel(level);
  },
  setEppEnabled: function (enabled) {
    if (typeof enabled !== "boolean") {
      throw new Error("Invalid EPP enabled flag. Must be a boolean.");
    }
    epp.setEnabled(enabled);
    this._setEppEnabled(enabled);
  },
};

idaProto.LogLevels.$ = new EnumHandler(idaProto.LogLevels);
idaProto.Life.$ = new EnumHandler(idaProto.Life);
idaProto.Move.$ = new EnumHandler(idaProto.Move);
idaProto.StormModes.$ = new EnumHandler(idaProto.StormModes);
idaProto.IslandOverrides.$ = new EnumHandler(idaProto.IslandOverrides);
deepFreeze(idaProto);

module.exports.idaProto = idaProto;
