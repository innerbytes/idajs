#include "Console.h"

#include "../../../common/Logger.h"
#include <sstream>
#include <iomanip>

namespace core
{
    static constexpr int MAX_OBJECT_DEPTH = 3;           // Maximum nesting depth for object inspection
    static constexpr uint32_t MAX_ARRAY_ITEMS = 100;     // Maximum array items to display before truncating
    static constexpr size_t MAX_TYPED_ARRAY_ITEMS = 100; // Maximum typed array items to display inline
    static constexpr uint32_t MAX_OBJECT_PROPS = 50;     // Maximum object properties to display before truncating

    std::string Console::inscope_FormatValue(v8::Isolate *isolate, v8::Local<v8::Value> value, int depth, int maxDepth)
    {
        v8::HandleScope handleScope(isolate);
        v8::Local<v8::Context> context = isolate->GetCurrentContext();

        // Handle null and undefined
        if (value->IsNull())
        {
            return "null";
        }
        if (value->IsUndefined())
        {
            return "undefined";
        }

        // Handle primitives
        if (value->IsBoolean())
        {
            return value->BooleanValue(isolate) ? "true" : "false";
        }
        if (value->IsNumber())
        {
            v8::String::Utf8Value str(isolate, value);
            return *str;
        }
        if (value->IsString())
        {
            v8::String::Utf8Value str(isolate, value);
            // Return quoted string for objects, plain for top-level
            if (depth > 0)
            {
                std::ostringstream oss;
                oss << "'" << *str << "'";
                return oss.str();
            }
            return *str;
        }

        // Handle functions
        if (value->IsFunction())
        {
            v8::Local<v8::Function> func = value.As<v8::Function>();
            v8::Local<v8::Value> nameValue = func->GetName();
            v8::String::Utf8Value nameStr(isolate, nameValue);
            
            if (nameStr.length() > 0 && **nameStr != '\0')
            {
                std::ostringstream oss;
                oss << "[Function: " << *nameStr << "]";
                return oss.str();
            }
            return "[Function]";
        }

        // Handle arrays
        if (value->IsArray())
        {
            v8::Local<v8::Array> arr = value.As<v8::Array>();
            uint32_t length = arr->Length();
            
            if (depth >= maxDepth)
            {
                return "[Array]";
            }

            std::ostringstream oss;
            oss << "[";
            
            for (uint32_t i = 0; i < length && i < MAX_ARRAY_ITEMS; ++i)
            {
                if (i > 0) oss << ", ";
                
                v8::Local<v8::Value> element;
                if (arr->Get(context, i).ToLocal(&element))
                {
                    oss << inscope_FormatValue(isolate, element, depth + 1, maxDepth);
                }
                else
                {
                    oss << "undefined";
                }
            }
            
            if (length > MAX_ARRAY_ITEMS)
            {
                oss << ", ... " << (length - MAX_ARRAY_ITEMS) << " more items";
            }
            
            oss << "]";
            return oss.str();
        }

        // Handle typed arrays
        if (value->IsTypedArray())
        {
            v8::Local<v8::TypedArray> typedArray = value.As<v8::TypedArray>();
            size_t length = typedArray->Length();
            
            std::ostringstream oss;
            if (value->IsUint8Array())
            {
                oss << "Uint8Array(" << length << ")";
            }
            else if (value->IsUint16Array())
            {
                oss << "Uint16Array(" << length << ")";
            }
            else if (value->IsInt32Array())
            {
                oss << "Int32Array(" << length << ")";
            }
            else if (value->IsFloat32Array())
            {
                oss << "Float32Array(" << length << ")";
            }
            else
            {
                oss << "TypedArray(" << length << ")";
            }
            
            if (depth < maxDepth && length > 0 && length <= MAX_TYPED_ARRAY_ITEMS)
            {
                oss << " [";
                for (size_t i = 0; i < length; ++i)
                {
                    if (i > 0) oss << ", ";
                    v8::Local<v8::Value> element;
                    if (typedArray->Get(context, i).ToLocal(&element))
                    {
                        oss << inscope_FormatValue(isolate, element, depth + 1, maxDepth);
                    }
                }
                oss << "]";
            }
            
            return oss.str();
        }

        // Handle objects
        if (value->IsObject())
        {
            if (depth >= maxDepth)
            {
                return "[Object]";
            }

            v8::Local<v8::Object> obj = value.As<v8::Object>();
            
            // Get own property names
            v8::Local<v8::Array> propertyNames;
            if (!obj->GetOwnPropertyNames(context).ToLocal(&propertyNames))
            {
                return "[Object]";
            }

            uint32_t length = propertyNames->Length();
            
            std::ostringstream oss;
            oss << "{ ";
            
            uint32_t displayedProps = 0;
            for (uint32_t i = 0; i < length && displayedProps < MAX_OBJECT_PROPS; ++i)
            {
                v8::Local<v8::Value> key;
                if (!propertyNames->Get(context, i).ToLocal(&key))
                {
                    continue;
                }

                v8::String::Utf8Value keyStr(isolate, key);
                
                v8::Local<v8::Value> propValue;
                if (!obj->Get(context, key).ToLocal(&propValue))
                {
                    continue;
                }

                if (displayedProps > 0) oss << ", ";
                
                oss << *keyStr << ": " << inscope_FormatValue(isolate, propValue, depth + 1, maxDepth);
                displayedProps++;
            }
            
            if (length > MAX_OBJECT_PROPS)
            {
                oss << ", ... " << (length - MAX_OBJECT_PROPS) << " more properties";
            }
            
            oss << " }";
            return oss.str();
        }

        // Fallback
        v8::String::Utf8Value str(isolate, value);
        return *str;
    }

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

            stream << inscope_FormatValue(isolate, args[i], 0, MAX_OBJECT_DEPTH);
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
