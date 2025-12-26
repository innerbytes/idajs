#pragma once

#include <v8.h>

#include "../IdaBridge.h"
#include "../IdaLbaBridge.h"
#include "../idaInterop.h"

namespace Ida
{
    class GameObjectTemplate
    {
    private:
        v8::Persistent<v8::ObjectTemplate> mTemplate;
        v8::Isolate *mIsolate;
        IdaLbaBridge *mLbaBridge;
        IdaBridge *mIdaBridge;

        // Getters - allowed everywhere except None, BeforeSceneLoad
        static void getId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getControlMode(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getStaticFlags(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getBonusFlags(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getBonusQuantity(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getPos(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getAngle(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getRegisters(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getLifePoints(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getArmor(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getHitPower(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getRotationSpeed(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getTalkColor(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getEntity(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getBody(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getAnimation(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getSpriteId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getLifeScript(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getMoveScript(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void isFacingZoneDirection(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void isDisabled(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed only in AfterLoadScene
        static void setControlMode(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setStaticFlags(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setBonusFlags(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setBonusQuantity(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setPos(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setAngle(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setRegisters(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setLifePoints(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setArmor(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setHitPower(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setRotationSpeed(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setTalkColor(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setEntity(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setBody(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setAnimation(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setSpriteId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void disable(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void handleLifeScript(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void handleMoveScript(const v8::FunctionCallbackInfo<v8::Value> &args);

    public:
        GameObjectTemplate(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge)
            : mIsolate(isolate), mLbaBridge(lbaBridge), mIdaBridge(idaBridge)
        {
        }
        ~GameObjectTemplate();
        void init();
        v8::Local<v8::Object> inscope_wrap(int objectIndex);
        static T_OBJET *inscope_GetObjectReference(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, int objectIndex);
    };

}  // namespace Ida
