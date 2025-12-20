#pragma once
#include <v8.h>

namespace core
{
    struct ArgsWithTaskContext
    {
        v8::Local<v8::Object> taskContext;
        std::vector<v8::Local<v8::Value>> args;
    };

    v8::Persistent<v8::Value> *inscope_newPersistentArguments(const v8::FunctionCallbackInfo<v8::Value> &localArgs,
                                                              int startIndex, size_t *argc);

    bool inscope_validateArgumentsCount(v8::Isolate *isolate, int argc, int minArgs);

    void inscope_ThrowReferenceError(v8::Isolate *isolate, const std::string &message);

    void inscope_ThrowTypeError(v8::Isolate *isolate, const std::string &message);

    void inscope_ThrowRangeError(v8::Isolate *isolate, const std::string &message);

    void inscope_ThrowError(v8::Isolate *isolate, const std::string &message);

    bool inscope_isObjectCreatedBy(v8::Isolate *isolate, v8::Local<v8::Object> &object,
                                   const std::string &globalConstructorFunctionName);

    ArgsWithTaskContext inscope_extractTaskArgs(const v8::FunctionCallbackInfo<v8::Value> &args);

    template <typename T, typename ValidatorFn, typename ExtractorFn>
    std::pair<bool, T> inscope_validateValue(const std::string &typeName, v8::Isolate *isolate,
                                             v8::Local<v8::Value> value, const std::string &argumentName,
                                             ValidatorFn isValid, ExtractorFn extract,
                                             std::optional<T> minValue = std::nullopt,
                                             std::optional<T> maxValue = std::nullopt)
    {
        if (!isValid(value))
        {
            inscope_ThrowTypeError(isolate, argumentName + " must be " + typeName);
            return {false, T{}};
        }

        auto checkedValue = extract(isolate->GetCurrentContext(), value).ToChecked();

        // 3) Range checks
        if (minValue && checkedValue < *minValue)
        {
            inscope_ThrowRangeError(isolate, argumentName + " must be >= " + std::to_string(*minValue));
            return {false, T{}};
        }
        if (maxValue && checkedValue > *maxValue)
        {
            inscope_ThrowRangeError(isolate, argumentName + " must be <= " + std::to_string(*maxValue));
            return {false, T{}};
        }

        return {true, static_cast<T>(checkedValue)};
    }

    template <typename T, typename ValidatorFn, typename ExtractorFn>
    std::pair<bool, std::vector<T>> inscope_validateArray(const std::string &typeName, v8::Isolate *isolate,
                                                          v8::Local<v8::Value> value, const std::string &argumentName,
                                                          ValidatorFn isValid, ExtractorFn extract, size_t checkedSize,
                                                          std::optional<T> minValue = std::nullopt,
                                                          std::optional<T> maxValue = std::nullopt)
    {
        std::vector<T> checkedValues;

        if (!value->IsArray())
        {
            inscope_ThrowTypeError(isolate, argumentName + " must be an array");
            return {false, checkedValues};
        }

        v8::Local<v8::Array> array = v8::Local<v8::Array>::Cast(value);
        auto arrayLength = array->Length();
        if (checkedSize > 0 && arrayLength != checkedSize)
        {
            inscope_ThrowTypeError(isolate, argumentName + " must be an array of size " + std::to_string(checkedSize));
            return {false, checkedValues};
        }

        checkedValues.reserve(arrayLength);
        for (size_t i = 0; i < arrayLength; ++i)
        {
            auto ctx = isolate->GetCurrentContext();
            auto val = array->Get(ctx, i).ToLocalChecked();
            if (!isValid(val))
            {
                inscope_ThrowTypeError(isolate, argumentName + " must be an array of type " + typeName);
                return {false, checkedValues};
            }

            auto checkedValue = extract(ctx, val).FromMaybe(0);
            if (minValue && checkedValue < *minValue)
            {
                inscope_ThrowRangeError(isolate,
                                        argumentName + " must have values that are >= " + std::to_string(*minValue));
                return {false, checkedValues};
            }
            if (maxValue && checkedValue > *maxValue)
            {
                inscope_ThrowRangeError(isolate,
                                        argumentName + " must have values that are <= " + std::to_string(*maxValue));
                return {false, checkedValues};
            }

            checkedValues.push_back(static_cast<T>(checkedValue));
        }

        return {true, checkedValues};
    }

    std::pair<bool, std::string> inscope_validateString(v8::Isolate *isolate, v8::Local<v8::Value> value,
                                                        const std::string &argumentName, bool requireNonEmpty);

}  // namespace core

#define VALIDATE_ARGS_COUNT(count)                                            \
    if (!core::inscope_validateArgumentsCount(isolate, args.Length(), count)) \
    {                                                                         \
        return;                                                               \
    }

#define VALIDATE_VALUE(CTYPE, SUFFIX, value, name, ...)                        \
    auto result_##name = core::inscope_validateValue<CTYPE>(                   \
        #CTYPE, isolate, value, #name, [](auto v) { return v->Is##SUFFIX(); }, \
        [](auto ctx, auto v) { return v->SUFFIX##Value(ctx); }, __VA_ARGS__);  \
    if (!result_##name.first)                                                  \
    {                                                                          \
        return;                                                                \
    }                                                                          \
    auto name = result_##name.second;

#define VALIDATE_STRING(value, name, requireNonEmpty)                                          \
    auto result_##name = core::inscope_validateString(isolate, value, #name, requireNonEmpty); \
    if (!result_##name.first)                                                                  \
    {                                                                                          \
        return;                                                                                \
    }                                                                                          \
    auto name = result_##name.second;

#define VALIDATE_BOOL(value, name)                                         \
    if (!value->IsBoolean())                                               \
    {                                                                      \
        core::inscope_ThrowTypeError(isolate, #name " must be a boolean"); \
        return;                                                            \
    }                                                                      \
    auto name = value->BooleanValue(isolate);

#define VALIDATE_INT_VALUE(value, name, ...) VALIDATE_VALUE(int32_t, Int32, value, name, __VA_ARGS__)

#define VALIDATE_INT16_VALUE(value, name)                                            \
    VALIDATE_VALUE(int16_t, Int32, value, name, std::numeric_limits<int16_t>::min(), \
                   std::numeric_limits<int16_t>::max())

#define VALIDATE_ARRAY(CTYPE, SUFFIX, value, name, size, ...)                       \
    auto result_##name = core::inscope_validateArray<CTYPE>(                        \
        #CTYPE, isolate, value, #name, [](auto v) { return v->Is##SUFFIX(); },      \
        [](auto ctx, auto v) { return v->SUFFIX##Value(ctx); }, size, __VA_ARGS__); \
    if (!result_##name.first)                                                       \
    {                                                                               \
        return;                                                                     \
    }                                                                               \
    auto name = result_##name.second;
