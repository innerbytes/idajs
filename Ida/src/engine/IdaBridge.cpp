#include "idaBridge.h"

#include <assert.h>

#include <algorithm>

namespace Ida
{
    void *IdaBridge::resizeZones(size_t oldSize, size_t newSize, void *zonesPtr)
    {
        assert(newSize > oldSize);
        bool zonesAreManagedByIda = (zonesPtr == mZones.data());

        mZones.resize(newSize);

        // If the zones are not managed by Ida, we need to copy the old data to the new vector
        if (!zonesAreManagedByIda && oldSize > 0)
        {
            std::copy_n(static_cast<T_ZONE *>(zonesPtr), oldSize, mZones.data());
        }

        // Initialize all the new zones with zeros
        std::fill(mZones.begin() + oldSize, mZones.end(), T_ZONE{});

        return mZones.data();
    }

    void *IdaBridge::resizeWaypoints(size_t oldSize, size_t newSize, void *waypointsPtr)
    {
        assert(newSize > oldSize);
        bool waypointsAreManagedByIda = (waypointsPtr == mWaypoints.data());

        mWaypoints.resize(newSize);

        // If the waypoints are not managed by Ida, we need to copy the old data to the new vector
        if (!waypointsAreManagedByIda && oldSize > 0)
        {
            std::copy_n(static_cast<T_TRACK *>(waypointsPtr), oldSize, mWaypoints.data());
        }

        // Initialize all the new waypoints with zeros
        std::fill(mWaypoints.begin() + oldSize, mWaypoints.end(), T_TRACK{});

        return mWaypoints.data();
    }

    void IdaBridge::prepareLifeScript(const uint8_t opcode, const size_t argumentsSize)
    {
        mLifeScript.clear();

        // Reserve space for opcode, arguments, and terminator opcode
        mLifeScript.reserve(2 + argumentsSize);

        mLifeScript.push_back(opcode);
    }

    void IdaBridge::prepareLifeFunction(const uint8_t opcode, const size_t argumentsSize)
    {
        mLifeScript.clear();

        // Reserve space for opcode + arguments
        mLifeScript.reserve(1 + argumentsSize);
        mLifeScript.push_back(opcode);
    }

    unsigned char *IdaBridge::getLifeScript()
    {
        return mLifeScript.data();
    }

    void IdaBridge::finalizeLifeScript()
    {
        mLifeScript.push_back(LM_RETURN);
    }

    void IdaBridge::pushArgument(const size_t length, const char *value)
    {
        mLifeScript.insert(mLifeScript.end(), value, value + length + 1);
    }

    void IdaBridge::prepareMoveScript(const size_t objectId, const uint8_t opcode, const size_t argumentsSize)
    {
        auto &moveScript = mMoveScripts[objectId];
        moveScript.clear();
        // Reserve space for opcode, arguments, and terminator opcode
        moveScript.reserve(2 + argumentsSize);
        moveScript.push_back(opcode);
    }

    void IdaBridge::loadMoveScript(const size_t objectId, const size_t length, const uint8_t *code)
    {
        auto &moveScript = mMoveScripts[objectId];
        moveScript.clear();
        mMoveScripts[objectId].insert(moveScript.begin(), code, code + length);
    }

    std::pair<size_t, uint8_t *> IdaBridge::getMoveScript(const size_t objectId)
    {
        auto &moveScript = mMoveScripts[objectId];
        return {moveScript.size(), moveScript.data()};
    }

    void IdaBridge::finalizeMoveScript(const size_t objectId)
    {
        auto &moveScript = mMoveScripts[objectId];
        moveScript.push_back(TM_END);
    }

    void IdaBridge::pushMoveArgument(const size_t objectId, const size_t length, const char *value)
    {
        auto &moveScript = mMoveScripts[objectId];
        moveScript.insert(moveScript.end(), value, value + length + 1);
    }

}  // namespace Ida
