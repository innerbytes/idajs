#pragma once

#include <cstring>

#include "../../engine/idaTypes.h"
#include "AssetSerializer.h"

namespace Ida
{
    /**
     * @brief Concrete serializer for PcxHandle assets
     */
    class ImageSerializer : public IAssetSerializer<PcxHandle>
    {
    public:
        std::vector<uint8_t> serialize(const PcxHandle &image) const override
        {
            std::vector<uint8_t> data;

            // Calculate total size needed
            size_t totalSize = sizeof(uint32_t) * 4 +  // width, height, imageDataSize, paletteDataSize
                               image.imageDataSize + image.paletteDataSize;

            data.resize(totalSize);
            size_t offset = 0;

            // Write dimensions
            uint32_t width = image.width;
            uint32_t height = image.height;
            uint32_t imageDataSize = static_cast<uint32_t>(image.imageDataSize);
            uint32_t paletteDataSize = static_cast<uint32_t>(image.paletteDataSize);

            std::memcpy(data.data() + offset, &width, sizeof(width));
            offset += sizeof(width);

            std::memcpy(data.data() + offset, &height, sizeof(height));
            offset += sizeof(height);

            std::memcpy(data.data() + offset, &imageDataSize, sizeof(imageDataSize));
            offset += sizeof(imageDataSize);

            std::memcpy(data.data() + offset, &paletteDataSize, sizeof(paletteDataSize));
            offset += sizeof(paletteDataSize);

            // Write image data
            std::memcpy(data.data() + offset, image.imageData, image.imageDataSize);
            offset += image.imageDataSize;

            // Write palette data
            std::memcpy(data.data() + offset, image.paletteData, image.paletteDataSize);

            return data;
        }

        bool deserialize(const std::vector<uint8_t> &data, PcxHandle &image) const override
        {
            if (data.size() < sizeof(uint32_t) * 4)
            {
                return false;
            }

            size_t offset = 0;

            // Read dimensions and sizes
            uint32_t width, height, imageDataSize, paletteDataSize;

            std::memcpy(&width, data.data() + offset, sizeof(width));
            offset += sizeof(width);

            std::memcpy(&height, data.data() + offset, sizeof(height));
            offset += sizeof(height);

            std::memcpy(&imageDataSize, data.data() + offset, sizeof(imageDataSize));
            offset += sizeof(imageDataSize);

            std::memcpy(&paletteDataSize, data.data() + offset, sizeof(paletteDataSize));
            offset += sizeof(paletteDataSize);

            // Verify data size
            size_t expectedSize = sizeof(uint32_t) * 4 + imageDataSize + paletteDataSize;
            if (data.size() != expectedSize)
            {
                return false;
            }

            // Allocate image data
            image.width = width;
            image.height = height;
            image.imageDataSize = imageDataSize;
            image.paletteDataSize = paletteDataSize;
            image.imageData = new uint8_t[imageDataSize];
            image.paletteData = new uint8_t[paletteDataSize];

            // Read image data
            std::memcpy(image.imageData, data.data() + offset, imageDataSize);
            offset += imageDataSize;

            // Read palette data
            std::memcpy(image.paletteData, data.data() + offset, paletteDataSize);

            return true;
        }

        std::string getMagicNumber() const override
        {
            return "IDAPCX01";
        }

        void clearAsset(PcxHandle &image) const override
        {
            image.clear();
        }
    };

}  // namespace Ida
