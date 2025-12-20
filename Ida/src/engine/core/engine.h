#pragma once

#include <v8.h>

#include "ClientObjects.h"

namespace core
{
    using RunCallback = std::function<void()>;
    using BindObjectsCallback = std::function<std::unique_ptr<ClientObjects>()>;
    using ObjectProviderCallback = std::function<v8::Local<v8::Object>(v8::Local<v8::Context>)>;
    using ArgumentsProviderCallback = std::function<size_t(v8::Isolate *, v8::Local<v8::Value> *&)>;
    using ResultCallback = std::function<void(v8::Isolate *, v8::MaybeLocal<v8::Value>)>;

    void initV8(char *appLocation);

    bool isV8Init();

    v8::Isolate *getIsolate();

    bool runModScript(std::string &scriptFullPath, BindObjectsCallback bindObjectsCallback, RunCallback callback);

    void runSyncEvent(const std::string &eventName, const ObjectProviderCallback objectProvider,
                      const ArgumentsProviderCallback argumentsProvider = nullptr);

    void runFunction(const std::string &functionName, bool requireFunction = false,
                     const ObjectProviderCallback objectProvider = nullptr,
                     const ArgumentsProviderCallback args = nullptr, const ResultCallback resultCallback = nullptr);

    void runFunction(const v8::Global<v8::Function> &function, const ArgumentsProviderCallback args = nullptr,
                     const ResultCallback resultCallback = nullptr);

    v8::MaybeLocal<v8::Value> inscope_runFunction(const std::string &functionName, bool requireFunction = false,
                                                  const size_t argc = 0, v8::Local<v8::Value> *argv = nullptr,
                                                  const ObjectProviderCallback objectProvider = nullptr);

    /// @brief Runs a script unwrapped
    v8::MaybeLocal<v8::Value> inscope_runScript(v8::Local<v8::Context> context, const std::string &scriptPath,
                                                const std::string &script = "");
    v8::MaybeLocal<v8::Value> inscope_tryCatch(const std::function<v8::MaybeLocal<v8::Value>()> &callback);

    v8::Local<v8::Object> inscope_GetObject(v8::Local<v8::Context> context, const char *objectName);

    void processTasks();

    void postTask(v8::Task *task);

    void postDelayedTask(v8::Task *task, double delay);

    void disposeV8();
}  // namespace core
