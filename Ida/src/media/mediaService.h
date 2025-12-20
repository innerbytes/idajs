#pragma once

#include <span>
#include <string>
#include <unordered_map>

#include "../engine/idaTypes.h"

namespace Ida
{
    void loadSprites(std::unordered_map<std::string, std::string> &spritePaths, const std::string &spritePath,
                     const std::unordered_map<std::string, PaletteConversionData> &usePalettes,
                     const uint8_t *defaultPalette);

    void loadImages(std::unordered_map<std::string, std::string> &imagePaths, const std::string &imagePath,
                    const std::unordered_map<std::string, PaletteConversionData> &usePalettes,
                    const uint8_t *defaultPalette);

    bool loadSpriteFromDisk(const std::string &idaSpritePath, SpriteHandle &spriteHandle);

    bool loadImageFromDisk(const std::string &idaImagePath, PcxHandle &pcxHandle);

    /**
     * @brief Prune orphaned image cache files from a folder
     * @param imagePath Path to the folder containing image assets
     * @return Number of orphaned cache files removed
     */
    size_t pruneImageCache(const std::string &imagePath);

    /**
     * @brief Read all bytes of a sprite with given number from the atlas
     * @param handle The sprite handle containing the atlas data
     * @param spriteNumber The index of the sprite to read (0-based)
     * @return std::span<const uint8_t> view into sprite bytes, or empty span if invalid sprite number
     * @note The returned span is valid as long as the SpriteHandle remains valid
     */
    std::span<const uint8_t> readSprite(const SpriteHandle &handle, unsigned int spriteNumber);
}  // namespace Ida
