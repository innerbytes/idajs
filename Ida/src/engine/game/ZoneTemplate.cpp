#include "ZoneTemplate.h"

#include "../core/argumentsHandler.h"
#include "templateUtils.h"

using namespace v8;

namespace Ida
{
    ZoneTemplate::~ZoneTemplate()
    {
        mTemplate.Reset();
    }

    void ZoneTemplate::init()
    {
        HandleScope handleScope(mIsolate);

        Local<ObjectTemplate> tmpl = ObjectTemplate::New(mIsolate);

        // 0 - lbaBridge, 1 - idaBridge, 2 - zoneIndex
        tmpl->SetInternalFieldCount(3);

        // Function bindings
        inscope_bindFunctions(mIsolate, tmpl,
                              {FN(getId), FN(getPos1), FN(getPos2), FN(getRegisters), FN(getType), FN(getZoneValue),

                               FN(setPos1), FN(setPos2), FN(setRegisters), FN(setType), FN(setZoneValue)});

        mTemplate.Reset(mIsolate, tmpl);
    }

    Local<Object> ZoneTemplate::inscope_wrap(int zoneIndex)
    {
        Local<ObjectTemplate> tmpl = mTemplate.Get(mIsolate);
        Local<Object> instance = tmpl->NewInstance(mIsolate->GetCurrentContext()).ToLocalChecked();
        instance->SetAlignedPointerInInternalField(0, mLbaBridge);
        instance->SetAlignedPointerInInternalField(1, mIdaBridge);
        Local<Value> index = Integer::New(mIsolate, zoneIndex);
        instance->SetInternalField(2, index);

        return instance;
    }

    T_ZONE *ZoneTemplate::inscope_GetObjectReference(Isolate *isolate, IdaLbaBridge *lbaBridge, int zoneIndex)
    {
        void *zone = lbaBridge->getZoneByIndex(zoneIndex);
        if (!zone)
        {
            std::string errorMessage = "Zone not found with index: " + std::to_string(zoneIndex);
            core::inscope_ThrowReferenceError(isolate, errorMessage);
            return nullptr;
        }
        return static_cast<T_ZONE *>(zone);
    }

    void ZoneTemplate::getId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        Local<Int32> zoneIndex = args.This()->GetInternalField(2).As<Int32>();
        args.GetReturnValue().Set(zoneIndex);
    }

    void ZoneTemplate::getPos1(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_ZONE, zone);
        Local<Array> pos = Array::New(isolate, 3);
        pos->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, zone->X0)).Check();
        pos->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, zone->Y0)).Check();
        pos->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, zone->Z0)).Check();
        args.GetReturnValue().Set(pos);
    }

    void ZoneTemplate::getPos2(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_ZONE, zone);
        Local<Array> pos = Array::New(isolate, 3);
        pos->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, zone->X1)).Check();
        pos->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, zone->Y1)).Check();
        pos->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, zone->Z1)).Check();
        args.GetReturnValue().Set(pos);
    }

    void ZoneTemplate::getRegisters(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_ZONE, zone);
        Local<Array> registers = Array::New(isolate, 8);
        registers->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, zone->Info0)).Check();
        registers->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, zone->Info1)).Check();
        registers->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, zone->Info2)).Check();
        registers->Set(isolate->GetCurrentContext(), 3, Integer::New(isolate, zone->Info3)).Check();
        registers->Set(isolate->GetCurrentContext(), 4, Integer::New(isolate, zone->Info4)).Check();
        registers->Set(isolate->GetCurrentContext(), 5, Integer::New(isolate, zone->Info5)).Check();
        registers->Set(isolate->GetCurrentContext(), 6, Integer::New(isolate, zone->Info6)).Check();
        registers->Set(isolate->GetCurrentContext(), 7, Integer::New(isolate, zone->Info7)).Check();
        args.GetReturnValue().Set(registers);
    }

    void ZoneTemplate::getType(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_ZONE, zone);
        args.GetReturnValue().Set(zone->Type);
    }

    void ZoneTemplate::getZoneValue(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_ZONE, zone);
        args.GetReturnValue().Set(zone->Num);
    }

    void ZoneTemplate::setZoneValue(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], zoneValue);
        BIND_OBJECT(T_ZONE, zone);

        zone->Num = zoneValue;
    }

    void ZoneTemplate::setPos1(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_ARRAY(int32_t, Int32, args[0], pos1, 3);
        BIND_OBJECT(T_ZONE, zone);

        zone->X0 = pos1[0];
        zone->Y0 = pos1[1];
        zone->Z0 = pos1[2];
    }

    void ZoneTemplate::setPos2(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_ARRAY(int32_t, Int32, args[0], pos2, 3);
        BIND_OBJECT(T_ZONE, zone);

        zone->X1 = pos2[0];
        zone->Y1 = pos2[1];
        zone->Z1 = pos2[2];
    }

    void ZoneTemplate::setRegisters(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_ARRAY(int32_t, Int32, args[0], registers, 8);
        BIND_OBJECT(T_ZONE, zone);

        zone->Info0 = registers[0];
        zone->Info1 = registers[1];
        zone->Info2 = registers[2];
        zone->Info3 = registers[3];
        zone->Info4 = registers[4];
        zone->Info5 = registers[5];
        zone->Info6 = registers[6];
        zone->Info7 = registers[7];
    }

    void ZoneTemplate::setType(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], type);
        BIND_OBJECT(T_ZONE, zone);

        zone->Type = type;
    }

}  // namespace Ida
