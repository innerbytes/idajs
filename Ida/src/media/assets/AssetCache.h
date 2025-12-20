#pragma once

#include <algorithm>
#include <cstdint>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <memory>
#include <sstream>
#include <string>
#include <type_traits>
#include <vector>

#include "../../../lib/md5/MD5.h"
#include "../../common/Logger.h"
#include "../../engine/idaTypes.h"
#include "AssetSerializer.h"
#include "HashDataSerializer.h"

namespace Ida
{
    /**
     * @brief Utility class for asset cache operations that don't require template instantiation
     */
    class AssetCacheUtils
    {
    public:
        /**
         * @brief Prune orphaned cache files from a folder
         * @param folderPath Path to the folder to prune
         * @param assetExtension Extension of the source assets (e.g., ".png")
         * @return Number of orphaned cache files removed
         */
        static size_t prune(const std::string &folderPath, const std::string &assetExtension)
        {
            if (!std::filesystem::exists(folderPath))
            {
                return 0;
            }

            size_t removedCount = 0;

            try
            {
                // Recursively iterate through all .ida files in the folder
                for (const auto &entry : std::filesystem::recursive_directory_iterator(folderPath))
                {
                    // Skip if not a regular .ida file
                    if (!entry.is_regular_file() || entry.path().extension() != ".ida")
                    {
                        continue;
                    }

                    std::filesystem::path idaPath = entry.path();

                    // Get the corresponding source file path by changing extension
                    std::filesystem::path sourcePath = idaPath;
                    sourcePath.replace_extension(assetExtension);

                    // Skip if source file still exists
                    if (std::filesystem::exists(sourcePath))
                    {
                        continue;
                    }

                    // Source file doesn't exist, remove the cache files
                    bool removed = false;

                    // Remove .ida file
                    std::error_code ec;
                    if (std::filesystem::remove(idaPath, ec) && !ec)
                    {
                        Logger::dbg() << "Removed orphaned asset file: " << idaPath.string();
                        removed = true;
                    }

                    // Remove corresponding .md5 file
                    std::filesystem::path md5Path = idaPath;
                    md5Path.replace_extension(".md5");
                    if (std::filesystem::remove(md5Path, ec) && !ec)
                    {
                        Logger::dbg() << "Removed orphaned hash file: " << md5Path.string();
                    }

                    if (removed)
                    {
                        ++removedCount;
                    }
                }
            }
            catch (const std::filesystem::filesystem_error &e)
            {
                Logger::err() << "Filesystem error during cache pruning in " << folderPath << ": " << e.what();
            }

            return removedCount;
        }
    };

    /**
     * @brief Generic asset cache manager with MD5 verification
     *
     * This class manages the caching of converted assets to .ida format files,
     * along with MD5 hash verification to ensure cache validity.
     * Works with any asset type through the IAssetSerializer interface.
     * Optionally supports additional hash data for cache validation.
     */
    template <typename TAsset, typename THashData = void>
    class AssetCache
    {
    public:
        /**
         * @brief Construct AssetCache with asset serializer only (no additional hash data)
         * @param assetSerializer Serializer for the asset type TAsset
         */
        explicit AssetCache(std::unique_ptr<IAssetSerializer<TAsset>> assetSerializer)
            : mAssetSerializer(std::move(assetSerializer)), mHashDataSerializer(nullptr)
        {
        }

        /**
         * @brief Construct AssetCache with asset serializer and hash data serializer
         * @param assetSerializer Serializer for the asset type TAsset
         * @param hashDataSerializer Serializer for additional hash data type THashData
         */
        AssetCache(std::unique_ptr<IAssetSerializer<TAsset>> assetSerializer,
                   std::unique_ptr<IHashDataSerializer<THashData>> hashDataSerializer)
            : mAssetSerializer(std::move(assetSerializer)), mHashDataSerializer(std::move(hashDataSerializer))
        {
        }

        // Non-copyable but movable
        AssetCache(const AssetCache &) = delete;
        AssetCache &operator=(const AssetCache &) = delete;
        AssetCache(AssetCache &&) = default;
        AssetCache &operator=(AssetCache &&) = default;

        ~AssetCache() = default;

        /**
         * @brief Check if a cached asset exists for the given source file path
         * @param sourceFilePath Path to the original source file
         * @return true if both .ida and .md5 files exist, false otherwise
         */
        bool isCached(const std::string &sourceFilePath) const
        {
            std::string idaPath = getIdaFilePath(sourceFilePath);
            std::string md5Path = getMd5FilePath(sourceFilePath);

            return std::filesystem::exists(idaPath) && std::filesystem::exists(md5Path);
        }

        /**
         * @brief Verify if the cached asset is up-to-date by checking MD5 hash
         * @param sourceFilePath Path to the original source file
         * @param additionalHashData Optional additional data to include in hash computation
         * @return true if cached asset is valid and up-to-date, false otherwise
         */
        template <typename... Args>
        bool isValid(const std::string &sourceFilePath, Args &&...additionalHashData) const
        {
            static_assert(sizeof...(Args) <= 1, "isValid can accept at most one additional hash data parameter");

            if (!isCached(sourceFilePath))
            {
                return false;
            }

            std::string currentHash = computeHash(sourceFilePath, std::forward<Args>(additionalHashData)...);
            if (currentHash.empty())
            {
                return false;
            }

            std::string cachedHash = readHashFromFile(getMd5FilePath(sourceFilePath));
            if (cachedHash.empty())
            {
                return false;
            }

            return currentHash == cachedHash;
        }

        /**
         * @brief Save converted asset data and its hash to cache
         * @param sourceFilePath Path to the original source file
         * @param asset Converted asset data to cache
         * @param additionalHashData Optional additional data to include in hash computation
         * @return true if successfully saved, false otherwise
         */
        template <typename... Args>
        bool saveAssetToCache(const std::string &sourceFilePath, const TAsset &asset, Args &&...additionalHashData)
        {
            static_assert(sizeof...(Args) <= 1,
                          "saveAssetToCache can accept at most one additional hash data parameter");

            std::string idaPath = getIdaFilePath(sourceFilePath);
            std::string md5Path = getMd5FilePath(sourceFilePath);

            // Create directories if they don't exist
            std::filesystem::path idaDir = std::filesystem::path(idaPath).parent_path();
            if (!std::filesystem::exists(idaDir))
            {
                std::error_code ec;
                std::filesystem::create_directories(idaDir, ec);
                if (ec)
                {
                    return false;
                }
            }

            // Save asset data
            if (!saveAssetToFile(idaPath, asset))
            {
                return false;
            }

            // Compute and save hash
            std::string hash = computeHash(sourceFilePath, std::forward<Args>(additionalHashData)...);
            if (hash.empty())
            {
                return false;
            }

            if (!writeHashToFile(md5Path, hash))
            {
                return false;
            }

            return true;
        }

        /**
         * @brief Convert source file path to corresponding .ida file path
         * @param sourceFilePath Path to the original source file
         * @return Path to the corresponding .ida file
         */
        std::string getIdaFilePath(const std::string &sourceFilePath) const
        {
            std::filesystem::path path(sourceFilePath);
            path.replace_extension(".ida");
            return path.string();
        }

        /**
         * @brief Load asset data from .ida file using the serializer
         * @param idaFilePath Path to the .ida file
         * @param asset Output asset to load data into
         * @return true if successfully loaded, false otherwise
         */
        bool loadAssetFromFile(const std::string &idaFilePath, TAsset &asset) const
        {
            if (!mAssetSerializer)
            {
                return false;
            }

            std::ifstream file(idaFilePath, std::ios::binary);
            if (!file.is_open())
            {
                return false;
            }

            // Read and verify magic number
            std::string expectedMagic = mAssetSerializer->getMagicNumber();
            std::vector<char> magic(expectedMagic.size());
            file.read(magic.data(), magic.size());

            if (!file.good() || std::string(magic.begin(), magic.end()) != expectedMagic)
            {
                return false;
            }

            // Read remaining data
            file.seekg(0, std::ios::end);
            size_t totalSize = static_cast<size_t>(file.tellg());
            file.seekg(expectedMagic.size(), std::ios::beg);

            size_t dataSize = totalSize - expectedMagic.size();
            std::vector<uint8_t> data(dataSize);
            file.read(reinterpret_cast<char *>(data.data()), dataSize);

            if (!file.good())
            {
                return false;
            }

            // Clear asset and deserialize
            mAssetSerializer->clearAsset(asset);
            return mAssetSerializer->deserialize(data, asset);
        }

    private:
        /**
         * @brief Convert source file path to corresponding .md5 file path
         * @param sourceFilePath Path to the original source file
         * @return Path to the corresponding .md5 file
         */
        std::string getMd5FilePath(const std::string &sourceFilePath) const
        {
            std::filesystem::path path(sourceFilePath);
            path.replace_extension(".md5");
            return path.string();
        }

        /**
         * @brief Compute MD5 hash for source file with optional additional hash data
         * @param sourceFilePath Path to the source file
         * @param additionalHashData Optional additional data for hash computation
         * @return MD5 hash as hex string, empty if failed
         */
        template <typename... Args>
        std::string computeHash(const std::string &sourceFilePath, Args &&...additionalHashData) const
        {
            static_assert(sizeof...(Args) <= 1, "computeHash can accept at most one additional hash data parameter");

            try
            {
                // Read source file
                std::vector<uint8_t> sourceBytes = readSourceFile(sourceFilePath);
                if (sourceBytes.empty())
                {
                    return "";
                }

                // Compute MD5 hash
                MD5 md5;
                md5.update(sourceBytes.data(), sourceBytes.size());

                if (!mHashDataSerializer)
                {
                    return md5.finalize();
                }

                // Add additional hash data if provided
                if constexpr (sizeof...(Args) == 1 && !std::is_void_v<THashData>)
                {
                    auto hashDataBytes =
                        mHashDataSerializer->serializeForHash(std::forward<Args>(additionalHashData)...);
                    if (!hashDataBytes.empty())
                    {
                        md5.update(hashDataBytes.data(), hashDataBytes.size());
                    }
                }

                return md5.finalize();
            }
            catch (const std::exception &)
            {
                return "";
            }
        }

        /**
         * @brief Read MD5 hash from .md5 file
         * @param md5FilePath Path to the .md5 file
         * @return MD5 hash string, empty if file doesn't exist or failed to read
         */
        std::string readHashFromFile(const std::string &md5FilePath) const
        {
            if (!std::filesystem::exists(md5FilePath))
            {
                return "";
            }

            std::ifstream file(md5FilePath);
            if (!file.is_open())
            {
                return "";
            }

            std::string hash;
            std::getline(file, hash);

            // Trim whitespace
            hash.erase(hash.find_last_not_of(" \n\r\t") + 1);

            return hash;
        }

        /**
         * @brief Write MD5 hash to .md5 file
         * @param md5FilePath Path to the .md5 file
         * @param hash MD5 hash string to write
         * @return true if successfully written, false otherwise
         */
        bool writeHashToFile(const std::string &md5FilePath, const std::string &hash) const
        {
            std::ofstream file(md5FilePath);
            if (!file.is_open())
            {
                return false;
            }

            file << hash;
            return file.good();
        }

        /**
         * @brief Read source file contents into memory
         * @param sourceFilePath Path to the source file
         * @return Vector containing source file bytes, empty if failed
         */
        std::vector<uint8_t> readSourceFile(const std::string &sourceFilePath) const
        {
            std::vector<uint8_t> buffer;

            if (!std::filesystem::exists(sourceFilePath))
            {
                return buffer;
            }

            std::ifstream file(sourceFilePath, std::ios::binary);
            if (!file.is_open())
            {
                return buffer;
            }

            file.seekg(0, std::ios::end);
            size_t fileSize = static_cast<size_t>(file.tellg());
            file.seekg(0, std::ios::beg);

            buffer.resize(fileSize);
            file.read(reinterpret_cast<char *>(buffer.data()), fileSize);

            if (!file.good())
            {
                buffer.clear();
            }

            return buffer;
        }

        /**
         * @brief Save asset data to .ida file using the serializer
         * @param idaFilePath Path to the .ida file
         * @param asset Asset data to save
         * @return true if successfully saved, false otherwise
         */
        bool saveAssetToFile(const std::string &idaFilePath, const TAsset &asset) const
        {
            if (!mAssetSerializer)
            {
                return false;
            }

            std::vector<uint8_t> serializedData = mAssetSerializer->serialize(asset);
            if (serializedData.empty())
            {
                return false;
            }

            std::ofstream file(idaFilePath, std::ios::binary);
            if (!file.is_open())
            {
                return false;
            }

            // Write magic number
            std::string magic = mAssetSerializer->getMagicNumber();
            file.write(magic.c_str(), magic.size());

            // Write serialized data
            file.write(reinterpret_cast<const char *>(serializedData.data()), serializedData.size());

            return file.good();
        }

        // Member variables
        std::unique_ptr<IAssetSerializer<TAsset>> mAssetSerializer;
        std::unique_ptr<IHashDataSerializer<THashData>> mHashDataSerializer;
    };

}  // namespace Ida
