#include "Timer.h"

#include <iostream>

#include "../engine.h"
#include "../argumentsHandler.h"

using namespace std;

namespace core
{

    class TimerTask : public v8::Task
    {
    private:
        v8::Isolate *mIsolate;
        TimerStartHandle *mTimerStartHandle;
        uint32_t mTimerId;
        double mDelayInSeconds;  // For intervals
        bool mArgumentsPassedToNextTask = false;
        v8::Persistent<v8::Value> *mArgv;
        size_t mArgc;

    public:
        TimerTask(v8::Isolate *isolate, TimerStartHandle *timerStartHandle, int timerId, double delayInSeconds,
                  v8::Persistent<v8::Value> *argv, size_t argc)
            : mIsolate(isolate),
              mTimerStartHandle(timerStartHandle),
              mTimerId(timerId),
              mDelayInSeconds(delayInSeconds),
              mArgv(argv),
              mArgc(argc)
        {
        }

        ~TimerTask()
        {
            if (mArgumentsPassedToNextTask)
            {
                return;
            }

            for (size_t i = 0; i < mArgc; ++i)
            {
                mArgv[i].Reset();
            }
            delete[] mArgv;
        }

        void Run() override
        {
            auto timers = &mTimerStartHandle->timers;

            // If timer was cleared
            if (timers->find(mTimerId) == timers->end())
            {
                return;
            }

            v8::HandleScope handleScope(mIsolate);
            v8::Local<v8::Context> context = mIsolate->GetCurrentContext();
            v8::Context::Scope context_scope(context);

            v8::Local<v8::Function> callback = mTimerStartHandle->timers[mTimerId].callback.Get(mIsolate);

            if (mTimerStartHandle->timers[mTimerId].isInterval)
            {
                postDelayedTask(new TimerTask(mIsolate, mTimerStartHandle, mTimerId, mDelayInSeconds, mArgv, mArgc),
                                mDelayInSeconds);
                mArgumentsPassedToNextTask = true;
            }
            else
            {
                timers->erase(mTimerId);
            }

            vector<v8::Local<v8::Value>> localArguments(mArgc);
            for (size_t i = 0; i < mArgc; ++i)
            {
                localArguments[i] = mArgv[i].Get(mIsolate); 
            }
            v8::Local<v8::Value> *localArgumentsPointer = localArguments.data();
            inscope_tryCatch(
                [&]() { return callback->Call(context, context->Global(), mArgc, localArgumentsPointer); });
        }
    };

    void Timer::inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global)
    {
        // Bind setTimeout
        global->Set(
            v8::String::NewFromUtf8Literal(isolate, "setTimeout"),
            v8::FunctionTemplate::New(isolate, Timer::setTimeout, v8::External::New(isolate, &mTimerStartHandle)));
        global->Set(
            v8::String::NewFromUtf8Literal(isolate, "clearTimeout"),
            v8::FunctionTemplate::New(isolate, Timer::clearTimeout, v8::External::New(isolate, &mTimerStartHandle)));

        // Bind setInterval
        global->Set(
            v8::String::NewFromUtf8Literal(isolate, "setInterval"),
            v8::FunctionTemplate::New(isolate, Timer::setInterval, v8::External::New(isolate, &mTimerStartHandle)));
        global->Set(
            v8::String::NewFromUtf8Literal(isolate, "clearInterval"),
            v8::FunctionTemplate::New(isolate, Timer::clearTimeout, v8::External::New(isolate, &mTimerStartHandle)));
    }

    // setTimeout implementation
    void Timer::setTimeout(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        v8::Isolate *isolate = args.GetIsolate();
        v8::HandleScope handleScope(isolate);

        if (args.Length() < 1 || !args[0]->IsFunction() || args.Length() > 1 && !args[1]->IsNumber())
        {
            isolate->ThrowException(v8::Exception::TypeError(
                v8::String::NewFromUtf8Literal(isolate, "Invalid arguments. Usage: setTimeout(callback[, delay]).")));
            return;
        }

        auto timerStartHandle = static_cast<TimerStartHandle *>(args.Data().As<v8::External>()->Value());

        v8::Local<v8::Function> callback = args[0].As<v8::Function>();
        int64_t delay = args.Length() > 1 ? args[1]->IntegerValue(isolate->GetCurrentContext()).ToChecked() : 0;
        delay = delay > -1 ? delay : 0;
        int timerId = timerStartHandle->nextTimerId++;

        timerStartHandle->timers[timerId] = {timerId, false, v8::Global<v8::Function>(isolate, callback)};

        double delayInSeconds = delay / 1000.0;

        size_t argc;
        v8::Persistent<v8::Value> *argv = inscope_newPersistentArguments(args, 2, &argc);
        postDelayedTask(new TimerTask(isolate, timerStartHandle, timerId, delayInSeconds, argv, argc), delayInSeconds);

        args.GetReturnValue().Set(timerId);
    }

    void Timer::clearTimeout(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        v8::Isolate *isolate = args.GetIsolate();
        v8::HandleScope handleScope(isolate);

        if (args.Length() < 1 || (!args[0]->IsNumber() && !args[0]->IsUndefined()))
        {
            isolate->ThrowException(v8::Exception::TypeError(
                v8::String::NewFromUtf8Literal(args.GetIsolate(), "Invalid arguments. Usage: clearTimeout(timerId).")));
            return;
        }

        if (args[0]->IsUndefined())
        {
            return;
        }

        auto timerStartHandle = static_cast<TimerStartHandle *>(args.Data().As<v8::External>()->Value());

        int timerId = args[0]->Int32Value(args.GetIsolate()->GetCurrentContext()).ToChecked();
        auto timers = &timerStartHandle->timers;

        if (timers->find(timerId) != timers->end())
        {
            timers->erase(timerId);
        }
    }

    void Timer::setInterval(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        v8::Isolate *isolate = args.GetIsolate();
        v8::HandleScope handleScope(isolate);

        if (args.Length() < 1 || !args[0]->IsFunction() || args.Length() > 1 && !args[1]->IsNumber())
        {
            isolate->ThrowException(v8::Exception::TypeError(
                v8::String::NewFromUtf8Literal(isolate, "Invalid arguments. Usage: setInterval(callback[, delay]).")));
            return;
        }

        auto timerStartHandle = static_cast<TimerStartHandle *>(args.Data().As<v8::External>()->Value());

        v8::Local<v8::Function> callback = args[0].As<v8::Function>();
        int64_t delay = args.Length() > 1 ? args[1]->IntegerValue(isolate->GetCurrentContext()).ToChecked() : 10;
        delay = delay > -1 ? delay : 10;

        int timerId = timerStartHandle->nextTimerId++;

        timerStartHandle->timers[timerId] = {timerId, true, v8::Global<v8::Function>(isolate, callback)};

        double delayInSeconds = delay / 1000.0;
        size_t argc;
        v8::Persistent<v8::Value> *argv = inscope_newPersistentArguments(args, 2, &argc);
        postDelayedTask(new TimerTask(isolate, timerStartHandle, timerId, delayInSeconds, argv, argc), delayInSeconds);

        args.GetReturnValue().Set(timerId);
    }

    void Timer::clearInterval(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        v8::Isolate *isolate = args.GetIsolate();
        v8::HandleScope handleScope(isolate);

        if (args.Length() < 1 || (!args[0]->IsNumber() && !args[0]->IsUndefined()))
        {
            isolate->ThrowException(v8::Exception::TypeError(
                v8::String::NewFromUtf8Literal(isolate, "Invalid arguments. Usage: clearInterval(timerId).")));
            return;
        }

        if (args[0]->IsUndefined())
        {
            return;
        }

        auto timerStartHandle = static_cast<TimerStartHandle *>(args.Data().As<v8::External>()->Value());

        int timerId = args[0]->Int32Value(args.GetIsolate()->GetCurrentContext()).FromJust();
        auto timers = &timerStartHandle->timers;

        if (timers->find(timerId) != timers->end())
        {
            timers->erase(timerId);
        }
    }
}  // namespace core
