#pragma once

#include <vector>
#include <cstdint>
#include <string>

namespace Ida
{
    /**
     * @brief Abstract interface for asset serialization and deserialization
     * @tparam T The asset type to serialize/deserialize
     */
    template<typename T>
    class IAssetSerializer
    {
    public:
        virtual ~IAssetSerializer() = default;

        /**
         * @brief Serialize asset data to binary format
         * @param asset The asset to serialize
         * @return Vector containing serialized binary data, empty if failed
         */
        virtual std::vector<uint8_t> serialize(const T &asset) const = 0;

        /**
         * @brief Deserialize asset data from binary format
         * @param data Binary data to deserialize
         * @param asset Output asset to deserialize into
         * @return true if successfully deserialized, false otherwise
         */
        virtual bool deserialize(const std::vector<uint8_t> &data, T &asset) const = 0;

        /**
         * @brief Get the magic number/identifier for this asset type
         * @return 8-byte magic number as string
         */
        virtual std::string getMagicNumber() const = 0;

        /**
         * @brief Clear/reset the asset to initial state
         * @param asset The asset to clear
         */
        virtual void clearAsset(T &asset) const = 0;
    };

}  // namespace Ida
