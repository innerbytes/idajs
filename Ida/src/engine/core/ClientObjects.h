#pragma once

#include <v8.h>

namespace core
{
    class ClientObjects
    {
    public:
        virtual void init(v8::Isolate *isolate, v8::Local<v8::Object> globalObject) const = 0;
        virtual ~ClientObjects() {}
    };
}  // namespace core
