#pragma once

#include <cstring>

#include "../../engine/idaTypes.h"
#include "AssetSerializer.h"

namespace Ida
{
    /**
     * @brief Concrete serializer for SpriteHandle assets
     */
    class SpriteSerializer : public IAssetSerializer<SpriteHandle>
    {
    public:
        std::vector<uint8_t> serialize(const SpriteHandle &sprite) const override
        {
            std::vector<uint8_t> data;
            
            // Write sprite count + buffer size
            uint32_t spriteCount = sprite.n;
            uint32_t bufferSize = static_cast<uint32_t>(sprite.bufferSize);
            
            data.resize(sizeof(spriteCount) + sizeof(bufferSize) + 
                       (spriteCount * sizeof(int) * 2) + sprite.bufferSize);
            
            size_t offset = 0;
            
            // Write sprite count
            std::memcpy(data.data() + offset, &spriteCount, sizeof(spriteCount));
            offset += sizeof(spriteCount);
            
            // Write buffer size
            std::memcpy(data.data() + offset, &bufferSize, sizeof(bufferSize));
            offset += sizeof(bufferSize);
            
            // Write width array
            std::memcpy(data.data() + offset, sprite.w, spriteCount * sizeof(int));
            offset += spriteCount * sizeof(int);
            
            // Write height array
            std::memcpy(data.data() + offset, sprite.h, spriteCount * sizeof(int));
            offset += spriteCount * sizeof(int);
            
            // Write sprite buffer
            std::memcpy(data.data() + offset, sprite.buffer, sprite.bufferSize);
            
            return data;
        }
        
        bool deserialize(const std::vector<uint8_t> &data, SpriteHandle &sprite) const override
        {
            if (data.size() < sizeof(uint32_t) * 2)
            {
                return false;
            }
            
            size_t offset = 0;
            
            // Read sprite count
            uint32_t spriteCount;
            std::memcpy(&spriteCount, data.data() + offset, sizeof(spriteCount));
            offset += sizeof(spriteCount);
            
            // Read buffer size
            uint32_t bufferSize;
            std::memcpy(&bufferSize, data.data() + offset, sizeof(bufferSize));
            offset += sizeof(bufferSize);
            
            // Verify data size
            size_t expectedSize = sizeof(uint32_t) * 2 + (spriteCount * sizeof(int) * 2) + bufferSize;
            if (data.size() != expectedSize)
            {
                return false;
            }
            
            // Allocate sprite data
            sprite.n = spriteCount;
            sprite.bufferSize = bufferSize;
            sprite.w = new int[spriteCount];
            sprite.h = new int[spriteCount];
            sprite.buffer = new unsigned char[bufferSize];
            
            // Read width array
            std::memcpy(sprite.w, data.data() + offset, spriteCount * sizeof(int));
            offset += spriteCount * sizeof(int);
            
            // Read height array
            std::memcpy(sprite.h, data.data() + offset, spriteCount * sizeof(int));
            offset += spriteCount * sizeof(int);
            
            // Read sprite buffer
            std::memcpy(sprite.buffer, data.data() + offset, bufferSize);
            
            return true;
        }
        
        std::string getMagicNumber() const override
        {
            return "IDASPR01";
        }
        
        void clearAsset(SpriteHandle &sprite) const override
        {
            sprite.clear();
        }
    };

}  // namespace Ida
