#include "SceneTemplate.h"

#include "../Epp.h"
#include "../core/argumentsHandler.h"
#include "../idajs.h"
#include "templateUtils.h"
#include "templates.h"

using namespace v8;

namespace Ida
{
    /// @brief Some variables should not be written through Ida directly, as it's dangerous
    inline static bool isReadOnlyGameVariable(const int variableIndex)
    {
        return variableIndex == FLAG_MONEY || variableIndex == FLAG_ACF || variableIndex == FLAG_ACF2 ||
               variableIndex == FLAG_ACF3 || variableIndex == FLAG_ESC || variableIndex == FLAG_DONT_USE;
    }

    SceneTemplate::~SceneTemplate()
    {
        mTemplate.Reset();
    }

    void SceneTemplate::init()
    {
        HandleScope handle_scope(mIsolate);

        // Create Scene Template
        Local<ObjectTemplate> tmpl = ObjectTemplate::New(mIsolate);

        // 0 - LbaBridge pointer, 1 - IdaBridge pointer
        tmpl->SetInternalFieldCount(2);

        // Function bindings
        inscope_bindFunctions(mIsolate, tmpl,
                              {FN(getId),       FN(getIsland),       FN(getPlanet),       FN(getNumObjects),
                               FN(getObject),   FN(getNumZones),     FN(getZone),         FN(getNumWaypoints),
                               FN(getWaypoint), FN(getStartPos),     FN(getVariable),     FN(getGameVariable),

                               FN(setStartPos), FN(setVariable),     FN(setGameVariable),

                               FN(addObjects),  FN(addZones),        FN(addWaypoints),    FN(getGold),
                               FN(getZlitos),   FN(getCurrentMoney), FN(getForeignMoney), FN(setGold),
                               FN(setZlitos),   FN(setCurrentMoney), FN(setForeignMoney),

                               FN(getNumKeys),  FN(getMagicLevel),   FN(getMagicPoints),  FN(updateWaypoint)});

        // Events declarations
        // NOTE - event subscription service with signalEventSubscribed and signalEventUnsubscribed can be added for
        // optimization
        inscope_declareEvents(mIsolate, tmpl, event_BeforeLoadScene, event_AfterLoadScene, event_AfterLoadSavedState);

        mTemplate.Reset(mIsolate, tmpl);
    }

    void SceneTemplate::bind(Local<Object> object)
    {
        HandleScope handle_scope(mIsolate);

        object
            ->Set(mIsolate->GetCurrentContext(), v8::String::NewFromUtf8(mIsolate, SceneObjectName).ToLocalChecked(),
                  inscope_wrap())
            .Check();
    }

    Local<Object> SceneTemplate::inscope_wrap()
    {
        Local<ObjectTemplate> tmpl = mTemplate.Get(mIsolate);
        Local<Object> instance = tmpl->NewInstance(mIsolate->GetCurrentContext()).ToLocalChecked();
        instance->SetAlignedPointerInInternalField(0, mLbaBridge);
        instance->SetAlignedPointerInInternalField(1, mIdaBridge);
        return instance;
    }

    void SceneTemplate::getId(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)

        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getScene());
    }

    void SceneTemplate::getIsland(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getIsland());
    }

    void SceneTemplate::getPlanet(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getPlanet());
    }

    void SceneTemplate::getNumObjects(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getNumObjects());
    }

    void SceneTemplate::getNumZones(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getNumZones());
    }

    void SceneTemplate::getNumWaypoints(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getNumWaypoints());
    }

    void SceneTemplate::getObject(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], objectIndex, 0, lbaBridge->getNumObjects() - 1)

        if (!GameObjectTemplate::inscope_GetObjectReference(isolate, lbaBridge, objectIndex))
        {
            return;
        }

        Local<Object> object = getGameObjectTemplate()->inscope_wrap(objectIndex);
        args.GetReturnValue().Set(object);
    }

    void SceneTemplate::getZone(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], zoneIndex, 0, lbaBridge->getNumZones() - 1)

        if (!ZoneTemplate::inscope_GetObjectReference(isolate, lbaBridge, zoneIndex))
        {
            return;
        }

        Local<Object> object = getZoneTemplate()->inscope_wrap(zoneIndex);
        args.GetReturnValue().Set(object);
    }

    void SceneTemplate::getWaypoint(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], waypointIndex, 0, lbaBridge->getNumWaypoints() - 1)

        void *waypointRaw = lbaBridge->getWaypointByIndex(waypointIndex);
        if (!waypointRaw)
        {
            return;
        }

        T_TRACK *waypoint = static_cast<T_TRACK *>(waypointRaw);

        Local<Array> pos = Array::New(isolate, 3);
        pos->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, waypoint->X)).Check();
        pos->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, waypoint->Y)).Check();
        pos->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, waypoint->Z)).Check();
        args.GetReturnValue().Set(pos);
    }

    void SceneTemplate::updateWaypoint(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(2)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], waypointIndex, 0, lbaBridge->getNumWaypoints() - 1)
        VALIDATE_ARRAY(int32_t, Int32, args[1], pos, 3)

        void *waypointRaw = lbaBridge->getWaypointByIndex(waypointIndex);
        if (!waypointRaw)
        {
            return;
        }

        T_TRACK *waypoint = static_cast<T_TRACK *>(waypointRaw);
        waypoint->X = pos[0];
        waypoint->Y = pos[1];
        waypoint->Z = pos[2];
    }

    void SceneTemplate::getStartPos(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        Local<Array> position = Array::New(isolate, 3);
        position->Set(isolate->GetCurrentContext(), 0, Integer::New(isolate, lbaBridge->getCubeStartX())).Check();
        position->Set(isolate->GetCurrentContext(), 1, Integer::New(isolate, lbaBridge->getCubeStartY())).Check();
        position->Set(isolate->GetCurrentContext(), 2, Integer::New(isolate, lbaBridge->getCubeStartZ())).Check();

        args.GetReturnValue().Set(position);
    }

    void SceneTemplate::getVariable(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], variableIndex, 0, lbaBridge->getMaxVarCubeIndex())

        uint8_t *varCube = lbaBridge->getVarCube(variableIndex);

        if (!varCube)
        {
            return;
        }

        args.GetReturnValue().Set(*varCube);
    }

    void SceneTemplate::setVariable(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::SceneLoad, ExecutionPhase::Life, ExecutionPhase::Move)

        VALIDATE_ARGS_COUNT(2)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], variableIndex, 0, lbaBridge->getMaxVarCubeIndex())

        if (variableIndex == lbaBridge->getMaxVarCubeIndex())
        {
            core::inscope_ThrowError(
                isolate, "The last scene variable cannot be written through Ida. It is used in the game save state.");
            return;
        }

        VALIDATE_VALUE(uint8_t, Uint32, args[1], value, 0, 255)

        uint8_t *varCube = lbaBridge->getVarCube(variableIndex);
        if (!varCube)
        {
            return;
        }

        *varCube = value;
    }

    void SceneTemplate::getGameVariable(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        VALIDATE_ARGS_COUNT(1)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], variableIndex, 0, lbaBridge->getMaxVarGameIndex())

        int16_t *varGame = lbaBridge->getVarGame(variableIndex);

        if (!varGame)
        {
            return;
        }

        args.GetReturnValue().Set(*varGame);
    }

    void SceneTemplate::setGameVariable(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::SceneLoad, ExecutionPhase::Life, ExecutionPhase::Move)

        VALIDATE_ARGS_COUNT(2)
        BIND_BRIDGE
        VALIDATE_INT_VALUE(args[0], variableIndex, 0, lbaBridge->getMaxVarGameIndex())

        if (isReadOnlyGameVariable(variableIndex))
        {
            core::inscope_ThrowError(
                isolate,
                "The game variable number " + std::to_string(variableIndex) +
                    " cannot be written through Ida. See the scene and life API if you need a way to change it.");
            return;
        }

        VALIDATE_INT16_VALUE(args[1], value)

        int16_t *varGame = lbaBridge->getVarGame(variableIndex);
        if (!varGame)
        {
            return;
        }

        *varGame = value;
    }

    void SceneTemplate::setStartPos(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        VALIDATE_ARGS_COUNT(1)
        VALIDATE_ARRAY(int32_t, Int32, args[0], pos, 3)
        BIND_BRIDGE

        lbaBridge->setCubeStartX(pos[0]);
        lbaBridge->setCubeStartY(pos[1]);
        lbaBridge->setCubeStartZ(pos[2]);
    }

    void SceneTemplate::addObjects(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        BIND_BRIDGE
        auto numObjects = lbaBridge->getNumObjects();
        auto maximumMoreObjects = lbaBridge->getMaxObjects() - numObjects;
        if (maximumMoreObjects < 1)
        {
            core::inscope_ThrowRangeError(isolate,
                                          "No more objects can be added to the scene. The maximum is reached: " +
                                              std::to_string(lbaBridge->getMaxObjects()));
            return;
        }

        size_t desiredCount = 1;
        if (args.Length() > 0)
        {
            VALIDATE_VALUE(size_t, Uint32, args[0], count, 1, maximumMoreObjects);
            desiredCount = count;
        }

        lbaBridge->setNumObjects(numObjects + desiredCount);

        // Init all new objects
        uint8_t *objectFlags = idaBridge->getObjectFlags();
        for (size_t i = numObjects; i < numObjects + desiredCount; ++i)
        {
            lbaBridge->initObject(i);
            objectFlags[i] |= IDA_OBJ_NEW;
        }

        // Returning the index of the first newly added object
        args.GetReturnValue().Set(numObjects);
    }

    void SceneTemplate::addZones(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        BIND_BRIDGE
        auto numZones = lbaBridge->getNumZones();
        auto maximumMoreZones = lbaBridge->getMaxZones() - numZones;
        if (maximumMoreZones < 1)
        {
            core::inscope_ThrowRangeError(isolate, "No more zones can be added to the scene. The maximum is reached: " +
                                                       std::to_string(lbaBridge->getMaxZones()));
            return;
        }

        size_t desiredCount = 1;
        if (args.Length() > 0)
        {
            VALIDATE_VALUE(size_t, Uint32, args[0], count, 1, maximumMoreZones);
            desiredCount = count;
        }

        void *gameZones = lbaBridge->getZones();
        size_t newSize = numZones + desiredCount;
        void *newGameZones = idaBridge->resizeZones(numZones, newSize, gameZones);
        lbaBridge->setZones(newSize, newGameZones);

        // Returning the index of the first newly added zone
        args.GetReturnValue().Set(numZones);
    }

    void SceneTemplate::addWaypoints(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_ALLOW(ExecutionPhase::SceneLoad)
        BIND_BRIDGE
        auto numWaypoints = lbaBridge->getNumWaypoints();
        auto maximumMoreWaypoints = lbaBridge->getMaxWaypoints() - numWaypoints;
        if (maximumMoreWaypoints < 1)
        {
            core::inscope_ThrowRangeError(isolate,
                                          "No more waypoints can be added to the scene. The maximum is reached: " +
                                              std::to_string(lbaBridge->getMaxWaypoints()));
            return;
        }

        size_t desiredCount = 1;
        if (args.Length() > 0)
        {
            VALIDATE_VALUE(size_t, Uint32, args[0], count, 1, maximumMoreWaypoints);
            desiredCount = count;
        }

        void *gameWaypoints = lbaBridge->getWaypoints();
        size_t newSize = numWaypoints + desiredCount;
        void *newGameWaypoints = idaBridge->resizeWaypoints(numWaypoints, newSize, gameWaypoints);
        lbaBridge->setWaypoints(newSize, newGameWaypoints);

        // Returning the index of the first newly added waypoint
        args.GetReturnValue().Set(numWaypoints);
    }

    void SceneTemplate::getGold(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getGold());
    }

    void SceneTemplate::getZlitos(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getZlitos());
    }

    void SceneTemplate::getCurrentMoney(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        if (lbaBridge->getPlanet() >= 2)
        {
            args.GetReturnValue().Set(lbaBridge->getZlitos());
        }
        else
        {
            args.GetReturnValue().Set(lbaBridge->getGold());
        }
    }

    void SceneTemplate::getForeignMoney(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        if (lbaBridge->getPlanet() >= 2)
        {
            args.GetReturnValue().Set(lbaBridge->getGold());
        }
        else
        {
            args.GetReturnValue().Set(lbaBridge->getZlitos());
        }
    }

    void SceneTemplate::getNumKeys(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getNumKeys());
    }

    void SceneTemplate::getMagicLevel(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getMagicLevel());
    }

    void SceneTemplate::getMagicPoints(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE
        EPP_DENY(ExecutionPhase::None, ExecutionPhase::BeforeSceneLoad)
        BIND_BRIDGE

        args.GetReturnValue().Set(lbaBridge->getMagicPoints());
    }

    void SceneTemplate::setGold(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::SceneLoad, ExecutionPhase::Life)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT16_VALUE(args[0], gold)
        BIND_BRIDGE

        lbaBridge->setGold(gold);

        // If we are on Zeelich, set gold in inventory as foreign money
        if (lbaBridge->getPlanet() >= 2)
        {
            short *inventoryMoney = lbaBridge->getVarGame(8);
            *inventoryMoney = gold;
        }
    }

    void SceneTemplate::setZlitos(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::SceneLoad, ExecutionPhase::Life)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT16_VALUE(args[0], zlitos)
        BIND_BRIDGE

        lbaBridge->setZlitos(zlitos);

        // If we are not on Zeelich, set zlitos in inventory as foreign money
        if (lbaBridge->getPlanet() < 2)
        {
            short *inventoryMoney = lbaBridge->getVarGame(8);
            *inventoryMoney = zlitos;
        }
    }

    void SceneTemplate::setCurrentMoney(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::SceneLoad, ExecutionPhase::Life)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT16_VALUE(args[0], money)
        BIND_BRIDGE

        if (lbaBridge->getPlanet() >= 2)
        {
            lbaBridge->setZlitos(money);
        }
        else
        {
            lbaBridge->setGold(money);
        }
    }

    void SceneTemplate::setForeignMoney(const FunctionCallbackInfo<Value> &args)
    {
        BEGIN_SCOPE

        EPP_ALLOW(ExecutionPhase::SceneLoad, ExecutionPhase::Life)

        VALIDATE_ARGS_COUNT(1)
        VALIDATE_INT16_VALUE(args[0], money)
        BIND_BRIDGE

        short *inventoryMoney = lbaBridge->getVarGame(8);
        if (lbaBridge->getPlanet() >= 2)
        {
            *inventoryMoney = money;
            lbaBridge->setGold(money);
        }
        else
        {
            *inventoryMoney = money;
            lbaBridge->setZlitos(money);
        }
    }

}  // namespace Ida
