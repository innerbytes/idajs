#pragma once

#include <v8.h>

#include <unordered_map>

namespace core
{

    struct TimerInfo
    {
        int id;
        bool isInterval;
        v8::Global<v8::Function> callback;
    };

    struct TimerStartHandle
    {
        uint32_t nextTimerId = 1;
        std::unordered_map<uint32_t, TimerInfo> timers;
    };

    class Timer
    {
    public:
        // Bind functions to the global V8 object
        void inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global);

    private:
        TimerStartHandle mTimerStartHandle;

        static void setTimeout(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void clearTimeout(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void setInterval(const v8::FunctionCallbackInfo<v8::Value> &args);
        static void clearInterval(const v8::FunctionCallbackInfo<v8::Value> &args);
    };
}  // namespace core
