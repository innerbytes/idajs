#pragma once

// IdaCpp - Execution protection policy

#include <string>
#include <unordered_map>

#pragma pack(push, 8)

namespace Ida
{
    enum class ExecutionPhase
    {
        // Script started, no scene is loaded yet
        None,

        // Before starting to load a scene - point of taking reverse decisions
        BeforeSceneLoad,

        // After loaded a scene
        SceneLoad,

        // Loading a saved game
        GameLoad,

        // In the main game loop, after scene is loaded, but not in life or move script
        InScene,

        // Running life script
        Life,

        // Running move script
        Move,
    };

    // Constant map to resolve ExecutionPhase to string names
    const std::unordered_map<ExecutionPhase, std::string> ExecutionPhaseNames = {
        {ExecutionPhase::None, "None"},
        {ExecutionPhase::BeforeSceneLoad, "BeforeLoadScene"},
        {ExecutionPhase::SceneLoad, "AfterLoadScene"},
        {ExecutionPhase::GameLoad, "AfterLoadSavedState"},
        {ExecutionPhase::InScene, "InScene"},
        {ExecutionPhase::Life, "LifeScript"},
        {ExecutionPhase::Move, "MoveScript"}};

    class Epp
    {
    private:
        ExecutionPhase mCurrentPhase = ExecutionPhase::None;
        bool mIsTestMode = false;
        bool mIsEnabled = true;

    public:
        void setPhase(ExecutionPhase phase)
        {
            mCurrentPhase = phase;
        }

        ExecutionPhase getPhase() const
        {
            return mCurrentPhase;
        }

        void setTestMode(const bool isTestMode)
        {
            mIsTestMode = isTestMode;
        }

        bool isTestMode() const
        {
            return mIsTestMode;
        }

        void setEnabled(const bool isEnabled)
        {
            mIsEnabled = isEnabled;
        }

        bool isEnabled() const
        {
            return mIsEnabled;
        }

        template <typename Container>
        bool isExecutionAllowed(const Container& allowedPhases) const
        {
            if (!mIsEnabled)
            {
                return true;
            }

            for (const auto& phase : allowedPhases)
            {
                if (mCurrentPhase == phase)
                {
                    return true;
                }
            }
            return false;
        }

        template <typename Container>
        bool isExecutionDenied(const Container& deniedPhases) const
        {
            if (!mIsEnabled)
            {
                return false;
            }

            for (const auto& phase : deniedPhases)
            {
                if (mCurrentPhase == phase)
                {
                    return true;
                }
            }
            return false;
        }

        template <typename Container>
        static std::string getPhaseNames(const Container& phases)
        {
            std::string result;
            bool first = true;
            for (const auto& phase : phases)
            {
                if (!first)
                {
                    result += ", ";
                }
                auto it = ExecutionPhaseNames.find(phase);
                if (it != ExecutionPhaseNames.end())
                {
                    result += it->second;
                }
                else
                {
                    result += "Unknown";
                }
                first = false;
            }
            return result;
        }

        template <typename Container>
        static std::string getPhaseNamesExcept(const Container& exceptPhases)
        {
            std::string result;
            bool first = true;

            // Iterate through all possible phases
            for (const auto& [phase, name] : ExecutionPhaseNames)
            {
                // Check if this phase is in the except list
                bool isExcluded = false;
                for (const auto& exceptPhase : exceptPhases)
                {
                    if (phase == exceptPhase)
                    {
                        isExcluded = true;
                        break;
                    }
                }

                // If not excluded, add to result
                if (!isExcluded)
                {
                    if (!first)
                    {
                        result += ", ";
                    }
                    result += name;
                    first = false;
                }
            }
            return result;
        }
    };

}  // namespace Ida

#pragma pack(pop)
