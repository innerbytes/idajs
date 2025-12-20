#include "Instrumentation.h"
#include "Logger.h"

namespace Ida
{

    bool Instrumentation::EntityKey::operator==(const EntityKey &other) const
    {
        return name == other.name && id == other.id;
    }

    std::size_t Instrumentation::EntityKeyHash::operator()(const EntityKey &key) const
    {
        return std::hash<std::string>()(key.name) ^ (std::hash<int>()(key.id) << 1);
    }

    void Instrumentation::beginTrack(const std::string &name, int id)
    {
        EntityKey key{name, id};
        auto &data = tracks[key];
        data.isTracking = true;
        data.startTime = std::chrono::steady_clock::now();
    }

    void Instrumentation::endTrack(const std::string &name, int id, int printPeriod)
    {
        auto endTime = std::chrono::steady_clock::now();
        EntityKey key{name, id};
        auto it = tracks.find(key);
        if (it != tracks.end() && it->second.isTracking)
        {
            auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - it->second.startTime);
            it->second.accumulated += duration;
            it->second.isTracking = false;
        }

        if (printPeriod > 0)
        {
            bool isPrinted = print(name, id, printPeriod);
            if (isPrinted)
            {
                resetTrack(name, id);
            }
        }
    }

    void Instrumentation::resetTrack(const std::string &name, int id)
    {
        EntityKey key{name, id};
        auto it = tracks.find(key);
        if (it != tracks.end())
        {
            it->second.accumulated = std::chrono::microseconds{0};
            it->second.isTracking = false;
            it->second.printCounter = 0;
        }
    }

    void Instrumentation::resetAll()
    {
        tracks.clear();
    }

    bool Instrumentation::print(const std::string &name, int id, int count)
    {
        EntityKey key{name, id};
        auto it = tracks.find(key);
        if (it != tracks.end())
        {
            it->second.printCounter++;
            if (it->second.printCounter >= count)
            {
                float averageTime = static_cast<float>(it->second.accumulated.count()) / it->second.printCounter;
                Logger::inf() << "[Time] " << name << ":" << id << " - " << averageTime << " mms";
                it->second.printCounter = 0;
                return true;
            }
        }
        return false;
    }

}  // namespace Ida
