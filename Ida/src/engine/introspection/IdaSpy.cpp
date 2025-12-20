#include "IdaSpy.h"

#include "../../media/mediaService.h"

namespace Ida
{
    void IdaSpy::setMainMenuCommand(int command)
    {
        mNextMainMenuCommand = command;
    }

    const int IdaSpy::doMainMenu()
    {
        if (mNextMainMenuCommand > 0)
        {
            int command = mNextMainMenuCommand;
            mNextMainMenuCommand = 0;
            return command;
        }

        return 0;
    }

    bool IdaSpy::spyDialog(const int time, const uint8_t *text, const int sizeText, const int flags, const int minColor,
                           const int maxColor)
    {
        if (!mDialogSpyInfo.isActive)
        {
            return false;
        }

        if (mDialogSpyInfo.timeStartMs <= 0)
        {
            mDialogSpyInfo.timeStartMs = time;
        }

        mDialogSpyInfo.text.resize(sizeText - 1);
        memcpy(mDialogSpyInfo.text.data(), text, sizeText - 1);
        mDialogSpyInfo.flags = flags;
        mDialogSpyInfo.minColor = minColor;
        mDialogSpyInfo.maxColor = maxColor;

        bool terminateSpy = time - mDialogSpyInfo.timeStartMs >= mDialogSpyInfo.spyPeriodMs;
        if (terminateSpy)
        {
            mDialogSpyInfo.isActive = false;
            mDialogSpyInfo.timeStartMs = 0;
        }

        return terminateSpy;
    }

    // Happens earlier that spyDialog is called, so we can save the sprite info
    void IdaSpy::spyDialogSprite(const int idaSpriteNumber, const int xOfs, const int yOfs, const SpriteHandle *atlas)
    {
        mDialogSpyInfo.spriteId = idaSpriteNumber;
        mDialogSpyInfo.spriteXOfs = xOfs;
        mDialogSpyInfo.spriteYOfs = yOfs;

        auto spriteData = readSprite(*atlas, idaSpriteNumber);
        mDialogSpyInfo.spriteBytes.assign(spriteData.begin(), spriteData.end());
    }

    void IdaSpy::spyDialogSpriteClear()
    {
        mDialogSpyInfo.spriteId = -1;
        mDialogSpyInfo.spriteXOfs = 0;
        mDialogSpyInfo.spriteYOfs = 0;
        mDialogSpyInfo.spriteBytes.clear();
    }

    void IdaSpy::spyImagePalette(const size_t paletteLength, const uint8_t *paletteData)
    {
        mImageSpyInfo.paletteBytes.clear();
        if (!mImageSpyInfo.isActive || !paletteData)
        {
            return;
        }

        mImageSpyInfo.paletteBytes.assign(paletteData, paletteData + paletteLength);
    }

    void IdaSpy::spyImage(const int effect, const size_t imageLength, const uint8_t *imageData)
    {
        mImageSpyInfo.imageBytes.clear();
        mImageSpyInfo.effectId = -1;
        if (!mImageSpyInfo.isActive || !imageData)
        {
            return;
        }

        mImageSpyInfo.effectId = effect;
        mImageSpyInfo.imageBytes.assign(imageData, imageData + imageLength);
    }

    bool IdaSpy::shouldWaitImageSpy(const int time)
    {
        if (!mImageSpyInfo.isActive)
        {
            return false;
        }

        if (mImageSpyInfo.timeStartMs <= 0)
        {
            mImageSpyInfo.timeStartMs = time;
        }

        bool continueSpy = time - mImageSpyInfo.timeStartMs < mImageSpyInfo.spyPeriodMs;
        if (!continueSpy)
        {
            mImageSpyInfo.isActive = false;
            mImageSpyInfo.timeStartMs = 0;
        }

        return continueSpy;
    }
}  // namespace Ida
