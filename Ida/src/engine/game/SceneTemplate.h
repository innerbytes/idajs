#pragma once

#include <v8.h>

#include "../IdaBridge.h"
#include "../IdaLbaBridge.h"

namespace Ida
{
    class SceneTemplate
    {
    private:
        v8::Persistent<v8::ObjectTemplate> mTemplate;
        v8::Isolate *mIsolate;
        IdaLbaBridge *mLbaBridge;
        IdaBridge *mIdaBridge;

        // Getters are allowed everywhere except None, BeforeSceneLoad
        static void getId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getIsland(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getPlanet(const v8::FunctionCallbackInfo<v8::Value> &args);

        static void getNumObjects(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getObject(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getNumZones(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getZone(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getNumWaypoints(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getWaypoint(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getStartPos(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getVariable(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getGameVariable(const v8::FunctionCallbackInfo<v8::Value> &args);

        static void getGold(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getZlitos(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getCurrentMoney(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getForeignMoney(const v8::FunctionCallbackInfo<v8::Value> &args);

        static void getNumKeys(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getMagicLevel(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getMagicPoints(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in SceneLoad only
        static void setStartPos(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void addObjects(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void addZones(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void addWaypoints(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in SceneLoad, Life, Move
        // The original game never change the variables in move scripts, but this doesn't seem to be dangerous to allow
        // in Move as well
        static void setGameVariable(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setVariable(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in SceneLoad, Life
        // Technically, we can allow this in the Move as well, but the original game never does it in Move script, so
        // better to be careful
        static void setGold(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setZlitos(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setCurrentMoney(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setForeignMoney(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed everywhere except None, BeforeSceneLoad

        // Outside of the scene setup, use this function with caution and only if it's really needed. Allows to use
        // dynamic waypoints in move scripts. Note, that updated waypoints are not saved in the savegame. Beware not to
        // update the waypoints other scripts are using at the moment, as it may lead to unexpected behavior.
        static void updateWaypoint(const v8::FunctionCallbackInfo<v8::Value> &args);

        v8::Local<v8::Object> inscope_wrap();

    public:
        static constexpr const char *event_BeforeLoadScene = "beforeLoadScene";
        static constexpr const char *event_AfterLoadScene = "afterLoadScene";
        static constexpr const char *event_AfterLoadSavedState = "afterLoadSavedState";

        SceneTemplate(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge)
            : mIsolate(isolate), mLbaBridge(lbaBridge), mIdaBridge(idaBridge)
        {
        }
        ~SceneTemplate();

        void init();
        void bind(v8::Local<v8::Object> object);
    };

}  // namespace Ida
