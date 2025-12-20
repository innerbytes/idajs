#include "files.h"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <regex>
#include <sstream>

#include "../../common/Logger.h"

namespace fs = std::filesystem;

namespace files
{
    std::string BasePath = "";

    static std::string getPathWithUnixSlashes(const std::string &path)
    {
        return fs::path(path).generic_string();
    }

    std::string readAllText(const std::string &filePath)
    {
        std::string fullPath = toAbsolute(filePath);
        std::ifstream file(fullPath);
        if (!file.is_open())
        {
            throw std::runtime_error("Failed to open file: " + fullPath);
        }

        std::stringstream buffer;
        buffer << file.rdbuf();  // Read entire file into a stringstream
        return buffer.str();     // Return the contents as a string
    }

    void writeAllText(const std::string &filePath, const std::string &content)
    {
        std::string fullPath = toAbsolute(filePath);
        std::ofstream file(fullPath);
        if (!file.is_open())
        {
            throw std::runtime_error("Failed to open file for writing: " + fullPath);
        }

        file << content;
    }

    bool copy(const std::string &sourcePath, const std::string &destinationPath)
    {
        std::string fullSourcePath = toAbsolute(sourcePath);
        std::string fullDestinationPath = toAbsolute(destinationPath);

        try
        {
            fs::copy_file(fullSourcePath, fullDestinationPath, fs::copy_options::overwrite_existing);
        }
        catch (const std::filesystem::filesystem_error &e)
        {
            Logger::err() << "Error copying file: " << e.what();
            return false;
        }

        return true;
    }

    bool isAbsolute(const std::string &path)
    {
        return fs::path(path).is_absolute();
    }

    bool exists(const std::string &absolutePath)
    {
        return fs::exists(fs::path(absolutePath));
    }

    std::string toAbsolute(const std::string &path, const std::string &basePath)
    {
        std::string currentBasePath = basePath.empty() ? BasePath : basePath;
        std::string unixPath = getPathWithUnixSlashes(path);

        auto candidatePath = isAbsolute(unixPath) ? unixPath : fs::path(currentBasePath) / fs::path(unixPath);
        try
        {
            return fs::absolute(candidatePath).string();
        }
        catch (const std::filesystem::filesystem_error &e)
        {
            Logger::err() << "Path error: " << e.what();
            return candidatePath.string();
        }
    }

    std::string getDirPath(const std::string &path)
    {
        return fs::path(path).parent_path().string() + (char)fs::path::preferred_separator;
    }

    std::string getAppDirPath()
    {
        return getPathWithUnixSlashes(BasePath);
    }

    std::string replaceExtension(const std::string &path, const std::string &newExtension)
    {
        fs::path filePath(path);
        if (filePath.has_extension())
        {
            filePath.replace_extension(newExtension);
        }
        else
        {
            filePath += newExtension;
        }
        return filePath.string();
    }

    std::string addExtension(const std::string &path, const std::string &newExtension)
    {
        fs::path filePath(path);

        // Get the current extension (if any)
        std::string currentExtension = filePath.extension().string();

        // If the current extension is already the new extension, return the path as-is
        if (currentExtension == newExtension)
        {
            return path;
        }

        // Otherwise, add the new extension to the end
        filePath += newExtension;
        return filePath.string();
    }

    void deleteFile(const std::string &absolutePath)
    {
        try
        {
            fs::remove(absolutePath);
        }
        catch (const std::filesystem::filesystem_error &e)
        {
            Logger::err() << "Error deleting file: " << e.what();
        }
    }

}  // namespace files
