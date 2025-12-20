#pragma once

#include <span>
#include <string>
#include <unordered_map>
#include <vector>

#include "PaletteConverter.h"
#include "engine/idaTypes.h"

namespace Ida
{

    class PngToLbaSpriteConverter
    {
    public:
        /**
         * @brief Construct a new PngToLbaSpriteConverter object
         */
        PngToLbaSpriteConverter();
        ~PngToLbaSpriteConverter() = default;

        /**
         * @brief Convert PNG images to LBA sprite format
         * @param imagePaths Array of PNG file paths to convert
         * @param palette 256-color palette (768 bytes: R,G,B,R,G,B,...)
         * @param spriteHandle Output handle for the converted sprite data
         * @param algorithm Color matching algorithm to use
         * @param useDithering Enable Floyd-Steinberg error diffusion dithering
         * @param alphaTreshold Alpha threshold (since LBA sprites don't support semi-transparent, all alpha values
         * below this will be considered fully-transparent)
         * @return true if conversion was successful, false otherwise
         */
        bool convert(std::span<const std::string> imagePaths, const uint8_t *palette, SpriteHandle &spriteHandle,
                     ColorMatchingAlgorithm algorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN,
                     bool useDithering = true, uint8_t alphaThreshold = 200);

    private:
        // Reusable buffers to avoid allocations in loops
        std::vector<int> mPixelLineBuffer;
        std::vector<uint8_t> mEncodedLineBuffer;
        std::vector<uint8_t> mIndexBuffer;  // Buffer for PaletteConverter output

        uint8_t encodeLine(const int *line, int lineSize, std::vector<uint8_t> &encodedLine);
    };

    /* LBA Sprite atlas format
    +-------------------+---------------------------------------------------------------+
    | Section           | Description                                                   |
    +-------------------+---------------------------------------------------------------+
    | Descriptor Table  | Table of 4-byte offsets to each image (n dwords)              |
    +-------------------+---------------------------------------------------------------+
    | Image Data        | Each image is encoded separately.                             |
    +-------------------+---------------------------------------------------------------+
    | Image Header      | 4 bytes: width (1 byte), height (1 byte),                     |
    |                   | xOffset (1 byte), yOffset (1 byte).                           |
    |                   | Normally you want to set xOffset and yOffset to 0             |
    +-------------------+---------------------------------------------------------------+
    | Lines block       | Each line is encoded separately.                              |
    |                   | There is <height> amount of lines in total.                   |
    +-------------------+---------------------------------------------------------------+
    | Line Header       | Starts with 1 byte specifying the number of blocks in the     |
    |                   | line.                                                         |
    +-------------------+---------------------------------------------------------------+
    | Block Byte        | Bits 6,7 contain instruction, bits 0-5 contain <pixelCount>-1 |
    |  - 00xxxxxx       | Skip (xxxxxx + 1) pixels (transparent block)                  |
    |  - 01xxxxxx       | Copy (xxxxxx + 1) uncompressed pixels to output               |
    |  - 10xxxxxx       | Copy the pixel (xxxxxx + 1) times to output (compressed)      |
    +-------------------+---------------------------------------------------------------+
    | Pixel bytes       | Each pixel is 1 byte, containing the palette index.           |
    | (0 - 64 bytes)    | If previous byte high bits were 00, no pixel bytes here       |
    |                   | If was 01, there will be (xxxxxx+1) pixel bytes               |
    |                   | If was 10, there will be 1 pixel byte                         |
    +-------------------+---------------------------------------------------------------+
    | End of Line       | Each line ends after processing all blocks.                   |
    |                   | The next byte specifies the number of blocks for the next     |
    |                   | line.                                                         |
    +-------------------+---------------------------------------------------------------+
    */
}  // namespace Ida
