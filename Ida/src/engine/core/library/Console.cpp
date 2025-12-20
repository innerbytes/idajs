#include "Console.h"

#include "../../../common/Logger.h"

namespace core
{
    void Console::logToStream(const v8::FunctionCallbackInfo<v8::Value> &args, Logger::LogLine &&stream)
    {
        if (args.Length() < 1)
        {
            stream << "";
            return;
        }

        v8::Isolate *isolate = args.GetIsolate();
        v8::HandleScope handleScope(isolate);

        for (int i = 0; i < args.Length(); ++i)
        {
            if (i > 0)
            {
                stream << " ";
            }

            v8::String::Utf8Value str(isolate, args[i]);
            stream << *str;
        }
    }

    void Console::debug(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        logToStream(args, Logger::jsDbg());
    }

    void Console::log(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        logToStream(args, Logger::jsInf());
    }

    void Console::warn(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        logToStream(args, Logger::jsWrn());
    }

    void Console::error(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        logToStream(args, Logger::jsErr());
    }

    // Bind the console object to the global object
    void Console::inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global)
    {
        v8::Local<v8::ObjectTemplate> console = v8::ObjectTemplate::New(isolate);

        // Bind console output methods
        console->Set(v8::String::NewFromUtf8Literal(isolate, "debug"), v8::FunctionTemplate::New(isolate, debug));
        console->Set(v8::String::NewFromUtf8Literal(isolate, "info"), v8::FunctionTemplate::New(isolate, log));
        console->Set(v8::String::NewFromUtf8Literal(isolate, "log"), v8::FunctionTemplate::New(isolate, log));
        console->Set(v8::String::NewFromUtf8Literal(isolate, "warn"), v8::FunctionTemplate::New(isolate, warn));
        console->Set(v8::String::NewFromUtf8Literal(isolate, "error"), v8::FunctionTemplate::New(isolate, error));

        // Add the console object to the global logger template (because V8 already has defined console that is not easy
        // to override from here)
        global->Set(v8::String::NewFromUtf8Literal(isolate, "logger"), console);
    }
}  // namespace core
