// This file contains helper functions to execute Life and Track scripts from the Ida engine

#pragma once

#include <v8.h>

#include "../IdaBridge.h"

namespace Ida
{
    void inscope_loadLifeOperation(v8::Isolate *isolate, IdaBridge *bridge,
                                   const v8::FunctionCallbackInfo<v8::Value> &args, const uint8_t opcode,
                                   bool *const result);

    void inscope_loadLifeFunction(v8::Isolate *isolate, IdaBridge *bridge,
                                  const v8::FunctionCallbackInfo<v8::Value> &args, const uint8_t opcode,
                                  bool *const result);

    void inscope_loadMoveOperation(v8::Isolate *isolate, IdaBridge *bridge,
                                   const v8::FunctionCallbackInfo<v8::Value> &args, const size_t objectId,
                                   const uint8_t opcode, bool *const result);

    bool loadSavedMoveOperation(IdaBridge *bridge, const size_t objectId,
                                std::vector<uint8_t, std::allocator<uint8_t>> &code, const uint8_t opcode);

    int convertResult(const int input, const uint8_t returnType);

    inline bool isPersistentMoveOperation(const uint8_t opcode)
    {
        // Persistent move operations are those that store their state in the patches in the original engine
        // We have to store them dynamically in the coroutines
        // Note that, some of the opcodes are not used from Ida, like TM_LOOP, but they are still here
        return (opcode == TM_ANGLE || opcode == TM_FACE_TWINSEN || opcode == TM_WAIT_NB_ANIM ||
                opcode == TM_WAIT_NB_DIZIEME || opcode == TM_WAIT_NB_SECOND || opcode == TM_ANGLE_RND ||
                opcode == TM_WAIT_NB_DIZIEME_RND || opcode == TM_WAIT_NB_SECOND_RND || opcode == TM_LOOP);
    }

}  // namespace Ida
