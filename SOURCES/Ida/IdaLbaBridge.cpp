#include "engine/IdaLbaBridge.h"

#include "../c_extern.h"
#include "../OBJECT.H" 

int IdaLbaBridge::getNumObjects()
{
    return NbObjets;
}

void IdaLbaBridge::setNumObjects(int numObjects)
{
	if (numObjects < 0 || numObjects > MAX_OBJETS)
	{
		return; // Invalid number of objects
	}

	NbObjets = numObjects;
}

void IdaLbaBridge::initObject(int objectIndex) 
{
	if (objectIndex < 0 || objectIndex >= NbObjets)
	{
		return; // Invalid object index
	}
	InitObject(objectIndex);
	T_OBJET *obj = &ListObjet[objectIndex];

	// The object must have a default model for the game to not crash, setting to Twinsen
	obj->IndexFile3D = 0;
	update3DModel(obj);
}

int IdaLbaBridge::getNumZones()
{
	return NbZones;
}

int IdaLbaBridge::getNumWaypoints()
{
    return NbBrickTrack;
}

void *IdaLbaBridge::getObjectByIndex(int objectIndex)
{
	if (objectIndex < 0 || objectIndex >= NbObjets)
	{
		return nullptr;
	}
	return &ListObjet[objectIndex];
}

void *IdaLbaBridge::getZoneByIndex(int zoneIndex)
{
	if (zoneIndex < 0 || zoneIndex >= NbZones)
	{
		return nullptr;
	}
	return &ListZone[zoneIndex];
}

void *IdaLbaBridge::getZones()
{
	return (void*)ListZone;
}

void *IdaLbaBridge::getWaypoints()
{
	return (void*)ListBrickTrack;
}

void IdaLbaBridge::setZones(int numZones, void *zonesPtr)
{
	if (numZones < 0 || numZones > getMaxZones() || zonesPtr == nullptr)
	{
		return; // Invalid number of zones or null pointer
	}

	NbZones = numZones;
	ListZone = (T_ZONE*)zonesPtr;
}

void IdaLbaBridge::setWaypoints(int numWaypoints, void* waypointsPtr)
{
	if (numWaypoints < 0 || numWaypoints > getMaxWaypoints() || waypointsPtr == nullptr)
	{
		return; // Invalid number of waypoints or null pointer
	}
	NbBrickTrack = numWaypoints;
	ListBrickTrack = (T_TRACK*)waypointsPtr;
}

void* IdaLbaBridge::getWaypointByIndex(int waypointIndex)
{
	if (waypointIndex < 0 || waypointIndex >= NbBrickTrack)
	{
		return nullptr;
	}
	return &ListBrickTrack[waypointIndex];
}

int IdaLbaBridge::getMaxVarCubeIndex()
{
	return MAX_VARS_CUBE - 1;
}

int IdaLbaBridge::getMaxVarGameIndex()
{
	return MAX_VARS_GAME - 1;
}

int IdaLbaBridge::getMaxObjects()
{
	return MAX_OBJETS;
}

unsigned char *IdaLbaBridge::getVarCube(int varIndex)
{
	if (varIndex < 0 || varIndex >= MAX_VARS_CUBE)
	{
		return nullptr;
	}
	return &ListVarCube[varIndex];
}

signed short *IdaLbaBridge::getVarGame(int varIndex)
{
	if (varIndex < 0 || varIndex >= MAX_VARS_GAME)
	{
		return nullptr;
	}
	return &ListVarGame[varIndex];
}

int IdaLbaBridge::getCubeStartX() 
{
	return CubeStartX;
}

int IdaLbaBridge::getCubeStartY() 
{
	return CubeStartY;
}

int IdaLbaBridge::getCubeStartZ() 
{
	return CubeStartZ;
}

void IdaLbaBridge::setCubeStartX(int x)
{
	CubeStartX = x;
}

void IdaLbaBridge::setCubeStartY(int y)
{
	CubeStartY = y;
}

void IdaLbaBridge::setCubeStartZ(int z)
{
	CubeStartZ = z;
}

void IdaLbaBridge::update3DModel(void *pobj)
{
	T_OBJET *obj = (T_OBJET *)pobj;
	if (!(obj->Flags & SPRITE_3D))
	{
		obj->PtrFile3D = LoadFile3D(obj->IndexFile3D);
	}
}

void IdaLbaBridge::executeLifeCode(int objectIndex, unsigned char *code)
{
	T_OBJET *obj = &ListObjet[objectIndex];

	auto currentPtrLife = obj->PtrLife;
	auto currentOfsLife = obj->OffsetLife;
	obj->PtrLife = code;
	obj->OffsetLife = 0;

	DoLife(objectIndex);

	obj->PtrLife = currentPtrLife;
	obj->OffsetLife = currentOfsLife;
}

int IdaLbaBridge::executeLifeFunction(int objectIndex, unsigned char *typeAnswer, unsigned char *code)
{
	T_OBJET *obj = &ListObjet[objectIndex];

	auto currentPtrPrg = PtrPrg;
	PtrPrg = code;
	DoFuncLife(obj);
	PtrPrg = currentPtrPrg;

	*typeAnswer = TypeAnswer;

	return Value;
}

bool IdaLbaBridge::isMoveCommandActive(int objectIndex) 
{
	return ListObjet[objectIndex].OffsetTrack > -1;
}

void IdaLbaBridge::executeMoveCommand(int objectIndex, unsigned char *code)
{
	T_OBJET *obj = &ListObjet[objectIndex];
	obj->PtrTrack = code;
	obj->OffsetTrack = 0;
	DoTrack(objectIndex);
}

void IdaLbaBridge::continueMoveCommand(int objectIndex, unsigned char *code) 
{
	T_OBJET *obj = &ListObjet[objectIndex];
	obj->PtrTrack = code;
	DoTrack(objectIndex);
}

void IdaLbaBridge::stopMoveCommand(int objectIndex)
{
	T_OBJET *obj = &ListObjet[objectIndex];
	obj->OffsetTrack = -1;
	obj->MemoLabelTrack = -1;
	obj->OffsetLabelTrack = -1;
	obj->LabelTrack = -1;
}

bool IdaLbaBridge::testObjectZoneDirection(int objectX, int objectZ, int objectBeta, void *zone, ZoneDirection direction)
{
    T_ZONE *zonePtr = (T_ZONE *)zone;
    if (direction == ZoneDirection::None)
    {
        direction = (ZoneDirection)zonePtr->Info2;
    }

    return TestObjectZoneDirection(objectX, objectZ, objectBeta, zonePtr, direction);    
}

bool IdaLbaBridge::findAllBodies(int numobj, unsigned char **outBodies, short **outHqrIds, int *outCount) 
{
	return FindAllBodies(numobj, outBodies, outHqrIds, (S32 *)outCount);
}

bool IdaLbaBridge::findAllAnimations(int numobj, unsigned short **outAnims, int *outCount)
{
	return FindAllAnims(numobj, outAnims, (S32 *)outCount);
}

void IdaLbaBridge::requestPaletteSync() 
{
	FlagPal = TRUE;
}

int IdaLbaBridge::getGold()
{
	return NbGoldPieces;
}

int IdaLbaBridge::getZlitos()
{
	return NbZlitosPieces;
}

void IdaLbaBridge::setGold(int gold)
{
	NbGoldPieces = gold;
}

void IdaLbaBridge::setZlitos(int zlitos)
{
	NbZlitosPieces = zlitos;
}

int IdaLbaBridge::getPlanet()
{
	return Planet;
}

int IdaLbaBridge::getIsland()
{
	return Island;
}

int IdaLbaBridge::getScene()
{
	return NumCube;
}

int IdaLbaBridge::getNumKeys() 
{
	return NbLittleKeys;
}

int IdaLbaBridge::getMagicLevel()
{
	return MagicLevel;
}

int IdaLbaBridge::getMagicPoints()
{
	return MagicPoint;
}

void IdaLbaBridge::exitProcess(int exitCode)
{
	exit(exitCode);
}

