// Common contants and ids for the mod

// When a story has multiple phases, we can control its state, using a single scene variable, that can have different values
const StoryPhases = {
  Kissing: 0,
  TalkAfterKissing: 1,
  GoingToTheWindow: 2,
  TalkNearWindow: 3,
  TwinsenIsControlledByPlayer: 4,
  DialogInBathroom: 5,
  DinoScene: 6,
};

// It's handy to store all the scene id and other value references in one properties object.
// Here we will have ids of the objects, zones and waypoints of our scene that we will use in the script.
const SceneProperties = {
  twinsenId: 0,
  doorId: 2,
  zoeId: 4,
  zoe2Id: 5, // Will use this actor for kissing in bath coroutine
  dinoId: -1, // This will be a new object, doesn't exist in the scene file

  zoneNightstandId: 13, // The nightstand with the key
  zoneExitDoorId: 4, // This is the exit door (teleport zone)
  zoneExitValue: 3, // This is the exit zone value we can use in scripts
  zoneZoePortraitId: 10, // The text zone for Zoe portrait

  zoneBathroomEntranceId: -1, // This will be a new zone, doesn't exist in the scene file
  zoneBathroomEntranceValue: -1,

  // To handle Twinsen going to the window in the player controlled phase
  zoneWindowValue: 4,

  // Those will be new waypoints, they don't exist in the scene file
  wpWindowId: -1,
  wpToBathroom1: -1,
  wpToBathroom2: -1,
  wpToBathroom3: -1,

  // Will use this waypoint to position things outside the scene
  wpNull: -1,

  // Will use this for custom texts in the dialogs
  textId: -1,

  // Temporary store for non-persistent triggers (for example, handy for checking player pressed action key)
  tempStore: null,
};

// Export the objects that should be accessible in other modules
module.exports.SceneProperties = SceneProperties;
module.exports.StoryPhases = StoryPhases;
