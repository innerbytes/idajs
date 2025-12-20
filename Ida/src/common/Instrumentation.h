#pragma once

#pragma pack(push, 8)

#include <chrono>
#include <string>
#include <unordered_map>

namespace Ida
{

    class Instrumentation
    {
    private:
        struct EntityKey
        {
            std::string name;
            int id;

            bool operator==(const EntityKey &other) const;
        };

        struct EntityKeyHash
        {
            std::size_t operator()(const EntityKey &key) const;
        };

        struct TrackingData
        {
            std::chrono::microseconds accumulated{0};
            std::chrono::steady_clock::time_point startTime;
            bool isTracking = false;
            int printCounter = 0;
        };

        std::unordered_map<EntityKey, TrackingData, EntityKeyHash> tracks;

    public:
        void beginTrack(const std::string &name, int id);
        void endTrack(const std::string &name, int id, int printPeriod = 0);
        void resetTrack(const std::string &name, int id);
        void resetAll();
        bool print(const std::string &name, int id, int count);
    };

}  // namespace Ida

#pragma pack(pop)
