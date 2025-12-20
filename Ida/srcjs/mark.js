const { EnumHandler, FlagsHandler } = require("./enums");
const { deepFreeze } = require("./utils");

const markProto = {
  GameLoops: {
    None: 0,
    GameMenu: 1,
    Game: 2,
  },
  InputFlags: {
    UP: 1 << 0, // 'UP' - Move Forward
    DOWN: 1 << 1, // 'DOWN' - Move Backward
    LEFT: 1 << 2, // 'LEFT' - Turn Left
    RIGHT: 1 << 3, // 'RIGHT' - Turn Right
    THROW: 1 << 4, // 'ALT' - Use Weapon
    BEHAVIOR: 1 << 5, // 'CTRL' - Behavior Menu
    INVENTORY: 1 << 6, // 'SHIFT', 'I' - Inventory
    ACTION_MODAL: 1 << 7, // 'SPACE' - Behavior Action
    ACTION_ALWAYS: 1 << 8, // 'W' - Dialogue/Search
    RETURN: 1 << 9, // 'RETURN' - Camera Recenter
    MENUS: 1 << 10, // 'ESC' - Menus
    HOLOMAP: 1 << 11, // 'H' - Holomap
    PAUSE: 1 << 12, // 'P' - Pause
    DODGE: 1 << 13, // 'X' - Dodge
    NORMAL: 1 << 14, // 'F5' - Normal Behavior
    ATHLETIC: 1 << 15, // 'F6' - Athletic Behavior
    AGGRESSIVE: 1 << 16, // 'F7' - Aggressive Behavior
    DISCREET: 1 << 17, // 'F8' - Discreet Behavior
    HELP: 1 << 18, // 'F1' - Online Help
    SAVE: 1 << 19, // 'F2' and 'S' - Save
    LOAD: 1 << 20, // 'F3' and 'L' - Load
    OPTIONS: 1 << 21, // 'F4' and 'O' - Options Menu
    CAMERA: 1 << 22, // '²' - Rotate Camera
    CAMERA_LEVEL_UP: 1 << 23, // '+' - Next Camera Level
    CAMERA_LEVEL_DOWN: 1 << 24, // '-' - Previous Camera Level
    WEAPON_1: 1 << 25, // '1' - Weapon 1 (Magic Ball)
    WEAPON_2: 1 << 26, // '2' - Weapon 2 (Magic Ball)
    WEAPON_3: 1 << 27, // '3' - Weapon 3 (Magic Ball)
    WEAPON_4: 1 << 28, // '4' - Weapon 4 (Magic Ball)
    WEAPON_5: 1 << 29, // '5' - Weapon 5 (Magic Ball)
    WEAPON_6: 1 << 30, // '6' - Weapon 6 (Magic Ball)
    WEAPON_7: 1 << 31, // '7' - Weapon 7 (Magic Ball)
  },
};

markProto.GameLoops.$ = new EnumHandler(markProto.GameLoops);
markProto.InputFlags.$ = new FlagsHandler(markProto.InputFlags);
deepFreeze(markProto);

module.exports.markProto = markProto;
