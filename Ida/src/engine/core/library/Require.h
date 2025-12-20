#pragma once
#include <v8.h>

#include <unordered_map>

#include "../files.h"

namespace core
{
    class Require
    {
    public:
        void inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global);

    private:
        struct RequireData
        {
            Require *thisObject;
            std::string moduleRootPath;
            v8::Global<v8::Function> thisFunction;
        };

        RequireData mRootData{this, files::getAppDirPath()};
        std::unordered_map<std::string, v8::Persistent<v8::Value>> mModuleCache;
        static void require(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void requireFinalizer(const v8::WeakCallbackInfo<RequireData> &info);
        static bool allowedPathStart(const std::string &path);
    };
}  // namespace core
