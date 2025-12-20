#include "argumentsHandler.h"

using namespace v8;

namespace core
{
    v8::Persistent<v8::Value> *inscope_newPersistentArguments(const v8::FunctionCallbackInfo<v8::Value> &localArgs,
                                                              int startIndex, size_t *argc)
    {
        if (startIndex >= localArgs.Length())
        {
            *argc = 0;
            return nullptr;
        }

        Isolate *isolate = localArgs.GetIsolate();
        size_t length = *argc = localArgs.Length() - startIndex;
        v8::Persistent<v8::Value> *argv = new v8::Persistent<v8::Value>[length];
        for (size_t i = 0; i < length; ++i)
        {
            argv[i].Reset(isolate, localArgs[i + startIndex]);
        }

        return argv;
    }

    std::pair<bool, std::string> inscope_validateString(v8::Isolate *isolate, v8::Local<v8::Value> value,
                                                        const std::string &argumentName, bool requireNonEmpty)
    {
        if (!value->IsString())
        {
            inscope_ThrowTypeError(isolate, argumentName + " must be a string");
            return {false, ""};
        }

        auto utf8Value = v8::String::Utf8Value(isolate, value);
        if (requireNonEmpty && utf8Value.length() == 0)
        {
            inscope_ThrowTypeError(isolate, argumentName + " must be a non-empty string");
            return {false, ""};
        }

        return {true, std::string(*utf8Value)};
    }

    void inscope_ThrowReferenceError(Isolate *isolate, const std::string &message)
    {
        isolate->ThrowException(
            Exception::ReferenceError(String::NewFromUtf8(isolate, message.c_str()).ToLocalChecked()));
    }

    void inscope_ThrowTypeError(Isolate *isolate, const std::string &message)
    {
        isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, message.c_str()).ToLocalChecked()));
    }

    void inscope_ThrowRangeError(Isolate *isolate, const std::string &message)
    {
        isolate->ThrowException(Exception::RangeError(String::NewFromUtf8(isolate, message.c_str()).ToLocalChecked()));
    }

    void inscope_ThrowError(Isolate *isolate, const std::string &message)
    {
        isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate, message.c_str()).ToLocalChecked()));
    }

    bool inscope_validateArgumentsCount(Isolate *isolate, int argc, int minArgs)
    {
        if (argc < minArgs)
        {
            inscope_ThrowError(isolate, "Expected at least " + std::to_string(minArgs) + " arguments");
            return false;
        }

        return true;
    }

    bool inscope_isObjectCreatedBy(Isolate *isolate, Local<Object> &object,
                                   const std::string &globalConstructorFunctionName)
    {
        Local<Context> context = isolate->GetCurrentContext();

        // Get the object's constructor
        Local<Value> constructorVal;
        if (!object->Get(context, String::NewFromUtf8(isolate, "constructor").ToLocalChecked())
                 .ToLocal(&constructorVal))
        {
            return false;  // Failed to get constructor
        }

        if (!constructorVal->IsFunction())
        {
            return false;  // Not a valid constructor
        }
        Local<Function> objConstructor = constructorVal.As<Function>();

        // Get the global constructor function
        Local<Value> globalConstructorVal;
        if (!context->Global()
                 ->Get(context, String::NewFromUtf8(isolate, globalConstructorFunctionName.c_str()).ToLocalChecked())
                 .ToLocal(&globalConstructorVal))
        {
            return false;  // Constructor not found in the global scope
        }

        if (!globalConstructorVal->IsFunction())
        {
            return false;  // Global property is not a function
        }
        Local<Function> globalConstructor = globalConstructorVal.As<Function>();

        // Compare constructors (checking object identity)
        return objConstructor == globalConstructor;
    }

    ArgsWithTaskContext inscope_extractTaskArgs(const FunctionCallbackInfo<Value> &args)
    {
        Isolate *isolate = args.GetIsolate();
        ArgsWithTaskContext result;
        int startIndex = 0;
        if (args.Length() > 1 && args[0]->IsObject() &&
            inscope_isObjectCreatedBy(
                isolate, result.taskContext = args[0]->ToObject(isolate->GetCurrentContext()).ToLocalChecked(),
                "CoroutineContext"))
        {
            startIndex = 1;
        }
        else
        {
            result.taskContext.Clear();
        }

        for (int i = startIndex; i < args.Length(); ++i)
        {
            result.args.push_back(args[i]);
        }

        return result;
    }

}  // namespace core
