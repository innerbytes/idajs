#include "Performance.h"

#include "../../SDL/include/SDL.h"

namespace core
{

    void Performance::inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global)
    {
        v8::Local<v8::ObjectTemplate> performance = v8::ObjectTemplate::New(isolate);
        performance->Set(v8::String::NewFromUtf8(isolate, "now", v8::NewStringType::kNormal).ToLocalChecked(),
                         v8::FunctionTemplate::New(isolate, now));
        global->Set(v8::String::NewFromUtf8(isolate, "performance", v8::NewStringType::kNormal).ToLocalChecked(),
                    performance);
    }

    void Performance::now(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        v8::HandleScope handleScope(args.GetIsolate());
        args.GetReturnValue().Set(v8::Number::New(args.GetIsolate(), SDL_GetTicks64()));
    }
}  // namespace core
