#include "mediaService.h"

#include <chrono>
#include <cstring>
#include <filesystem>
#include <memory>
#include <span>

#include "../common/Logger.h"
#include "PngToLbaSpriteConverter.h"
#include "PngToPcxConverter.h"
#include "assets/AssetCache.h"
#include "assets/ImageSerializer.h"
#include "assets/PaletteHashDataSerializer.h"
#include "assets/SpriteSerializer.h"

using namespace Logger;

namespace Ida
{
    namespace fs = std::filesystem;
    using namespace std;

    void loadSprites(std::unordered_map<std::string, std::string> &spritePaths, const std::string &spritePath,
                     const std::unordered_map<std::string, PaletteConversionData> &usePalettes,
                     const uint8_t *defaultPalette)
    {
        if (!fs::exists(spritePath))
        {
            return;
        }

        inf() << "Converting user sprites...";

        // Create asset cache with sprite serializer and palette hash data serializer
        auto spriteSerializer = std::make_unique<SpriteSerializer>();
        auto paletteHashSerializer = std::make_unique<PaletteHashDataSerializer>();
        AssetCache<SpriteHandle, PaletteConversionData> assetCache(std::move(spriteSerializer),
                                                                   std::move(paletteHashSerializer));

        auto converter = std::make_unique<PngToLbaSpriteConverter>();
        for (const auto &entry : fs::recursive_directory_iterator(spritePath))
        {
            if (!entry.is_regular_file() || entry.path().extension() != ".png")
            {
                continue;
            }

            std::string pathString = entry.path().string();
            std::string relativePath = fs::relative(entry.path(), spritePath).string();
            std::replace(relativePath.begin(), relativePath.end(), '\\', '/');

            PaletteConversionData usePaletteData;
            usePaletteData.algorithm = PaletteConversionData::SpriteDefaultAlgorithm;
            usePaletteData.useDithering = PaletteConversionData::SpriteDefaultUseDithering;
            if (usePalettes.find(relativePath) != usePalettes.end())
            {
                usePaletteData = usePalettes.at(relativePath);
            }

            // Check if cached version is valid (this also checks if it exists)
            if (assetCache.isValid(pathString, usePaletteData))
            {
                dbg() << "Using cached sprite: " << relativePath;
                spritePaths.emplace(relativePath, assetCache.getIdaFilePath(pathString));
            }
            else
            {
                // Convert and save to cache
                SpriteHandle spriteHandle;
                std::span<const std::string> singleSpritePath(&pathString, 1);
                dbg() << "Converting sprite " << pathString << "; with algorithm "
                      << static_cast<int>(usePaletteData.algorithm) << ", "
                      << (usePaletteData.useDithering ? "dithered" : "not dithered") << ", alphaThreshold "
                      << static_cast<int>(usePaletteData.alphaThreshold);
                bool result =
                    converter->convert(singleSpritePath, defaultPalette, spriteHandle, usePaletteData.algorithm,
                                       usePaletteData.useDithering, usePaletteData.alphaThreshold);
                if (!result)
                {
                    err() << "Failed to convert sprite " << relativePath;
                }
                else
                {
                    // Save converted asset to cache
                    if (assetCache.saveAssetToCache(pathString, spriteHandle, usePaletteData))
                    {
                        spritePaths.emplace(relativePath, assetCache.getIdaFilePath(pathString));
                        inf() << "Successfully converted and cached sprite " << relativePath;
                    }
                    else
                    {
                        err() << "Failed to save the cached sprite " << relativePath;
                    }
                }
            }
        }
    }

    void loadImages(std::unordered_map<std::string, std::string> &imagePaths, const std::string &imagePath,
                    const std::unordered_map<std::string, PaletteConversionData> &usePalettes,
                    const uint8_t *defaultPalette)
    {
        if (!fs::exists(imagePath))
        {
            return;
        }

        inf() << "Converting user images...";

        // Create asset cache with image serializer and palette hash data serializer
        auto imageSerializer = std::make_unique<ImageSerializer>();
        auto paletteHashSerializer = std::make_unique<PaletteHashDataSerializer>();
        AssetCache<PcxHandle, PaletteConversionData> assetCache(std::move(imageSerializer),
                                                                std::move(paletteHashSerializer));

        auto converter = std::make_unique<PngToPcxConverter>();
        for (const auto &entry : fs::recursive_directory_iterator(imagePath))
        {
            if (!entry.is_regular_file() || entry.path().extension() != ".png")
            {
                continue;
            }

            std::string pathString = entry.path().string();
            std::string relativeImagePath = fs::relative(entry.path(), imagePath).string();
            std::replace(relativeImagePath.begin(), relativeImagePath.end(), '\\', '/');

            PaletteConversionData usePaletteData;
            usePaletteData.algorithm = PaletteConversionData::ImageDefaultAlgorithm;
            usePaletteData.useDithering = PaletteConversionData::ImageDefaultUseDithering;
            if (usePalettes.find(relativeImagePath) != usePalettes.end())
            {
                usePaletteData = usePalettes.at(relativeImagePath);
            }

            // Check if cached version is valid (this also checks if it exists)
            if (assetCache.isValid(pathString, usePaletteData))
            {
                dbg() << "Using cached image: " << relativeImagePath;
                imagePaths.emplace(relativeImagePath, assetCache.getIdaFilePath(pathString));
            }
            else
            {
                // Convert and save to cache
                auto palette = usePaletteData.paletteIndex > -1 ? defaultPalette : nullptr;
                if (usePaletteData.paletteIndex > -1)
                {
                    dbg() << "Converting image " << pathString << "; with algorithm "
                          << static_cast<int>(usePaletteData.algorithm) << ","
                          << (usePaletteData.useDithering ? " dithered" : " not dithered") << "; with palette "
                          << usePaletteData.paletteIndex;
                }
                else
                {
                    dbg() << "Converting image " << pathString << "; with building PNG colors derived palette";
                }

                PcxHandle pcxHandle;
                bool result = converter->convert(pathString, palette, pcxHandle, usePaletteData.algorithm,
                                                 usePaletteData.useDithering);
                if (!result)
                {
                    err() << "Failed to convert image " << relativeImagePath;
                }
                else
                {
                    // Save converted asset to cache
                    if (assetCache.saveAssetToCache(pathString, pcxHandle, usePaletteData))
                    {
                        imagePaths.emplace(relativeImagePath, assetCache.getIdaFilePath(pathString));
                        inf() << "Successfully converted and cached image " << relativeImagePath;
                    }
                    else
                    {
                        err() << "Failed to save cached image " << relativeImagePath;
                    }
                }
            }
        }
    }

    bool loadSpriteFromDisk(const std::string &idaSpritePath, SpriteHandle &spriteHandle)
    {
        AssetCache<SpriteHandle, PaletteConversionData> assetCache(std::make_unique<SpriteSerializer>(),
                                                                   std::make_unique<PaletteHashDataSerializer>());

        return assetCache.loadAssetFromFile(idaSpritePath, spriteHandle);
    }

    bool loadImageFromDisk(const std::string &idaImagePath, PcxHandle &imageHandle)
    {
        AssetCache<PcxHandle, PaletteConversionData> assetCache(std::make_unique<ImageSerializer>(),
                                                                std::make_unique<PaletteHashDataSerializer>());

        return assetCache.loadAssetFromFile(idaImagePath, imageHandle);
    }

    size_t pruneImageCache(const std::string &imagePath)
    {
        if (!fs::exists(imagePath))
        {
            return 0;
        }

        inf() << "Pruning image cache in " << imagePath;
        size_t removedCount = AssetCacheUtils::prune(imagePath, ".png");

        if (removedCount > 0)
        {
            inf() << "Pruned " << removedCount << " orphaned image cache files from " << imagePath;
        }
        else
        {
            dbg() << "No orphaned image cache files found in " << imagePath;
        }

        return removedCount;
    }

    std::span<const uint8_t> readSprite(const SpriteHandle &handle, unsigned int spriteNumber)
    {
        // Validate input parameters
        if (handle.buffer == nullptr || spriteNumber >= handle.n)
        {
            return {};
        }

        // The first part of the buffer contains the offset table (4 bytes per sprite)
        const uint32_t *offsetsTable = reinterpret_cast<const uint32_t *>(handle.buffer);

        // Get the offset of the requested sprite
        uint32_t spriteOffset = offsetsTable[spriteNumber];

        // Calculate the end offset (either next sprite's offset or end of buffer)
        uint32_t spriteEndOffset;
        if (spriteNumber + 1 < handle.n)
        {
            // Not the last sprite, use next sprite's offset
            spriteEndOffset = offsetsTable[spriteNumber + 1];
        }
        else
        {
            // This is the last sprite, use the total buffer size
            spriteEndOffset = static_cast<uint32_t>(handle.bufferSize);
        }

        // Calculate sprite size and return span view
        uint32_t spriteSize = spriteEndOffset - spriteOffset;

        // Return span view into the buffer (zero-copy)
        return std::span<const uint8_t>(handle.buffer + spriteOffset, spriteSize);
    }
}  // namespace Ida
