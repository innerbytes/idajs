#pragma once

#include <cstdint>
#include <cstring>
#include <iomanip>
#include <sstream>
#include <string>

namespace Ida
{
    // MD5 implementation for hash computation (matches js-md5 reference)
    class MD5
    {
    public:
        MD5()
        {
            reset();
        }

        void update(const uint8_t *data, size_t length)
        {
            const uint8_t *ptr = data;
            size_t remaining = length;

            while (remaining > 0)
            {
                size_t chunk_size = std::min(remaining, static_cast<size_t>(64 - buffer_pos));
                std::memcpy(buffer + buffer_pos, ptr, chunk_size);
                buffer_pos += chunk_size;
                ptr += chunk_size;
                remaining -= chunk_size;
                total_length += chunk_size;

                if (buffer_pos == 64)
                {
                    processBlock();
                    buffer_pos = 0;
                }
            }
        }

        std::string finalize()
        {
            // Padding
            uint64_t bit_length = total_length * 8;
            buffer[buffer_pos++] = 0x80;

            if (buffer_pos > 56)
            {
                while (buffer_pos < 64) buffer[buffer_pos++] = 0;
                processBlock();
                buffer_pos = 0;
            }

            while (buffer_pos < 56) buffer[buffer_pos++] = 0;

            // Append length (little endian)
            for (int i = 0; i < 8; ++i)
            {
                buffer[56 + i] = static_cast<uint8_t>((bit_length >> (i * 8)) & 0xFF);
            }
            processBlock();

            // Convert to hex string (little endian byte order for each word)
            std::ostringstream oss;
            for (int i = 0; i < 4; ++i)
            {
                uint32_t val = h[i];
                for (int j = 0; j < 4; ++j)
                {
                    oss << std::hex << std::setw(2) << std::setfill('0')
                        << static_cast<unsigned>((val >> (j * 8)) & 0xFF);
                }
            }

            reset();
            return oss.str();
        }

    private:
        uint32_t h[4];
        uint8_t buffer[64];
        size_t buffer_pos;
        uint64_t total_length;

        void reset()
        {
            h[0] = 0x67452301;  // Same as JS: 1732584193
            h[1] = 0xEFCDAB89;  // Same as JS: -271733879
            h[2] = 0x98BADCFE;  // Same as JS: -1732584194
            h[3] = 0x10325476;  // Same as JS: 271733878
            buffer_pos = 0;
            total_length = 0;
        }

        static uint32_t rotateLeft(uint32_t value, unsigned int shift)
        {
            return (value << shift) | (value >> (32 - shift));
        }

        void processBlock()
        {
            // Convert buffer to 32-bit words (little endian)
            uint32_t w[16];
            for (int i = 0; i < 16; ++i)
            {
                w[i] = static_cast<uint32_t>(buffer[i * 4]) | (static_cast<uint32_t>(buffer[i * 4 + 1]) << 8) |
                       (static_cast<uint32_t>(buffer[i * 4 + 2]) << 16) |
                       (static_cast<uint32_t>(buffer[i * 4 + 3]) << 24);
            }

            uint32_t a = h[0], b = h[1], c = h[2], d = h[3];

            // Round 1: F(x,y,z) = (x & y) | (~x & z)
            auto FF = [](uint32_t &a, uint32_t b, uint32_t c, uint32_t d, uint32_t x, uint32_t s, uint32_t ac) {
                a += ((b & c) | (~b & d)) + x + ac;
                a = rotateLeft(a, s) + b;
            };

            FF(a, b, c, d, w[0], 7, 0xd76aa478);
            FF(d, a, b, c, w[1], 12, 0xe8c7b756);
            FF(c, d, a, b, w[2], 17, 0x242070db);
            FF(b, c, d, a, w[3], 22, 0xc1bdceee);
            FF(a, b, c, d, w[4], 7, 0xf57c0faf);
            FF(d, a, b, c, w[5], 12, 0x4787c62a);
            FF(c, d, a, b, w[6], 17, 0xa8304613);
            FF(b, c, d, a, w[7], 22, 0xfd469501);
            FF(a, b, c, d, w[8], 7, 0x698098d8);
            FF(d, a, b, c, w[9], 12, 0x8b44f7af);
            FF(c, d, a, b, w[10], 17, 0xffff5bb1);
            FF(b, c, d, a, w[11], 22, 0x895cd7be);
            FF(a, b, c, d, w[12], 7, 0x6b901122);
            FF(d, a, b, c, w[13], 12, 0xfd987193);
            FF(c, d, a, b, w[14], 17, 0xa679438e);
            FF(b, c, d, a, w[15], 22, 0x49b40821);

            // Round 2: G(x,y,z) = (x & z) | (y & ~z)
            auto GG = [](uint32_t &a, uint32_t b, uint32_t c, uint32_t d, uint32_t x, uint32_t s, uint32_t ac) {
                a += ((b & d) | (c & ~d)) + x + ac;
                a = rotateLeft(a, s) + b;
            };

            GG(a, b, c, d, w[1], 5, 0xf61e2562);
            GG(d, a, b, c, w[6], 9, 0xc040b340);
            GG(c, d, a, b, w[11], 14, 0x265e5a51);
            GG(b, c, d, a, w[0], 20, 0xe9b6c7aa);
            GG(a, b, c, d, w[5], 5, 0xd62f105d);
            GG(d, a, b, c, w[10], 9, 0x02441453);
            GG(c, d, a, b, w[15], 14, 0xd8a1e681);
            GG(b, c, d, a, w[4], 20, 0xe7d3fbc8);
            GG(a, b, c, d, w[9], 5, 0x21e1cde6);
            GG(d, a, b, c, w[14], 9, 0xc33707d6);
            GG(c, d, a, b, w[3], 14, 0xf4d50d87);
            GG(b, c, d, a, w[8], 20, 0x455a14ed);
            GG(a, b, c, d, w[13], 5, 0xa9e3e905);
            GG(d, a, b, c, w[2], 9, 0xfcefa3f8);
            GG(c, d, a, b, w[7], 14, 0x676f02d9);
            GG(b, c, d, a, w[12], 20, 0x8d2a4c8a);

            // Round 3: H(x,y,z) = x ^ y ^ z
            auto HH = [](uint32_t &a, uint32_t b, uint32_t c, uint32_t d, uint32_t x, uint32_t s, uint32_t ac) {
                a += (b ^ c ^ d) + x + ac;
                a = rotateLeft(a, s) + b;
            };

            HH(a, b, c, d, w[5], 4, 0xfffa3942);
            HH(d, a, b, c, w[8], 11, 0x8771f681);
            HH(c, d, a, b, w[11], 16, 0x6d9d6122);
            HH(b, c, d, a, w[14], 23, 0xfde5380c);
            HH(a, b, c, d, w[1], 4, 0xa4beea44);
            HH(d, a, b, c, w[4], 11, 0x4bdecfa9);
            HH(c, d, a, b, w[7], 16, 0xf6bb4b60);
            HH(b, c, d, a, w[10], 23, 0xbebfbc70);
            HH(a, b, c, d, w[13], 4, 0x289b7ec6);
            HH(d, a, b, c, w[0], 11, 0xeaa127fa);
            HH(c, d, a, b, w[3], 16, 0xd4ef3085);
            HH(b, c, d, a, w[6], 23, 0x04881d05);
            HH(a, b, c, d, w[9], 4, 0xd9d4d039);
            HH(d, a, b, c, w[12], 11, 0xe6db99e5);
            HH(c, d, a, b, w[15], 16, 0x1fa27cf8);
            HH(b, c, d, a, w[2], 23, 0xc4ac5665);

            // Round 4: I(x,y,z) = y ^ (x | ~z)
            auto II = [](uint32_t &a, uint32_t b, uint32_t c, uint32_t d, uint32_t x, uint32_t s, uint32_t ac) {
                a += (c ^ (b | ~d)) + x + ac;
                a = rotateLeft(a, s) + b;
            };

            II(a, b, c, d, w[0], 6, 0xf4292244);
            II(d, a, b, c, w[7], 10, 0x432aff97);
            II(c, d, a, b, w[14], 15, 0xab9423a7);
            II(b, c, d, a, w[5], 21, 0xfc93a039);
            II(a, b, c, d, w[12], 6, 0x655b59c3);
            II(d, a, b, c, w[3], 10, 0x8f0ccc92);
            II(c, d, a, b, w[10], 15, 0xffeff47d);
            II(b, c, d, a, w[1], 21, 0x85845dd1);
            II(a, b, c, d, w[8], 6, 0x6fa87e4f);
            II(d, a, b, c, w[15], 10, 0xfe2ce6e0);
            II(c, d, a, b, w[6], 15, 0xa3014314);
            II(b, c, d, a, w[13], 21, 0x4e0811a1);
            II(a, b, c, d, w[4], 6, 0xf7537e82);
            II(d, a, b, c, w[11], 10, 0xbd3af235);
            II(c, d, a, b, w[2], 15, 0x2ad7d2bb);
            II(b, c, d, a, w[9], 21, 0xeb86d391);

            h[0] += a;
            h[1] += b;
            h[2] += c;
            h[3] += d;
        }
    };

}  // namespace Ida
