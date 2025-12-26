import { SceneLoadMode } from "@idajs/types";
import { twinsenTalksToMeteoMage } from "./life";

// Here is example of how you can import your own types in your mod
import { useMyGameStore } from "./GameStore";

console.log(`This is TypeScript version of the storm demo Sample.
  
Start a new game to see this sample in action.
`);

const outsideTwinsenHouseSceneId = 49; // Scene id of the outside of Twinsen's house

let meteoMageId: number;
let textId: number;
let choices: number[];

// Making new game start outside Twinsen's house
ida.setStartSceneId(outsideTwinsenHouseSceneId);

// Disabling the intro video for this mod
// Otherwise, you can set it also to play the custom intro video - from image.Videos enum
ida.setIntroVideo("");

// Before load scene event allows to perform the changes that will affect scene loading process, like changing weather and palette.
// If we are loading the game from the save file, the loaded Ida game and scene variables are already available to check here.
scene.addEventListener(scene.Events.beforeLoadScene, (sceneId: number, loadMode: SceneLoadMode) => {
  // Only need to change the storm state if the game is loaded from the save file, or if we teleported here (teleporting after weather changing dialog)
  // If we just moved to this scene, the storm state should just remain the same
  if (
    loadMode !== scene.LoadModes.WillLoadSavedState &&
    loadMode !== scene.LoadModes.PlayerTeleportedHere
  ) {
    return;
  }

  const gameStore = useMyGameStore();
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
scene.addEventListener(scene.Events.afterLoadScene, (sceneId: number, loadMode: SceneLoadMode) => {
  // Outside the house
  if (sceneId == outsideTwinsenHouseSceneId) {
    // Reserving text id and choices for the scripted dialogs
    textId = text.create();
    choices = text.createChoices();

    // Adding a meteo mage - just for demo purposes, we will talk to him to switch the storm on and off
    meteoMageId = scene.addObjects();
    const mage = scene.getObject(meteoMageId);

    mage.setTalkColor(text.Colors.Seafoam);
    mage.setEntity(67); // Meteomage entity (we can look entities, bodies and animation numbers in the LBArchitect application).
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
    // This object should reset on each scene load, so if the life script handler is declared outside of this event,
    // we can use tempStore, like in the House or Bathroom samples.
    const triggerStore = {};

    // Handle Twinsen life script
    const twinsen = scene.getObject(0);
    twinsen.handleLifeScript((objectId: number) => {
      if (
        // Checking if the action button is pressed
        isTriggeredTrue(triggerStore, "playerAction", ida.lifef(objectId, ida.Life.LF_ACTION) > 0)
      ) {
        // If distance to the Meteo Mage is close, we handle interactions with him
        if (ida.lifef(objectId, ida.Life.LF_DISTANCE, meteoMageId) < 1250) {
          twinsenTalksToMeteoMage(objectId, textId, choices, meteoMageId);
        }
      }

      // Allow LBA2 life script to handle the object after us
      return true;
    });
  }
});
