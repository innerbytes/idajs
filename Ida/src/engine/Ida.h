#pragma once

#pragma pack(push, 8)

#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <unordered_set>

#include "IdaLbaBridge.h"

namespace Ida
{
    /**
     * @brief Facade for LBA2 -> Ida hooks
     */
    class Ida
    {
    private:
        static constexpr const char *DefaultIntroVideo = "INTRO";

        char *mAppPath;

        std::string mModBasePath;
        bool mIsModProvided = false;
        bool mIsScriptProvided = false;

        LoopType mLoopType = LoopType::None;

        std::unique_ptr<IdaLbaBridge> mLbaBridge;

        const uint8_t *mNormalPalette = nullptr;

        std::vector<uint8_t> mTextBuffer;

        // Asset name to asset paths (.ida files)
        // This must be loaded once per mod lifetime, and will remain the source of truth for all the media
        std::unordered_map<std::string, std::string> mSpritePaths;
        std::unordered_map<std::string, std::string> mImagePaths;

        // Cached in memory assets. Can be cleaned up on every scene load
        std::unordered_map<std::string, SpriteHandle> mSprites;
        std::unordered_map<std::string, PcxHandle> mImages;

        uint8_t mForcedStorm = 0;
        uint8_t mForcedIslandModel = 0;
        bool mLightningDisabled = false;
        int mStartSceneId = 0;
        std::string mIntroVideo = DefaultIntroVideo;

        uint8_t *mObjectFlags;

        void clearMedia();
        void clearMediaMemory();
        void clearSceneLoadOverrides();
        void clearSceneHandlers();

        long long mLastProfileTime = 0;
        int mProfileFrameCount = 0;

    public:
        Ida(char *appPath, std::unique_ptr<IdaLbaBridge> lbaBridge, int logLevel);
        ~Ida();

        /// @brief Called before the game menu is shown first time
        /// @param modName the name of the mod folder, if any
        /// @param normalPalette the normal 256-colors palette of the game
        /// @param minimumAllowedTextId the first text id, that is not used in the game, thus it and bigger ids can be
        /// @param languageId the text language id of the game
        /// @param spokenLanguageId the spoken language id of the game
        /// @param minimumAllowedPcxId the first pcx id, that is not used in the game, thus it and bigger ids can be
        /// used by mods
        void init(const std::string &modName, const uint8_t *normalPalette, const int minimumAllowedTextId,
                  const int languageId, const int spokenLanguageId, const uint8_t minimumAllowedPcxId,
                  const bool testMode);

        /// @brief Converts and loads to memory atlas all the images and sprites for the current mod
        void convertImagesAndSprites(const std::unordered_map<std::string, PaletteConversionData> &imagePalettes,
                                     const std::unordered_map<std::string, PaletteConversionData> &spritePalettes);

        ///
        /// @brief Called after the Ida is initialized, wraps the whole game loop including main menu
        ///
        void run(std::function<void()> gameLoop);

        const LoopType getLoopType() const
        {
            return mLoopType;
        }

        /// @brief Stops all the mod hooks execution as if the script is not provided. Usefull for debugging.
        void halt();

        ///
        /// @brief process javascript micro and macro tasks
        ///
        void processTasks(const LoopType loopType);

        /// @brief Called before loading a scene, but after the scene id and load file is known
        /// The pre-loading of the Ida saved game happens here, so the mod developer has access to the variables
        /// Decisions on whether save game is compatible, migrating the save game file to the new version,
        /// and also decisions on pallete and other variables important during scene load can be taken here by mod
        /// develper.
        void beforeLoadScene(const int sceneId, const char *loadFilePath, const int sceneLoadMode,
                             const bool isLoadGame, const bool isRestoringValidPos);

        /// @brief Called after loading a scene, but before the scene is shown. Can edit / add / delete objects, zones,
        /// waypoints here
        void afterLoadScene(const int sceneId, const int sceneLoadMode, const bool isLoadGame,
                            const bool isRestoringValidPos);

        /// @brief Called after the LBA save game is loaded
        /// The second loading of the Ida saved game happens here
        /// The initial system actions based on loaded state, like resuming of the coroutines happen here.
        /// TODO - after we implement save version control system, see if this still needs to be exposed to mod
        /// developer
        void afterLoadGame(const int sceneId, const char *loadFilePath);

        /// @brief Called after the LBA game is saved - using it usually to save the Ida state to json file
        void afterSaveGame(const char *saveFilePath);

        // Saving a backup game state to the inside of the normal game state (used for after-death recuperation)
        void saveValidPos();

        // Restoring a backup game state from the inside of the normal game state (used for after-death recuperation)
        void restoreValidPos();

        /// @brief Sets a JavaScript life script handler for a specific game object
        /// @param objectId the index of the game object
        /// @param handler the persistent V8 function handle for the life script
        void setLifeHandler(int objectId, void *handler);

        /// @brief Sets a JavaScript move script handler for all game objects
        void setMoveHandler(void *handler);

        /// @brief Gets Ida specific object flags for all objects in the current scene
        uint8_t *getObjectFlags() const
        {
            return mObjectFlags;
        }

        /// @brief Called every frame for each object that should handle life, right before the life script of the
        /// object is executed
        /// @return true if the LBA life script should still be executed after, false if it should be skipped
        bool doBeforeLife(int objectId);

        /// @brief Called every frame for each object, instead of the vanilla track script of the object, if overridden
        void doTrack(int objectId);

        /// @brief Returns true if Ida controls the dialog text with given id, false if the game should use its own text
        const bool controlsDialogText(int textId);

        /// @brief Returns the custom dialog flag whem the game dialog is overriden by Ida, but user wants to use
        /// original text. Will return 0 if the flag is not overridden
        const unsigned char getDialogFlag(int textId);

        /// @brief if the dialog textId is controlled by Ida, the game will call this function to get the text;
        ///        callling this function second time will overwrite the previous text buffer
        /// @param textId the id of the text
        /// @param textSize the size of the allocated text buffer-1 (doesn't count the first flag byte, counts the
        /// null-terminator) will be returned here
        /// @return the full text buffer is returned from Ida [flag byte, text bytes..., null terminator]. The text
        /// buffer should not be deallocated from the outside.
        const unsigned char *getText(uint32_t textId, long *textSize);

        /// @brief Returns the custom color of the text. If no custom color is set for this text, should return value
        /// less than 0
        /// @param textId the id of the text
        /// @return desired dialog color, or DialogColors::None if the color for this text is not overriden
        const DialogColorHandle getTextColor(uint32_t textId);

        /// @brief Returns the pointer to Ida Sprite Atlas handle if custom sprite will be shown. If no custom sprite is
        /// set for this text, should return nullptr
        /// @param textId the id of the text
        /// @param desiredX X coordinate of the sprite from the game. Return it back in x value with or without
        /// modification
        /// @param desiredY Y coordinate of the sprite from the game. Return it back in y value with or without
        /// modification
        /// @param desiredSprite the sprite id from the game (Zoe or Baldino). Return back in idaSprite the number of
        /// sprite in ida atlas you want to show
        const SpriteHandle *getDialogSprite(uint32_t textId, int desiredX, int desiredY, int desiredSprite, int *x,
                                            int *y, int *idaSprite);

        /// @brief Returns the pointer to the image handle with the given ID, or nullptr if not found
        const PcxHandle *getImage(uint8_t imageId);

        /// @brief if active, forces the storm, disregarding on the LBA2 story conditions check
        bool isStorm() const
        {
            return mForcedStorm == static_cast<uint8_t>(ForcedStorm::ForceStorm);
        }

        /// @brief if active, forces no storm, disregarding on the LBA2 story conditions check
        bool isNoStorm() const
        {
            return mForcedStorm >= static_cast<uint8_t>(ForcedStorm::ForceNoStorm);
        }

        /// @brief sets the storm state forcing, disregarding on the LBA2 story conditions check
        /// @param isActive 0 - obey LBA2 conditions (default), 1 - force storm, 2 or more - force no storm
        void setForcedStorm(const uint8_t isActive)
        {
            mForcedStorm = isActive;
        }

        uint8_t getForcedStorm() const
        {
            return mForcedStorm;
        }

        uint8_t getForcedIslandModel() const
        {
            return mForcedIslandModel;
        }

        void setForcedIslandModel(const uint8_t model)
        {
            mForcedIslandModel = model;
        }

        bool isForcedCitadel() const
        {
            return mForcedIslandModel == static_cast<uint8_t>(ForcedIslandModel::Citadel);
        }

        bool isForcedCitabeau() const
        {
            return mForcedIslandModel == static_cast<uint8_t>(ForcedIslandModel::Citabeau);
        }

        bool isForcedCelebrationNormal() const
        {
            return mForcedIslandModel == static_cast<uint8_t>(ForcedIslandModel::CelebrationNormal);
        }

        bool isForcedCelebrationRisen() const
        {
            return mForcedIslandModel == static_cast<uint8_t>(ForcedIslandModel::CelebrationRisen);
        }

        void setLightningDisabled(const bool isDisabled)
        {
            mLightningDisabled = isDisabled;
        }

        bool isLightningDisabled() const
        {
            return mLightningDisabled;
        }

        int getStartSceneId() const
        {
            return mStartSceneId;
        }

        void setStartSceneId(const int sceneId)
        {
            mStartSceneId = sceneId;
        }

        void setIntroVideo(const std::string &videoName)
        {
            mIntroVideo = videoName;
        }

        const std::string &getIntroVideo() const
        {
            return mIntroVideo;
        }

        const void *getSpy() const;
    };
};  // namespace Ida
#pragma pack(pop)
