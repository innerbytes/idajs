#pragma once

/*
    This module is part of IdaJS test engine.
    It serves to introspect on various internal LBA2 game engine states for automated test purposes.
*/

#include "../Ida.h"

#pragma pack(push, 8)

namespace Ida
{
    class IdaSpy
    {
    private:
        Ida *mIda = nullptr;

        int mNextMainMenuCommand = 0;
        bool mSkipVideoOnce = false;
        uint32_t mGameInput = 0;
        bool mIsHotReloadEnabled = true;
        std::string mSaveGameName;
        int mExitCode = 0;

        DialogSpyInfo mDialogSpyInfo;
        ImageSpyInfo mImageSpyInfo;

    public:
        IdaSpy(Ida *ida) : mIda(ida) {}

        void setMainMenuCommand(int command);

        const int doMainMenu();

        void skipVideoOnce()
        {
            mSkipVideoOnce = true;
        }

        const bool isVideoSkippedOnce()
        {
            bool ret = mSkipVideoOnce;
            mSkipVideoOnce = false;
            return ret;
        }

        void setGameInputOnce(uint32_t input)
        {
            mGameInput = input;
        }

        const uint32_t readGameInputOnce()
        {
            uint32_t ret = mGameInput;
            mGameInput = 0;
            return ret;
        }

        const bool isHotReloadEnabled() const
        {
            return mIsHotReloadEnabled;
        }

        void setHotReloadEnabled(const bool isEnabled)
        {
            mIsHotReloadEnabled = isEnabled;
        }

        std::string getSaveGameNameOnce()
        {
            std::string ret = mSaveGameName;
            mSaveGameName.clear();
            return ret;
        }

        void setSaveGameNameOnce(const std::string &saveName)
        {
            mSaveGameName = saveName;
        }

        bool isDialogSpyEnabled() const
        {
            return mDialogSpyInfo.isActive;
        }

        void enableDialogSpy(const int periodMs)
        {
            mDialogSpyInfo.isActive = true;
            mDialogSpyInfo.spyPeriodMs = periodMs;
        }

        const DialogSpyInfo &getDialogSpyInfo()
        {
            return mDialogSpyInfo;
        }

        bool spyDialog(const int time, const uint8_t *text, const int sizeText, const int flags, const int minColor,
                       const int maxColor);

        void spyDialogSprite(const int idaSpriteNumber, const int xOfs, const int yOfs, const SpriteHandle *atlas);

        void spyDialogSpriteClear();

        bool isImageSpyEnabled() const
        {
            return mImageSpyInfo.isActive;
        }

        void enableImageSpy(const int periodMs)
        {
            mImageSpyInfo.isActive = true;
            mImageSpyInfo.spyPeriodMs = periodMs;
        }

        void spyImagePalette(const size_t paletteLength, const uint8_t *paletteData);

        void spyImage(const int effect, const size_t imageLength, const uint8_t *imageData);

        const ImageSpyInfo &getImageSpyInfo()
        {
            return mImageSpyInfo;
        }

        bool shouldWaitImageSpy(const int time);

        void setExitCodeOnce(const int exitCode)
        {
            mExitCode = exitCode;
        }

        int getExitCodeOnce()
        {
            int ret = mExitCode;
            mExitCode = 0;
            return ret;
        }
    };
};  // namespace Ida

#pragma pack(pop)
