#pragma once

#pragma pack(push, 8)

#include <string>
#include <vector>

// *** General Ida types and defines

#define PATH_SEP "\\"

// Object flags

// Object should process Ida life
constexpr uint8_t IDA_OBJ_LIFE = 0x01;

// Object has Ida life handler
constexpr uint8_t IDA_OBJ_LIFE_ENABLED = 0x02;

// Object is created by Ida script - no LBA scripts can be called for it
constexpr uint8_t IDA_OBJ_NEW = 0x04;

// Object track is handled by Ida script
constexpr uint8_t IDA_OBJ_MOVE = 0x08;

// We should call ida move handler for this object
constexpr uint8_t IDA_OBJ_MOVE_ENABLED = 0x10;

// *** Those are additional LBA2 types, that are not present in the original game.

enum class ZoneTypes
{
    Disabled = -1,
    Teleport = 0,
    Camera = 1,
    Sceneric = 2,
    Fragment = 3,
    Bonus = 4,
    Text = 5,
    Ladder = 6,
    Conveyor = 7,
    Spike = 8,
    Rail = 9,
};

enum class ZoneDirection
{
    None = 0,
    North = 1,
    South = 2,
    East = 4,
    West = 8
};

enum class LoopType
{
    None = 0,
    GameMenu = 1,
    Game = 2,
};

/// @brief Information about opened dialog, used in the automated testing
struct DialogSpyInfo
{
    bool isActive = false;
    int timeStartMs = 0;
    int spyPeriodMs = 0;
    std::vector<uint8_t> text;
    int flags = 0;
    int minColor = 0;
    int maxColor = 0;

    std::vector<uint8_t> spriteBytes;
    int spriteId = -1;
    int spriteXOfs = 0;
    int spriteYOfs = 0;
};

struct ImageSpyInfo
{
    bool isActive = false;
    int timeStartMs = 0;
    int spyPeriodMs = 0;
    int effectId = -1;
    std::vector<uint8_t> paletteBytes;
    std::vector<uint8_t> imageBytes;
};

/**
 * @enum DialogColors
 * @brief Enumeration for dialog colors
 */
enum class DialogColors
{
    /// @brief No custom color
    None = -1,

    /// @brief (#7C00DC)
    CinematicPurple = 0,

    /// @brief (#80583C)
    CocoaBrown = 1,

    /// @brief (#E8D8A8)
    PaleSand = 2,

    /// @brief (#B8B8B4)
    LightGray = 3,

    /// @brief (#D46460), aka Zoe color
    ZoeRed = 4,

    /// @brief (#F8B890)
    Peach = 5,

    /// @brief (#F4C46C)
    Goldenrod = 6,

    /// @brief (#98A878)
    SageGreen = 7,

    /// @brief (#74B47C)
    MintGreen = 8,

    /// @brief (#40A488)
    TealGreen = 9,

    /// @brief (#44ACB0)
    Seafoam = 10,

    /// @brief (#749CA0)
    DustyBlue = 11,

    /// @brief (#64A4C8), aka Twinsen color
    TwinsenBlue = 12,

    /// @brief (#A098AC)
    LavenderGray = 13,

    /// @brief (#B0A4A0)
    WarmTaupe = 14,

    /// @brief (#FCFCFC)
    CinematicWhiteGold = 15
};

enum class ColorMatchingAlgorithm
{
    EUCLIDEAN = 0,           // Simple RGB Euclidean distance (fastest)
    WEIGHTED_EUCLIDEAN = 2,  // Weighted RGB distance considering human perception
    CIELAB_DELTA_E = 4       // CIELAB color space with Delta E (most accurate)
};

enum class ForcedStorm
{
    NotForced = 0,
    ForceStorm = 1,
    ForceNoStorm = 2,
};

enum class ForcedIslandModel
{
    NotForced = 0,
    Citadel = 1,
    Citabeau = 2,
    CelebrationNormal = 3,
    CelebrationRisen = 4,
};

struct PaletteConversionData
{
    static constexpr ColorMatchingAlgorithm SpriteDefaultAlgorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN;
    static constexpr ColorMatchingAlgorithm ImageDefaultAlgorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN;
    static constexpr bool SpriteDefaultUseDithering = false;
    static constexpr bool ImageDefaultUseDithering = true;

    ColorMatchingAlgorithm algorithm = ColorMatchingAlgorithm::WEIGHTED_EUCLIDEAN;
    bool useDithering = true;
    int paletteIndex = -1;
    uint8_t alphaThreshold = 200;
};

#pragma pack(pop)

// *** Types for cross-calls

#pragma pack(push, 1)
struct ZoneHandle
{
    int ZoneIndex;
    void *Zone;
};

struct DialogColorHandle
{
    /**
     * @brief Most cases you want just this. Main color of the dialog (16 color). This is the standard diaog colors of
     * the game if set to None, the dialog will use the StartColor256 and EndColor256 If StartColor256 also is set to
     * <0, no custom color will be used (the game will chose the color normally)
     */
    DialogColors MainColor = DialogColors::None;

    /**
     * @brief 256-based color to start printing character with. The color will increment with each character until
     * reaches EndColor256. Use for non-standard dialog colors and experiments.
     */
    int StartColor256 = -1;
    int EndColor256 = -1;
};

struct SpriteHandle
{
    unsigned int n = 0;               // Number of images in the atlas
    int *w = nullptr;                 // Pointer to array of widths
    int *h = nullptr;                 // Pointer to array of heights
    unsigned char *buffer = nullptr;  // Buffer containing the atlas data
    size_t bufferSize = 0;

    void clear()
    {
        if (w)
        {
            delete[] w;
            w = nullptr;
        }
        if (h)
        {
            delete[] h;
            h = nullptr;
        }
        if (buffer)
        {
            delete[] buffer;
            buffer = nullptr;
        }
        n = 0;
        bufferSize = 0;
    }

    ~SpriteHandle()
    {
        clear();
    }
};

struct PcxHandle
{
    uint8_t *imageData = nullptr;    // Raw 8-bit indexed pixel data
    size_t imageDataSize = 0;        // Size of image data in bytes
    uint8_t *paletteData = nullptr;  // 768-byte RGB palette (256 colors * 3 components)
    size_t paletteDataSize = 0;      // Size of palette data in bytes (always 768)
    uint32_t width = 0;              // Image width in pixels
    uint32_t height = 0;             // Image height in pixels

    void clear()
    {
        if (imageData)
        {
            delete[] imageData;
            imageData = nullptr;
        }
        if (paletteData)
        {
            delete[] paletteData;
            paletteData = nullptr;
        }
        imageDataSize = 0;
        paletteDataSize = 0;
        width = 0;
        height = 0;
    }

    ~PcxHandle()
    {
        clear();
    }
};

#pragma pack(pop)
