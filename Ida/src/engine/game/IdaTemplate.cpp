#include "IdaTemplate.h"

#include <v8.h>

#include "../../common/Logger.h"
#include "../core/argumentsHandler.h"
#include "../idaInterop.h"
#include "../idajs.h"
#include "script.h"
#include "templateUtils.h"
#include "templates.h"

using namespace v8;
using namespace Logger;

namespace Ida
{

#define VALIDATE_MOVE(flags, objectIndex)                                                                        \
    if (!(flags[objectIndex] & IDA_OBJ_MOVE))                                                                    \
    {                                                                                                            \
        core::inscope_ThrowError(                                                                                \
            args.GetIsolate(),                                                                                   \
            "The move script for object " + std::to_string(objectIndex) +                                        \
                " is not set to be controlled by the Ida mod engine. Use obj.handleMoveScript() to set it up."); \
        return;                                                                                                  \
    }

    IdaTemplate::~IdaTemplate()
    {
        mTemplate.Reset();
    }

    void IdaTemplate::init()
    {
        HandleScope handle_scope(mIsolate);
        Local<ObjectTemplate> tmpl = ObjectTemplate::New(mIsolate);

        // 0 - LbaBridge pointer, 1 - IdaBridge pointer
        tmpl->SetInternalFieldCount(2);

        inscope_bindFunctions(mIsolate, tmpl,
                              {
                                  FN(getTextLanguage),
                                  FN(getVoiceLanguage),
                                  FN(getFirstTextId),
                                  FN(getFirstImageId),

                                  FN(life),
                                  FN(lifef),
                                  FN(setStorm),
                                  FN(forceIsland),
                                  FN(enableLightning),
                                  FN(disableLightning),
                                  FN(getLogLevel),
                                  FN(getAnimations),

                                  FN(halt),
                                  FN(useImages),
                                  FN(setStartSceneId),
                                  FN(setIntroVideo),

                                  // System
                                  FN(_isMoveActive),
                                  FN(_move),
                                  FN(_cmove),
                                  FN(_stopMove),
                                  FN(_enableMove),
                                  FN(_disableMove),
                                  FN(_setMoveHandler),

                                  // Undocumented
                                  FN(_setLogLevel),
                                  FN(_setEppEnabled),
                                  FN(_getBodies),
                              });

        mTemplate.Reset(mIsolate, tmpl);
    }

    void IdaTemplate::bind(Local<Object> object)
    {
        HandleScope handle_scope(mIsolate);
        object
            ->Set(mIsolate->GetCurrentContext(), v8::String::NewFromUtf8(mIsolate, IdaObjectName).ToLocalChecked(),
                  inscope_wrap())
            .Check();
    }

    Local<Object> IdaTemplate::inscope_wrap()
    {
        Local<ObjectTemplate> tmpl = mTemplate.Get(mIsolate);
        Local<Object> instance = tmpl->NewInstance(mIsolate->GetCurrentContext()).ToLocalChecked();
        instance->SetAlignedPointerInInternalField(0, mLbaBridge);
        instance->SetAlignedPointerInInternalField(1, mIdaBridge);
        return instance;
    }

    void IdaTemplate::getTextLanguage(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        BIND_IDA_BRIDGE
        const char *textLanguage = idaBridge->getLanguage();
        args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, textLanguage).ToLocalChecked());
    }

    void IdaTemplate::getVoiceLanguage(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        BIND_IDA_BRIDGE
        const char *voiceLanguage = idaBridge->getSpokenLanguage();
        args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, voiceLanguage).ToLocalChecked());
    }

    void IdaTemplate::getFirstTextId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        BIND_IDA_BRIDGE
        const int firstTextId = idaBridge->getFirstTextId();
        args.GetReturnValue().Set(v8::Integer::New(isolate, firstTextId));
    }

    void IdaTemplate::getFirstImageId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        BIND_IDA_BRIDGE
        const uint8_t firstImageId = idaBridge->getFirstPcxId();
        args.GetReturnValue().Set(v8::Integer::New(isolate, firstImageId));
    }

    void IdaTemplate::life(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::Life)

        // Arguments: 0 - objectIndex, 1 - opcode, 2..more - values (can be number or string)
        VALIDATE_ARGS_COUNT(2)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)
        VALIDATE_VALUE(uint8_t, Uint32, args[1], opcode, 0, 255);

        bool isLoaded;
        inscope_loadLifeOperation(isolate, idaBridge, args, opcode, &isLoaded);
        if (!isLoaded)
        {
            return;
        }

        lbaBridge->executeLifeCode(objectIndex, idaBridge->getLifeScript());
    }

    void IdaTemplate::lifef(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::Life)

        // Arguments: 0 - objectIndex, 1 - opcode, 2..more - values (can be number or string)
        VALIDATE_ARGS_COUNT(2)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)
        VALIDATE_VALUE(uint8_t, Uint32, args[1], opcode, 0, 255);

        bool isLoaded;
        inscope_loadLifeFunction(isolate, idaBridge, args, opcode, &isLoaded);
        if (!isLoaded)
        {
            return;
        }

        uint8_t returnType;
        int result = lbaBridge->executeLifeFunction(objectIndex, &returnType, idaBridge->getLifeScript());

        args.GetReturnValue().Set(v8::Integer::New(isolate, convertResult(result, returnType)));
    }

    void IdaTemplate::_isMoveActive(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        // Arguments: 0 - objectIndex
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        bool isActive = lbaBridge->isMoveCommandActive(objectIndex);
        args.GetReturnValue().Set(v8::Boolean::New(isolate, isActive));
    }

    /// @brief Continues executing already started move command for the object at the given index.
    void IdaTemplate::_move(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::Move)

        // Arguments: 0 - objectIndex, 1 - savedCode[], 2 - opcode, 3..more - arguments (can be number or string)
        VALIDATE_ARGS_COUNT(3)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        if (lbaBridge->isMoveCommandActive(objectIndex))
        {
            err() << "A move command is already active for object " << objectIndex
                  << ". Cannot execute another move command.";
            return;
        }

        VALIDATE_ARRAY(uint8_t, Uint32, args[1], savedCode, 0);
        VALIDATE_VALUE(uint8_t, Uint32, args[2], opcode, 0, 255);

        bool isLoadedSavedOperation = false;
        if (savedCode.size() > 0)
        {
            isLoadedSavedOperation = loadSavedMoveOperation(idaBridge, objectIndex, savedCode, opcode);
            if (!isLoadedSavedOperation)
            {
                err() << "Failed to load saved move operation for object " << objectIndex << " with opcode "
                      << static_cast<int>(opcode) << ". Will execute move command from the beginning.";
            }
        }

        if (!isLoadedSavedOperation)
        {
            bool isLoaded;
            inscope_loadMoveOperation(isolate, idaBridge, args, objectIndex, opcode, &isLoaded);
            if (!isLoaded)
            {
                return;
            }
        }

        std::pair<size_t, uint8_t *> moveScript = idaBridge->getMoveScript(objectIndex);
        lbaBridge->executeMoveCommand(objectIndex, moveScript.second);
    }

    /// @brief Continues executing already started move command for the object at the given index.
    /// Keep this efficient, as it's called every frame for every object that has a move command active.
    void IdaTemplate::_cmove(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::Move)

        // Arguments: 0 - objectIndex
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        if (!lbaBridge->isMoveCommandActive(objectIndex))
        {
            err() << "No move command is active for object " << objectIndex
                  << ". Cannot continue executing move command.";
            return;
        }

        std::pair<size_t, uint8_t *> moveScript = idaBridge->getMoveScript(objectIndex);
        lbaBridge->continueMoveCommand(objectIndex, moveScript.second);
        if (isPersistentMoveOperation(moveScript.second[0]))
        {
            // Return the moveScript as JS array, so we can persist it in the coroutine and save game later
            Local<ArrayBuffer> arrayBuffer = ArrayBuffer::New(isolate, moveScript.first);
            std::shared_ptr<BackingStore> backing = arrayBuffer->GetBackingStore();
            std::memcpy(backing->Data(), moveScript.second, moveScript.first);
            Local<Uint8Array> uint8Array = Uint8Array::New(arrayBuffer, 0, moveScript.first);
            args.GetReturnValue().Set(uint8Array);
        }
    }

    void IdaTemplate::_stopMove(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        // Arguments: 0 - objectIndex
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        if (!lbaBridge->isMoveCommandActive(objectIndex))
        {
            return;
        }

        lbaBridge->stopMoveCommand(objectIndex);
    }

    void IdaTemplate::_enableMove(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        // Arguments: 0 - objectIndex
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        uint8_t *flags = idaBridge->getObjectFlags();
        VALIDATE_MOVE(flags, objectIndex);
        flags[objectIndex] |= IDA_OBJ_MOVE_ENABLED;
    }

    void IdaTemplate::_disableMove(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        // Arguments: 0 - objectIndex
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        uint8_t *flags = idaBridge->getObjectFlags();
        VALIDATE_MOVE(flags, objectIndex);

        if (lbaBridge->isMoveCommandActive(objectIndex))
        {
            lbaBridge->stopMoveCommand(objectIndex);
        }

        flags[objectIndex] &= ~IDA_OBJ_MOVE_ENABLED;
    }

    void IdaTemplate::setStorm(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::BeforeSceneLoad)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT_VALUE(args[0], stormMode, 0, 2)

        uint8_t idaStormMode = idaBridge->getStorm();
        if (idaStormMode == stormMode)
        {
            return;  // No change
        }

        idaBridge->setStorm(stormMode);

        BIND_BRIDGE

        lbaBridge->requestPaletteSync();
    }

    void IdaTemplate::forceIsland(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::BeforeSceneLoad)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT_VALUE(args[0], forcedIsland, 0, 4)

        idaBridge->setForcedIslandModel(forcedIsland);
    }

    void IdaTemplate::setStartSceneId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::None)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT_VALUE(args[0], sceneId, 0)

        idaBridge->setStartSceneId(sceneId);
    }

    void IdaTemplate::setIntroVideo(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::None)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_STRING(args[0], videoName, false)

        idaBridge->setIntroVideo(videoName);
    }

    void IdaTemplate::enableLightning(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        BIND_IDA_BRIDGE
        idaBridge->setLightningDisabled(false);
    }

    void IdaTemplate::disableLightning(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        BIND_IDA_BRIDGE
        idaBridge->setLightningDisabled(true);
    }

    void IdaTemplate::_setLogLevel(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        // Arguments: 0 - log level
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_VALUE(uint8_t, Uint32, args[0], logLevel, 0, 4)

        setJsLogLevel(static_cast<LogLevel>(logLevel));
    }

    void IdaTemplate::getLogLevel(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        args.GetReturnValue().Set(static_cast<int>(getJsLogLevel()));
    }

    void IdaTemplate::_setEppEnabled(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        // Arguments: 0 - enabled (boolean)
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_BOOL(args[0], enabled)

        BIND_IDA_BRIDGE
        idaBridge->setEppEnabled(enabled);
    }

    void IdaTemplate::halt(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::None, ExecutionPhase::InScene)
        idaBridge->halt();
    }

    void IdaTemplate::useImages(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::None, ExecutionPhase::InScene)

        std::unordered_map<std::string, PaletteConversionData> imagePalettes;
        std::unordered_map<std::string, PaletteConversionData> spritePalettes;

        if (args.Length() == 0 || args[0]->IsNull() || args[0]->IsUndefined() || !args[0]->IsObject())
        {
            idaBridge->convertImagesAndSprites(imagePalettes, spritePalettes);
            return;
        }

        Local<Object> configObj = args[0]->ToObject(isolate->GetCurrentContext()).ToLocalChecked();

        // Helper lambda to parse palette configuration for a file
        auto parsePaletteConfiguration = [&](Local<Value> value, bool isSprite) -> PaletteConversionData {
            PaletteConversionData data;

            // Set different defaults for sprites vs images
            if (isSprite)
            {
                // Sprites: WeightedEuclidean, no dithering (algorithm = 2)
                data.algorithm = PaletteConversionData::SpriteDefaultAlgorithm;
                data.useDithering = PaletteConversionData::SpriteDefaultUseDithering;
            }
            else
            {
                // Images: WeightedEuclidean, dithered (algorithm = 3)
                data.algorithm = PaletteConversionData::ImageDefaultAlgorithm;
                data.useDithering = PaletteConversionData::ImageDefaultUseDithering;
            }

            if (value->IsNull() || value->IsUndefined() || !value->IsObject())
            {
                return data;  // Use defaults
            }

            Local<Object> paletteConfig = value->ToObject(isolate->GetCurrentContext()).ToLocalChecked();

            // Extract paletteIndex
            Local<String> paletteIndexKey = v8::String::NewFromUtf8(isolate, "paletteIndex").ToLocalChecked();
            if (paletteConfig->Has(isolate->GetCurrentContext(), paletteIndexKey).ToChecked())
            {
                Local<Value> paletteIndexValue =
                    paletteConfig->Get(isolate->GetCurrentContext(), paletteIndexKey).ToLocalChecked();
                if (paletteIndexValue->IsNumber())
                {
                    data.paletteIndex = paletteIndexValue->Int32Value(isolate->GetCurrentContext()).ToChecked();
                }
            }

            // Extract algorithm
            Local<String> algorithmKey = v8::String::NewFromUtf8(isolate, "algorithm").ToLocalChecked();
            if (paletteConfig->Has(isolate->GetCurrentContext(), algorithmKey).ToChecked())
            {
                Local<Value> algorithmValue =
                    paletteConfig->Get(isolate->GetCurrentContext(), algorithmKey).ToLocalChecked();
                if (algorithmValue->IsNumber())
                {
                    int jsAlgorithm = algorithmValue->Int32Value(isolate->GetCurrentContext()).ToChecked();
                    int cppAlgorithm = 2 * (jsAlgorithm / 2);
                    data.useDithering = (jsAlgorithm % 2) == 1;
                    data.algorithm = static_cast<ColorMatchingAlgorithm>(cppAlgorithm);
                }
            }

            // Extract alphaThreshold (only valid for sprites)
            Local<String> alphaThresholdKey = v8::String::NewFromUtf8(isolate, "alphaThreshold").ToLocalChecked();
            if (paletteConfig->Has(isolate->GetCurrentContext(), alphaThresholdKey).ToChecked())
            {
                Local<Value> alphaThresholdValue =
                    paletteConfig->Get(isolate->GetCurrentContext(), alphaThresholdKey).ToLocalChecked();
                if (alphaThresholdValue->IsNumber())
                {
                    int threshold = alphaThresholdValue->Uint32Value(isolate->GetCurrentContext()).ToChecked();
                    if (threshold > 255)
                    {
                        threshold = 255;  // Clamp to max value
                    }
                    // Clamp to valid uint8_t range
                    data.alphaThreshold = static_cast<uint8_t>(threshold);
                }
            }

            return data;
        };

        // Helper lambda to process a category (sprites or images)
        auto processCategory = [&](Local<Value> categoryValue,
                                   std::unordered_map<std::string, PaletteConversionData> &targetMap, bool isSprite) {
            if (!categoryValue->IsObject())
            {
                return;
            }

            Local<Object> categoryObj = categoryValue->ToObject(isolate->GetCurrentContext()).ToLocalChecked();
            Local<Array> propertyNames =
                categoryObj->GetOwnPropertyNames(isolate->GetCurrentContext()).ToLocalChecked();

            for (uint32_t i = 0; i < propertyNames->Length(); ++i)
            {
                Local<Value> key = propertyNames->Get(isolate->GetCurrentContext(), i).ToLocalChecked();
                Local<Value> value = categoryObj->Get(isolate->GetCurrentContext(), key).ToLocalChecked();

                if (!key->IsString())
                {
                    continue;  // Skip non-string keys
                }

                String::Utf8Value keyStr(isolate, key);
                std::string filename(*keyStr);

                targetMap[filename] = parsePaletteConfiguration(value, isSprite);
            }
        };

        // Process ImagesConfiguration with sprites and images properties
        Local<String> spritesKey = v8::String::NewFromUtf8(isolate, "sprites").ToLocalChecked();
        Local<String> imagesKey = v8::String::NewFromUtf8(isolate, "images").ToLocalChecked();

        if (configObj->Has(isolate->GetCurrentContext(), spritesKey).ToChecked())
        {
            Local<Value> spritesValue = configObj->Get(isolate->GetCurrentContext(), spritesKey).ToLocalChecked();
            processCategory(spritesValue, spritePalettes, true);  // true = isSprite
        }

        if (configObj->Has(isolate->GetCurrentContext(), imagesKey).ToChecked())
        {
            Local<Value> imagesValue = configObj->Get(isolate->GetCurrentContext(), imagesKey).ToLocalChecked();
            processCategory(imagesValue, imagePalettes, false);  // false = isImage
        }

        idaBridge->convertImagesAndSprites(imagePalettes, spritePalettes);
    }

    void IdaTemplate::_setMoveHandler(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::None)
        VALIDATE_ARGS_COUNT(1)

        if (!args[0]->IsFunction())
        {
            core::inscope_ThrowTypeError(isolate, "First argument must be a function");
            return;
        }

        auto moveScriptHandler = Local<Function>::Cast(args[0]);
        idaBridge->setMoveHandler(&moveScriptHandler);
    }

    void IdaTemplate::_getBodies(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], entityId, 0, lbaBridge->getNum3DEntities() - 1)

        uint8_t *allBodies;
        int16_t *allHqrIds;
        int32_t count;
        bool result = lbaBridge->findAllBodies(entityId, &allBodies, &allHqrIds, &count);
        if (!result)
        {
            count = 0;
            wrn() << "Failed to get bodies for the entity. Make sure your HQR files are "
                     "from vanilla game, or they are correctly modified. EntityId: "
                  << entityId;
        }

        Local<Object> resultObj = Object::New(isolate);
        auto context = args.GetIsolate()->GetCurrentContext();
        for (int32_t i = 0; i < count; i++)
        {
            Local<Number> key = Number::New(isolate, allBodies[i]);
            Local<Number> value = Number::New(isolate, allHqrIds[i]);
            resultObj->Set(context, key, value).Check();
        }

        if (count > 0)
        {
            free(allBodies);
            free(allHqrIds);
        }

        args.GetReturnValue().Set(resultObj);
    }

    void IdaTemplate::getAnimations(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], entityId, 0, lbaBridge->getNum3DEntities() - 1)

        uint16_t *allAnims;
        int32_t count;
        bool result = lbaBridge->findAllAnimations(entityId, &allAnims, &count);
        if (!result)
        {
            count = 0;
            wrn() << "Failed to get animations for the entity. Make sure your HQR files are "
                     "from vanilla game, that this entity contains animations, or that your HQR modifications are "
                     "correct. EntityId: "
                  << entityId;
        }

        if (count == 0)
        {
            Local<v8::ArrayBuffer> arrayBuffer = v8::ArrayBuffer::New(isolate, 0);
            Local<v8::Uint16Array> uint16Array = v8::Uint16Array::New(arrayBuffer, 0, 0);
            args.GetReturnValue().Set(uint16Array);
            return;
        }

        std::unique_ptr<v8::BackingStore> backingStore = v8::ArrayBuffer::NewBackingStore(
            allAnims, count * sizeof(uint16_t), [](void *data, size_t length, void *deleter_data) { free(data); },
            nullptr);

        Local<v8::ArrayBuffer> arrayBuffer = v8::ArrayBuffer::New(isolate, std::move(backingStore));
        Local<v8::Uint16Array> uint16Array = v8::Uint16Array::New(arrayBuffer, 0, count);

        args.GetReturnValue().Set(uint16Array);
    }
}  // namespace Ida
