#include "Require.h"

#include "../engine.h"
#include "../files.h"

using namespace v8;

namespace core
{
    void Require::requireFinalizer(const v8::WeakCallbackInfo<RequireData> &info)
    {
        RequireData *data = info.GetParameter();
        data->thisFunction.Reset();
        delete data;
    }

    void Require::require(const v8::FunctionCallbackInfo<v8::Value> &args)
    {
        Isolate *isolate = args.GetIsolate();
        HandleScope handleScope(isolate);

        if (args.Length() < 1 || !args[0]->IsString())
        {
            isolate->ThrowException(Exception::TypeError(
                v8::String::NewFromUtf8Literal(isolate, "require expects a string path to script argument")));
            return;
        }

        // Reading the function data
        auto *data = static_cast<RequireData *>(args.Data().As<External>()->Value());
        Require *thisObject = data->thisObject;
        std::string moduleRootPath = data->moduleRootPath;

        // Resolve the module path - only supporting relative Unix paths for now, and only js files
        String::Utf8Value filePath(isolate, args[0]);
        std::string filePathWithExtension = files::addExtension(*filePath, ".js");
        if (!allowedPathStart(filePathWithExtension))
        {
            isolate->ThrowException(Exception::Error(v8::String::NewFromUtf8Literal(
                isolate,
                "Unexpected characters at the start of module path. Only absolute and relative Unix and Windows file "
                "paths are allowed. Node.js node_modules resolution is not supported. "
                "If you need to use node_modules, please use a bundler like webpack or typescript.")));
            return;
        }

        std::string modulePath = files::toAbsolute(filePathWithExtension, moduleRootPath);
        if (!files::exists(modulePath))
        {
            std::string errorMessage = "File not found: " + modulePath;
            isolate->ThrowException(
                Exception::Error(v8::String::NewFromUtf8(isolate, errorMessage.c_str()).ToLocalChecked()));
            return;
        }

        Local<Context> context = isolate->GetCurrentContext();

        // Check if the module is already cached
        auto cached = thisObject->mModuleCache.find(modulePath);
        if (cached != thisObject->mModuleCache.end())
        {
            Local<Object> module = cached->second.Get(isolate).As<Object>();
            Local<Value> moduleExports =
                module->Get(context, v8::String::NewFromUtf8Literal(isolate, "exports")).ToLocalChecked();

            args.GetReturnValue().Set(moduleExports);
            return;
        }

        std::string scriptContent;
        try
        {
            scriptContent = files::readAllText(modulePath);
        }
        catch (const std::exception &e)
        {
            isolate->ThrowException(Exception::Error(v8::String::NewFromUtf8(isolate, e.what()).ToLocalChecked()));
            return;
        }

        // Wrap module content into the module wrapper function
        std::string wrappedScript =
            "(function(exports, require, module, __filename, __dirname) { " + scriptContent + "\n})";

        MaybeLocal<Value> rawResult = inscope_runScript(context, modulePath, wrappedScript);

        Local<Value> result;
        if (!rawResult.ToLocal(&result) || !result->IsFunction())
        {
            std::string errorMessage = "Failed to execute module " + modulePath;
            isolate->ThrowException(
                Exception::Error(v8::String::NewFromUtf8(isolate, errorMessage.c_str()).ToLocalChecked()));
            return;
        }

        Local<Function> moduleFunction = Local<Function>::Cast(result);

        // Create module and exports objects
        v8::Local<Object> exports = Object::New(isolate);
        v8::Local<Object> module = Object::New(isolate);
        module->Set(context, v8::String::NewFromUtf8Literal(isolate, "exports"), exports).Check();

        // Create require function for this module
        std::string dirPath = files::getDirPath(modulePath);
        auto newRequireData = new RequireData{thisObject, dirPath};
        Local<Function> requireFunction =
            Function::New(context, require, External::New(isolate, newRequireData)).ToLocalChecked();

        newRequireData->thisFunction.Reset(isolate, requireFunction);
        newRequireData->thisFunction.SetWeak(newRequireData, requireFinalizer, WeakCallbackType::kParameter);

        // Call the module wrapper function
        v8::Local<Value> argv[] = {exports, requireFunction, module,
                                   v8::String::NewFromUtf8(isolate, modulePath.c_str()).ToLocalChecked(),
                                   v8::String::NewFromUtf8(isolate, dirPath.c_str()).ToLocalChecked()};

        MaybeLocal<Value> functionResult = inscope_tryCatch([&context, &isolate, &moduleFunction, &argv]() {
            return moduleFunction->Call(context, Undefined(isolate), 5, argv);
        });
        if (functionResult.IsEmpty())
        {
            std::string errorMessage = "Error loading the module: " + modulePath;
            isolate->ThrowException(
                Exception::Error(v8::String::NewFromUtf8(isolate, errorMessage.c_str()).ToLocalChecked()));
            return;
        }

        // Getting module.exports again for the case the module overrides it
        Local<Value> moduleExports =
            module->Get(context, v8::String::NewFromUtf8Literal(isolate, "exports")).ToLocalChecked();

        // Cache the module
        thisObject->mModuleCache[modulePath].Reset(isolate, module);

        // Return module.exports
        args.GetReturnValue().Set(moduleExports);
    }

    void Require::inscope_bind(v8::Isolate *isolate, v8::Local<v8::ObjectTemplate> global)
    {
        global->Set(v8::String::NewFromUtf8Literal(isolate, "require"),
                    v8::FunctionTemplate::New(isolate, require, External::New(isolate, &mRootData)));
    }

    bool Require::allowedPathStart(const std::string &path)
    {
        if (path.empty())
        {
            return false;
        }

        // Check for relative paths: ./ or ../ or .\ or ..\

        if (path[0] == '.')
        {
            if (path.length() == 1)
            {
                return false;  // Just "." is not allowed
            }
            if (path[1] == '/' || path[1] == '\\')
            {
                return true;  // "./" or ".\"
            }
            if (path[1] == '.' && path.length() > 2 && (path[2] == '/' || path[2] == '\\'))
            {
                return true;  // "../" or "..\"
            }
            return false;
        }

        // Check for absolute Unix paths: /
        if (path[0] == '/')
        {
            return true;
        }

        // Check for absolute Windows paths: <letter>:\

        if (path.length() >= 3 && ((path[0] >= 'a' && path[0] <= 'z') || (path[0] >= 'A' && path[0] <= 'Z')) &&
            path[1] == ':' && path[2] == '\\')
        {
            return true;
        }

        return false;
    }

}  // namespace core
