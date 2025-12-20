#pragma once

#include <cstdint>
#include <vector>

#include "../engine/idaTypes.h"

namespace Ida
{
    /**
     * @brief Reusable palette-based color matching and conversion utilities
     * Supports various color matching algorithms for 256-color palettes
     */
    class PaletteConverter
    {
    public:
        PaletteConverter() = default;
        ~PaletteConverter() = default;

        /**
         * @brief Find the closest palette color index for a given RGB color
         * @param palette 256-color palette (768 bytes: R,G,B,R,G,B,...)
         * @param r Red component (0-255)
         * @param g Green component (0-255)
         * @param b Blue component (0-255)
         * @param algorithm Color matching algorithm to use
         * @return Index of the closest color in the palette (0-255)
         */
        static uint8_t findClosestColor(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b,
                                        ColorMatchingAlgorithm algorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN);

        /**
         * @brief Convert RGBA image data to indexed color using specified algorithm
         * @param pixels RGBA pixel data (width * height * 4 bytes)
         * @param width Image width in pixels
         * @param height Image height in pixels
         * @param palette 256-color palette (768 bytes: R,G,B,R,G,B,...)
         * @param outputIndices Output buffer for indexed data (must be pre-allocated: width * height bytes)
         * @param algorithm Color matching algorithm to use
         */
        static void convertToIndexed(const uint8_t *pixels, uint32_t width, uint32_t height, const uint8_t *palette,
                                     uint8_t *outputIndices,
                                     ColorMatchingAlgorithm algorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN);

        /**
         * @brief Convert RGBA image data to indexed color with Floyd-Steinberg dithering
         * @param pixels RGBA pixel data (width * height * 4 bytes)
         * @param width Image width in pixels
         * @param height Image height in pixels
         * @param palette 256-color palette (768 bytes: R,G,B,R,G,B,...)
         * @param outputIndices Output buffer for indexed data (must be pre-allocated: width * height bytes)
         * @param baseAlgorithm Base color matching algorithm to use for dithering
         */
        static void convertToIndexedWithDithering(
            const uint8_t *pixels, uint32_t width, uint32_t height, const uint8_t *palette, uint8_t *outputIndices,
            ColorMatchingAlgorithm baseAlgorithm = ColorMatchingAlgorithm::CIELAB_DELTA_E);

    private:
        /**
         * @brief CIELAB color structure
         */
        struct LabColor
        {
            double L, a, b;
            LabColor(double l = 0, double a_val = 0, double b_val = 0) : L(l), a(a_val), b(b_val) {}
        };

        /**
         * @brief Fast integer-based Euclidean distance calculation
         * @param r1,g1,b1 First RGB color
         * @param r2,g2,b2 Second RGB color
         * @return Squared distance (no sqrt for performance)
         */
        static uint32_t calculateDistanceSquared(uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2,
                                                 uint8_t b2);

        /**
         * @brief Weighted Euclidean distance considering human perception
         * @param r1,g1,b1 First RGB color
         * @param r2,g2,b2 Second RGB color
         * @return Weighted distance
         */
        static double calculateWeightedDistance(uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2, uint8_t b2);

        /**
         * @brief Convert RGB to CIELAB color space
         * @param r Red component (0-255)
         * @param g Green component (0-255)
         * @param b Blue component (0-255)
         * @return CIELAB color
         */
        static LabColor rgbToLab(uint8_t r, uint8_t g, uint8_t b);

        /**
         * @brief Calculate Delta E color difference in CIELAB space (CIE76 formula)
         * @param lab1 First CIELAB color
         * @param lab2 Second CIELAB color
         * @return Delta E difference
         */
        static double calculateDeltaE(const LabColor &lab1, const LabColor &lab2);

        /**
         * @brief Find closest palette color using simple Euclidean distance (fastest)
         * @param palette 256-color palette
         * @param r,g,b RGB color components
         * @return Closest palette index
         */
        static uint8_t findClosestEuclidean(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b);

        /**
         * @brief Find closest palette color using weighted Euclidean distance
         * @param palette 256-color palette
         * @param r,g,b RGB color components
         * @return Closest palette index
         */
        static uint8_t findClosestWeightedEuclidean(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b);

        /**
         * @brief Find closest palette color using CIELAB Delta E
         * @param palette 256-color palette
         * @param r,g,b RGB color components
         * @return Closest palette index
         */
        static uint8_t findClosestCielabDeltaE(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b);
    };

}  // namespace Ida
