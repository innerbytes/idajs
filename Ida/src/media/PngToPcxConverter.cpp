#include "PngToPcxConverter.h"

#include <algorithm>
#include <cmath>
#include <cstring>
#include <iostream>
#include <queue>

#include "../common/Logger.h"

using namespace std;
using namespace Logger;

namespace Ida
{
    PngToPcxConverter::PngToPcxConverter()
    {
        // Pre-reserve buffers for typical image sizes
        colorBuffer.reserve(1024);
        indexBuffer.reserve(640 * 480);
        paletteBuffer.reserve(768);
        colorMap.reserve(2048);
    }

    bool PngToPcxConverter::convert(const std::string &pngFilePath, const uint8_t *palette, PcxHandle &handle,
                                    ColorMatchingAlgorithm algorithm, bool useDithering)
    {
        // Clean any existing data in the handle
        handle.clear();

        // Clear and reuse buffers to avoid allocations
        colorBuffer.clear();
        indexBuffer.clear();
        paletteBuffer.clear();
        colorMap.clear();

        // Load PNG using SDL_image
        SDL_Surface *image = IMG_Load(pngFilePath.c_str());
        if (!image)
        {
            err() << "Error loading PNG file: " << pngFilePath << " - " << IMG_GetError();
            return false;
        }

        handle.width = image->w;
        handle.height = image->h;

        if (handle.width != 640 || handle.height != 480)
        {
            err() << "Invalid image dimensions: " << handle.width << "x" << handle.height
                  << "; Your png file must have 640x480 resolution";
            SDL_FreeSurface(image);
            return false;
        }

        // Convert to RGBA format if necessary
        SDL_Surface *rgbaImage = nullptr;
        if (image->format->format != SDL_PIXELFORMAT_RGBA32)
        {
            rgbaImage = SDL_ConvertSurfaceFormat(image, SDL_PIXELFORMAT_RGBA32, 0);
            SDL_FreeSurface(image);
            if (!rgbaImage)
            {
                err() << "Error converting image to RGBA format: " << SDL_GetError();
                return false;
            }
            image = rgbaImage;
        }

        // Early exit for images that are already paletted (rare but possible)
        if (image->format->palette && image->format->palette->ncolors <= 256)
        {
            dbg() << "Image is already paletted with " << image->format->palette->ncolors
                  << " colors, using direct conversion";
            return convertDirectPalette(image, handle);
        }

        const uint8_t *pixels = static_cast<const uint8_t *>(image->pixels);

        if (palette != nullptr)
        {
            // Use external palette
            dbg() << "Using external palette for conversion";

            // Step 1: Convert image to indexed color using external palette
            convertToIndexedWithExternalPalette(pixels, handle.width, handle.height, palette, algorithm, useDithering);

            // Step 2: Create palette data from external palette
            createExternalPaletteData(palette);
        }
        else
        {
            // Build own palette (original behavior)
            dbg() << "Building own palette for conversion";

            // Step 1: Collect unique colors from the image (optimized)
            collectColors(pixels, handle.width, handle.height);

            // Step 2: Quantize to 256 colors if necessary
            std::vector<Color> internalPalette;
            if (colorBuffer.size() <= 256)
            {
                // Already fits in 256 colors - direct copy
                internalPalette = colorBuffer;
                // Pad with black if needed
                internalPalette.resize(256, Color(0, 0, 0, 0));
            }
            else
            {
                // Need to quantize
                internalPalette = quantizeColors(colorBuffer);
            }

            // Step 3: Build color cube for fast lookups
            colorCube.buildFromPalette(internalPalette);

            // Step 4: Convert image to indexed color format (optimized)
            convertToIndexed(pixels, handle.width, handle.height, internalPalette);

            // Step 5: Create palette data in LBA2 format
            createPaletteData(internalPalette);
        }

        // Step 6: Allocate raw buffers and copy data
        handle.imageDataSize = indexBuffer.size();
        handle.imageData = new uint8_t[handle.imageDataSize];
        memcpy(handle.imageData, indexBuffer.data(), handle.imageDataSize);

        handle.paletteDataSize = paletteBuffer.size();
        handle.paletteData = new uint8_t[handle.paletteDataSize];
        memcpy(handle.paletteData, paletteBuffer.data(), handle.paletteDataSize);

        SDL_FreeSurface(image);

        return true;
    }

    void PngToPcxConverter::collectColors(const uint8_t *pixels, uint32_t width, uint32_t height)
    {
        colorMap.clear();

        const uint32_t totalPixels = width * height;
        const uint8_t *pixelPtr = pixels;

        for (uint32_t i = 0; i < totalPixels; ++i)
        {
            const uint8_t r = *pixelPtr++;
            const uint8_t g = *pixelPtr++;
            const uint8_t b = *pixelPtr++;
            const uint8_t a = *pixelPtr++;

            // Skip fully transparent pixels
            if (a < 128) continue;

            const uint32_t colorKey = (static_cast<uint32_t>(r) << 16) | (static_cast<uint32_t>(g) << 8) | b;
            ++colorMap[colorKey];
        }

        colorBuffer.clear();
        colorBuffer.reserve(colorMap.size());

        for (const auto &pair : colorMap)
        {
            const uint32_t colorKey = pair.first;
            const uint32_t count = pair.second;

            const uint8_t r = (colorKey >> 16) & 0xFF;
            const uint8_t g = (colorKey >> 8) & 0xFF;
            const uint8_t b = colorKey & 0xFF;

            colorBuffer.emplace_back(r, g, b, count);
        }
    }

    std::vector<PngToPcxConverter::Color> PngToPcxConverter::quantizeColors(const std::vector<Color> &colors)
    {
        // Use median cut algorithm to quantize to 256 colors
        std::vector<ColorNode> nodes = buildQuantizationTree(colors, 256);

        std::vector<Color> quantizedPalette;
        quantizedPalette.reserve(256);

        for (const auto &node : nodes)
        {
            quantizedPalette.push_back(node.getAverageColor());
        }

        // Ensure we have exactly 256 colors
        while (quantizedPalette.size() < 256)
        {
            quantizedPalette.emplace_back(0, 0, 0, 0);
        }

        return quantizedPalette;
    }

    std::vector<PngToPcxConverter::ColorNode> PngToPcxConverter::buildQuantizationTree(const std::vector<Color> &colors,
                                                                                       size_t targetColors)
    {
        // Optimized priority queue with cached pixel counts
        struct NodeWithCount
        {
            ColorNode node;
            uint32_t pixelCount;

            NodeWithCount(const ColorNode &n) : node(n), pixelCount(0)
            {
                for (const auto &color : node.colors) pixelCount += color.count;
            }
        };

        auto cmp = [](const NodeWithCount &a, const NodeWithCount &b) {
            return a.pixelCount < b.pixelCount;  // Max heap
        };

        std::priority_queue<NodeWithCount, std::vector<NodeWithCount>, decltype(cmp)> nodeQueue(cmp);

        // Start with all colors in one node
        ColorNode rootNode;
        rootNode.colors = colors;
        rootNode.calculateBounds();
        nodeQueue.emplace(rootNode);

        // Split nodes until we have the target number of colors
        while (nodeQueue.size() < targetColors && !nodeQueue.empty())
        {
            NodeWithCount currentNodeWithCount = nodeQueue.top();
            nodeQueue.pop();

            ColorNode &currentNode = currentNodeWithCount.node;

            // Don't split nodes with only one color
            if (currentNode.colors.size() <= 1)
            {
                nodeQueue.push(currentNodeWithCount);
                break;
            }

            ColorNode leftNode, rightNode;
            currentNode.splitNode(leftNode, rightNode);

            if (!leftNode.colors.empty())
            {
                leftNode.calculateBounds();
                nodeQueue.emplace(leftNode);
            }

            if (!rightNode.colors.empty())
            {
                rightNode.calculateBounds();
                nodeQueue.emplace(rightNode);
            }
        }

        // Convert queue to vector
        std::vector<ColorNode> result;
        result.reserve(nodeQueue.size());
        while (!nodeQueue.empty())
        {
            result.push_back(nodeQueue.top().node);
            nodeQueue.pop();
        }

        return result;
    }

    void PngToPcxConverter::ColorNode::calculateBounds()
    {
        if (colors.empty()) return;

        minR = maxR = colors[0].r;
        minG = maxG = colors[0].g;
        minB = maxB = colors[0].b;

        for (const auto &color : colors)
        {
            minR = std::min(minR, color.r);
            maxR = std::max(maxR, color.r);
            minG = std::min(minG, color.g);
            maxG = std::max(maxG, color.g);
            minB = std::min(minB, color.b);
            maxB = std::max(maxB, color.b);
        }
    }

    uint8_t PngToPcxConverter::ColorNode::getLargestRange() const
    {
        uint8_t rangeR = maxR - minR;
        uint8_t rangeG = maxG - minG;
        uint8_t rangeB = maxB - minB;

        if (rangeR >= rangeG && rangeR >= rangeB) return 0;  // Red
        if (rangeG >= rangeB) return 1;                      // Green
        return 2;                                            // Blue
    }

    void PngToPcxConverter::ColorNode::splitNode(ColorNode &left, ColorNode &right) const
    {
        if (colors.empty()) return;

        uint8_t splitChannel = getLargestRange();

        // Sort colors by the channel with the largest range
        std::vector<Color> sortedColors = colors;
        std::sort(sortedColors.begin(), sortedColors.end(), [splitChannel](const Color &a, const Color &b) {
            switch (splitChannel)
            {
                case 0:
                    return a.r < b.r;  // Red
                case 1:
                    return a.g < b.g;  // Green
                case 2:
                    return a.b < b.b;  // Blue
                default:
                    return false;
            }
        });

        // Split at median
        size_t medianIndex = sortedColors.size() / 2;

        left.colors.assign(sortedColors.begin(), sortedColors.begin() + medianIndex);
        right.colors.assign(sortedColors.begin() + medianIndex, sortedColors.end());
    }

    PngToPcxConverter::Color PngToPcxConverter::ColorNode::getAverageColor() const
    {
        if (colors.empty()) return Color(0, 0, 0, 0);

        uint64_t totalR = 0, totalG = 0, totalB = 0, totalCount = 0;

        for (const auto &color : colors)
        {
            totalR += color.r * color.count;
            totalG += color.g * color.count;
            totalB += color.b * color.count;
            totalCount += color.count;
        }

        if (totalCount == 0) return Color(0, 0, 0, 0);

        return Color(static_cast<uint8_t>(totalR / totalCount), static_cast<uint8_t>(totalG / totalCount),
                     static_cast<uint8_t>(totalB / totalCount), static_cast<uint32_t>(totalCount));
    }

    uint8_t PngToPcxConverter::findClosestPaletteIndex(const std::vector<Color> &palette, uint8_t r, uint8_t g,
                                                       uint8_t b)
    {
        uint8_t bestIndex = 0;
        uint32_t minDistance = UINT32_MAX;

        for (size_t i = 0; i < palette.size(); ++i)
        {
            const Color &paletteColor = palette[i];

            // Fast integer-based distance calculation (no sqrt needed)
            uint32_t distance = calculateDistanceSquared(r, g, b, paletteColor.r, paletteColor.g, paletteColor.b);

            if (distance < minDistance)
            {
                minDistance = distance;
                bestIndex = static_cast<uint8_t>(i);
            }
        }

        return bestIndex;
    }

    void PngToPcxConverter::convertToIndexed(const uint8_t *pixels, uint32_t width, uint32_t height,
                                             const std::vector<Color> &palette)
    {
        const uint32_t totalPixels = width * height;
        indexBuffer.clear();
        indexBuffer.reserve(totalPixels);

        const uint8_t *pixelPtr = pixels;

        // Use color cube for fast lookups if available
        if (colorCube.isInitialized())
        {
            for (uint32_t i = 0; i < totalPixels; ++i)
            {
                const uint8_t r = *pixelPtr++;
                const uint8_t g = *pixelPtr++;
                const uint8_t b = *pixelPtr++;
                const uint8_t a = *pixelPtr++;

                uint8_t paletteIndex = 0;  // Default to first color (usually black)

                // Only process opaque pixels
                if (a >= 128)
                {
                    paletteIndex = colorCube.getClosestIndex(r, g, b);
                }

                indexBuffer.push_back(paletteIndex);
            }
        }
        else
        {
            // Fallback to linear search (should rarely happen)
            for (uint32_t i = 0; i < totalPixels; ++i)
            {
                const uint8_t r = *pixelPtr++;
                const uint8_t g = *pixelPtr++;
                const uint8_t b = *pixelPtr++;
                const uint8_t a = *pixelPtr++;

                uint8_t paletteIndex = 0;

                if (a >= 128)
                {
                    paletteIndex = findClosestPaletteIndex(palette, r, g, b);
                }

                indexBuffer.push_back(paletteIndex);
            }
        }
    }

    void PngToPcxConverter::createPaletteData(const std::vector<Color> &palette)
    {
        paletteBuffer.clear();
        paletteBuffer.reserve(768);  // 256 colors * 3 components

        for (size_t i = 0; i < 256; ++i)
        {
            if (i < palette.size())
            {
                paletteBuffer.push_back(palette[i].r);
                paletteBuffer.push_back(palette[i].g);
                paletteBuffer.push_back(palette[i].b);
            }
            else
            {
                // Pad with black if we have fewer than 256 colors
                paletteBuffer.push_back(0);
                paletteBuffer.push_back(0);
                paletteBuffer.push_back(0);
            }
        }
    }

    // Fast integer-based distance calculation
    uint32_t PngToPcxConverter::calculateDistanceSquared(uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2,
                                                         uint8_t b2)
    {
        const int dr = static_cast<int>(r1) - static_cast<int>(r2);
        const int dg = static_cast<int>(g1) - static_cast<int>(g2);
        const int db = static_cast<int>(b1) - static_cast<int>(b2);

        return static_cast<uint32_t>(dr * dr + dg * dg + db * db);
    }

    // ColorCube implementation for O(1) palette lookups
    void PngToPcxConverter::ColorCube::buildFromPalette(const std::vector<Color> &palette)
    {
        // Pre-compute closest palette index for each cube cell
        for (int r = 0; r < CUBE_SIZE; ++r)
        {
            for (int g = 0; g < CUBE_SIZE; ++g)
            {
                for (int b = 0; b < CUBE_SIZE; ++b)
                {
                    // Map cube coordinates to RGB values
                    const uint8_t realR = static_cast<uint8_t>((r * 255) / (CUBE_SIZE - 1));
                    const uint8_t realG = static_cast<uint8_t>((g * 255) / (CUBE_SIZE - 1));
                    const uint8_t realB = static_cast<uint8_t>((b * 255) / (CUBE_SIZE - 1));

                    // Find closest palette color
                    uint8_t bestIndex = 0;
                    uint32_t minDistance = UINT32_MAX;

                    for (size_t i = 0; i < palette.size(); ++i)
                    {
                        const Color &paletteColor = palette[i];
                        uint32_t distance = calculateDistanceSquared(realR, realG, realB, paletteColor.r,
                                                                     paletteColor.g, paletteColor.b);

                        if (distance < minDistance)
                        {
                            minDistance = distance;
                            bestIndex = static_cast<uint8_t>(i);
                        }
                    }

                    cube[r][g][b] = bestIndex;
                }
            }
        }

        isBuilt = true;
    }

    uint8_t PngToPcxConverter::ColorCube::getClosestIndex(uint8_t r, uint8_t g, uint8_t b) const
    {
        if (!isBuilt) return 0;

        // Map RGB values to cube coordinates
        const int cubeR = (static_cast<int>(r) * (CUBE_SIZE - 1)) / 255;
        const int cubeG = (static_cast<int>(g) * (CUBE_SIZE - 1)) / 255;
        const int cubeB = (static_cast<int>(b) * (CUBE_SIZE - 1)) / 255;

        return cube[cubeR][cubeG][cubeB];
    }

    // Direct palette conversion for already-paletted images
    bool PngToPcxConverter::convertDirectPalette(SDL_Surface *image, PcxHandle &handle)
    {
        if (!image->format->palette)
        {
            return false;
        }

        SDL_Palette *palette = image->format->palette;
        const uint32_t totalPixels = handle.width * handle.height;

        // Direct copy of indexed data
        indexBuffer.clear();
        indexBuffer.reserve(totalPixels);

        const uint8_t *pixels = static_cast<const uint8_t *>(image->pixels);
        for (uint32_t i = 0; i < totalPixels; ++i)
        {
            indexBuffer.push_back(pixels[i]);
        }

        paletteBuffer.clear();
        paletteBuffer.reserve(768);

        for (int i = 0; i < 256; ++i)
        {
            if (i < palette->ncolors)
            {
                paletteBuffer.push_back(palette->colors[i].r);
                paletteBuffer.push_back(palette->colors[i].g);
                paletteBuffer.push_back(palette->colors[i].b);
            }
            else
            {
                // Pad with black
                paletteBuffer.push_back(0);
                paletteBuffer.push_back(0);
                paletteBuffer.push_back(0);
            }
        }

        // Allocate output buffers
        handle.imageDataSize = indexBuffer.size();
        handle.imageData = new uint8_t[handle.imageDataSize];
        memcpy(handle.imageData, indexBuffer.data(), handle.imageDataSize);

        handle.paletteDataSize = paletteBuffer.size();
        handle.paletteData = new uint8_t[handle.paletteDataSize];
        memcpy(handle.paletteData, paletteBuffer.data(), handle.paletteDataSize);

        dbg() << "Direct palette conversion completed successfully";
        return true;
    }

    void PngToPcxConverter::convertToIndexedWithExternalPalette(const uint8_t *pixels, uint32_t width, uint32_t height,
                                                                const uint8_t *externalPalette,
                                                                ColorMatchingAlgorithm algorithm, bool useDithering)
    {
        const uint32_t totalPixels = width * height;
        indexBuffer.clear();
        indexBuffer.resize(totalPixels);

        // Use PaletteConverter for the conversion
        if (useDithering)
        {
            PaletteConverter::convertToIndexedWithDithering(pixels, width, height, externalPalette, indexBuffer.data(),
                                                            algorithm);
        }
        else
        {
            PaletteConverter::convertToIndexed(pixels, width, height, externalPalette, indexBuffer.data(), algorithm);
        }
    }

    void PngToPcxConverter::createExternalPaletteData(const uint8_t *externalPalette)
    {
        paletteBuffer.clear();
        paletteBuffer.reserve(768);  // 256 colors * 3 components

        // Copy the external palette data directly (it's already in the correct format)
        for (int i = 0; i < 768; ++i)
        {
            paletteBuffer.push_back(externalPalette[i]);
        }
    }

}  // namespace Ida
