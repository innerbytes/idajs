#pragma once

#include <v8.h>
#include <iostream>
#include "../../../common/Logger.h"

namespace core
{

    // To fully override console of V8 see here:
    // https://source.chromium.org/chromium/chromium/src/+/main:v8/src/d8/d8-console.cc
    class Console
    {
    public:
        Console() = default;

        void inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global);

    private:
        // Static methods for console.log and console.error
        static void debug(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void log(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void warn(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void error(const v8::FunctionCallbackInfo<v8::Value> &args);

        // Helper method to log to a stream
        static void logToStream(const v8::FunctionCallbackInfo<v8::Value> &args, Logger::LogLine &&stream);
    };
}  // namespace core
