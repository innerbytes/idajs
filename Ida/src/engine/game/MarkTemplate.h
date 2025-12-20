#pragma once

#include <v8.h>

#include "../IdaBridge.h"
#include "../IdaLbaBridge.h"

namespace Ida
{
    class MarkTemplate
    {
    private:
        v8::Persistent<v8::ObjectTemplate> mTemplate;
        v8::Isolate *mIsolate;
        IdaLbaBridge *mLbaBridge;
        IdaBridge *mIdaBridge;

        static void exitProcess(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void exit(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void newGame(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void saveGame(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void loadGame(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void skipVideoOnce(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setGameInputOnce(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getGameLoop(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void isHotReloadEnabled(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void disableHotReload(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void enableHotReload(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void doDialogSpy(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getDialogSpyInfo(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void doImageSpy(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void getImageSpyInfo(const v8::FunctionCallbackInfo<v8::Value> &args);

        v8::Local<v8::Object> inscope_wrap();

    public:
        MarkTemplate(v8::Isolate *isolate, IdaLbaBridge *lbaBridge, IdaBridge *idaBridge)
            : mIsolate(isolate), mLbaBridge(lbaBridge), mIdaBridge(idaBridge)
        {
        }
        ~MarkTemplate();

        void init();
        void bind(v8::Local<v8::Object> object);
    };
}  // namespace Ida
