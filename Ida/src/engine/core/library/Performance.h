#pragma once

#include <v8.h>

namespace core
{
    class Performance
    {
    public:
        void inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global);

    private:
        static void now(const v8::FunctionCallbackInfo<v8::Value> &args);
    };
}  // namespace core
