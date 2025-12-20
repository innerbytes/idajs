#pragma once

#pragma pack(push, 8)

#include <iterator>
#include <unordered_map>
#include <vector>

#include "Epp.h"
#include "Ida.h"
#include "idaInterop.h"
#include "introspection/IdaSpy.h"

namespace Ida
{
    constexpr const char *languageCodes[6] = {"en", "fr", "de", "es", "it", "pt"};

    enum class LifeFunctionReturnType : uint8_t
    {
        INT8 = 0,
        INT16 = 1,
        STRING = 2,
        UINT8 = 4,
    };

    /// @brief This is facade to access Ida configuration and functions from the JS game engine
    class IdaBridge
    {
    private:
        Ida *mIdaInstance;
        Epp *mEpp;

        int mFirstTextId;
        int mLanguageId;
        int mSpokenLanguageId;
        uint8_t mMinimumAllowedPcxId;

        std::unordered_map<size_t, std::vector<uint8_t>> mMoveScripts;
        std::vector<uint8_t> mLifeScript;

        // Allows to have more zones in the scene, than defined in the HQR
        std::vector<T_ZONE> mZones;

        // Allows to have more waypoints in the scene, than defined in the HQR
        std::vector<T_TRACK> mWaypoints;

        IdaSpy *mSpy;

    public:
        IdaBridge(Ida *idaInstance, IdaSpy *idaSpy, Epp *epp, int firstTextId, int languageId, int spokenLanguageId,
                  uint8_t minimumAllowedPcxId)
            : mIdaInstance(idaInstance),
              mSpy(idaSpy),
              mEpp(epp),
              mFirstTextId(firstTextId),
              mLanguageId(languageId),
              mSpokenLanguageId(spokenLanguageId),
              mMinimumAllowedPcxId(minimumAllowedPcxId) {};

        const int getFirstTextId() const
        {
            return mFirstTextId;
        }

        const uint8_t getFirstPcxId() const
        {
            return mMinimumAllowedPcxId;
        }

        const char *getLanguage() const
        {
            return languageCodes[mLanguageId];
        }

        const char *getSpokenLanguage() const
        {
            return languageCodes[mSpokenLanguageId];
        }

        void *resizeZones(size_t oldSize, size_t newSize, void *zonesPtr);

        void *resizeWaypoints(size_t oldSize, size_t newSize, void *waypointsPtr);

        void prepareLifeScript(const uint8_t opcode, const size_t argumentsSize);

        void prepareLifeFunction(const uint8_t opcode, const size_t argumentsSize);

        unsigned char *getLifeScript();

        void finalizeLifeScript();

        template <std::integral T>
        void pushArgument(T value)
        {
            std::copy(reinterpret_cast<const uint8_t *>(&value), reinterpret_cast<const uint8_t *>(&value) + sizeof(T),
                      std::back_inserter(mLifeScript));
        }

        void pushArgument(const size_t length, const char *value);

        void prepareMoveScript(const size_t objectId, const uint8_t opcode, const size_t argumentsSize);

        std::pair<size_t, uint8_t *> getMoveScript(const size_t objectId);

        void finalizeMoveScript(const size_t objectId);

        // When restoring a saved operation
        void loadMoveScript(const size_t objectId, const size_t length, const uint8_t *code);

        template <std::integral T>
        void pushMoveArgument(const size_t objectId, T value)
        {
            auto &moveScript = mMoveScripts[objectId];
            std::copy(reinterpret_cast<const uint8_t *>(&value), reinterpret_cast<const uint8_t *>(&value) + sizeof(T),
                      std::back_inserter(moveScript));
        }

        void pushMoveArgument(const size_t objectId, const size_t length, const char *value);

        void convertImagesAndSprites(std::unordered_map<std::string, PaletteConversionData> &imagePalettes,
                                     std::unordered_map<std::string, PaletteConversionData> &spritePalettes)
        {
            mIdaInstance->convertImagesAndSprites(imagePalettes, spritePalettes);
        }

        void setStorm(const uint8_t stormMode)
        {
            mIdaInstance->setForcedStorm(stormMode);
        }

        uint8_t getStorm() const
        {
            return mIdaInstance->getForcedStorm();
        }

        void setForcedIslandModel(const uint8_t model)
        {
            mIdaInstance->setForcedIslandModel(model);
        }

        void setLightningDisabled(const bool isDisabled)
        {
            mIdaInstance->setLightningDisabled(isDisabled);
        }

        void setStartSceneId(const int sceneId)
        {
            mIdaInstance->setStartSceneId(sceneId);
        }

        uint8_t *getObjectFlags() const
        {
            return mIdaInstance->getObjectFlags();
        }

        void setLifeHandler(int objectId, void *handler)
        {
            mIdaInstance->setLifeHandler(objectId, handler);
        }

        void setMoveHandler(void *handler)
        {
            mIdaInstance->setMoveHandler(handler);
        }

        void setIntroVideo(const std::string &videoName)
        {
            mIdaInstance->setIntroVideo(videoName);
        }

        void halt()
        {
            mIdaInstance->halt();
        }

        LoopType getLoopType() const
        {
            return mIdaInstance->getLoopType();
        }

        void newGame()
        {
            mSpy->setMainMenuCommand(71);
        }

        void saveGame(const std::string &saveName)
        {
            mSpy->setSaveGameNameOnce(saveName);
            mSpy->setMainMenuCommand(73);
        }

        void loadGame(const std::string &saveName)
        {
            mSpy->setSaveGameNameOnce(saveName);
            mSpy->setMainMenuCommand(72);
        }

        void exitGame(int exitCode)
        {
            mSpy->setExitCodeOnce(exitCode);
            mSpy->setMainMenuCommand(75);
        }

        void skipVideoOnce()
        {
            mSpy->skipVideoOnce();
        }

        void setGameInputOnce(uint32_t input)
        {
            mSpy->setGameInputOnce(input);
        }

        void setHotReloadEnabled(const bool isEnabled)
        {
            mSpy->setHotReloadEnabled(isEnabled);
        }

        bool isHotReloadEnabled() const
        {
            return mSpy->isHotReloadEnabled();
        }

        const DialogSpyInfo &getDialogSpyInfo()
        {
            return mSpy->getDialogSpyInfo();
        }

        void doDialogSpy(const int timePeriodMs)
        {
            mSpy->enableDialogSpy(timePeriodMs);
        }

        const ImageSpyInfo &getImageSpyInfo()
        {
            return mSpy->getImageSpyInfo();
        }

        void doImageSpy(const int timePeriodMs)
        {
            mSpy->enableImageSpy(timePeriodMs);
        }

        template <typename Container>
        bool isEppAllowed(const Container &allowedPhases) const
        {
            return mEpp->isExecutionAllowed(allowedPhases);
        }

        template <typename Container>
        bool isEppDenied(const Container &deniedPhases) const
        {
            return mEpp->isExecutionDenied(deniedPhases);
        }

        bool isEppTestMode() const
        {
            return mEpp->isTestMode();
        }

        void setEppEnabled(const bool isEnabled)
        {
            mEpp->setEnabled(isEnabled);
        }

        template <typename Container>
        std::string getPhaseNames(const Container &phases) const
        {
            return Epp::getPhaseNames(phases);
        }

        template <typename Container>
        std::string getPhaseNamesExcept(const Container &exceptPhases) const
        {
            return Epp::getPhaseNamesExcept(exceptPhases);
        }
    };

}  // namespace Ida

#pragma pack(pop)
