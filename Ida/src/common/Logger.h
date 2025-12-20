#pragma once
#include <ostream>

namespace Logger
{
    enum class LogLevel
    {
        DEBUG = 0,
        INFO = 1,
        WARNING = 2,
        ERROR = 3,
        NONE = 4
    };

    LogLevel getLogLevel();
    void setLogLevel(LogLevel level);

    LogLevel getJsLogLevel();
    void setJsLogLevel(LogLevel level);
    void setJsModuleName(const std::string name);

    class LogLine
    {
    public:
        explicit LogLine(bool isVoid, const std::string &prefix, std::ostream &outStream);

        // special-case empty C‑strings: skip prefix+content entirely
        LogLine &operator<<(const char *s);

        // special-case empty std::string
        LogLine &operator<<(const std::string &s);

        // manipulators (std::hex, std::dec, etc.)
        template <typename T>
        LogLine &operator<<(const T &v)
        {
            if (mIsVoid)
            {
                return *this;
            }

            printPrefixIfNeeded();
            mOut << v;
            return *this;
        }

        LogLine &operator<<(std::ostream &(*manip)(std::ostream &));

        ~LogLine();

    private:
        void printPrefixIfNeeded();

        bool mIsVoid;
        const std::string mPrefix;
        std::ostream &mOut;
        bool mNeedPrefix;
    };

    LogLine dbg();
    LogLine inf();
    LogLine wrn();
    LogLine err();

    LogLine jsDbg();
    LogLine jsInf();
    LogLine jsWrn();
    LogLine jsErr();

}  // namespace Logger
