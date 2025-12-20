#pragma once

#include "../../engine/idaTypes.h"
#include "HashDataSerializer.h"

namespace Ida
{
    /**
     * @brief Concrete hash data serializer for PaletteConversionData
     */
    class PaletteHashDataSerializer : public IHashDataSerializer<PaletteConversionData>
    {
    public:
        std::vector<uint8_t> serializeForHash(const PaletteConversionData &paletteData) const override
        {
            std::vector<uint8_t> data;
            
            // Pre-allocate exact size for efficiency
            size_t totalSize = sizeof(uint8_t) * 2 +  // algorithm + useDithering
                              sizeof(int32_t) +       // paletteIndex
                              sizeof(uint8_t);        // alphaThreshold
            data.resize(totalSize);
            
            size_t offset = 0;
            
            // Write algorithm
            data[offset++] = static_cast<uint8_t>(paletteData.algorithm);
            
            // Write dithering flag
            data[offset++] = paletteData.useDithering ? 1 : 0;
            
            // Write paletteIndex (host endianness)
            int32_t paletteIndex = paletteData.paletteIndex;
            std::memcpy(data.data() + offset, &paletteIndex, sizeof(paletteIndex));
            offset += sizeof(paletteIndex);
            
            // Write alpha threshold
            data[offset] = paletteData.alphaThreshold;
            
            return data;
        }
    };

}  // namespace Ida
