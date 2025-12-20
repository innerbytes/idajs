#include "PaletteConverter.h"

#include <algorithm>
#include <cmath>
#include <limits>
#include <vector>

namespace Ida
{
    // All pixels with alpha values equal or below this threshold, will be not considered
    constexpr uint8_t AlphaThreshold = 16;

    uint8_t PaletteConverter::findClosestColor(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b,
                                               ColorMatchingAlgorithm algorithm)
    {
        switch (algorithm)
        {
            case ColorMatchingAlgorithm::EUCLIDEAN:
                return findClosestEuclidean(palette, r, g, b);

            case ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN:
                return findClosestWeightedEuclidean(palette, r, g, b);

            case ColorMatchingAlgorithm::CIELAB_DELTA_E:
                return findClosestCielabDeltaE(palette, r, g, b);

            default:
                return findClosestWeightedEuclidean(palette, r, g, b);
        }
    }

    void PaletteConverter::convertToIndexed(const uint8_t *pixels, uint32_t width, uint32_t height,
                                            const uint8_t *palette, uint8_t *outputIndices,
                                            ColorMatchingAlgorithm algorithm)
    {
        const uint32_t totalPixels = width * height;
        const uint8_t *pixelPtr = pixels;

        for (uint32_t i = 0; i < totalPixels; ++i)
        {
            const uint8_t r = *pixelPtr++;
            const uint8_t g = *pixelPtr++;
            const uint8_t b = *pixelPtr++;
            const uint8_t a = *pixelPtr++;

            uint8_t paletteIndex = 0;  // Default to first color (usually black)

            // Only process opaque pixels
            if (a > AlphaThreshold)
            {
                paletteIndex = findClosestColor(palette, r, g, b, algorithm);
            }

            outputIndices[i] = paletteIndex;
        }
    }

    void PaletteConverter::convertToIndexedWithDithering(const uint8_t *pixels, uint32_t width, uint32_t height,
                                                         const uint8_t *palette, uint8_t *outputIndices,
                                                         ColorMatchingAlgorithm baseAlgorithm)
    {
        const uint32_t totalPixels = width * height;

        // Create error buffers for dithering (floating point for precision)
        std::vector<std::vector<double>> errorR(height, std::vector<double>(width, 0.0));
        std::vector<std::vector<double>> errorG(height, std::vector<double>(width, 0.0));
        std::vector<std::vector<double>> errorB(height, std::vector<double>(width, 0.0));

        const uint8_t *pixelPtr = pixels;

        for (uint32_t y = 0; y < height; ++y)
        {
            for (uint32_t x = 0; x < width; ++x)
            {
                const uint32_t pixelIndex = y * width + x;

                const uint8_t origR = *pixelPtr++;
                const uint8_t origG = *pixelPtr++;
                const uint8_t origB = *pixelPtr++;
                const uint8_t a = *pixelPtr++;

                uint8_t paletteIndex = 0;  // Default to first color (usually black)

                // Only process opaque pixels
                if (a > AlphaThreshold)
                {
                    // Add accumulated error to current pixel
                    double correctedR = std::clamp(origR + errorR[y][x], 0.0, 255.0);
                    double correctedG = std::clamp(origG + errorG[y][x], 0.0, 255.0);
                    double correctedB = std::clamp(origB + errorB[y][x], 0.0, 255.0);

                    uint8_t quantizedR = static_cast<uint8_t>(correctedR);
                    uint8_t quantizedG = static_cast<uint8_t>(correctedG);
                    uint8_t quantizedB = static_cast<uint8_t>(correctedB);

                    // Find closest palette color
                    paletteIndex = findClosestColor(palette, quantizedR, quantizedG, quantizedB, baseAlgorithm);

                    // Get the actual palette color
                    uint8_t paletteR = palette[paletteIndex * 3];
                    uint8_t paletteG = palette[paletteIndex * 3 + 1];
                    uint8_t paletteB = palette[paletteIndex * 3 + 2];

                    // Calculate quantization error
                    double errR = correctedR - paletteR;
                    double errG = correctedG - paletteG;
                    double errB = correctedB - paletteB;

                    // Distribute error using Floyd-Steinberg weights
                    // X     7/16
                    // 3/16  5/16  1/16

                    if (x + 1 < width)
                    {
                        errorR[y][x + 1] += errR * 7.0 / 16.0;
                        errorG[y][x + 1] += errG * 7.0 / 16.0;
                        errorB[y][x + 1] += errB * 7.0 / 16.0;
                    }

                    if (y + 1 < height)
                    {
                        if (x > 0)
                        {
                            errorR[y + 1][x - 1] += errR * 3.0 / 16.0;
                            errorG[y + 1][x - 1] += errG * 3.0 / 16.0;
                            errorB[y + 1][x - 1] += errB * 3.0 / 16.0;
                        }

                        errorR[y + 1][x] += errR * 5.0 / 16.0;
                        errorG[y + 1][x] += errG * 5.0 / 16.0;
                        errorB[y + 1][x] += errB * 5.0 / 16.0;

                        if (x + 1 < width)
                        {
                            errorR[y + 1][x + 1] += errR * 1.0 / 16.0;
                            errorG[y + 1][x + 1] += errG * 1.0 / 16.0;
                            errorB[y + 1][x + 1] += errB * 1.0 / 16.0;
                        }
                    }
                }

                outputIndices[pixelIndex] = paletteIndex;
            }
        }
    }

    uint32_t PaletteConverter::calculateDistanceSquared(uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2,
                                                        uint8_t b2)
    {
        const int dr = static_cast<int>(r1) - static_cast<int>(r2);
        const int dg = static_cast<int>(g1) - static_cast<int>(g2);
        const int db = static_cast<int>(b1) - static_cast<int>(b2);

        return static_cast<uint32_t>(dr * dr + dg * dg + db * db);
    }

    double PaletteConverter::calculateWeightedDistance(uint8_t r1, uint8_t g1, uint8_t b1, uint8_t r2, uint8_t g2,
                                                       uint8_t b2)
    {
        // Weights based on human visual perception (ITU-R BT.601 standard)
        // Human eye is most sensitive to green, least to blue
        const double rWeight = 0.299;
        const double gWeight = 0.587;
        const double bWeight = 0.114;

        const double dr = static_cast<double>(r1) - static_cast<double>(r2);
        const double dg = static_cast<double>(g1) - static_cast<double>(g2);
        const double db = static_cast<double>(b1) - static_cast<double>(b2);

        return rWeight * dr * dr + gWeight * dg * dg + bWeight * db * db;
    }

    PaletteConverter::LabColor PaletteConverter::rgbToLab(uint8_t r, uint8_t g, uint8_t b)
    {
        // First convert RGB to XYZ
        double rNorm = r / 255.0;
        double gNorm = g / 255.0;
        double bNorm = b / 255.0;

        // Apply gamma correction (sRGB to linear RGB)
        auto gammaCorrect = [](double value) -> double {
            if (value > 0.04045)
                return pow((value + 0.055) / 1.055, 2.4);
            else
                return value / 12.92;
        };

        rNorm = gammaCorrect(rNorm);
        gNorm = gammaCorrect(gNorm);
        bNorm = gammaCorrect(bNorm);

        // Convert to XYZ using sRGB matrix
        double x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
        double y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750;
        double z = rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041;

        // Normalize by D65 white point
        x /= 0.95047;
        y /= 1.00000;
        z /= 1.08883;

        // Convert XYZ to LAB
        auto labTransform = [](double t) -> double {
            if (t > 0.008856)
                return pow(t, 1.0 / 3.0);
            else
                return (7.787 * t) + (16.0 / 116.0);
        };

        double fx = labTransform(x);
        double fy = labTransform(y);
        double fz = labTransform(z);

        double L = (116.0 * fy) - 16.0;
        double a = 500.0 * (fx - fy);
        double b_lab = 200.0 * (fy - fz);

        return LabColor(L, a, b_lab);
    }

    double PaletteConverter::calculateDeltaE(const LabColor &lab1, const LabColor &lab2)
    {
        double dL = lab1.L - lab2.L;
        double da = lab1.a - lab2.a;
        double db = lab1.b - lab2.b;

        return sqrt(dL * dL + da * da + db * db);
    }

    uint8_t PaletteConverter::findClosestEuclidean(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b)
    {
        uint8_t bestIndex = 0;
        uint32_t minDistance = std::numeric_limits<uint32_t>::max();

        for (int i = 0; i < 256; ++i)
        {
            const uint8_t paletteR = palette[i * 3];
            const uint8_t paletteG = palette[i * 3 + 1];
            const uint8_t paletteB = palette[i * 3 + 2];

            uint32_t distance = calculateDistanceSquared(r, g, b, paletteR, paletteG, paletteB);

            if (distance < minDistance)
            {
                minDistance = distance;
                bestIndex = static_cast<uint8_t>(i);
            }
        }

        return bestIndex;
    }

    uint8_t PaletteConverter::findClosestWeightedEuclidean(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b)
    {
        uint8_t bestIndex = 0;
        double minDistance = std::numeric_limits<double>::max();

        for (int i = 0; i < 256; ++i)
        {
            const uint8_t paletteR = palette[i * 3];
            const uint8_t paletteG = palette[i * 3 + 1];
            const uint8_t paletteB = palette[i * 3 + 2];

            double distance = calculateWeightedDistance(r, g, b, paletteR, paletteG, paletteB);

            if (distance < minDistance)
            {
                minDistance = distance;
                bestIndex = static_cast<uint8_t>(i);
            }
        }

        return bestIndex;
    }

    uint8_t PaletteConverter::findClosestCielabDeltaE(const uint8_t *palette, uint8_t r, uint8_t g, uint8_t b)
    {
        uint8_t bestIndex = 0;
        double minDistance = std::numeric_limits<double>::max();

        LabColor sourceLab = rgbToLab(r, g, b);

        for (int i = 0; i < 256; ++i)
        {
            const uint8_t paletteR = palette[i * 3];
            const uint8_t paletteG = palette[i * 3 + 1];
            const uint8_t paletteB = palette[i * 3 + 2];

            LabColor paletteLab = rgbToLab(paletteR, paletteG, paletteB);
            double distance = calculateDeltaE(sourceLab, paletteLab);

            if (distance < minDistance)
            {
                minDistance = distance;
                bestIndex = static_cast<uint8_t>(i);
            }
        }

        return bestIndex;
    }

}  // namespace Ida
