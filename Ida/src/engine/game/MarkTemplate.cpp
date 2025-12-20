#include "MarkTemplate.h"

#include <v8.h>

#include <cstring>

#include "../core/argumentsHandler.h"
#include "templateUtils.h"
#include "templates.h"

using namespace v8;

namespace Ida
{
    MarkTemplate::~MarkTemplate()
    {
        mTemplate.Reset();
    }

    void MarkTemplate::init()
    {
        HandleScope handle_scope(mIsolate);
        Local<ObjectTemplate> tmpl = ObjectTemplate::New(mIsolate);

        // 0 - LbaBridge pointer, 1 - IdaBridge pointer
        tmpl->SetInternalFieldCount(2);

        inscope_bindFunctions(
            mIsolate, tmpl,
            {FN(exitProcess), FN(exit), FN(newGame), FN(saveGame), FN(loadGame), FN(skipVideoOnce),
             FN(setGameInputOnce), FN(getGameLoop), FN(isHotReloadEnabled), FN(disableHotReload), FN(enableHotReload),
             FN(doDialogSpy), FN(getDialogSpyInfo), FN(doImageSpy), FN(getImageSpyInfo)});

        mTemplate.Reset(mIsolate, tmpl);
    }

    void MarkTemplate::bind(Local<Object> object)
    {
        HandleScope handle_scope(mIsolate);
        object
            ->Set(mIsolate->GetCurrentContext(), v8::String::NewFromUtf8(mIsolate, "mark").ToLocalChecked(),
                  inscope_wrap())
            .Check();
    }

    Local<Object> MarkTemplate::inscope_wrap()
    {
        Local<ObjectTemplate> tmpl = mTemplate.Get(mIsolate);
        Local<Object> instance = tmpl->NewInstance(mIsolate->GetCurrentContext()).ToLocalChecked();
        instance->SetAlignedPointerInInternalField(0, mLbaBridge);
        instance->SetAlignedPointerInInternalField(1, mIdaBridge);
        return instance;
    }

    void MarkTemplate::exitProcess(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT_VALUE(args[0], exitCode);
        BIND_BRIDGE
        lbaBridge->exitProcess(exitCode);
    }

    void MarkTemplate::exit(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        if (idaBridge->getLoopType() != LoopType::GameMenu)
        {
            core::inscope_ThrowError(isolate, "Cannot exit the game when not in the main menu.");
            return;
        }

        if (args.Length() > 0)
        {
            VALIDATE_INT_VALUE(args[0], exitCode, 0, 255)
            idaBridge->exitGame(exitCode);
        }
        else
        {
            idaBridge->exitGame(0);
        }
    }

    void MarkTemplate::newGame(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        if (idaBridge->getLoopType() != LoopType::GameMenu)
        {
            core::inscope_ThrowError(isolate, "Cannot start a new game when not in the main menu.");
            return;
        }

        idaBridge->newGame();
    }

    void MarkTemplate::saveGame(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        if (idaBridge->getLoopType() != LoopType::GameMenu)
        {
            core::inscope_ThrowError(isolate, "Cannot start a new game when not in the main menu.");
            return;
        }

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_STRING(args[0], saveName, true)
        if (saveName.length() > 100)
        {
            core::inscope_ThrowError(isolate, "Save game name is too long. Maximum length is 100 characters.");
            return;
        }

        idaBridge->saveGame(saveName);
    }

    void MarkTemplate::loadGame(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        if (idaBridge->getLoopType() != LoopType::GameMenu)
        {
            core::inscope_ThrowError(isolate, "Cannot load a game when not in the main menu.");
            return;
        }

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_STRING(args[0], saveName, true)
        if (saveName.length() > 100)
        {
            core::inscope_ThrowError(isolate, "Load game name is too long. Maximum length is 100 characters.");
            return;
        }

        idaBridge->loadGame(saveName);
    }

    void MarkTemplate::skipVideoOnce(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST
        idaBridge->skipVideoOnce();
    }

    void MarkTemplate::setGameInputOnce(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        // Arguments: 0 - input value
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_VALUE(uint32_t, Uint32, args[0], input)

        idaBridge->setGameInputOnce(input);
    }

    void MarkTemplate::getGameLoop(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        args.GetReturnValue().Set(static_cast<int>(idaBridge->getLoopType()));
    }

    void MarkTemplate::isHotReloadEnabled(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        args.GetReturnValue().Set(idaBridge->isHotReloadEnabled());
    }

    void MarkTemplate::disableHotReload(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        idaBridge->setHotReloadEnabled(false);
    }

    void MarkTemplate::enableHotReload(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        idaBridge->setHotReloadEnabled(true);
    }

    void MarkTemplate::doDialogSpy(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        // Arguments: 0 - time in ms
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT_VALUE(args[0], time, 0)

        idaBridge->doDialogSpy(time);
    }

    void MarkTemplate::getDialogSpyInfo(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        const DialogSpyInfo &dialogSpyInfo = idaBridge->getDialogSpyInfo();
        Local<Object> result = Object::New(isolate);

        // Convert text bytes to JavaScript Uint8Array without copying (zero-copy approach)
        Local<Uint8Array> textUint8Array;
        if (!dialogSpyInfo.text.empty())
        {
            Local<ArrayBuffer> textArrayBuffer = ArrayBuffer::New(isolate, dialogSpyInfo.text.size());
            std::memcpy(textArrayBuffer->GetBackingStore()->Data(), dialogSpyInfo.text.data(),
                        dialogSpyInfo.text.size());
            textUint8Array = Uint8Array::New(textArrayBuffer, 0, dialogSpyInfo.text.size());
        }
        else
        {
            Local<ArrayBuffer> emptyBuffer = ArrayBuffer::New(isolate, 0);
            textUint8Array = Uint8Array::New(emptyBuffer, 0, 0);
        }
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "text").ToLocalChecked(),
                  textUint8Array)
            .Check();
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "flags").ToLocalChecked(),
                  v8::Integer::New(isolate, dialogSpyInfo.flags))
            .Check();
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "minColor").ToLocalChecked(),
                  v8::Integer::New(isolate, dialogSpyInfo.minColor))
            .Check();
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "maxColor").ToLocalChecked(),
                  v8::Integer::New(isolate, dialogSpyInfo.maxColor))
            .Check();

        // Add sprite information
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "spriteId").ToLocalChecked(),
                  v8::Integer::New(isolate, static_cast<int>(dialogSpyInfo.spriteId)))
            .Check();
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "spriteXOfs").ToLocalChecked(),
                  v8::Integer::New(isolate, dialogSpyInfo.spriteXOfs))
            .Check();
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "spriteYOfs").ToLocalChecked(),
                  v8::Integer::New(isolate, dialogSpyInfo.spriteYOfs))
            .Check();

        // Convert sprite bytes to JavaScript Uint8Array (empty array if no data)
        Local<ArrayBuffer> arrayBuffer = ArrayBuffer::New(isolate, dialogSpyInfo.spriteBytes.size());
        if (!dialogSpyInfo.spriteBytes.empty())
        {
            std::memcpy(arrayBuffer->GetBackingStore()->Data(), dialogSpyInfo.spriteBytes.data(),
                        dialogSpyInfo.spriteBytes.size());
        }
        Local<Uint8Array> uint8Array = Uint8Array::New(arrayBuffer, 0, dialogSpyInfo.spriteBytes.size());
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "spriteBytes").ToLocalChecked(),
                  uint8Array)
            .Check();

        args.GetReturnValue().Set(result);
    }

    void MarkTemplate::doImageSpy(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        // Arguments: 0 - time in ms
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT_VALUE(args[0], time, 0)

        idaBridge->doImageSpy(time);
    }

    void MarkTemplate::getImageSpyInfo(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_TEST

        const ImageSpyInfo &imageSpyInfo = idaBridge->getImageSpyInfo();
        Local<Object> result = Object::New(isolate);

        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "isActive").ToLocalChecked(),
                  v8::Boolean::New(isolate, imageSpyInfo.isActive))
            .Check();
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "effectId").ToLocalChecked(),
                  v8::Integer::New(isolate, imageSpyInfo.effectId))
            .Check();

        // Convert palette bytes to JavaScript Uint8Array (empty array if no data)
        Local<ArrayBuffer> paletteArrayBuffer = ArrayBuffer::New(isolate, imageSpyInfo.paletteBytes.size());
        if (!imageSpyInfo.paletteBytes.empty())
        {
            std::memcpy(paletteArrayBuffer->GetBackingStore()->Data(), imageSpyInfo.paletteBytes.data(),
                        imageSpyInfo.paletteBytes.size());
        }
        Local<Uint8Array> paletteUint8Array = Uint8Array::New(paletteArrayBuffer, 0, imageSpyInfo.paletteBytes.size());
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "paletteBytes").ToLocalChecked(),
                  paletteUint8Array)
            .Check();

        // Convert image bytes to JavaScript Uint8Array (empty array if no data)
        Local<ArrayBuffer> imageArrayBuffer = ArrayBuffer::New(isolate, imageSpyInfo.imageBytes.size());
        if (!imageSpyInfo.imageBytes.empty())
        {
            std::memcpy(imageArrayBuffer->GetBackingStore()->Data(), imageSpyInfo.imageBytes.data(),
                        imageSpyInfo.imageBytes.size());
        }
        Local<Uint8Array> imageUint8Array = Uint8Array::New(imageArrayBuffer, 0, imageSpyInfo.imageBytes.size());
        result
            ->Set(isolate->GetCurrentContext(), v8::String::NewFromUtf8(isolate, "imageBytes").ToLocalChecked(),
                  imageUint8Array)
            .Check();

        args.GetReturnValue().Set(result);
    }

}  // namespace Ida
