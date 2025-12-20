#include "script.h"

#include "../../common/Logger.h"
#include "../core/argumentsHandler.h"

using namespace v8;
using namespace Logger;

namespace Ida
{
    void inscope_loadLifeOperation(Isolate *isolate, IdaBridge *bridge, const FunctionCallbackInfo<Value> &args,
                                   const uint8_t opcode, bool *const result)
    {
        *result = false;

        switch (opcode)
        {
            case LM_PALETTE:
            case LM_BODY:
            case LM_CAMERA_CENTER:
            case LM_FALLABLE:
            case LM_CAM_FOLLOW:
            case LM_COMPORTEMENT_HERO:
            case LM_KILL_OBJ:
            case LM_GIVE_BONUS:
            case LM_CHANGE_CUBE:
            case LM_OBJ_COL:
            case LM_BRICK_COL:
            case LM_INVISIBLE:
            case LM_POS_POINT:
            case LM_SET_MAGIC_LEVEL:
            case LM_SUB_MAGIC_POINT:
            case LM_ECLAIR:
            case LM_FOUND_OBJECT:
            case LM_INIT_BUGGY:
            case LM_MEMO_ARDOISE:
            case LM_SET_HOLO_POS:
            case LM_CLR_HOLO_POS:
            case LM_FADE_TO_PAL:
            case LM_SET_SPRITE:
            case LM_SET_FRAME:
            case LM_SET_FRAME_3DS:
            case LM_BULLE:
            case LM_NO_CHOC:
            case LM_CINEMA_MODE:
            case LM_PLUIE:
            case LM_PLAY_MUSIC:
            case LM_TRACK_TO_VAR_GAME:
            case LM_VAR_GAME_TO_TRACK:
            case LM_ANIM_TEXTURE:
            case LM_SET_USED_INVENTORY:
            case LM_SET_ARMURE:
            case LM_BACKGROUND:
            case LM_STOP_L_TRACK_OBJ:
            case LM_RESTORE_L_TRACK_OBJ:
            case LM_SAVE_COMPORTEMENT_OBJ:
            case LM_RESTORE_COMPORTEMENT_OBJ: {
                VALIDATE_ARGS_COUNT(3)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                bridge->prepareLifeScript(opcode, 1);
                bridge->pushArgument(arg0);
            }
            break;
            // 3-4 arguments
            case LM_SET_CONTROL: {
                VALIDATE_ARGS_COUNT(3)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], movementMode, 0, 255);
                size_t argSize = 1;
                uint8_t actor;
                if (movementMode == MOVE_FOLLOW || movementMode == MOVE_CIRCLE || movementMode == MOVE_CIRCLE2)
                {
                    VALIDATE_ARGS_COUNT(4)
                    VALIDATE_VALUE(uint8_t, Uint32, args[3], _arg, 0, 255);
                    actor = _arg;
                    argSize++;
                }

                bridge->prepareLifeScript(opcode, argSize);
                bridge->pushArgument(movementMode);
                if (argSize > 1)
                {
                    bridge->pushArgument(actor);
                }
            }
            break;
            // 4-5 arguments
            case LM_SET_CONTROL_OBJ: {
                VALIDATE_ARGS_COUNT(4)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                VALIDATE_VALUE(uint8_t, Uint32, args[3], movementMode, 0, 255);
                size_t argSize = 2;
                uint8_t actor;
                if (movementMode == MOVE_FOLLOW || movementMode == MOVE_CIRCLE || movementMode == MOVE_CIRCLE2)
                {
                    VALIDATE_ARGS_COUNT(5)
                    VALIDATE_VALUE(uint8_t, Uint32, args[4], _arg, 0, 255);
                    actor = _arg;
                    argSize++;
                }

                bridge->prepareLifeScript(opcode, argSize);
                bridge->pushArgument(arg0);
                bridge->pushArgument(movementMode);
                if (argSize > 2)
                {
                    bridge->pushArgument(actor);
                }
            }
            break;

            case LM_BODY_OBJ:
            case LM_SET_CAMERA:
            case LM_SHADOW_OBJ:
            case LM_SET_LIFE_POINT_OBJ:
            case LM_SUB_LIFE_POINT_OBJ:
            case LM_HIT_OBJ:
            case LM_SET_GRM:
            case LM_SET_CHANGE_CUBE:
            case LM_ESCALATOR:
            case LM_ECHELLE:
            case LM_SET_ARMURE_OBJ:
            case LM_ADD_LIFE_POINT_OBJ:
            case LM_STATE_INVENTORY:
            case LM_SET_HIT_ZONE:
            case LM_SET_RAIL:
            case LM_FLOW_POINT:
            case LM_FLOW_OBJ:
            case LM_POS_OBJ_AROUND: {
                VALIDATE_ARGS_COUNT(4)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                VALIDATE_VALUE(uint8_t, Uint32, args[3], arg1, 0, 255);
                bridge->prepareLifeScript(opcode, 2);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
            }
            break;
            case LM_PCX: {
                VALIDATE_ARGS_COUNT(4)
                auto maxImageNum = bridge->getFirstPcxId();
                // Allow all SCREEN.HQR images + 1 for custom images
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, maxImageNum);
                VALIDATE_VALUE(uint8_t, Uint32, args[3], arg1, 0, 1);
                bridge->prepareLifeScript(opcode, 2);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
            }
            break;
            case LM_ANIM:
            case LM_ANIM_SET:
            case LM_SET_ANIM_DIAL: {
                VALIDATE_ARGS_COUNT(3)
                VALIDATE_VALUE(uint16_t, Uint32, args[2], arg0, 0, std::numeric_limits<uint16_t>::max());
                bridge->prepareLifeScript(opcode, 2);
                bridge->pushArgument(arg0);
            }
            break;
            case LM_ANIM_OBJ: {
                VALIDATE_ARGS_COUNT(4)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                VALIDATE_VALUE(uint16_t, Uint32, args[3], arg1, 0, std::numeric_limits<uint16_t>::max());
                bridge->prepareLifeScript(opcode, 3);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
            }
            break;
            case LM_SET_TRACK:
            case LM_BETA:
            case LM_MESSAGE:
            case LM_SET_COMPORTEMENT:
            case LM_GIVE_GOLD_PIECES:
            case LM_SET_DOOR_LEFT:
            case LM_SET_DOOR_RIGHT:
            case LM_SET_DOOR_UP:
            case LM_SET_DOOR_DOWN:
            case LM_ADD_CHOICE:
            case LM_ASK_CHOICE:
            case LM_MESSAGE_ZOE:
            case LM_SAMPLE:
            case LM_SAMPLE_RND:
            case LM_SAMPLE_ALWAYS:
            case LM_SAMPLE_STOP:
            case LM_ADD_GOLD_PIECES: {
                VALIDATE_ARGS_COUNT(3)
                VALIDATE_INT16_VALUE(args[2], arg0);
                bridge->prepareLifeScript(opcode, 2);
                bridge->pushArgument(arg0);
            }
            break;
            case LM_SET_TRACK_OBJ:
            case LM_SET_COMPORTEMENT_OBJ:
            case LM_MESSAGE_OBJ:
            case LM_IMPACT_POINT:
            case LM_ASK_CHOICE_OBJ: {
                VALIDATE_ARGS_COUNT(4)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                VALIDATE_INT16_VALUE(args[3], arg1);
                bridge->prepareLifeScript(opcode, 3);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
            }
            break;
            case LM_SUICIDE:
            case LM_END_LIFE:
            case LM_USE_ONE_LITTLE_KEY:
            case LM_STOP_L_TRACK:
            case LM_RESTORE_L_TRACK:
            case LM_INC_CHAPTER:
            case LM_INC_CLOVER_BOX:
            case LM_FULL_POINT:
            case LM_ACTION:
            case LM_SAVE_HERO:
            case LM_RESTORE_HERO:
            case LM_GAME_OVER:
            case LM_THE_END:
            case LM_NO_BODY:
            case LM_BRUTAL_EXIT:
            case LM_SAVE_COMPORTEMENT:
            case LM_RESTORE_COMPORTEMENT:
            case LM_INVERSE_BETA: {
                bridge->prepareLifeScript(opcode, 0);
            }
            break;
            case LM_PLAY_ACF: {
                VALIDATE_ARGS_COUNT(3)
                VALIDATE_STRING(args[2], arg0, true);
                bridge->prepareLifeScript(opcode, 1);
                bridge->pushArgument(arg0.length(), arg0.c_str());
            }
            break;
            case LM_IMPACT_OBJ: {
                VALIDATE_ARGS_COUNT(5)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                VALIDATE_INT16_VALUE(args[3], arg1);
                VALIDATE_INT16_VALUE(args[4], arg2);
                bridge->prepareLifeScript(opcode, 5);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
                bridge->pushArgument(arg2);
            }
            break;
            case LM_REPEAT_SAMPLE: {
                VALIDATE_ARGS_COUNT(4)
                VALIDATE_INT16_VALUE(args[2], arg0);
                VALIDATE_VALUE(uint8_t, Uint32, args[3], arg1, 0, 255);
                bridge->prepareLifeScript(opcode, 3);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
            }
            break;
            case LM_PARM_SAMPLE: {
                VALIDATE_ARGS_COUNT(5)
                VALIDATE_INT16_VALUE(args[2], arg0);
                VALIDATE_VALUE(uint8_t, Uint32, args[3], arg1, 0, 255);
                VALIDATE_INT16_VALUE(args[4], arg2);
                bridge->prepareLifeScript(opcode, 5);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
                bridge->pushArgument(arg2);
            }
            break;
            case LM_NEW_SAMPLE: {
                VALIDATE_ARGS_COUNT(6)
                VALIDATE_INT16_VALUE(args[2], arg0);
                VALIDATE_INT16_VALUE(args[3], arg1);
                VALIDATE_VALUE(uint8_t, Uint32, args[4], arg2, 0, 255);
                VALIDATE_INT16_VALUE(args[5], arg3);
                bridge->prepareLifeScript(opcode, 4);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
                bridge->pushArgument(arg2);
                bridge->pushArgument(arg3);
            }
            break;
            case LM_PCX_MESS_OBJ: {
                VALIDATE_ARGS_COUNT(6)
                auto maxImageNum = bridge->getFirstPcxId();
                // Allow all SCREEN.HQR images + 1 more for the custom ones
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, maxImageNum);
                VALIDATE_VALUE(uint8_t, Uint32, args[3], arg1, 0, 1);
                VALIDATE_VALUE(uint8_t, Uint32, args[4], arg2, 0, 255);
                VALIDATE_INT16_VALUE(args[5], arg3);
                bridge->prepareLifeScript(opcode, 4);
                bridge->pushArgument(arg0);
                bridge->pushArgument(arg1);
                bridge->pushArgument(arg2);
                bridge->pushArgument(arg3);
            }
            break;
            default:
                core::inscope_ThrowError(
                    isolate, "This opcode is not supported for Ida life operations: " + std::to_string(opcode));
                return;
        }

        bridge->finalizeLifeScript();
        *result = true;
    }

    void inscope_loadLifeFunction(v8::Isolate *isolate, IdaBridge *bridge,
                                  const v8::FunctionCallbackInfo<v8::Value> &args, const uint8_t opcode,
                                  bool *const result)
    {
        *result = false;

        switch (opcode)
        {
            case LF_COL:
            case LF_ZONE:
            case LF_L_TRACK:
            case LF_HIT_BY:
            case LF_ACTION:
            case LF_COMPORTEMENT_HERO:
            case LF_CHOICE:
            case LF_CARRY_BY:
            case LF_COL_DECORS: {
                bridge->prepareLifeFunction(opcode, 0);
            }
            break;
            case LF_COL_OBJ:
            case LF_DISTANCE:
            case LF_ZONE_OBJ:
            case LF_L_TRACK_OBJ:
            case LF_CONE_VIEW:
            case LF_DISTANCE_3D:
            case LF_USE_INVENTORY:
            case LF_ECHELLE:
            case LF_RAIL:
            case LF_CARRY_OBJ_BY:
            case LF_ANGLE:
            case LF_DISTANCE_MESSAGE:
            case LF_HIT_OBJ_BY:
            case LF_REAL_ANGLE:
            case LF_COL_DECORS_OBJ:
            case LF_OBJECT_DISPLAYED:
            case LF_ANGLE_OBJ: {
                VALIDATE_ARGS_COUNT(3)
                VALIDATE_VALUE(uint8_t, Uint32, args[2], arg0, 0, 255);
                bridge->prepareLifeFunction(opcode, 1);
                bridge->pushArgument(arg0);
            }
            break;
            default:
                core::inscope_ThrowError(
                    isolate, "Such opcode is not supported for Ida life functions: " + std::to_string(opcode) +
                                 "; This value is probably accessible through an ida function directly");
                return;
        }

        *result = true;
    }

    void inscope_loadMoveOperation(Isolate *isolate, IdaBridge *bridge, const FunctionCallbackInfo<Value> &args,
                                   const size_t objectId, const uint8_t opcode, bool *const result)
    {
        const int baseArgsCount = 3;

        *result = false;
        switch (opcode)
        {
            // No arguments
            case TM_WAIT_ANIM:
            case TM_NO_BODY:
            case TM_CLOSE:
            case TM_WAIT_DOOR:
            case TM_STOP_ANIM_3DS:
            case TM_WAIT_ANIM_3DS: {
                bridge->prepareMoveScript(objectId, opcode, 0);
            }
            break;

            // Single u8 argument
            case TM_BODY:
            case TM_GOTO_POINT:
            case TM_POS_POINT:
            case TM_GOTO_SYM_POINT:
            case TM_GOTO_POINT_3D:
            case TM_BACKGROUND:
            case TM_SET_FRAME:
            case TM_SET_FRAME_3DS:
            case TM_SET_START_3DS:
            case TM_SET_END_3DS:
            case TM_START_ANIM_3DS:
            case TM_WAIT_FRAME_3DS:
            case TM_VOLUME: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 1)
                VALIDATE_VALUE(uint8_t, Uint32, args[baseArgsCount], arg0, 0, 255);
                bridge->prepareMoveScript(objectId, opcode, 1);
                bridge->pushMoveArgument(objectId, arg0);
            }
            break;

            // Single u16 argument
            case TM_ANIM: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 1)
                VALIDATE_VALUE(uint16_t, Uint32, args[baseArgsCount], arg0, 0, 65535);
                bridge->prepareMoveScript(objectId, opcode, 2);
                bridge->pushMoveArgument(objectId, arg0);
            }
            break;

            // Single i16 argument
            case TM_ANGLE:
            case TM_SAMPLE:
            case TM_SPEED:
            case TM_BETA:
            case TM_OPEN_LEFT:
            case TM_OPEN_RIGHT:
            case TM_OPEN_UP:
            case TM_OPEN_DOWN:
            case TM_SAMPLE_RND:
            case TM_SAMPLE_ALWAYS:
            case TM_SAMPLE_STOP:
            case TM_REPEAT_SAMPLE:
            case TM_SIMPLE_SAMPLE:
            case TM_FACE_TWINSEN:
            case TM_SPRITE:
            case TM_DECALAGE:
            case TM_FREQUENCE: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 1)
                VALIDATE_INT16_VALUE(args[baseArgsCount], arg0);
                bridge->prepareMoveScript(objectId, opcode, 2);
                bridge->pushMoveArgument(objectId, arg0);
            }
            break;

            // Two u8 arguments
            case TM_WAIT_NB_ANIM: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 2)
                VALIDATE_VALUE(uint8_t, Uint32, args[baseArgsCount], arg0, 0, 255);
                VALIDATE_VALUE(uint8_t, Uint32, args[baseArgsCount + 1], arg1, 0, 255);
                bridge->prepareMoveScript(objectId, opcode, 2);
                bridge->pushMoveArgument(objectId, arg0);
                bridge->pushMoveArgument(objectId, arg1);
            }
            break;

            // Two i16 arguments
            case TM_ANGLE_RND: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 2)
                VALIDATE_INT16_VALUE(args[baseArgsCount], arg0);
                VALIDATE_INT16_VALUE(args[baseArgsCount + 1], arg1);
                bridge->prepareMoveScript(objectId, opcode, 4);
                bridge->pushMoveArgument(objectId, arg0);
                bridge->pushMoveArgument(objectId, arg1);
            }
            break;

            // Wait commands (u8, u32:0)
            case TM_WAIT_NB_SECOND:
            case TM_WAIT_NB_DIZIEME:
            case TM_WAIT_NB_SECOND_RND:
            case TM_WAIT_NB_DIZIEME_RND: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 1)
                VALIDATE_VALUE(uint8_t, Uint32, args[baseArgsCount], arg0, 0, 255);
                uint32_t arg1 = 0;  // Second argument should always be zero for those opcodes
                bridge->prepareMoveScript(objectId, opcode, 5);
                bridge->pushMoveArgument(objectId, arg0);
                bridge->pushMoveArgument(objectId, arg1);
            }
            break;

            // String argument
            case TM_PLAY_ACF: {
                VALIDATE_ARGS_COUNT(baseArgsCount + 1)
                VALIDATE_STRING(args[baseArgsCount], arg0, true);
                bridge->prepareMoveScript(objectId, opcode, arg0.length());
                bridge->pushMoveArgument(objectId, arg0.length(), arg0.c_str());
            }
            break;

            default:
                core::inscope_ThrowError(
                    isolate, "This opcode is not supported for Ida move operations: " + std::to_string(opcode) +
                                 "; Use Ida javascript functions instead.");
                return;
        }

        bridge->finalizeMoveScript(objectId);
        *result = true;
    }

    bool loadSavedMoveOperation(IdaBridge *bridge, const size_t objectId,
                                std::vector<uint8_t, std::allocator<uint8_t>> &code, const uint8_t opcode)
    {
        if (opcode != code[0])
        {
            err() << "Error restoring move operation. Expected opcode did not match the restored operation opcode: "
                  << static_cast<int>(opcode) << " != " << static_cast<int>(code[0]);
            return false;
        }

        bridge->loadMoveScript(objectId, code.size(), code.data());
        return true;
    }

    int convertResult(const int input, const uint8_t returnType)
    {
        switch (static_cast<LifeFunctionReturnType>(returnType))
        {
            case LifeFunctionReturnType::INT8:
                int8_t result8;
                std::memcpy(&result8, &input, sizeof(result8));
                return result8;
            case LifeFunctionReturnType::INT16:
                int16_t result16;
                std::memcpy(&result16, &input, sizeof(result16));
                return result16;
            case LifeFunctionReturnType::UINT8:
                uint8_t resultU8;
                std::memcpy(&resultU8, &input, sizeof(resultU8));
                return resultU8;
            default:
                return input;
        }
    }
}  // namespace Ida
