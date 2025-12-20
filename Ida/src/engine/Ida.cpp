#include "Ida.h"

#include <v8.h>

#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>

#include "../common/Logger.h"
#include "../version.h"
#include "Epp.h"
#include "core/engine.h"
#include "core/files.h"
#include "game/LbaClientObjects.h"
#include "idaInterop.h"
#include "idaTypes.h"
#include "idajs.h"
#include "introspection/IdaSpy.h"
#include "media/mediaService.h"

using namespace std;
namespace fs = std::filesystem;

using namespace Logger;

namespace Ida
{
    // Bridge to call Ida/cpp from JS
    static IdaBridge *idaBridge = nullptr;

    // Execution Permissions Policy system
    static Epp *epp = nullptr;

    // Spy system to inspect and modify game state in the automated tests
    static IdaSpy *spy = nullptr;

    // Move and life handlers
    static v8::Global<v8::Function> mSceneMoveHandler;
    static std::unordered_map<int, v8::Global<v8::Function>> mSceneLifeHandlers;

    Ida::Ida(char *appPath, std::unique_ptr<IdaLbaBridge> lbaBridge, int logLevel)
        : mAppPath(appPath), mLbaBridge(std::move(lbaBridge))
    {
        setLogLevel(logLevel < 0 ? CFG_LOGLEVEL : static_cast<Logger::LogLevel>(logLevel));
        files::BasePath = files::getDirPath(appPath);
        spy = new IdaSpy(this);
        mObjectFlags = new uint8_t[mLbaBridge->getMaxObjects()];

        inf() << "";
        inf() << "LBA2 Community - IdaJS Edition: v" << IDA_VERSION;
        dbg() << "Base path: " << files::BasePath;
        dbg() << "PATH_RESSOURCE: " << CFG_PATH_RESSOURCE;
        dbg() << "PATH_SAVE: " << CFG_PATH_SAVE;
        dbg() << "PATH_PCX_SAVE: " << CFG_PATH_PCX_SAVE;
        dbg() << "PATH_SAVE_BUGS: " << CFG_PATH_SAVE_BUGS;
    }

    Ida::~Ida()
    {
        if (idaBridge)
        {
            delete idaBridge;
            idaBridge = nullptr;
        }

        if (epp)
        {
            delete epp;
            epp = nullptr;
        }

        if (spy)
        {
            delete spy;
            spy = nullptr;
        }

        mSceneMoveHandler.Reset();
        for (auto &handler : mSceneLifeHandlers)
        {
            handler.second.Reset();
        }
        mSceneLifeHandlers.clear();

        delete[] mObjectFlags;

        core::disposeV8();
        dbg() << "V8 disposed\n";
    }

    static int calculateIdaSceneLoadMode(const int sceneLoadMode, const bool isLoadGame, const bool isRestoringValidPos)
    {
        int idaSceneLoadMode = sceneLoadMode;

        // isLoadGame or isRestoringValidPos signalize that the game state will be now loaded right after the scene is
        // loaded The mod should not initialize the scene from scratch, start coroutines, etc
        if (isLoadGame || isRestoringValidPos)
        {
            // For the JS engine, using special sceneLoadMode, instead of passing isLoadGame separately
            idaSceneLoadMode = 4;
        }

        return idaSceneLoadMode;
    }

    static void loadIdaSavedState(const char *loadFilePath)
    {
        std::string jsonFilePath = files::replaceExtension(loadFilePath, ".json");
        std::string jsonContent = files::exists(jsonFilePath) ? files::readAllText(jsonFilePath) : "";

        core::runFunction(
            scene_load, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, SceneObjectName); },
            [&jsonContent](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] =
                    v8::String::NewFromUtf8(isolate, jsonContent.c_str(), v8::NewStringType::kNormal).ToLocalChecked();
                argv = args;
                return 1;
            });
    }

    void Ida::init(const string &modName, const uint8_t *normalPalette, const int minimumAllowedTextId,
                   const int languageId, const int spokenLanguageId, const uint8_t minimumAllowedPcxId,
                   const bool testMode)
    {
        epp = new Epp();
        epp->setTestMode(testMode);

        mModBasePath = CFG_PATH_MODS + modName + PATH_SEP;
        if (files::exists(mModBasePath))
        {
            inf() << "Mod provided: " << mModBasePath;
            setJsModuleName(modName);
            mIsModProvided = true;
        }
        else
        {
            inf() << "Mod not found: " << mModBasePath << "; The LBA2 will continue to run as vanilla";
            return;
        }

        mNormalPalette = normalPalette;

        if (core::isV8Init())
        {
            throw runtime_error("Fatal: Only once instance of Ida is allowed");
            return;
        }

        // 1000 is used in the dialog choices as Escape marker. So, we need to not use it for our texts
        int finalMinimumAllowedTextId = minimumAllowedTextId > 1000 ? minimumAllowedTextId : 1001;
        idaBridge =
            new IdaBridge(this, spy, epp, finalMinimumAllowedTextId, languageId, spokenLanguageId, minimumAllowedPcxId);

        core::initV8(mAppPath);
        dbg() << "V8 initialized";
    }

    void Ida::convertImagesAndSprites(const std::unordered_map<std::string, PaletteConversionData> &imagePalettes,
                                      const std::unordered_map<std::string, PaletteConversionData> &spritePalettes)
    {
        // If already converted, skip
        if (!mImagePaths.empty() || !mSpritePaths.empty())
        {
            dbg() << "useImages is called, but images and sprites were already converted in this session, skipping.";
            return;
        }

        string mediaPath = mModBasePath + "media" + PATH_SEP;
        string imagePath = mediaPath + "images" + PATH_SEP;
        string spritePath = mediaPath + "sprites" + PATH_SEP;

        pruneImageCache(mediaPath);
        loadImages(mImagePaths, imagePath, imagePalettes, mNormalPalette);
        loadSprites(mSpritePaths, spritePath, spritePalettes, mNormalPalette);
    }

    void Ida::clearMediaMemory()
    {
        mImages.clear();
        mSprites.clear();
    }

    void Ida::clearMedia()
    {
        clearMediaMemory();
        mImagePaths.clear();
        mSpritePaths.clear();
    }

    // This should be only reset when the mod is reloaded
    void Ida::clearSceneLoadOverrides()
    {
        mSceneMoveHandler.Reset();
        mForcedStorm = 0;
        mForcedIslandModel = 0;
        mLightningDisabled = false;
        mStartSceneId = 0;
        mIntroVideo = DefaultIntroVideo;
    }

    // This should reset before every scene load
    void Ida::clearSceneHandlers()
    {
        // Reset all persistent V8 function handles before clearing the map
        for (auto &handler : mSceneLifeHandlers)
        {
            handler.second.Reset();
        }
        mSceneLifeHandlers.clear();

        // Clear all Ida object flags
        std::memset(mObjectFlags, 0, mLbaBridge->getMaxObjects());
    }

    void Ida::setLifeHandler(int objectId, void *handlerPtr)
    {
        v8::Global<v8::Function> &handler = *static_cast<v8::Global<v8::Function> *>(handlerPtr);

        auto it = mSceneLifeHandlers.find(objectId);
        if (it != mSceneLifeHandlers.end())
        {
            it->second.Reset();
        }
        if (!handler.IsEmpty())
        {
            mSceneLifeHandlers[objectId] = std::move(handler);
        }
    }

    void Ida::setMoveHandler(void *handlerPtr)
    {
        v8::Local<v8::Function> &handler = *static_cast<v8::Local<v8::Function> *>(handlerPtr);
        mSceneMoveHandler.Reset(core::getIsolate(), handler);
    }

    void Ida::halt()
    {
        mIsScriptProvided = false;
    }

    // This can run even before init. The init is supposed to be called, only if the isModeProvided == true
    void Ida::run(std::function<void()> gameLoop)
    {
        // Cleaning up before new run
        mIsScriptProvided = false;
        clearMedia();
        clearSceneLoadOverrides();

        if (!mIsModProvided)
        {
            gameLoop();
            return;
        }

        std::string modEntryScriptPath = mModBasePath + string(ModEntryFileName);

        using namespace core;

        if (!files::exists(modEntryScriptPath))
        {
            wrn() << "File " << modEntryScriptPath << " is not found. The mod script will not run.";
            gameLoop();
        }
        else
        {
            epp->setPhase(ExecutionPhase::None);
            mIsScriptProvided = true;
            auto lbaBridge = mLbaBridge.get();
            bool runSuccess = core::runModScript(
                modEntryScriptPath, [lbaBridge]() { return std::make_unique<LbaClientObjects>(lbaBridge, idaBridge); },
                gameLoop);

            if (!runSuccess)
            {
                halt();
                err() << "Unabled to run the system or mod scripts: one or several errors encountered. The game will "
                         "continue in vanilla mode.";
                gameLoop();
            }
        }
    }

    void Ida::processTasks(const LoopType loopType)
    {
        // Saving loop type, so we can know if we are in main menu or in the game
        mLoopType = loopType;

        if (!mIsScriptProvided)
        {
            return;
        }

        core::processTasks();
    }

    void Ida::beforeLoadScene(const int sceneId, const char *loadFilePath, const int sceneLoadMode,
                              const bool isLoadGame, const bool isRestoringValidPos)
    {
        clearSceneHandlers();
        mLastProfileTime = 0;
        mProfileFrameCount = 0;

        if (!mIsScriptProvided)
        {
            return;
        }

        dbg() << "beforeLoadScene: " << sceneId << " from path " << loadFilePath << " sceneLoadMode: " << sceneLoadMode
              << " isGameLoad: " << isLoadGame;

        int idaSceneLoadMode = calculateIdaSceneLoadMode(sceneLoadMode, isLoadGame, isRestoringValidPos);

        epp->setPhase(ExecutionPhase::BeforeSceneLoad);

        // Early loading of the Ida saved state - allows the developer to take early decisions and modify the state
        // before it's too late
        if (idaSceneLoadMode == 4)
        {
            loadIdaSavedState(loadFilePath);
        }

        // Calling the event
        core::runSyncEvent(
            SceneTemplate::event_BeforeLoadScene,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, SceneObjectName); },
            [sceneId, idaSceneLoadMode](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[2];
                args[0] = v8::Integer::New(isolate, sceneId);
                args[1] = v8::Integer::New(isolate, idaSceneLoadMode);
                argv = args;
                return 2;
            });

        epp->setPhase(ExecutionPhase::None);
    }

    void Ida::afterLoadScene(const int sceneId, const int sceneLoadMode, const bool isLoadGame,
                             const bool isRestoringValidPos)
    {
        clearMediaMemory();

        if (!mIsScriptProvided)
        {
            return;
        }

        dbg() << "afterLoadScene: " << sceneId << " sceneLoadMode: " << sceneLoadMode << " isGameLoad: " << isLoadGame;

        int idaSceneLoadMode = calculateIdaSceneLoadMode(sceneLoadMode, isLoadGame, isRestoringValidPos);

        epp->setPhase(ExecutionPhase::SceneLoad);

        core::runSyncEvent(
            SceneTemplate::event_AfterLoadScene,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, SceneObjectName); },
            [sceneId, idaSceneLoadMode](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[2];
                args[0] = v8::Integer::New(isolate, sceneId);
                args[1] = v8::Integer::New(isolate, idaSceneLoadMode);
                argv = args;
                return 2;
            });

        epp->setPhase(ExecutionPhase::InScene);
    }

    void Ida::afterLoadGame(const int sceneId, const char *loadFilePath)
    {
        if (!mIsScriptProvided)
        {
            return;
        }

        dbg() << "afterLoadSavedState: " << sceneId << " from path " << loadFilePath;

        // Final loading of the Ida saved state
        loadIdaSavedState(loadFilePath);

        epp->setPhase(ExecutionPhase::GameLoad);

        // This event is used to resume the coroutines after the game is loaded
        core::runSyncEvent(
            SceneTemplate::event_AfterLoadSavedState,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, SceneObjectName); },
            [sceneId, loadFilePath](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[2];
                args[0] = v8::Integer::New(isolate, sceneId);
                args[1] = v8::String::NewFromUtf8(isolate, loadFilePath, v8::NewStringType::kNormal).ToLocalChecked();
                argv = args;
                return 2;
            });

        epp->setPhase(ExecutionPhase::InScene);
    }

    void Ida::afterSaveGame(const char *saveFilePath)
    {
        std::string filePathWithExtension = files::replaceExtension(saveFilePath, ".json");

        if (!mIsScriptProvided)
        {
            // If no mod is enabled, deleting the json file that might have left from the previous mod session
            files::deleteFile(filePathWithExtension);
            return;
        }

        dbg() << "afterSaveGame: " << saveFilePath;

        std::string savedGame;

        core::runFunction(
            scene_save, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, SceneObjectName); }, nullptr,
            [&savedGame](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                savedGame = !result.IsEmpty() && result.ToLocalChecked()->IsString()
                                ? *v8::String::Utf8Value(isolate, result.ToLocalChecked())
                                : "";
            });

        files::writeAllText(filePathWithExtension, savedGame);
    }

    void Ida::saveValidPos()
    {
        if (!mIsScriptProvided)
        {
            return;
        }

        core::runFunction(scene_saveBackup, true, [](v8::Local<v8::Context> context) {
            return core::inscope_GetObject(context, SceneObjectName);
        });
    }

    void Ida::restoreValidPos()
    {
        core::runFunction(scene_loadBackup, true, [](v8::Local<v8::Context> context) {
            return core::inscope_GetObject(context, SceneObjectName);
        });

        epp->setPhase(ExecutionPhase::GameLoad);

        core::runSyncEvent(
            SceneTemplate::event_AfterLoadSavedState,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, SceneObjectName); },
            [](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[2];
                args[0] = v8::Integer::New(isolate, -1);
                args[1] = v8::String::NewFromUtf8(isolate, "", v8::NewStringType::kNormal).ToLocalChecked();
                argv = args;
                return 2;
            });

        epp->setPhase(ExecutionPhase::InScene);
    }

    bool Ida::doBeforeLife(int objectId)
    {
        if (!mIsScriptProvided)
        {
            return true;
        }

        auto it = mSceneLifeHandlers.find(objectId);
        if (it == mSceneLifeHandlers.end() || it->second.IsEmpty())
        {
            err() << "No life handler found for objectId: " << objectId << ", but it was expected to have one.";
            return true;
        }

        v8::Global<v8::Function> &lifeHandler = it->second;
        bool resultHandle = false;
        epp->setPhase(ExecutionPhase::Life);

        core::runFunction(
            lifeHandler,
            [objectId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, objectId);
                argv = args;
                return 1;
            },
            [&resultHandle](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                resultHandle = !result.IsEmpty() && result.ToLocalChecked()->IsTrue();
            });

        epp->setPhase(ExecutionPhase::InScene);

        return resultHandle;
    }

    void Ida::doTrack(int objectId)
    {
        if (!mIsScriptProvided)
        {
            return;
        }

        if (mSceneMoveHandler.IsEmpty())
        {
            err() << "No move handler found, but it was expected to have one.";
            return;
        }

        epp->setPhase(ExecutionPhase::Move);

        core::runFunction(mSceneMoveHandler, [objectId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
            static v8::Local<v8::Value> args[1];
            args[0] = v8::Integer::New(isolate, objectId);
            argv = args;
            return 1;
        });

        epp->setPhase(ExecutionPhase::InScene);
    }

    const bool Ida::controlsDialogText(const int textId)
    {
        if (!mIsScriptProvided)
        {
            return false;
        }

        // We always control the text which is higher than the game text ids
        if (textId >= idaBridge->getFirstTextId())
        {
            return true;
        }

        // Check if the game text is overridden in the mod script
        bool resultValue;
        core::runFunction(
            text_isReplaced, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, TextObjectName); },
            [textId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, textId);
                argv = args;
                return 1;
            },
            [&resultValue](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                if (result.IsEmpty())
                {
                    return;
                }

                auto localResult = result.ToLocalChecked();
                if (!localResult->IsBoolean())
                {
                    return;
                }

                resultValue = localResult.As<v8::Boolean>()->Value();
            });

        return resultValue;
    }

    const unsigned char Ida::getDialogFlag(const int textId)
    {
        if (!mIsScriptProvided)
        {
            return 0;
        }

        // We always override the text which is higher than the game text ids, and flag will be passed together with
        // _get method
        if (textId >= idaBridge->getFirstTextId())
        {
            return 0;
        }

        // Check if the game text is overridden in the mod script
        uint8_t resultValue;
        core::runFunction(
            text_getFlags, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, TextObjectName); },
            [textId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, textId);
                argv = args;
                return 1;
            },
            [&resultValue](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                if (result.IsEmpty())
                {
                    return;
                }

                auto localResult = result.ToLocalChecked();
                if (!localResult->IsUint32())
                {
                    return;
                }

                resultValue = localResult.As<v8::Uint32>()->Value();
            });

        return resultValue;
    }

    const unsigned char *Ida::getText(uint32_t textId, long *textSize)
    {
        if (!mIsScriptProvided)
        {
            return nullptr;
        }

        auto textBuffer = &mTextBuffer;
        size_t length = 0;

        core::runFunction(
            text_get, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, TextObjectName); },
            [textId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, textId);
                argv = args;
                return 1;
            },
            [textBuffer, &length](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                if (result.IsEmpty())
                {
                    return;
                }

                // Expecting Uint8Array, containing flag byte, and then all the text bytes. Not null-terminated.
                auto localResult = result.ToLocalChecked();
                if (!localResult->IsUint8Array())
                {
                    return;
                }

                v8::Local<v8::Uint8Array> uint8Array = localResult.As<v8::Uint8Array>();
                length = uint8Array->Length();
                if (length == 0)
                {
                    return;
                }

                textBuffer->resize(length + 1);  // 1 extra byte for \0
                uint8Array->CopyContents(textBuffer->data(), length);
                textBuffer->at(length) = 0;  // Null-terminate the text
            });

        if (length == 0)
        {
            return nullptr;
        }

        *textSize = length;
        return mTextBuffer.data();
    }

    const DialogColorHandle Ida::getTextColor(uint32_t textId)
    {
        DialogColorHandle resultColorHandle;
        if (!mIsScriptProvided)
        {
            return resultColorHandle;
        }

        core::runFunction(
            text_getColor, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, TextObjectName); },
            [textId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, textId);
                argv = args;
                return 1;
            },
            [&resultColorHandle](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                if (result.IsEmpty())
                {
                    return;
                }

                auto localResult = result.ToLocalChecked();
                if (!localResult->IsArray())
                {
                    return;
                }

                v8::Local<v8::Array> resultArray = localResult.As<v8::Array>();
                if (resultArray->Length() < 3)
                {
                    return;
                }

                auto element0 = resultArray->Get(isolate->GetCurrentContext(), 0).ToLocalChecked();
                auto element1 = resultArray->Get(isolate->GetCurrentContext(), 1).ToLocalChecked();
                auto element2 = resultArray->Get(isolate->GetCurrentContext(), 2).ToLocalChecked();

                DialogColors color = inscope_readDialogColor(element0);
                resultColorHandle.MainColor = color;
                if (color != DialogColors::None)
                {
                    return;
                }

                // Second and third elements can be the start and end 256 colors
                int color256Start = inscope_read256Color(element1);
                int color256End = inscope_read256Color(element2);
                resultColorHandle.StartColor256 = color256Start;
                resultColorHandle.EndColor256 = color256End;
            });

        return resultColorHandle;
    }

    const SpriteHandle *Ida::getDialogSprite(uint32_t textId, int desiredX, int desiredY, int desiredSprite, int *x,
                                             int *y, int *idaSprite)
    {
        if (!mIsScriptProvided || mSpritePaths.size() == 0)
        {
            return nullptr;
        }

        std::string imageName = "";
        core::runFunction(
            text_getSprite, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, TextObjectName); },
            [textId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, textId);
                argv = args;
                return 1;
            },
            [&imageName, x, y](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                if (result.IsEmpty())
                {
                    return;
                }

                // Expecting result [string, xOfs, yOfs]
                auto localResult = result.ToLocalChecked();
                if (!localResult->IsArray())
                {
                    return;
                }

                v8::Local<v8::Array> resultArray = localResult.As<v8::Array>();
                if (resultArray->Length() < 3)
                {
                    return;
                }

                // Read first element as string
                auto element0 = resultArray->Get(isolate->GetCurrentContext(), 0).ToLocalChecked();
                std::string spritePath = "";
                if (element0->IsString())
                {
                    v8::String::Utf8Value utf8Value(isolate, element0);
                    spritePath = *utf8Value;
                }

                if (spritePath.empty())
                {
                    err() << "Sprite path is empty";
                    return;
                }

                // Read second element as int32
                auto element1 = resultArray->Get(isolate->GetCurrentContext(), 1).ToLocalChecked();
                if (element1->IsInt32())
                {
                    *x = element1.As<v8::Int32>()->Value();
                }

                // Read third element as int32
                auto element2 = resultArray->Get(isolate->GetCurrentContext(), 2).ToLocalChecked();
                if (element2->IsInt32())
                {
                    *y = element2.As<v8::Int32>()->Value();
                }

                imageName = spritePath;
            });

        if (imageName.empty() || mSpritePaths.find(imageName) == mSpritePaths.end())
        {
            return nullptr;
        }

        if (mSprites.find(imageName) == mSprites.end())
        {
            dbg() << "Loading sprite from disk: " << imageName;
            mSprites.emplace(imageName, SpriteHandle());
            if (!loadSpriteFromDisk(mSpritePaths[imageName], mSprites[imageName]))
            {
                err() << "Cannot load sprite from disk: " << imageName;
                return nullptr;
            };
        }

        *idaSprite = 0;
        return &mSprites[imageName];
    }

    const PcxHandle *Ida::getImage(uint8_t imageId)
    {
        if (!mIsScriptProvided || mImagePaths.size() == 0)
        {
            return nullptr;
        }

        std::string imageName = "";
        core::runFunction(
            image_get, true,
            [](v8::Local<v8::Context> context) { return core::inscope_GetObject(context, ImageObjectName); },
            [imageId](v8::Isolate *isolate, v8::Local<v8::Value> *&argv) -> size_t {
                static v8::Local<v8::Value> args[1];
                args[0] = v8::Integer::New(isolate, imageId);
                argv = args;
                return 1;
            },
            [&imageName](v8::Isolate *isolate, v8::MaybeLocal<v8::Value> result) {
                if (result.IsEmpty())
                {
                    return;
                }

                // Expecting result string or null / undefined
                auto localResult = result.ToLocalChecked();
                if (!localResult->IsString())
                {
                    return;
                }

                v8::String::Utf8Value utf8Value(isolate, localResult);
                imageName = *utf8Value;
            });

        if (imageName.empty() || mImagePaths.find(imageName) == mImagePaths.end())
        {
            return nullptr;
        }

        if (mImages.find(imageName) == mImages.end())
        {
            dbg() << "Loading image from disk: " << imageName;
            mImages.emplace(imageName, PcxHandle());
            if (!loadImageFromDisk(mImagePaths[imageName], mImages[imageName]))
            {
                err() << "Cannot load image from disk: " << imageName;
                return nullptr;
            };
        }

        return &mImages[imageName];
    }

    const void *Ida::getSpy() const
    {
        return spy;
    }
};  // namespace Ida
