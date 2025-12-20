#include "PngToLbaSpriteConverter.h"

#include <cstring>
#include <iostream>

#include "../common/Logger.h"
#include "SDL.h"
#include "SDL_image.h"

using namespace std;
using namespace Logger;

constexpr int MaxImageSize = 255;
constexpr int PalleteSize = 256;

namespace Ida
{
    PngToLbaSpriteConverter::PngToLbaSpriteConverter() {}

    bool PngToLbaSpriteConverter::convert(span<const string> imagePaths, const uint8_t *palette, SpriteHandle &handle,
                                          ColorMatchingAlgorithm algorithm, bool useDithering, uint8_t alphaThreshold)
    {
        auto imageCount = imagePaths.size();
        handle.clear();

        if (imageCount < 1)
        {
            return false;
        }

        // Pre-allocate buffer with estimated size to reduce reallocations
        vector<uint8_t> buffer;
        buffer.reserve(imageCount * 1024);  // Conservative estimate: ~1KB per image

        handle.n = imageCount;
        handle.w = new int[imageCount];
        handle.h = new int[imageCount];

        uint32_t *offsetsTable = new uint32_t[imageCount];
        uint32_t currentOffset = 4 * imageCount;

        for (unsigned int imgIndex = 0; imgIndex < imageCount; imgIndex++)
        {
            SDL_Surface *image = IMG_Load(imagePaths[imgIndex].c_str());
            if (!image)
            {
                err() << "Error loading image: " << imagePaths[imgIndex];
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

            if (image->w > MaxImageSize || image->h > MaxImageSize)
            {
                err() << "Image " << imagePaths[imgIndex] << " exceeds maximum size (" << MaxImageSize << "x"
                      << MaxImageSize << ")";
                SDL_FreeSurface(image);
                return false;
            }

            // Record width and height
            handle.w[imgIndex] = image->w;
            handle.h[imgIndex] = image->h;

            // Record offset of this image
            offsetsTable[imgIndex] = currentOffset;

            // Record header
            buffer.push_back(image->w);
            buffer.push_back(image->h);
            buffer.push_back(0);  // xofs
            buffer.push_back(0);  // yofs
            currentOffset += 4;

            // Pre-allocate reusable buffers for this image to avoid allocations in loops
            mPixelLineBuffer.resize(image->w);
            mEncodedLineBuffer.clear();
            mEncodedLineBuffer.reserve(image->w * 2);  // Conservative estimate for encoded line size

            // Convert entire image using PaletteConverter for better performance and quality
            const uint32_t totalPixels = image->w * image->h;
            mIndexBuffer.resize(totalPixels);

            if (useDithering)
            {
                PaletteConverter::convertToIndexedWithDithering(static_cast<const uint8_t *>(image->pixels), image->w,
                                                                image->h, palette, mIndexBuffer.data(), algorithm);
            }
            else
            {
                PaletteConverter::convertToIndexed(static_cast<const uint8_t *>(image->pixels), image->w, image->h,
                                                   palette, mIndexBuffer.data(), algorithm);
            }

            // Encode image data line by line
            for (int y = 0; y < image->h; y++)
            {
                // Convert indexed pixels to line format, handling transparency
                for (int x = 0; x < image->w; x++)
                {
                    const uint32_t pixel =
                        *(uint32_t *)((uint8_t *)image->pixels + y * image->pitch + x * image->format->BytesPerPixel);
                    uint8_t r, g, b, a;  // Need to provide valid pointers for all components
                    SDL_GetRGBA(pixel, image->format, &r, &g, &b, &a);

                    if (a < alphaThreshold)
                    {
                        mPixelLineBuffer[x] = -1;  // Transparent
                    }
                    else
                    {
                        mPixelLineBuffer[x] = mIndexBuffer[y * image->w + x];  // Use PaletteConverter result
                    }
                }

                // Clear and reuse the encoded line buffer
                mEncodedLineBuffer.clear();
                uint8_t blockCount = encodeLine(mPixelLineBuffer.data(), image->w, mEncodedLineBuffer);

                buffer.push_back(blockCount);
                buffer.insert(buffer.end(), mEncodedLineBuffer.begin(), mEncodedLineBuffer.end());
                currentOffset += 1 + mEncodedLineBuffer.size();
            }

            SDL_FreeSurface(image);
        }

        // Allocate and copy the buffer to handle
        const size_t offsetsTableSize = 4 * imageCount;
        handle.bufferSize = offsetsTableSize + buffer.size();
        handle.buffer = new uint8_t[handle.bufferSize];
#pragma warning(push)
#pragma warning(disable : 6386)  // Buffer overrun while writing to 'variable'
        memcpy(handle.buffer, offsetsTable, offsetsTableSize);
#pragma warning(pop)
        memcpy(handle.buffer + offsetsTableSize, buffer.data(), buffer.size());

        delete[] offsetsTable;

        return true;
    }

    uint8_t PngToLbaSpriteConverter::encodeLine(const int *pixelsLine, int lineSize, std::vector<uint8_t> &encodedLine)
    {
        int i = 0;
        uint8_t blockCount = 0;
        while (i < lineSize)
        {
            // Skip transparent pixels
            uint8_t skipCount = 0;
            while (i < lineSize && pixelsLine[i] == -1 && skipCount < 63)
            {
                skipCount++;
                i++;
            }

            if (skipCount > 0)
            {
                blockCount++;
                encodedLine.push_back(0b00000000 | (skipCount - 1));  // Skip block
                continue;
            }

            if (i == lineSize) continue;

            // Handle compressing repeating pixels
            int currentPixel = pixelsLine[i++];
            uint8_t repeatPixelsCount = 0;
            while (i < lineSize && pixelsLine[i] == currentPixel && repeatPixelsCount < 63)
            {
                repeatPixelsCount++;
                i++;
            }

            if (repeatPixelsCount > 0)
            {
                blockCount++;
                encodedLine.push_back(0b10000000 | repeatPixelsCount);  // Repeat block (if 1 pixel repeats, we need to
                                                                        // duplicate 2 pixels in the output)
                encodedLine.push_back(currentPixel);
                continue;
            }
            else
            {
                // No repetition or last pixel in line, fall back to the first checked pixel, and will write it as
                // differing block
                i--;
            }

            // Handle differing pixels
            uint8_t differentPixelsCount = 0;
            int pixelsStart = i;
            while (i < lineSize && (i == lineSize - 1 || pixelsLine[i] != pixelsLine[i + 1]) &&
                   differentPixelsCount < 63)
            {
                differentPixelsCount++;
                i++;
            }

            if (differentPixelsCount > 0)
            {
                blockCount++;
                encodedLine.push_back(0b01000000 | (differentPixelsCount - 1));  // Differing block
                for (int j = pixelsStart; j < i; j++)
                {
                    encodedLine.push_back(pixelsLine[j]);
                }
            }
        }

        return blockCount;
    }

}  // namespace Ida
