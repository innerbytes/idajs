#pragma once

#include <cstdint>
#include <vector>

namespace Ida
{
    /**
     * @brief Abstract interface for serializing additional hash data
     *
     * This interface allows any type of data to participate in the cache hash computation.
     * Examples: PaletteConversionData, AudioSettings, CompressionSettings, etc.
     */
    template <typename T>
    class IHashDataSerializer
    {
    public:
        virtual ~IHashDataSerializer() = default;

        /**
         * @brief Serialize hash data to bytes for hash computation
         * @param hashData The hash data to serialize
         * @return Vector containing serialized data for hashing
         */
        virtual std::vector<uint8_t> serializeForHash(const T &hashData) const = 0;
    };

}  // namespace Ida
