#pragma once

#include <v8.h>

#include "../IdaBridge.h"
#include "../IdaLbaBridge.h"

namespace Ida
{
    class IdaTemplate
    {
    private:
        v8::Persistent<v8::ObjectTemplate> mTemplate;
        v8::Isolate *mIsolate;
        IdaLbaBridge *mLbaBridge;
        IdaBridge *mIdaBridge;

        // Ida getters are allowed always
        static void getTextLanguage(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getVoiceLanguage(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getFirstTextId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getFirstImageId(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in life phase
        static void life(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void lifef(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in all phases except None, BeforeSceneLoad
        static void _isMoveActive(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void _stopMove(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void _enableMove(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void _disableMove(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed only in BeforeSceneLoad
        static void setStorm(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void forceIsland(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in move phase
        static void _move(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void _cmove(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed everywhere
        static void _setLogLevel(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getLogLevel(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void _setEppEnabled(const v8::FunctionCallbackInfo<v8::Value> &args);

        /// @brief Enable lightning light command back as normal.
        static void enableLightning(const v8::FunctionCallbackInfo<v8::Value> &args);

        /// @brief Disable lightning light command from having any effect. Useful when we disabled the storm.
        static void disableLightning(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in None and InScene phases
        static void halt(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void useImages(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Allowed in None phase only
        static void setStartSceneId(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setIntroVideo(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void _setMoveHandler(const v8::FunctionCallbackInfo<v8::Value> &args);

        v8::Local<v8::Object> inscope_wrap();

    public:
        IdaTemplate(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge)
            : mIsolate(isolate), mLbaBridge(lbaBridge), mIdaBridge(idaBridge)
        {
        }
        ~IdaTemplate();

        void init();
        void bind(v8::Local<v8::Object> object);
    };
}  // namespace Ida
