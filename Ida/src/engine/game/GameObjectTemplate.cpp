#include "GameObjectTemplate.h"

#include "../../common/Logger.h"
#include "../Epp.h"
#include "../core/argumentsHandler.h"
#include "ZoneTemplate.h"
#include "templateUtils.h"

using namespace v8;
using namespace Logger;

namespace Ida
{
    GameObjectTemplate::~GameObjectTemplate()
    {
        mTemplate.Reset();
    }

    void GameObjectTemplate::init()
    {
        HandleScope handleScope(mIsolate);

        // Create GameObject Template
        Local<ObjectTemplate> tmpl = ObjectTemplate::New(mIsolate);

        // 0 - lbaBridge, 1 - idaBridge, 2 - objectIndex
        tmpl->SetInternalFieldCount(3);

        // Function bindings
        inscope_bindFunctions(mIsolate, tmpl,
                              {FN(getId),
                               FN(getStaticFlags),
                               FN(getPos),
                               FN(getRegisters),
                               FN(getAngle),
                               FN(getLifePoints),
                               FN(getArmor),
                               FN(getHitPower),
                               FN(getRotationSpeed),
                               FN(getTalkColor),
                               FN(getEntity),
                               FN(getBody),
                               FN(getAnimation),
                               FN(getBonusFlags),
                               FN(getBonusQuantity),
                               FN(getControlMode),
                               FN(getSpriteId),
                               FN(getLifeScript),
                               FN(getMoveScript),
                               FN(isFacingZoneDirection),

                               FN(setControlMode),
                               FN(setStaticFlags),
                               FN(setBonusFlags),
                               FN(setBonusQuantity),
                               FN(setPos),
                               FN(setAngle),
                               FN(setRegisters),
                               FN(setLifePoints),
                               FN(setArmor),
                               FN(setHitPower),
                               FN(setRotationSpeed),
                               FN(setTalkColor),
                               FN(setEntity),
                               FN(setBody),
                               FN(setAnimation),
                               FN(setSpriteId),

                               FN(handleLifeScript),
                               FN(handleMoveScript),

                               FN(disable),
                               FN(isDisabled)});

        mTemplate.Reset(mIsolate, tmpl);
    }

    Local<Object> GameObjectTemplate::inscope_wrap(int objectIndex)
    {
        Local<ObjectTemplate> tmpl = mTemplate.Get(mIsolate);
        Local<Object> instance = tmpl->NewInstance(mIsolate->GetCurrentContext()).ToLocalChecked();
        instance->SetAlignedPointerInInternalField(0, mLbaBridge);
        instance->SetAlignedPointerInInternalField(1, mIdaBridge);
        Local<Value> index = Integer::New(mIsolate, objectIndex);
        instance->SetInternalField(2, index);

        return instance;
    }

    T_OBJET *GameObjectTemplate::inscope_GetObjectReference(Isolate *isolate, IdaLbaBridge *lbaBridge, int objectIndex)
    {
        void *obj = lbaBridge->getObjectByIndex(objectIndex);
        if (!obj)
        {
            std::string errorMessage = "Object not found with index: " + std::to_string(objectIndex);
            core::inscope_ThrowReferenceError(isolate, errorMessage);
            return nullptr;
        }

        return static_cast<T_OBJET *>(obj);
    }

    void GameObjectTemplate::getId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        Local<Int32> objectIndex = args.This()->GetInternalField(2).As<Int32>();
        args.GetReturnValue().Set(objectIndex);
    }

    void GameObjectTemplate::getStaticFlags(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        uint32_t flags = object->Flags;
        args.GetReturnValue().Set(flags);
    }

    void GameObjectTemplate::getBonusFlags(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        int16_t bonus = object->OptionFlags;
        args.GetReturnValue().Set(bonus);
    }

    void GameObjectTemplate::getPos(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        Local<Array> position = Array::New(isolate, 3);
        position->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, object->Obj.X)).Check();
        position->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, object->Obj.Y)).Check();
        position->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, object->Obj.Z)).Check();

        args.GetReturnValue().Set(position);
    }

    // When use clipping flag is set, it is the clipping rectangle: [Left, Top, Right, Bottom]
    void GameObjectTemplate::getRegisters(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        Local<Array> clipping = Array::New(isolate, 4);
        clipping->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, object->Info)).Check();
        clipping->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, object->Info1)).Check();
        clipping->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, object->Info2)).Check();
        clipping->Set(isolate->GetCurrentContext(), 3, Integer::New(isolate, object->Info3)).Check();

        args.GetReturnValue().Set(clipping);
    }

    void GameObjectTemplate::getAngle(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        int angle = object->Obj.Beta;
        args.GetReturnValue().Set(angle);
    }

    void GameObjectTemplate::getLifePoints(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        int16_t lifePoints = object->LifePoint;
        args.GetReturnValue().Set(lifePoints);
    }

    void GameObjectTemplate::getArmor(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t armor = object->Armure;
        args.GetReturnValue().Set(armor);
    }

    void GameObjectTemplate::getHitPower(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t hitPower = object->HitForce;
        args.GetReturnValue().Set(hitPower);
    }

    // Rotation speed is connected to desired rotation delay (used in LBAArchitect) by the formula: speed = 1024 * 50 /
    // delay
    void GameObjectTemplate::getRotationSpeed(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        int16_t rotationDelay = object->SRot;
        args.GetReturnValue().Set(rotationDelay);
    }

    void GameObjectTemplate::getTalkColor(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t talkColor = object->CoulObj;
        args.GetReturnValue().Set(talkColor);
    }

    void GameObjectTemplate::getEntity(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        int entity = object->IndexFile3D;
        args.GetReturnValue().Set(entity);
    }

    void GameObjectTemplate::getBody(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t body = object->GenBody;
        args.GetReturnValue().Set(body);
    }

    void GameObjectTemplate::getAllBodies(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        U8 *allBodies;
        S32 count;
        bool result = lbaBridge->findAllBodies(objectIndexValue, &allBodies, &count);
        if (!result)
        {
            core::inscope_ThrowReferenceError(
                isolate,
                "Failed to get all bodies for the object. Make sure you set object Entity first. Current entity: " +
                    std::to_string(object->IndexFile3D));
            return;
        }

        std::unique_ptr<v8::BackingStore> backingStore = v8::ArrayBuffer::NewBackingStore(
            allBodies, count, [](void *data, size_t length, void *deleter_data) { delete[] static_cast<U8 *>(data); },
            nullptr);

        Local<v8::ArrayBuffer> arrayBuffer = v8::ArrayBuffer::New(isolate, std::move(backingStore));
        Local<v8::Uint8Array> uint8Array = v8::Uint8Array::New(arrayBuffer, 0, count);

        args.GetReturnValue().Set(uint8Array);
    }

    // The higher byte contains the animation number, if it's a special actor animation
    // The lower bytes can contain general animation numbers
    void GameObjectTemplate::getAnimation(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint16_t animation = object->GenAnim;
        args.GetReturnValue().Set(animation);
    }

    void GameObjectTemplate::getBonusQuantity(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        int16_t bonusQuantity = object->NbBonus;
        args.GetReturnValue().Set(bonusQuantity);
    }

    void GameObjectTemplate::getControlMode(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t controlMode = object->Move;
        args.GetReturnValue().Set(controlMode);
    }

    void GameObjectTemplate::getSpriteId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        int16_t spriteId = object->Sprite;
        args.GetReturnValue().Set(spriteId);
    }

    // Now just outputting whether the life script is present or not. Output the script later.
    // Code of the decompiler for life and move opcodes can be taken from here:
    // https://github.com/LBALab/lba2remake/blob/master/src/game/scripting/data/lba2/life.ts
    void GameObjectTemplate::getLifeScript(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t *lifeStart = object->PtrLife;

        Local<Array> lifeScript = Array::New(isolate, 0);
        if (lifeStart == nullptr || lifeStart[0] == 0)
        {
            args.GetReturnValue().Set(false);
        }
        else
        {
            args.GetReturnValue().Set(true);
        }
    }

    // Now just outputting whether the move script is present or not. Output the script later.
    void GameObjectTemplate::getMoveScript(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);
        uint8_t *moveStart = object->PtrTrack;

        Local<Array> moveScript = Array::New(isolate, 0);
        if (moveStart == nullptr || moveStart[0] == 0)
        {
            args.GetReturnValue().Set(false);
        }
        else
        {
            args.GetReturnValue().Set(true);
        }
    }

    void GameObjectTemplate::isFacingZoneDirection(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(1);
        BIND_OBJECT(T_OBJET, object);
        VALIDATE_INT_VALUE(args[0], zoneIndex, 0, lbaBridge->getNumZones() - 1)

        T_ZONE *zone = ZoneTemplate::inscope_GetObjectReference(isolate, lbaBridge, zoneIndex);
        if (!zone)
        {
            return;
        }

        // If direction is not specified, it will be attempted to read from zone->Info2
        uint8_t direction = static_cast<uint8_t>(ZoneDirection::None);
        if (args.Length() > 1)
        {
            VALIDATE_VALUE(uint8_t, Uint32, args[1], dir, 0, 8);
            direction = dir;
        }

        bool result = lbaBridge->testObjectZoneDirection(object->Obj.X, object->Obj.Z, object->Obj.Beta, zone,
                                                         static_cast<ZoneDirection>(direction));

        args.GetReturnValue().Set(result);
    }

    void GameObjectTemplate::setControlMode(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(int32_t, Int32, args[0], controlMode, 0, 13);
        BIND_OBJECT(T_OBJET, object);

        object->Move = controlMode;
    }

    void GameObjectTemplate::setStaticFlags(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(uint32_t, Uint32, args[0], staticFlags);
        BIND_OBJECT(T_OBJET, object);

        object->Flags = staticFlags;
    }

    void GameObjectTemplate::setBonusFlags(const FunctionCallbackInfo<Value> &args)
    {
        using namespace std;
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], bonusFlags);
        BIND_OBJECT(T_OBJET, object);

        object->OptionFlags = bonusFlags;
    }

    void GameObjectTemplate::setBonusQuantity(const FunctionCallbackInfo<Value> &args)
    {
        using namespace std;
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], bonusQuantity);
        BIND_OBJECT(T_OBJET, object);

        object->NbBonus = bonusQuantity;
    }

    void GameObjectTemplate::setPos(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_ARRAY(int32_t, Int32, args[0], pos, 3);
        BIND_OBJECT(T_OBJET, object);

        if (objectIndexValue == 0)
        {
            wrn() << "Setting position of the object 0 (hero object) in the scene loading phase has no effect. Use "
                     "scene.setStartPos() instead.";
        }

        object->Obj.X = pos[0];
        object->Obj.Y = pos[1];
        object->Obj.Z = pos[2];
    }

    void GameObjectTemplate::setAngle(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(int32_t, Int32, args[0], angle);
        BIND_OBJECT(T_OBJET, object);

        object->Obj.Beta = angle;
    }

    void GameObjectTemplate::setRegisters(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_ARRAY(int32_t, Int32, args[0], registers, 4);
        BIND_OBJECT(T_OBJET, object);

        object->Info = registers[0];
        object->Info1 = registers[1];
        object->Info2 = registers[2];
        object->Info3 = registers[3];
    }

    void GameObjectTemplate::setLifePoints(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], lifePoints);
        BIND_OBJECT(T_OBJET, object);

        object->LifePoint = lifePoints;
    }

    void GameObjectTemplate::setArmor(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(uint8_t, Uint32, args[0], armor, 0, 255);
        BIND_OBJECT(T_OBJET, object);

        object->Armure = armor;
    }

    void GameObjectTemplate::setHitPower(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(uint8_t, Uint32, args[0], hitPower, 0, 255);
        BIND_OBJECT(T_OBJET, object);

        object->HitForce = hitPower;
    }

    void GameObjectTemplate::setRotationSpeed(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], rotationSpeed);
        BIND_OBJECT(T_OBJET, object);

        object->SRot = rotationSpeed;
    }

    void GameObjectTemplate::setTalkColor(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(uint8_t, Uint32, args[0], talkColor, 0, 15);
        BIND_OBJECT(T_OBJET, object);

        object->CoulObj = talkColor;
    }

    void GameObjectTemplate::setEntity(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(int32_t, Int32, args[0], entity);
        BIND_OBJECT(T_OBJET, object);

        bool hasChanged = object->IndexFile3D != entity;
        object->IndexFile3D = entity;
        if (hasChanged)
        {
            lbaBridge->update3DModel(object);
        }
    }

    void GameObjectTemplate::setBody(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(uint8_t, Uint32, args[0], body, 0, 255);
        BIND_OBJECT(T_OBJET, object);

        object->GenBody = body;
    }

    void GameObjectTemplate::setAnimation(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_VALUE(uint16_t, Uint32, args[0], animation, 0, 65535);
        BIND_OBJECT(T_OBJET, object);

        object->GenAnim = animation;
    }

    void GameObjectTemplate::setSpriteId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1);
        VALIDATE_INT16_VALUE(args[0], spriteId);
        BIND_OBJECT(T_OBJET, object);

        object->Sprite = spriteId;
    }

    void GameObjectTemplate::disable(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        BIND_OBJECT(T_OBJET, object);

        object->WorkFlags |= OBJ_DEAD;
        object->Obj.Body.Num = -1;
        object->ZoneSce = -1;
        object->LifePoint = 0;
    }

    void GameObjectTemplate::isDisabled(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_OBJECT(T_OBJET, object);

        bool isDisabled = (object->WorkFlags & OBJ_DEAD) != 0;
        args.GetReturnValue().Set(isDisabled);
    }

    void GameObjectTemplate::handleLifeScript(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)

        Global<Function> lifeScriptHandler;
        if (args.Length() > 0)
        {
            if (!args[0]->IsFunction())
            {
                core::inscope_ThrowTypeError(isolate, "First argument must be a function");
                return;
            }
            Local<Function> localHandler = Local<Function>::Cast(args[0]);
            lifeScriptHandler.Reset(isolate, localHandler);
        }

        BIND_OBJECT(T_OBJET, object);
        uint8_t *flags = idaBridge->getObjectFlags();
        flags[objectIndexValue] |= IDA_OBJ_LIFE;
        if (lifeScriptHandler.IsEmpty())
        {
            flags[objectIndexValue] &= ~IDA_OBJ_LIFE_ENABLED;
        }
        else
        {
            flags[objectIndexValue] |= IDA_OBJ_LIFE_ENABLED;
        }

        idaBridge->setLifeHandler(objectIndexValue, &lifeScriptHandler);
    }

    void GameObjectTemplate::handleMoveScript(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        BIND_OBJECT(T_OBJET, object);

        uint8_t *flags = idaBridge->getObjectFlags();
        flags[objectIndexValue] |= IDA_OBJ_MOVE;

        object->OffsetTrack = -1;
        object->MemoLabelTrack = -1;
        object->OffsetLabelTrack = -1;
        object->LabelTrack = -1;
    }

}  // namespace Ida
