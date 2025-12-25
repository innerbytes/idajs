#include "engine.h"

#include <libplatform/libplatform.h>

#include <string>

#include "../../common/Logger.h"
#include "../game/templates.h"
#include "files.h"
#include "library/Console.h"
#include "library/Performance.h"
#include "library/Require.h"
#include "library/Timer.h"
#include "runtime/PromiseRejectionHandler.h"

namespace core
{
    using namespace Logger;

    static std::unique_ptr<v8::Platform> mPlatform;
    static bool isInit = false;
    static v8::Isolate *isolate = nullptr;

    static PromiseRejectionHandler *promiseRejectionHandler = nullptr;

    // Setting it to bigger value will make timeouts more precise at the risk of delaying game frames
    constexpr int MaxTasksPerFrame = 5;

    constexpr const char *HandleEventFunction = "_handleEvent";

    v8::MaybeLocal<v8::Value> inscope_tryCatch(const std::function<v8::MaybeLocal<v8::Value>()> &callback)
    {
        v8::TryCatch tryCatch(isolate);
        auto result = callback();
        if (tryCatch.HasCaught())
        {
            v8::Local<v8::Message> message = tryCatch.Message();
            v8::String::Utf8Value filename(isolate, message->GetScriptOrigin().ResourceName());
            int line = message->GetLineNumber(isolate->GetCurrentContext()).FromMaybe(-1);
            int column = message->GetStartColumn(isolate->GetCurrentContext()).FromMaybe(-1);
            v8::String::Utf8Value exception(isolate, tryCatch.Exception());
            std::string errorMessage = *exception ? *exception : "Unknown exception";

            std::string stackTraceOrMessage = errorMessage;
            if (!tryCatch.StackTrace(isolate->GetCurrentContext()).IsEmpty())
            {
                v8::Local<v8::Value> stackTraceValue =
                    tryCatch.StackTrace(isolate->GetCurrentContext()).ToLocalChecked();
                v8::String::Utf8Value stackTraceStr(isolate, stackTraceValue);
                if (*stackTraceStr)
                {
                    stackTraceOrMessage = *stackTraceStr;
                }
            }

            err() << "Unhandled exception in " << (*filename ? *filename : "unknown script") << " on line " << line
                  << " column " << column << "\n"
                  << stackTraceOrMessage;

            return v8::MaybeLocal<v8::Value>();
        }

        return result;
    }

    void initV8(char *appLocation)
    {
        if (isInit)
        {
            return;
        }

        v8::V8::InitializeICUDefaultLocation(appLocation);

        mPlatform = v8::platform::NewDefaultPlatform();
        v8::V8::InitializePlatform(mPlatform.get());
        v8::V8::Initialize();

        v8::Isolate::CreateParams create_params;
        create_params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();

        isolate = v8::Isolate::New(create_params);
        isolate->SetMicrotasksPolicy(v8::MicrotasksPolicy::kExplicit);

        promiseRejectionHandler = new PromiseRejectionHandler(isolate);

        isInit = true;
    }

    bool isV8Init()
    {
        return isInit;
    }

    v8::Isolate *getIsolate()
    {
        return isolate;
    }

    bool runModScript(std::string &scriptFullPath, BindObjectsCallback bindObjectsCallback, RunCallback callback,
                      RunCallback cleanupCallback)
    {
        if (!isInit)
        {
            return false;
        }

        // Scopes
        v8::Isolate::Scope isolateScope(isolate);
        v8::HandleScope mainScope(isolate);

        // Binding host objects
        Console console;
        Timer timer;
        Performance performance;
        Require require;
        v8::Local<v8::ObjectTemplate> global = v8::ObjectTemplate::New(isolate);
        console.inscope_bind(isolate, global);
        timer.inscope_bind(isolate, global);
        performance.inscope_bind(isolate, global);
        require.inscope_bind(isolate, global);

        // Create a new context
        v8::Local<v8::Context> context = v8::Context::New(isolate, nullptr, global);

        // Enter the context scope for compiling and running the main script
        v8::Context::Scope context_scope(context);
        {
            v8::Local<v8::Object> globalObject = context->Global();

            // Add modScriptPath to the global object
            v8::Local<v8::String> scriptPathKey = v8::String::NewFromUtf8(isolate, "modScriptPath").ToLocalChecked();
            v8::Local<v8::String> scriptPathValue =
                v8::String::NewFromUtf8(isolate, scriptFullPath.c_str()).ToLocalChecked();
            globalObject->Set(context, scriptPathKey, scriptPathValue).Check();

            // Binding client objects
            auto clientObjects = bindObjectsCallback();
            clientObjects->init(isolate, globalObject);

            try
            {
                std::string globalScriptPath = "global.js";
                auto globalScriptResult = inscope_runScript(context, globalScriptPath);
                if (globalScriptResult.IsEmpty())
                {
                    throw std::logic_error("Failed to load global script");
                }
            }
            catch (std::logic_error &e)
            {
                err() << "JS compile error: " << e.what();
                if (cleanupCallback)
                {
                    cleanupCallback();
                }

                return false;
            }

            callback();

            if (cleanupCallback)
            {
                cleanupCallback();
            }
        }

        return true;
    }

    void runSyncEvent(const std::string &eventName, const ObjectProviderCallback objectProvider,
                      const ArgumentsProviderCallback argumentsProvider)
    {
        if (!isInit)
        {
            return;
        }

        using namespace v8;
        HandleScope handleScope(isolate);

        Local<Context> ctx = isolate->GetCurrentContext();
        Local<Value> *argv = nullptr;
        size_t argc = 0;
        if (argumentsProvider) [[likely]]
        {
            argc = argumentsProvider(isolate, argv);
        }

        std::vector<Local<Value>> functionArgs;
        functionArgs.reserve(1 + argc);
        functionArgs.push_back(
            String::NewFromUtf8(isolate, eventName.c_str(), NewStringType::kNormal).ToLocalChecked());
        functionArgs.insert(functionArgs.end(), argv, argv + argc);

        inscope_runFunction(std::string(HandleEventFunction), true, functionArgs.size(), functionArgs.data(),
                            objectProvider);
    }

    void runFunction(const std::string &functionName, bool requireFunction, const ObjectProviderCallback objectProvider,
                     const ArgumentsProviderCallback args, const ResultCallback resultCallback)
    {
        if (!isInit)
        {
            return;
        }

        using namespace v8;
        HandleScope handleScope(isolate);

        Local<Value> *argv = nullptr;
        size_t argc = 0;
        if (args) [[likely]]
        {
            argc = args(isolate, argv);
        }

        MaybeLocal<Value> result = inscope_runFunction(functionName, requireFunction, argc, argv, objectProvider);
        if (resultCallback)
        {
            resultCallback(isolate, result);
        }
    }

    void runFunction(const v8::Global<v8::Function> &function, const ArgumentsProviderCallback args,
                     const ResultCallback resultCallback)
    {
        if (!isInit)
        {
            return;
        }

        using namespace v8;
        HandleScope handleScope(isolate);

        Local<Function> localFunction = function.Get(isolate);
        Local<Value> *argv = nullptr;
        size_t argc = 0;

        if (args) [[likely]]
        {
            argc = args(isolate, argv);
        }

        auto gameContext = isolate->GetCurrentContext();
        MaybeLocal<Value> result =
            inscope_tryCatch([&]() { return localFunction->Call(gameContext, localFunction, argc, argv); });

        if (resultCallback)
        {
            resultCallback(isolate, result);
        }
    }

    v8::MaybeLocal<v8::Value> inscope_runScript(v8::Local<v8::Context> context, const std::string &scriptPath,
                                                const std::string &script)
    {
        if (!isInit)
        {
            throw std::runtime_error("V8 is not initialized");
        }

        dbg() << "Loading " << scriptPath;

        std::string scriptContents = script;

        if (scriptContents.empty())
        {
            try
            {
                scriptContents = files::readAllText(scriptPath);
            }
            catch (std::exception &e)
            {
                err() << "Error reading file: " << scriptPath << "; " << e.what();
                return v8::MaybeLocal<v8::Value>();
            }
        }

        v8::Local<v8::String> source =
            v8::String::NewFromUtf8(isolate, scriptContents.c_str(), v8::NewStringType::kNormal).ToLocalChecked();

        return inscope_tryCatch([&]() {
            auto v8ScriptName = v8::String::NewFromUtf8(isolate, scriptPath.c_str()).ToLocalChecked();
            v8::ScriptOrigin origin(v8ScriptName);
            auto compileResult = v8::Script::Compile(context, source, &origin);
            if (!compileResult.IsEmpty())
            {
                auto script = compileResult.ToLocalChecked();
                return script->Run(context);
            }
            return v8::MaybeLocal<v8::Value>();
        });
    }

    v8::MaybeLocal<v8::Value> inscope_runFunction(const std::string &functionName, bool requireFunction,
                                                  const size_t argc, v8::Local<v8::Value> *argv,
                                                  const ObjectProviderCallback objectProvider)
    {
        auto gameContext = isolate->GetCurrentContext();
        auto object = objectProvider ? objectProvider(gameContext) : gameContext->Global();
        auto funcName = v8::String::NewFromUtf8(isolate, functionName.c_str()).ToLocalChecked();
        auto funcVal = object->Get(gameContext, funcName).ToLocalChecked();

        if (funcVal->IsFunction())
        {
            v8::Local<v8::Function> func = funcVal.As<v8::Function>();
            return inscope_tryCatch([&]() { return func->Call(gameContext, object, argc, argv); });
        }
        else if (requireFunction)
        {
            err() << "Function '" << functionName << "' not found or is not callable.";
        }

        return v8::MaybeLocal<v8::Value>();
    }

    v8::Local<v8::Object> inscope_GetObject(v8::Local<v8::Context> context, const char *objectName)
    {
        v8::Local<v8::Object> global = context->Global();
        v8::Local<v8::Value> sceneValue =
            global->Get(context, v8::String::NewFromUtf8(context->GetIsolate(), objectName).ToLocalChecked())
                .ToLocalChecked();
        return sceneValue.As<v8::Object>();
    }

    void postTask(v8::Task *task)
    {
        if (!isInit)
        {
            return;
        }

        mPlatform->GetForegroundTaskRunner(isolate)->PostTask(std::unique_ptr<v8::Task>(task));
    }

    void postDelayedTask(v8::Task *task, double delay)
    {
        if (!isInit)
        {
            return;
        }

        mPlatform->GetForegroundTaskRunner(isolate)->PostDelayedTask(std::unique_ptr<v8::Task>(task), delay);
    }

    void processTasks()
    {
        if (!isInit)
        {
            return;
        }

        isolate->PerformMicrotaskCheckpoint();
        promiseRejectionHandler->checkUnhandledRejections();
        int taskCount = 0;
        while (taskCount < MaxTasksPerFrame && v8::platform::PumpMessageLoop(mPlatform.get(), isolate))
        {
            isolate->PerformMicrotaskCheckpoint();
            promiseRejectionHandler->checkUnhandledRejections();
            taskCount++;
        }
    }

    void disposeV8()
    {
        if (!isInit)
        {
            return;
        }

        isInit = false;

        delete promiseRejectionHandler;

        isolate->Dispose();
        v8::V8::Dispose();
        v8::V8::DisposePlatform();
    }
}  // namespace core
