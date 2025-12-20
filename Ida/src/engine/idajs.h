#pragma once
#pragma pack(push, 8)

#include <v8.h>

#include "idaTypes.h"

// Helpers to call js objects from Ida/cpp side
namespace Ida
{
    constexpr std::string_view ModEntryFileName = "index.js";

    constexpr const char *IdaObjectName = "ida";
    constexpr const char *SceneObjectName = "scene";
    constexpr const char *TextObjectName = "text";
    constexpr const char *ImageObjectName = "image";

    // Js functions called from Ida/cpp
    constexpr const char *text_isReplaced = "__isReplaced";
    constexpr const char *text_getFlags = "__getFlags";
    constexpr const char *text_get = "__get";
    constexpr const char *text_getColor = "__getColor";
    constexpr const char *text_getSprite = "__getSprite";

    constexpr const char *image_get = "__get";

    constexpr const char *scene_save = "__save";
    constexpr const char *scene_load = "__load";
    constexpr const char *scene_loadBackup = "__loadBackup";
    constexpr const char *scene_saveBackup = "__saveBackup";

    // Helper functions to read values
    DialogColors inscope_readDialogColor(v8::Local<v8::Value> colorValue);
    int inscope_read256Color(v8::Local<v8::Value> colorValue);
}  // namespace Ida

#pragma pack(pop)
