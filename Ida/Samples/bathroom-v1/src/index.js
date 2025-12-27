// We have splitted this sample's coroutines to a separate file
// Using them here
const { registerCoroutines } = require("./coroutines");

// The same way we use StoryPhases and Scene objects from a separate module
const { StoryPhases, SceneProperties } = require("./props");

// We have also extracted the life behaviors of each actor to separate scripts
const twinsenBehaviors = require("./twinsenLife");
const zoeBehaviors = require("./zoeLife");
const dinoBehaviors = require("./dinoLife");

// We will use custom images in this mod
ida.useImages({
  // We import dino.png and bath.png with LBA palette to use dialogs on top of it, thus we need to specify it in the configuration
  // If no configuration to useImages is passed, all images will be imported with palette, derived from the png file.
  images: {
    "dino.png": {
      paletteIndex: 0, // 0 - means game palette
      algorithm: image.PaletteAlgorithms.WeightedEuclidean, // Not using dithering for this image, looks better without one
    },
    "bath.png": {
      paletteIndex: 0, // Importing with default algorithm and game palette (will use dithering by default)
    },
  },
});

console.log(`
This is demo of a small scripted scene that we implement using IdaJS.
This also demonstrates a scene setup, and how we add extra objects and zones to the existing scene.
Other than that, this sample shows how you can decompose your mod in separate files.

Start a new game to see this sample in action.
`);

// It's handy to describe the scenario before starting to implement it
/*
Our scenario:
- Twinsen and Zoe are standing in the bathroom and kissing
- Twinsen tells Zoe - I need to check how is Dino there, I'm worried for him
- Twinsen approaches the window
- He says first the standard message "I cannot see my Dino from here..."
- But then he says "Oh wait..."
- An image with Dino appears
- Dino says in the dialog "But I can see you and what you are doing Twinsen. Maybe you can distract from Zoe a bit and buy me a cure?"
- Twinsen says "Oh, Dino, I will do it right now!"
- Zoe approaches to Twinsen and says "But, dear, don't you want to take a bath with me first?"
- Twinsen answers: sweet, we don't have a bathroom. The developers put everything to our house, only they forgot to include a bathroom.
- Zoe tells: no no, darling, they added bathroom. They just put a door to the place player couldn't see, so he doesn't distract from the game too much.
- Twinsen says: "Oh?"
- Zoe says: "Let me show you. Follow me"
- Zoe continues to the corner of the room. 
- The control is given to the player.
- Zoe disappears in the corner. 
- If player goes to the same place where Zoe disappears a bathroom scene starts
- An image of Twinsen and Zoe taking bath together
- Dialog - oh, poor Dino, he waited for so long...
- Camera switches to the house, where Dino is inside
- He's walking around, saying - where are they? They just were here!
- And what is this sound? 
- Kisses sounds can be heard.
- Dino: I hate it here (lays on the floor, sick). 
*/

// Setting up the scene 0 (house)
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, startMode) => {
  if (sceneId !== 0) return;

  // Resetting tempStore on each scene load
  SceneProperties.tempStore = {};

  // Will handle life and move scripts for Zoe and Twinsen
  const twinsen = scene.getObject(SceneProperties.twinsenId);
  const zoe = scene.getObject(SceneProperties.zoeId);
  const zoe2 = scene.getObject(SceneProperties.zoe2Id); // Will use this extra object on the scene for sound coroutines

  twinsen.handleMoveScript();
  zoe.handleMoveScript();
  zoe2.handleMoveScript();

  twinsen.handleLifeScript(handleTwinsenLife);
  zoe.handleLifeScript(handleZoeLife);
  zoe2.handleLifeScript();

  // Add new objects, zones, and waypoints
  // Everything we want to add / remove or change in the scene, comparing to the HQR file,
  // must be done inside of the afterSceneLoad event. It cannot be done afterwards in the life or move scripts.

  // === Waypoints setup ===

  // Add a Window waypoint, for Twinsen to walk there
  SceneProperties.wpWindowId = scene.addWaypoints();
  // The desired position of the waypoint can be looked in the LBArchitect application or by a script
  // This is the position from the LBArchitect where Zoe was initially standing, so by the window
  scene.updateWaypoint(SceneProperties.wpWindowId, [3931, 2048, 400]);

  // Add waypoints to walk to the bathroom and also an outside waypoint
  // This adds 4 waypoints in a row and returns the id of the first added waypoint
  SceneProperties.wpToBathroom1 = scene.addWaypoints(4);
  SceneProperties.wpToBathroom2 = SceneProperties.wpToBathroom1 + 1;
  SceneProperties.wpToBathroom3 = SceneProperties.wpToBathroom2 + 1;
  SceneProperties.wpNull = SceneProperties.wpToBathroom3 + 1;
  scene.updateWaypoint(SceneProperties.wpToBathroom1, [9472, 2048, 1500]);
  scene.updateWaypoint(SceneProperties.wpToBathroom2, [14300, 2048, 2048]);
  scene.updateWaypoint(SceneProperties.wpToBathroom3, [14320, 2048, 0]);
  scene.updateWaypoint(SceneProperties.wpNull, [0, 2048, 13000]); // This is a point outside of the scene, where we can place temporary unused objects

  // === Objects setup ===

  // Add a Dino-Fly actor to the scene
  SceneProperties.dinoId = scene.addObjects(); // Adds one more empty object to the scene and returns its Id
  const dino = scene.getObject(SceneProperties.dinoId); // Getting reference to the Dino object, so we can set it up
  dino.setTalkColor(text.Colors.TealGreen); // Dino's text color

  // Dino fly entity. You can find entity ids here: Ida/srcjs/architect/entities.md
  dino.setEntity(109);

  // Normal dino body, without Twinsen
  // Explore all bodies and animations, using Ida/Samples/animations sample
  dino.setBody(37);

  // Setting collisions with environment, with other objects, and also CanFall flags - it's usual for an actor
  // In additional also setting Invisible flag, we should not see Dino-Fly yet, he will appear in the end of our scenario.
  dino.setStaticFlags(
    object.Flags.CheckCollisionsWithScene |
      object.Flags.CheckCollisionsWithActors |
      object.Flags.CanFall |
      object.Flags.Invisible
  );
  dino.setLifePoints(255); // To make him alive he should have some HP
  dino.setPos(scene.getWaypoint(SceneProperties.wpNull)); // Putting Dino outside of the scene, he will act later

  // Enabling default Idle animation
  dino.setAnimation(0);

  // We will control both life and move scripts for Dino
  dino.handleLifeScript(handleDinoLife);
  dino.handleMoveScript();

  // === Zones setup ===

  // Making nightstand not return a key, but just a heart - we don't want Twinsen to leave the scene in this script
  const nightstand = scene.getZone(SceneProperties.zoneNightstandId);

  // The first register of the bonus zone stores the bonuses it can give, the second one - amount of the bonus
  nightstand.setRegisters([object.Bonuses.LIFE, 16, 0, 0, 0, 0, 0, 0]);

  // Disabling the exit door zone, so player cannot leave the scene
  const exitDoor = scene.getZone(SceneProperties.zoneExitDoorId);
  const exitDoorRegisters = exitDoor.getRegisters();
  // Disabling the exit door (the enabled/disabled bit is at the register 7 for Teleport zones)
  exitDoorRegisters[7] = 0;
  exitDoor.setRegisters(exitDoorRegisters);

  // Modify the Zoe Portrait text zone to display different text
  // Text zone is a special type of zone, that just automatically displays some text when the player interacts within it
  // In the original LBA2, the text zones can only display static text, defined in the scene file
  // However, here we show you how to also dynamically set the text of a text zone from the JavaScript

  // Get reference to the Zoe portrait text zone
  const zoePortraitZone = scene.getZone(SceneProperties.zoneZoePortraitId);

  // Modify the textId of the zone, which is stored in the Zone Value register
  zoePortraitZone.setZoneValue(
    // You should always create a new text for each text zone. Reusing existing text id, which is used in the life handlers, will not work here, as the zone text entity should not be overwritten later.
    text.create(
      // Using a function instead of just a text value, allows for dynamic text selection each time the text is displayed by the text zone. In this case we randomize the text a bit :)
      () =>
        [
          "Nahhh why am I smiling at Zoé's portrait like this. She's actually everything, I'm gone, it's over for me.",
          "I looked at Zoé's portrait and yeah... that's my girl, no thoughts, just love.",
          "Be serious... Zoé's portrait just activated my heart, my soul, and my entire vibe.",
        ].random()
    )
  );

  // Add Bathroom entrance zone to the scene
  SceneProperties.zoneBathroomEntranceId = scene.addZones();

  // Getting reference to newly added zone
  const bathroomEntranceZone = scene.getZone(SceneProperties.zoneBathroomEntranceId);

  // Setting up the zone to be sceneric
  bathroomEntranceZone.setType(object.ZoneTypes.Sceneric);

  // To check this zone in the script, it needs to have a sceneric value - assigning a new one for it
  SceneProperties.zoneBathroomEntranceValue = scene.findFreeZoneValue(
    object.ZoneTypes.Sceneric,
    SceneProperties.zoneBathroomEntranceId
  );
  bathroomEntranceZone.setZoneValue(SceneProperties.zoneBathroomEntranceValue);

  // Positioning the zone in the corner of the room, where we will have "Bathroom door"
  bathroomEntranceZone.setPos1([14080, 2048, 256]); // Closer to 0 corner of the zone
  // Furthest from 0 corner of the zone, adding width, height, and length
  bathroomEntranceZone.setPos2(bathroomEntranceZone.getPos1().plus([1024, 2048, 512]));

  // Setup Zoe and Twinsen initial positions for when the scene is just started.
  // When game is loaded from a save game, the positions and directions of the actors will be overwritten anyways.

  // Putting Twinsen to the wp0
  // to change the main hero start position we have to use scene.setStartPos.
  // Changing it on the object will not have effect
  scene.setStartPos(scene.getWaypoint(0));

  // Changing Twinsen direction to face Zoe (West)
  twinsen.setAngle(object.directionToAngle(object.West));

  // Putting Zoe 300 points to the West of Twinsen: zoePos = wp0 + WestVector * 300;
  zoe.setPos(scene.getWaypoint(0).plus(object.West.mul(300)));
  // Facing Twinsen
  zoe.setAngle(object.directionToAngle(object.East));

  // === Other setup ===

  // reserving text id for custom dialogs
  SceneProperties.textId = text.create();

  // reserving choices ids for custom dialog choices
  SceneProperties.choices = text.createChoices();

  // Register all our coroutines, by calling the function from coroutines.js module we have created
  registerCoroutines();

  // Init scene variables and start initial coroutines, if this scene started not from a loaded savegame
  // When loading a savegame, we want to keep the loaded state
  if (startMode !== scene.LoadModes.WillLoadSavedState) {
    // Getting access to our scene variables
    const S = useSceneStore();

    // Setting initial story phase
    S.storyPhase = StoryPhases.Kissing;

    // Setting initial Life script behavior for Twinsen
    S.twinsenBehavior = "start";

    // Starting the kissing coroutine on Zoe
    startCoroutine(SceneProperties.zoeId, "kissing");
  }
});

// Life handlers for necessary actors on this scene
function handleTwinsenLife(objectId) {
  const S = useSceneStore();
  runLife(twinsenBehaviors, S.twinsenBehavior, objectId);
}

function handleZoeLife(objectId) {
  const S = useSceneStore();
  runLife(zoeBehaviors, S.zoeBehavior, objectId);
}

function handleDinoLife(objectId) {
  const S = useSceneStore();
  runLife(dinoBehaviors, S.dinoBehavior, objectId);
}

// Helper function to execute the current behavior of an object, or "start" behavior if the current one is null
function runLife(behaviours, currentBehavior, objectId) {
  behaviours[currentBehavior ?? "start"]?.(objectId);
}
