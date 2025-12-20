#pragma once

#include <v8.h>

#include <map>

namespace core
{
    class PromiseRejectionHandler
    {
    public:
        PromiseRejectionHandler(v8::Isolate *isolate);
        ~PromiseRejectionHandler();

        void checkUnhandledRejections();

    private:
        void inscope_outputUnhandledRejection(v8::Local<v8::Value> reason);
        static void promiseRejectCallback(v8::PromiseRejectMessage message);
    };
}  // namespace core
