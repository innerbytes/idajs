#pragma once

#pragma pack(push, 1)

#include "idaTypes.h"

/// @brief This is facade to call LBA functions from Ida engine
/// The implementation is in LBA2 project
class IdaLbaBridge
{
public:
    int getNumObjects();

    void setNumObjects(int numObjects);

    void initObject(int objectIndex);

    int getMaxObjects();

    int getNumZones();

    inline int getMaxZones()
    {
        // Memory wise we can have more, but the game performance may suffer as there are O(N^2) loops with zone
        // checks. Also we need to check if the types that store zone index somewhere can exceed this.
        // Experiment with this value if you want to have more zones per scene.
        return 128;
    }

    inline int getMaxWaypoints()
    {
        // Way point index is u8 in the scripts, so max number cannot exceed 256.
        return 256;
    }

    void *getZones();

    void setZones(int numZones, void *zonesPtr);

    int getNumWaypoints();

    void *getWaypoints();

    void setWaypoints(int numWaypoints, void *waypointsPtr);

    void *getObjectByIndex(int objectIndex);

    void *getZoneByIndex(int zoneIndex);

    void *getWaypointByIndex(int waypointIndex);

    int getMaxVarCubeIndex();

    int getMaxVarGameIndex();

    unsigned char *getVarCube(int varIndex);

    short *getVarGame(int varIndex);

    int getCubeStartX();
    int getCubeStartY();
    int getCubeStartZ();

    void setCubeStartX(int x);
    void setCubeStartY(int y);
    void setCubeStartZ(int z);

    /// @brief Updates the 3D model on the game object
    void update3DModel(void *pobj);

    /// @brief Executes the custom life code for the object at the given index
    void executeLifeCode(int objectIndex, unsigned char *code);

    /// @brief Executes the life function for the object at the given index
    int executeLifeFunction(int objectIndex, unsigned char *typeAnswer, unsigned char *code);

    /// @brief Returns true if the move script is being run for the object at the given index
    bool isMoveCommandActive(int objectIndex);

    /// @brief Executes the move command for the object at the given index
    void executeMoveCommand(int objectIndex, unsigned char *code);

    /// @brief Continues executing already started move command for the object at the given index.
    void continueMoveCommand(int objectIndex, unsigned char *code);

    /// @brief Stops executing the move command for the object at the given index
    void stopMoveCommand(int objectIndex);

    /// @brief Returns true if object is facing the needed direction towards the zone. For example, Zoe's portrait is
    /// facing North. This will return true if Twinsen is also facing North.
    /// @param objectX - object X coordinate
    /// @param objectZ - object Z coordinate
    /// @param objectBeta - object Beta (angle around Y axis)
    /// @param zone - pointer to the zone
    /// @param direction - direction to check (if set to None, will be read from zone->Info2)
    bool testObjectZoneDirection(int objectX, int objectZ, int objectBeta, void *zone, ZoneDirection direction);

    /// @brief Finds all bodies used by an object in the current scene
    /// Reads object 3D Entity, so it needs to be present
    /// Allocates outBodies array, the caller is responsible to free it
    /// @param outBodies - allocated array of body numbers as they need to be set in setBody function
    /// @param outHqrIds - allocated array of HQR IDs corresponding to each body number
    /// @param outCount - will be 0 if no bodies found, no memory allocated in this case
    /// @returns true if no error; false, if error (no memory allocated in this case)
    bool findAllBodies(int numobj, unsigned char **outBodies, short **outHqrIds, int *outCount);

    /// @brief Finds all animations used by an object in the current scene
    /// Reads object 3D Entity, so it needs to be present
    /// Allocates outAnims array, the caller is responsible to free it
    /// @param outCount - will be 0 if no animations found, no memory allocated in this case
    /// @returns true if no error; false, if error (no memory allocated in this case)
    bool findAllAnimations(int numobj, unsigned short **outAnims, int *outCount);

    void requestPaletteSync();

    int getGold();
    int getZlitos();
    int getPlanet();
    int getIsland();
    int getScene();

    int getNumKeys();
    int getMagicLevel();
    int getMagicPoints();

    void setGold(int gold);
    void setZlitos(int zlitos);

    void exitProcess(int exitCode);
};

#pragma pack(pop)
