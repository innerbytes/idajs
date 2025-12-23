console.log(`
This is demo of how the storm effect can be switched on and off for your mod.
It also demonstrates how to change the start scene and intro video.

Start a new game to see this sample in action.
`);

const outsideTwinsenHouseSceneId = 49; // Scene id of the outside of Twinsen's house
const voidSceneId = 94; // Scene id of the Void

var meteoMageId;
var textId;
var choices;

// Making new game start outside Twinsen's house
ida.setStartSceneId(outsideTwinsenHouseSceneId);

// Disabling the intro video for this mod
// Otherwise, you can set it also to play the custom intro video - from image.Videos enum
ida.setIntroVideo("");

// Before load scene event allows to perform the changes that will affect scene loading process, like changing weather and palette.
// If we are loading the game from the save file, the loaded Ida game and scene variables are already available to check here.
scene.addEventListener(scene.Events.beforeLoadScene, (sceneId, loadMode) => {
  // Only need to change the storm state if the game is loaded from the save file, or if we teleported here (teleporting after weather changing dialog)
  // If we just moved to this scene, the storm state should just remain the same
  if (
    loadMode !== scene.LoadModes.WillLoadSavedState &&
    loadMode !== scene.LoadModes.PlayerTeleportedHere
  ) {
    return;
  }

  const gameStore = useGameStore();

  if (gameStore.isSunny) {
    // Forcing the sunny weather if our sunny variable is true
    ida.setStorm(ida.StormModes.ForceNoStorm);

    // Disable the ligtning in scripts alltogether
    ida.disableLightning();
  } else {
    // Otherwise forcing the stormy weather
    ida.setStorm(ida.StormModes.ForceStorm);

    // Enable the lightning in scripts
    ida.enableLightning();
  }
});

// After load scene event is where we should do all the custom scenes setup
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, loadMode) => {
  // Outside the house
  if (sceneId == outsideTwinsenHouseSceneId) {
    // Reserving text id and choices for the scripted dialogs
    textId = text.create();
    choices = text.createChoices();

    // Adding a meteo mage - just for demo purposes, we will talk to him to switch the storm on and off
    meteoMageId = scene.addObjects();
    const mage = scene.getObject(meteoMageId);

    mage.setTalkColor(text.Colors.Seafoam);
    mage.setEntity(67); // Meteomage entity (we can look entities, bodies and animation numbers in the LBAArchitect application).
    mage.setBody(0);

    // Setting collisions with environment, with other objects, and also fallable flags - normal for an actor
    mage.setStaticFlags(
      object.Flags.CheckCollisionsWithScene |
        object.Flags.CheckCollisionsWithActors |
        object.Flags.CanFall
    );

    mage.setLifePoints(255); // To make him alive he should have some HP
    mage.setArmor(255); // Make the mage unhittable

    // Positioning the mage to the west from the waypoint 31 (not far from the house)
    // wp31 + [1500, 370, 0]
    mage.setPos(scene.getWaypoint(31).plus(object.East.mul(1500).plus(object.Up.mul(370))));

    // Making the mage to face North
    mage.setAngle(object.directionToAngle(object.North));

    // Enabling default Idle animation
    mage.setAnimation(0);

    // Set Twinsen start position near the mage
    // wp31 + [1000, 370, 1000]
    scene.setStartPos(
      scene
        .getWaypoint(31)
        .plus(object.East.mul(1000).plus(object.Up.mul(370).plus(object.North.mul(1000))))
    );

    // Any object to store trigger states that we don't want to save in the saved game.
    // This is useful for action button presses and similar temporary states.
    // This object should reset on every scene load, so if the function is outside of the scene setup event scope, we can use tempStore object instead (see House Sample).
    const triggerStore = {};

    // Handle Twinsen life script
    const twinsen = scene.getObject(0);
    twinsen.handleLifeScript((objectId) => {
      if (
        // Checking if the action button is pressed
        isTriggeredTrue(triggerStore, "playerAction", ida.lifef(objectId, ida.Life.LF_ACTION) > 0)
      ) {
        // If distance to the Meteo Mage is close, we handle interactions with him
        if (ida.lifef(objectId, ida.Life.LF_DISTANCE, meteoMageId) < 1250) {
          twinsenTalksToMeteoMage(objectId);
        }
      }

      // Allow LBA2 life script to handle the object after us
      return true;
    });
  }
});

function twinsenTalksToMeteoMage(objectId) {
  ida.life(objectId, ida.Life.LM_MESSAGE, text.update(textId, "Hello!"));

  ida.life(objectId, ida.Life.LM_ADD_CHOICE, text.update(choices[0], "I like when it's stormy"));
  ida.life(objectId, ida.Life.LM_ADD_CHOICE, text.update(choices[1], "I prefer sunny weather"));
  ida.life(
    objectId,
    ida.Life.LM_ADD_CHOICE,
    text.update(choices[2], "Water, water, everywhere...")
  );

  ida.life(
    objectId,
    ida.Life.LM_ASK_CHOICE_OBJ,
    meteoMageId,
    text.update(textId, "Hello, Twinsen! Which weather do you prefer?")
  );

  const choice = ida.lifef(objectId, ida.Life.LF_CHOICE);
  const gameStore = useGameStore();

  // If we want stormy weather
  if (choice === choices[0]) {
    // If it's already stormy
    if (!gameStore.isSunny) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE_OBJ,
        meteoMageId,
        text.update(textId, "Ok, it is already stormy.")
      );
    } else {
      gameStore.isSunny = false;
      ida.life(objectId, ida.Life.LM_CHANGE_CUBE, outsideTwinsenHouseSceneId); // We need to reload scene to change the weather (palette changes)
    }
  }
  // If we want sunny weather
  else if (choice === choices[1]) {
    if (gameStore.isSunny) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE_OBJ,
        meteoMageId,
        text.update(textId, "Ok, it is already sunny.")
      );
    } else {
      gameStore.isSunny = true;
      ida.life(objectId, ida.Life.LM_CHANGE_CUBE, outsideTwinsenHouseSceneId); // We need to reload scene to change the weather (palette changes)
    }
  } else {
    // A joke :)
    ida.life(objectId, ida.Life.LM_CHANGE_CUBE, voidSceneId);
  }
}
