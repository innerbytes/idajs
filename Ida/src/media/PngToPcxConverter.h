#pragma once

#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include "SDL.h"
#include "SDL_image.h"
#include "engine/idaTypes.h"
#include "PaletteConverter.h"

namespace Ida
{
    /**
     * @brief Converter class for transforming PNG images to PCX format
     * Optimized for high-performance conversion with 3D color cube lookup
     */
    class PngToPcxConverter
    {
    public:
        PngToPcxConverter();
        ~PngToPcxConverter() = default;

        /**
         * @brief Convert a PNG file to PCX format data
         * @param pngFilePath Path to the PNG file to convert
         * @param palette Optional external palette (256 colors * 3 bytes RGB). If nullptr, builds own palette.
         * @param handle Reference to PcxHandle where the converted data will be stored
         * @param algorithm Color matching algorithm to use when external palette is provided
         * @param useDithering Enable Floyd-Steinberg error diffusion dithering (only applies when external palette is used)
         * @return true if conversion was successful, false otherwise
         */
        bool convert(const std::string &pngFilePath, const uint8_t *palette, PcxHandle &handle, 
                    ColorMatchingAlgorithm algorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN,
                    bool useDithering = true);

    private:
        /**
         * @brief Color structure for quantization algorithm
         */
        struct Color
        {
            uint8_t r, g, b;
            uint32_t count;

            Color() : r(0), g(0), b(0), count(0) {}
            Color(uint8_t red, uint8_t green, uint8_t blue, uint32_t cnt = 1) : r(red), g(green), b(blue), count(cnt) {}
        };

        /**
         * @brief Node structure for median cut quantization
         */
        struct ColorNode
        {
            std::vector<Color> colors;
            uint8_t minR, maxR, minG, maxG, minB, maxB;

            ColorNode() : minR(255), maxR(0), minG(255), maxG(0), minB(255), maxB(0) {}

            void calculateBounds();
            uint8_t getLargestRange() const;
            void splitNode(ColorNode &left, ColorNode &right) const;
            Color getAverageColor() const;
        };

        /**
         * @brief Collect unique colors from the PNG image (optimized)
         * @param pixels RGBA pixel data from PNG
         * @param width Image width
         * @param height Image height
         * Stores results in internal colorBuffer for memory efficiency
         */
        void collectColors(const uint8_t *pixels, uint32_t width, uint32_t height);

        /**
         * @brief Quantize colors to 256 using median cut algorithm
         * @param colors Input colors to quantize
         * @return Vector of 256 quantized colors
         */
        std::vector<Color> quantizeColors(const std::vector<Color> &colors);

        /**
         * @brief Build quantization tree using median cut
         * @param colors Input colors
         * @param targetColors Target number of colors (256)
         * @return Vector of color nodes representing the quantized palette
         */
        std::vector<ColorNode> buildQuantizationTree(const std::vector<Color> &colors, size_t targetColors);

        /**
         * @brief Find the closest palette color for a given RGB color
         * @param palette The quantized palette
         * @param r Red component
         * @param g Green component
         * @param b Blue component
         * @return Index of the closest color in the palette
         */
        uint8_t findClosestPaletteIndex(const std::vector<Color> &palette, uint8_t r, uint8_t g, uint8_t b);

        /**
         * @brief Convert RGBA image data to indexed color using external palette
         * @param pixels RGBA pixel data
         * @param width Image width
         * @param height Image height
         * @param externalPalette External palette (256 colors * 3 bytes RGB)
         * @param algorithm Color matching algorithm to use
         * @param useDithering Enable Floyd-Steinberg error diffusion dithering
         */
        void convertToIndexedWithExternalPalette(const uint8_t *pixels, uint32_t width, uint32_t height,
                                                const uint8_t *externalPalette, 
                                                ColorMatchingAlgorithm algorithm,
                                                bool useDithering);

        /**
         * @brief Create palette data from external palette (768-byte RGB array)
         * @param externalPalette External palette (256 colors * 3 bytes RGB)
         */
        void createExternalPaletteData(const uint8_t *externalPalette);

        /**
         * @brief Convert RGBA image data to indexed color using the quantized palette (optimized)
         * @param pixels RGBA pixel data
         * @param width Image width
         * @param height Image height
         * @param palette Quantized color palette
         * Stores results in internal indexBuffer for memory efficiency
         */
        void convertToIndexed(const uint8_t *pixels, uint32_t width, uint32_t height,
                              const std::vector<Color> &palette);

        /**
         * @brief Convert palette colors to LBA2 format (768-byte RGB array) (optimized)
         * @param palette Input palette colors
         * Stores results in internal paletteBuffer for memory efficiency
         */
        void createPaletteData(const std::vector<Color> &palette);

        /**
         * @brief 3D Color Cube for fast O(1) palette lookups
         */
        class ColorCube
        {
        private:
            static constexpr int CUBE_SIZE = 32;  // 32x32x32 = ~32K entries
#pragma warning(suppress : 26495)
            uint8_t cube[CUBE_SIZE][CUBE_SIZE][CUBE_SIZE];
#pragma warning(default : 26495)
            bool isBuilt = false;

        public:
            void buildFromPalette(const std::vector<Color> &palette);
            uint8_t getClosestIndex(uint8_t r, uint8_t g, uint8_t b) const;
            bool isInitialized() const
            {
                return isBuilt;
            }
        };

        /**
         * @brief Fast integer-based distance calculation
         */
        static uint32_t calculateDistanceSquared(uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2,
                                                 uint8_t b2);

        /**
         * @brief Direct conversion for already-paletted images (optimization)
         * @param image SDL surface with existing palette
         * @param handle Output handle for converted data
         * @return true if conversion was successful
         */
        bool convertDirectPalette(SDL_Surface *image, PcxHandle &handle);

    private:
        // Reusable buffers to avoid allocations
        mutable std::vector<Color> colorBuffer;
        mutable std::vector<uint8_t> indexBuffer;
        mutable std::vector<uint8_t> paletteBuffer;
        mutable std::unordered_map<uint32_t, uint32_t> colorMap;
        mutable ColorCube colorCube;
    };

}  // namespace Ida
