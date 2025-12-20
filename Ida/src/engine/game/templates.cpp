#include "templates.h"

namespace Ida
{
    static IdaTemplate *idaTemplate;
    static MarkTemplate *markTemplate;
    static SceneTemplate *sceneTemplate;
    static GameObjectTemplate *gameObjectTemplate;
    static ZoneTemplate *zoneTemplate;

    void initTemplates(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge)
    {
        idaTemplate = new IdaTemplate(isolate, lbaBridge, idaBridge);
        idaTemplate->init();

        markTemplate = new MarkTemplate(isolate, lbaBridge, idaBridge);
        markTemplate->init();

        sceneTemplate = new SceneTemplate(isolate, lbaBridge, idaBridge);
        sceneTemplate->init();

        gameObjectTemplate = new GameObjectTemplate(isolate, lbaBridge, idaBridge);
        gameObjectTemplate->init();

        zoneTemplate = new ZoneTemplate(isolate, lbaBridge, idaBridge);
        zoneTemplate->init();
    }

    IdaTemplate *getIdaTemplate()
    {
        return idaTemplate;
    }

    MarkTemplate *getMarkTemplate()
    {
        return markTemplate;
    }

    SceneTemplate *getSceneTemplate()
    {
        return sceneTemplate;
    }

    GameObjectTemplate *getGameObjectTemplate()
    {
        return gameObjectTemplate;
    }

    ZoneTemplate *getZoneTemplate()
    {
        return zoneTemplate;
    }

    void deleteTemplates()
    {
        delete gameObjectTemplate;
        delete idaTemplate;
        delete markTemplate;
        delete sceneTemplate;
        delete zoneTemplate;
    }
}  // namespace Ida
