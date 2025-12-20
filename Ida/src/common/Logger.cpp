#include "Logger.h"

#include <iostream>

namespace Logger
{
    static LogLevel logLevel = LogLevel::INFO;
    static LogLevel jsLogLevel = LogLevel::INFO;
    static std::string jsModuleName = "unknown";

    LogLine::LogLine(bool isVoid, const std::string &prefix, std::ostream &outStream)
        : mIsVoid(isVoid), mPrefix(prefix), mOut(outStream), mNeedPrefix(true)
    {
    }

    LogLine &LogLine::operator<<(const char *s)
    {
        if (mIsVoid || s == nullptr || *s == '\0')
        {
            return *this;
        }
        printPrefixIfNeeded();
        mOut << s;
        return *this;
    }

    LogLine &LogLine::operator<<(const std::string &s)
    {
        if (mIsVoid || s.empty())
        {
            return *this;
        }
        printPrefixIfNeeded();
        mOut << s;
        return *this;
    }

    LogLine &LogLine::operator<<(std::ostream &(*manip)(std::ostream &))
    {
        if (mIsVoid)
        {
            return *this;
        }

        printPrefixIfNeeded();
        mOut << manip;
        return *this;
    }

    void LogLine::printPrefixIfNeeded()
    {
        if (mNeedPrefix)
        {
            mOut << mPrefix;
            mNeedPrefix = false;
        }
    }

    LogLine::~LogLine()
    {
        if (!mIsVoid)
        {
            mOut << '\n';
        }
    }

    void setLogLevel(LogLevel level)
    {
        logLevel = level;
    }

    LogLevel getLogLevel()
    {
        return logLevel;
    }

    void setJsLogLevel(LogLevel level)
    {
        jsLogLevel = level;
    }

    LogLevel getJsLogLevel()
    {
        return jsLogLevel;
    }

    void setJsModuleName(const std::string name)
    {
        jsModuleName = name;
    }

    LogLine dbg()
    {
        return LogLine(logLevel > LogLevel::DEBUG, "[dbg] ", std::cout);
    }
    LogLine inf()
    {
        return LogLine(logLevel > LogLevel::INFO, "[inf] ", std::cout);
    }
    LogLine wrn()
    {
        return LogLine(logLevel > LogLevel::WARNING, "[wrn] ", std::cerr);
    }
    LogLine err()
    {
        return LogLine(logLevel > LogLevel::ERROR, "[err] ", std::cerr);
    }

    LogLine jsDbg()
    {
        std::string prefix = "[" + jsModuleName + "] [dbg] ";
        return LogLine(jsLogLevel > LogLevel::DEBUG, prefix, std::cout);
    }
    LogLine jsInf()
    {
        std::string prefix = "[" + jsModuleName + "] [inf] ";
        return LogLine(jsLogLevel > LogLevel::INFO, prefix, std::cout);
    }
    LogLine jsWrn()
    {
        std::string prefix = "[" + jsModuleName + "] [wrn] ";
        return LogLine(jsLogLevel > LogLevel::WARNING, prefix, std::cerr);
    }
    LogLine jsErr()
    {
        std::string prefix = "[" + jsModuleName + "] [err] ";
        return LogLine(jsLogLevel > LogLevel::ERROR, prefix, std::cerr);
    }

}  // namespace Logger
