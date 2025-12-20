#pragma once

#include <v8.h>

// This file contains utility functions to setup the JS objects templates

namespace Ida
{
    template <typename... Events>
    void inscope_declareEvents(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> tmpl, Events... events)
    {
        v8::Local<v8::ObjectTemplate> eventsTpl = v8::ObjectTemplate::New(isolate);

        (void)std::initializer_list<int>{(eventsTpl->Set(v8::String::NewFromUtf8(isolate, events).ToLocalChecked(),
                                                         v8::String::NewFromUtf8(isolate, events).ToLocalChecked()),
                                          0)...};

        tmpl->Set(v8::String::NewFromUtf8(isolate, "Events").ToLocalChecked(), eventsTpl);
    }

    inline void inscope_bindFunctions(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> tmpl,
                                      std::initializer_list<std::pair<const char *, v8::FunctionCallback>> funcs)
    {
        for (auto &f : funcs)
        {
            tmpl->Set(v8::String::NewFromUtf8(isolate, f.first).ToLocalChecked(),
                      v8::FunctionTemplate::New(isolate, f.second));
        }
    }
}  // namespace Ida

// *****  Macros for the templates *****

/// @brief Macro to bind a function to the template
#define FN(fn) {#fn, fn}

#define BEGIN_SCOPE                           \
    v8::Isolate *isolate = args.GetIsolate(); \
    v8::HandleScope handleScope(isolate);

#define BIND_BRIDGE auto *lbaBridge = static_cast<IdaLbaBridge *>(args.This()->GetAlignedPointerFromInternalField(0));

#define BIND_IDA_BRIDGE auto *idaBridge = static_cast<IdaBridge *>(args.This()->GetAlignedPointerFromInternalField(1));

/// @brief Macro to get an object reference from a template function using its index. Useful for zones and objects
#define BIND_OBJECT(type, var)                                                                         \
    auto *lbaBridge = static_cast<IdaLbaBridge *>(args.This()->GetAlignedPointerFromInternalField(0)); \
    Local<Int32> objectIndex = args.This()->GetInternalField(2).As<Int32>();                           \
    int objectIndexValue = objectIndex->Value();                                                       \
    type *var = inscope_GetObjectReference(isolate, lbaBridge, objectIndexValue);                      \
    if (!var)                                                                                          \
    {                                                                                                  \
        return;                                                                                        \
    }

/// @brief Controls if execution is denied for specified phases. Binds idaBridge.
#define EPP_DENY(...)                                                                                \
    BIND_IDA_BRIDGE                                                                                  \
    if (idaBridge->isEppDenied(std::initializer_list<ExecutionPhase>{__VA_ARGS__}))                  \
    {                                                                                                \
        std::string allowedScopes =                                                                  \
            idaBridge->getPhaseNamesExcept(std::initializer_list<ExecutionPhase>{__VA_ARGS__});      \
        core::inscope_ThrowError(                                                                    \
            args.GetIsolate(),                                                                       \
            "Execution of this function is only allowed in the following phases: " + allowedScopes); \
        return;                                                                                      \
    }

/// @brief Controls if execution is allowed for specified phases. Binds idaBridge.
#define EPP_ALLOW(...)                                                                                            \
    BIND_IDA_BRIDGE                                                                                               \
    if (!idaBridge->isEppAllowed(std::initializer_list<ExecutionPhase>{__VA_ARGS__}))                             \
    {                                                                                                             \
        std::string allowedScopes = idaBridge->getPhaseNames(std::initializer_list<ExecutionPhase>{__VA_ARGS__}); \
        core::inscope_ThrowError(                                                                                 \
            args.GetIsolate(),                                                                                    \
            "Execution of this function is only allowed in the following phases: " + allowedScopes);              \
        return;                                                                                                   \
    }

#define EPP_TEST                                                                                                 \
    BIND_IDA_BRIDGE                                                                                              \
    if (!idaBridge->isEppTestMode())                                                                             \
    {                                                                                                            \
        core::inscope_ThrowError(args.GetIsolate(), "Execution of this function is only allowed in test mode."); \
        return;                                                                                                  \
    }
