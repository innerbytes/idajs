#pragma once

#include <v8.h>

#include "GameObjectTemplate.h"
#include "IdaTemplate.h"
#include "MarkTemplate.h"
#include "SceneTemplate.h"
#include "ZoneTemplate.h"

namespace Ida
{
    void initTemplates(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge);
    IdaTemplate *getIdaTemplate();
    MarkTemplate *getMarkTemplate();
    SceneTemplate *getSceneTemplate();
    GameObjectTemplate *getGameObjectTemplate();
    ZoneTemplate *getZoneTemplate();
    void deleteTemplates();
}  // namespace Ida
