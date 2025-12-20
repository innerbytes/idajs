#pragma once

#include <v8.h>

#include "../IdaBridge.h"
#include "../IdaLbaBridge.h"
#include "../idaInterop.h"

namespace Ida
{
    class ZoneTemplate
    {
    private:
        v8::Persistent<v8::ObjectTemplate> mTemplate;
        v8::Isolate *mIsolate;
        IdaLbaBridge *mLbaBridge;
        IdaBridge *mIdaBridge;

        // Getters - allowed everywhere except None, BeforeSceneLoad
        static void getId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getZoneValue(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getPos1(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getPos2(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getRegisters(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getType(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed only in AfterLoadScene
        static void setZoneValue(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setPos1(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setPos2(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setRegisters(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setType(const v8::FunctionCallbackInfo<v8::Value> &args);

    public:
        ZoneTemplate(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge)
            : mIsolate(isolate), mLbaBridge(lbaBridge), mIdaBridge(idaBridge)
        {
        }
        ~ZoneTemplate();
        void init();
        v8::Local<v8::Object> inscope_wrap(int zoneIndex);
        static T_ZONE *inscope_GetObjectReference(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, int zoneIndex);
    };
}  // namespace Ida
