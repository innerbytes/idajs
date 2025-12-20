#pragma once
#include <string>

namespace files
{
    extern std::string BasePath;

    bool copy(const std::string &sourcePath, const std::string &destinationPath);

    std::string readAllText(const std::string &filepath);

    void writeAllText(const std::string &filepath, const std::string &content);

    bool isAbsolute(const std::string &path);

    // Unix full path of this application directory
    std::string getAppDirPath();

    std::string toAbsolute(const std::string &path, const std::string &basePath = "");

    std::string getDirPath(const std::string &path);

    /// @brief Replaces extension of the given path with the new extension. If there is no extension, it adds the new
    /// one.
    std::string replaceExtension(const std::string &path, const std::string &newExtension);

    /// @brief in the path like ".../file.aaa.bbb.ccc" adds newExtension to the end if the ccc is not already
    /// newExtension.
    std::string addExtension(const std::string &path, const std::string &newExtension);

    bool exists(const std::string &absolutePath);

    void deleteFile(const std::string &absolutePath);
}  // namespace files
