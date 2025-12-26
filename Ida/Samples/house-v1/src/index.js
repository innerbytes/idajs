// To use custom images and sprites in the mod (we have a small bonus where we can use them)
ida.useImages();

console.log(`
This is a House V1 Sample, demonstrating implementation of Twinsen House scene scripts in Ida mod engine.
This example mod fully reimplements the original behavior of LBA2 Twisen house scripts in javascript.
In this sample the focus is put on re-implementing the original behavior as close as possible to the original game scripts, without using custom architecture.

Start new game to run the sample.
`);

// *** Handy constants ****

// We can use area name to group game variables
const areaName = "house";

// Objects
// To know which object, zone or waypoint on the scene has which Id use LBArchitect application.
// LBArchitect 1.2: https://moonbase.kaziq.net/index.php?page=d_prog  (for the source code: https://github.com/LBALab/LBArchitect)
// LBArchitect is handy but is limited to indoor scenes only.
// For the outdoor scenes, you can use https://lba2remake.net Editor mode.
// There you can also investigate the scene objects, zones, waypoints and variables
const twinsenId = 0; // The player has always id 0
const nitroMegaPenguinId = 1; // Is present on every scene where it can be used, and has always id 1. We don't need to use this in our mod script.
const cellarDoorId = 2; // An actor for the cellar door
const sendellPortraitId = 3; // An actor for the sendell portrait
const zoeId = 4; // Zoe
const zoeOutId = 5; // An actor for scripts that process zoe outside timings
// (because depdending how long Twinsen stays in the house, Zoe will be in different place outside)

// Zones
const zoneSendellPortraitId = 6; // Zone with sendell portrait. We need its id to check player's direction
const zoneSendellPortraitValue = 0; // The sceneric value of the sendell portrait zone. We need it for the script to check which zone player is in.

const zoneZoeDiaryId = 0; // Zone with Zoe's diary. We need its id to check player's direction
const zoneZoeDiaryValue = 1; // The sceneric value of the Zoe's diary zone. We need it for the script to check which zone player is in.

const zoneCellarDoorId = 2; // Zone with the cellar door. We need its id to check player's direction
const zoneCellarDoorValue = 2; // The sceneric value of the cellar door zone. We need it for the script to check which zone player is in.

const zoneWindowId = 9; // Zone with the window. We need its id to check player's direction
const zoneWindowValue = 4; // The sceneric value of the window zone. We need it for the script to check which zone player is in.

const zoneCameraCentralValue = 1; // The camera zone in the center of the room, used for the cutscene

// LBA game variables
// The LBA game variables store global game state. We need to check and modify them to make our mod scripts work with the rest of the LBA world
// Unfortunately the legacy LBA script contain only numbers for those variables and no names, so we need to guess their
// purpose by reading script in the LBArchitect and/or in https://lba2remake.net Editor mode.
const varZoeLocation = 40; // Responsible to track Zoe's location - first she's in the room, then exiting, then going to DinoFLy outside, and so on
const varDragonIsCured = 42; // Responsible to track if the Dino FLy is cured
const varTwinsenIsWizard = 109; // Responsible to track if Twinsen is already a wizard
const varKidnappedChildrenQuestState = 83; // Within this scene, this variable used to know progression in the kidnapped children quest

// ************************

// We can use it for custom text in the script
let scriptTextId;

// Use this as baking state for non-persistent triggers, for example checking player action key press
let tempStore = null;

// afterLoadScene event allows to modify the scene objects, zones, and waypoints when the scene is loaded
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, startMode) => {
  tempStore = {}; // Resetting temp store on each scene load

  // In this mod we handle the main house room only - this is the scene with id 0
  if (sceneId === 0) {
    setupHouseMainRoom(startMode);

    /*
    // Enable this to quickly test the behavior when Zoe is doing wallpapers
    // After the first cutscene exit house and then reenter it, this will become active
    if (startMode == scene.LoadModes.PlayerMovedHere) {
      scene.setGameVariable(varDragonIsCured, 1);
      scene.setGameVariable(varTwinsenIsWizard, 1); // Check both 0 and 1 here
    }
    */

    /*
    // Enable to test that Zoe is approaching to the car outside.
    // After the first cutscene exit house and then reenter it, this will become active
    // If you stay longer in the house, she will approach closer
    if (startMode == scene.LoadModes.PlayerMovedHere) {
      scene.setGameVariable(varDragonIsCured, 0);
      scene.setGameVariable(varTwinsenIsWizard, 0);
      scene.setGameVariable(varZoeLocation, 15);
    }
    */

    /*
    // Enable this to quickly test the behavior in the chapter 4
    // After the first cutscene exit house and then reenter it, this will become active
    if (startMode == scene.LoadModes.PlayerMovedHere) {
      scene.setGameVariable(varDragonIsCured, 1);
      scene.setGameVariable(varTwinsenIsWizard, 1);
      scene.setGameVariable(scene.GameVariables.VAR_CHAPTER, 4);
      scene.setGameVariable(varKidnappedChildrenQuestState, 7); // Use values 7, 9, 10, 12 to test different possible situations
    }
    */
  }
});

// Handy to see which saved file is loaded
scene.addEventListener(scene.Events.afterLoadSavedState, (sceneId, filePath) => {
  console.log(`Saved state loaded for scene ${sceneId} from file ${filePath}`);
});

// Below there are life script handler functions for the scene actors
// Life script handlers are called repeatedly, every frame, again and again, for each actor object that is setup to handle it
// Thus, you should not do any heavy or long operations in the life script

// House life script handler for Twinsen - we chose the current behavior and execute it
function handleTwinsenLifeScript(objectId) {
  const sceneStore = useSceneStore();

  // Run the current Life behavior for twinsen
  const currentBehavior = houseTwinsenBehaviors[sceneStore.twinsenBehavior ?? "start"];

  currentBehavior?.(objectId);

  // Returning false or no return, means we don't want the LBA2 life script to run at all
  // Returning true would make it to run right after ours for the given object, thus allowing to combine mod script and the original script effects
  return false;
}

// House life script handler for Zoe - we chose the current behavior and execute it
// Apart this, we also run before-all behavior for Zoe
function handleZoeLifeScript(objectId) {
  const sceneStore = useSceneStore();

  // This life behavior will always run before any other
  const shouldContinue = houseBeforeAllZoeBehavior(objectId);
  if (!shouldContinue) return;

  // Run the current Life behavior for Zoe
  const currentBehavior = houseZoeBehaviors[sceneStore.zoeBehavior ?? "start"];
  currentBehavior?.(objectId);
}

// Handle cellar door life script handler - choose the current behavior and execute it
function handleCellarDoorLifeScript(objectId) {
  const sceneStore = useSceneStore();

  // Run the current Life behavior for the cellar door
  const currentBehavior = houseCellarDoorBehaviors[sceneStore.cellarDoorBehavior ?? "start"];
  currentBehavior?.(objectId);
}

// "Outside Zoe" object life script handler - choose the current behavior and execute it
function handleOutsideZoeLifeScript(objectId) {
  const sceneStore = useSceneStore();

  // Run the current Life behavior for outside Zoe
  const currentBehavior = outsideZoeBehaviors[sceneStore.outsideZoeBehavior ?? "start"];
  currentBehavior?.(objectId);
}

function setupHouseMainRoom(startMode) {
  // Setup the main room of Twinsen's house

  // Getting references to the scene objects we need to setup
  const twinsen = scene.getObject(twinsenId);
  const zoe = scene.getObject(zoeId);
  const cellarDoor = scene.getObject(cellarDoorId);
  const zoeOut = scene.getObject(zoeOutId);
  const sendellPortrait = scene.getObject(sendellPortraitId);

  // Providing our mod's life script handler functions for the scene objects, so that we control their behavior
  twinsen.handleLifeScript(handleTwinsenLifeScript);
  zoe.handleLifeScript(handleZoeLifeScript);
  cellarDoor.handleLifeScript(handleCellarDoorLifeScript);
  zoeOut.handleLifeScript(handleOutsideZoeLifeScript);

  // Asking to intercept the move scripts for the scene objects as well, they will be handled by IdaJS coroutines system
  twinsen.handleMoveScript();
  zoe.handleMoveScript();
  cellarDoor.handleMoveScript();
  zoeOut.handleMoveScript();
  sendellPortrait.handleMoveScript();

  // NOTE, that here we don't touch the NitroMecaPingouin object, which is always object with id 1 on every scene, where it can be used. By default this object is disabled, and is enabled only when the player uses this dangerous toy. The NitroMecaPingouin behavior is handled by LBA 2 internal code, and it has no life or move scripts.

  // Creating a text object for custom dialogs in the script (can create as many as we need, but one is usually enough)
  scriptTextId = text.create("");

  // Register coroutines (move scripts)
  registerCoroutine("cutsceneTwinsenMoveToZoe", cutsceneTwinsenMoveToZoe);
  registerCoroutine("cutsceneZoeIsTurningToTwinsen", cutsceneZoeIsTurningToTwinsen);

  registerCoroutine("zoeIsExitingTheHouse", zoeIsExitingTheHouse);
  registerCoroutine("zoeIsKissingTwinsen", zoeIsKissingTwinsen);
  registerCoroutine("zoeIsTurningToTwinsen", zoeIsTurningToTwinsen);
  registerCoroutine("zoeIsStartingDialogInKidsRoom", zoeIsStartingDialogInKidsRoom);
  registerCoroutine("zoeIsEndingDialogInKidsRoom", zoeIsEndingDialogInKidsRoom);

  registerCoroutine("sendellPortraitIsOpening", sendellPortraitIsOpening);
  registerCoroutine("cellarDoorAnimation", cellarDoorAnimation);

  registerCoroutine("zoeIsMovingOutside", zoeIsMovingOutside);

  // Set necessary initial scene variables
  // In case the game is being loaded from a savegame file, the scene variables will be loaded from there too, so we should not re-init them.
  if (startMode !== scene.LoadModes.WillLoadSavedState) {
    // Scene store allows to persist variables for this scene, but they will be reset when this or any other scene is loaded
    const sceneStore = useSceneStore();

    // This is corresponding to VAR_CUBE 1 in the original script
    // If enabled, Zoe should ask when interacted: Twinsen, have you already found the cure for the Dinofly?
    sceneStore.isDragonDialogEnabled = false;
  }
}

// Here we define different Twinsen life behaviours in the house.
// The current life behaviour is called every frame again and again for the corresponding object
const houseTwinsenBehaviors = {
  // Default behavior (when scene starts), corresponds to Comportment main in the original script
  start: (objectId) => {
    // Access to the js persistent game variables store. Those variables will be saved/loaded together with save game
    const gameStore = useGameStore(areaName);
    const sceneStore = useSceneStore();

    // If player just started the game (custscene is not done yet)
    // We will use isStartDialogDone variable to control if the initial cutscene is done
    // When variable doesn't exist yet, it's falsy by default
    if (!gameStore.isCutsceneDone) {
      // Sending a life script command to switching to cutscene mode
      // life command requires to pass the current objectId, the command, and the arguments
      ida.life(objectId, ida.Life.LM_CINEMA_MODE, 1);

      // Activating Camera Zone 1 (It's Zone 11 on the scene, the camera zone number is in the zone value parameter)
      // This will make camera confined to this zone
      ida.life(objectId, ida.Life.LM_SET_CAMERA, zoneCameraCentralValue, 1);

      // Set Twinsen's angle to point West (270 degrees, angles in LBA are measured from 0 (0 deg) to 4096 (360 deg))
      ida.life(objectId, ida.Life.LM_BETA, object.directionToAngle(object.ZoneDirections.West));

      // Positioning Twinsen on the waypoint 2
      ida.life(objectId, ida.Life.LM_POS_POINT, 2);

      // Set camera to follow Twinsen
      ida.life(objectId, ida.Life.LM_CAM_FOLLOW, objectId);

      // Set twinsen to not be controlled by the player
      ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.NoMovement);

      // Starting coroutine to move Twinsen to Zoe
      startCoroutine(objectId, "cutsceneTwinsenMoveToZoe");

      // Change the Twinsen behavior to waiting for cutscene to stop
      sceneStore.twinsenBehavior = "checkCutSceneStop";
    } else {
      // Cutscene is done, and we are at the start behavior: means player just reentered this scene

      // Increasing Zoe location, while she's outside, so she doesn't play near-the-door dialog again if we exit
      if (scene.getGameVariable(varZoeLocation) === 3) {
        scene.setGameVariable(varZoeLocation, 4);
      }

      sceneStore.twinsenBehavior = "playerControlled";
    }
  },
  // Waiting for cutscene to stop, corresponds to Twinsen Comportment 3 in the original script
  checkCutSceneStop: (objectId) => {
    const gameStore = useGameStore(areaName);
    if (gameStore.isCutsceneDone) {
      // Letting player to control Twinsen again
      ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.PlayerControl);

      // Setting Twinsen stance to normal
      ida.life(objectId, ida.Life.LM_COMPORTEMENT_HERO, object.TwinsenStances.Normal);

      // Setting Twinsen behavior to playerControlled
      const sceneStore = useSceneStore();
      sceneStore.twinsenBehavior = "playerControlled";

      // Freeing the camera out of bounded zone
      ida.life(objectId, ida.Life.LM_SET_CAMERA, 1, 0);

      // Turning the cinema mode off
      ida.life(objectId, ida.Life.LM_CINEMA_MODE, 0);
    }
  },
  // Behavior when Twinsen is controlled by the player, corresponds to Twinsen Comportment 1 in the original script
  playerControlled: (objectId) => {
    // Checking if action key is pressed by player
    if (
      // When we check the action is triggered it is enough to use tempStore object for the backing state as we don't need to persist the previous state of the action button in the save game
      isTriggeredTrue(tempStore, "playerAction", ida.lifef(objectId, ida.Life.LF_ACTION) > 0)
    ) {
      // If distance to Zoe is close, we handle interactions with Zoe
      if (ida.lifef(objectId, ida.Life.LF_DISTANCE, zoeId) < 1250) {
        twinsenHandleInteractionsWithZoe(objectId);
      }
      // Else we will check interactions with the sceneric zones
      else {
        twinsenHandleInteractionsWithHouseZones(objectId);
      }
    }

    // Checking once, if the Sendell portrait has finished opening - to automatically read the text
    const sceneStore = useSceneStore();
    if (oneIfTrue(sceneStore, "isSendellPortraitOpened")) {
      readTextBehindSendellPortrait(objectId);
    }
  },
};

// Here we define Zoe life behaviors in the house
const houseZoeBehaviors = {
  // Default behavior (when scene starts)
  start: (objectId) => {
    const sceneStore = useSceneStore();

    // If we entered the house in the Chapter 4 of the game
    if (scene.getGameVariable(scene.GameVariables.VAR_CHAPTER) === 4) {
      // Put Zoe to the middle of the room
      ida.life(objectId, ida.Life.LM_POS_POINT, 3);

      // Face Zoe to the South
      ida.life(objectId, ida.Life.LM_BETA, object.directionToAngle(object.ZoneDirections.South));

      if (
        scene.getGameVariable(varKidnappedChildrenQuestState) > 11 ||
        scene.getGameVariable(varKidnappedChildrenQuestState) === 7
      ) {
        // In the cases where Twinsen just arrived back from Zeelich first time or later in the quest Zoe is initiating the dialog herself
        sceneStore.zoeBehavior = "chapter4InitiateDialog";
      } else {
        // End the life script execution for Zoe, but Twinsen life script might still initiate the dialog
        sceneStore.zoeBehavior = "";
      }
    } else {
      const gameStore = useGameStore(areaName);

      if (!gameStore.isCutsceneDone) {
        // In the beginning of the cutscene, Zoe should start turn to face Twinsen
        startCoroutine(objectId, "cutsceneZoeIsTurningToTwinsen");

        // Change Zoe's behavior to waiting for Twinsen to approach
        sceneStore.zoeBehavior = "waitTwinsenApproached";
      } else {
        // If we are here, means the player re-entered the house scene. Need to check where Zoe should be

        // If Zoe is still exiting
        if (scene.getGameVariable(varZoeLocation) === 1) {
          // Enabling the dialog about DinoFly (var_cube 1 in the old script)
          sceneStore.isDragonDialogEnabled = true;

          // Positioning Zoe to waypoint 4
          ida.life(objectId, ida.Life.LM_POS_POINT, 4);

          // Turning Zoe towards South (exit)
          ida.life(
            objectId,
            ida.Life.LM_BETA,
            object.directionToAngle(object.ZoneDirections.South)
          );

          // Start walking animation
          ida.life(objectId, ida.Life.LM_ANIM, 1);

          // Starting the walking out coroutine from walking towards waypoint 5
          startCoroutine(objectId, "zoeIsExitingTheHouse", 5);

          // Set Zoe's behavior to exitTheHouse
          sceneStore.zoeBehavior = "exitTheHouse";
        } else if (scene.getGameVariable(varDragonIsCured) > 0) {
          // If we re-entered when the Dino Fly is already cured - Zoe should be in the house again
          // She will stay in the kid room, sticking the wallpaper

          // Turning West
          ida.life(objectId, ida.Life.LM_BETA, object.directionToAngle(object.ZoneDirections.West));

          // Positioning on the waypoint 7 (children room)
          ida.life(objectId, ida.Life.LM_POS_POINT, 7);

          // Start wallpapers animation (90)
          ida.life(objectId, ida.Life.LM_ANIM, 90);

          // Set Zoe life behavior
          sceneStore.zoeBehavior = "doWallpapers";
        } else {
          // If we rentered when Zoe has already exited, disabling her object
          ida.life(objectId, ida.Life.LM_SUICIDE);
        }
      }
    }
  },
  // In the initial cutscene, waiting Twinsen approached - corresponds to Zoe Comportment 1 in the original script
  waitTwinsenApproached: (objectId) => {
    // Waiting until both current Zoe and Twinsen coroutines finish
    if (!isCoroutineRunning(twinsenId) && !isCoroutineRunning(zoeId)) {
      // Showing message 0 - Twinsen, run to the pharmacy...
      ida.life(objectId, ida.Life.LM_MESSAGE, 0);

      // Setting a marker to the holomap
      ida.life(objectId, ida.Life.LM_SET_HOLO_POS, 22);

      // Advanicing the LBA Zoe state (game var 40) to 1 (means for the game she's started exiting the house)
      scene.setGameVariable(varZoeLocation, 1);

      // Enables Zoe to talk about cure for DinoFLy if interacted
      // In the old script it's VAR_CUBE_1 = 1
      const sceneStore = useSceneStore();
      sceneStore.isDragonDialogEnabled = true;

      // Starting coroutine for Zoe to exit the house
      startCoroutine(objectId, "zoeIsExitingTheHouse");

      // Switching Zoe's behavior
      sceneStore.zoeBehavior = "exitTheHouse";

      // Setting cutscene is over
      const gameStore = useGameStore(areaName);

      gameStore.isCutsceneDone = true;
    }
  },
  // Zoe is walking out of the house, corresponds to Zoe Comportment 2 in the original script
  exitTheHouse: (objectId) => {
    const sceneStore = useSceneStore();

    // Is triggered will only return true when the variable state is changed from false to true
    // This is analog of SWIF in the original code
    if (isTriggeredTrue(sceneStore, "isZoeWalkingOut")) {
      // Even though the camera is already following Twinsen, this forces the camera to center him once again
      // Since he's already almost centered at this point, it creates unbeautiful "jumpy" effect, so you can as well remove it
      // Left it here for the demo purpose, since it's present in the original script, but commented out
      // ida.life(objectId, ida.Life.LM_CAM_FOLLOW, 0);
    }

    // Checking when Zoe is in the Sceneric Zone 3 - exit zone
    if (ida.lifef(objectId, ida.Life.LF_ZONE) === 3) {
      // Setting the zoe game state (game var 40) to be outside, near the entrance
      scene.setGameVariable(varZoeLocation, 2);

      // Disabling Zoe object, so she disappears from the scene
      ida.life(objectId, ida.Life.LM_SUICIDE);
    }

    // If collision with Twinsen happened, then we need to start kissing him :)
    // We are checking both ways collision - Zoe with Twinsen and Twinsen with Zoe
    if (
      ida.lifef(objectId, ida.Life.LF_COL) === twinsenId ||
      ida.lifef(objectId, ida.Life.LF_COL_OBJ, twinsenId) === objectId
    ) {
      // Pause the current coroutine on Zoe
      pauseCoroutine(objectId, "zoeIsExitingTheHouse");

      // Setting the movement mode to follow Twinsen
      ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.FollowActor, twinsenId);

      // Starting the kissing coroutine
      startCoroutine(objectId, "zoeIsKissingTwinsen");

      // Switching life script behavior to kissing
      sceneStore.zoeBehavior = "kissTwinsen";
    }
  },
  // Zoe is kissing Twinsen, this corresponds to Zoe Comportment 3 in the original script
  kissTwinsen: (objectId) => {
    // If the kiss has ended or if the distance from Twinsen is already too far
    if (
      ida.lifef(objectId, ida.Life.LF_DISTANCE, twinsenId) > 1600 ||
      !isCoroutineRunning(objectId, "zoeIsKissingTwinsen")
    ) {
      // Set Zoe control mode back to NoMovement
      ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.NoMovement);

      // Resume walking animation
      ida.life(objectId, ida.Life.LM_ANIM, 1);

      // Unpause the exiting coroutine
      // Unpausing a coroutine will automatically stop the currently running coroutine, but
      // to prevent a warning message, we can stop it explicitly.
      stopCoroutine(objectId);
      unpauseCoroutine(objectId, "zoeIsExitingTheHouse");

      // Set the behavior back to exiting the house
      const sceneStore = useSceneStore();
      sceneStore.zoeBehavior = "exitTheHouse";
    }
  },

  // This is the behavior when Zoe is talking about cure for DinoFly
  // It's Zoe Comportment 5 in the original Zoe life script
  dialogAboutDragon: (objectId) => {
    // If Zoe is still turning for the Dialog, skipping
    if (isCoroutineRunning(objectId, "zoeIsTurningToTwinsen")) {
      return;
    }

    // MESSAGE 916 - Twinsen have you found a cure for the DinoFly?
    ida.life(objectId, ida.Life.LM_MESSAGE, 916);

    // Twinsen replies with 303 - No, not yet
    ida.life(objectId, ida.Life.LM_MESSAGE_OBJ, twinsenId, 303);

    // Set a marker on the holo map
    ida.life(objectId, ida.Life.LM_SET_HOLO_POS, 22);

    // Setting Zoe control mode to none, in case it was kissing animation where she followed Twinsen
    ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.NoMovement);

    // Start walking animation again
    ida.life(objectId, ida.Life.LM_ANIM, 1);

    // Unpausing exiting the house coroutine
    unpauseCoroutine(zoeId, "zoeIsExitingTheHouse");

    // Set Zoe life behavior back to exitTheHouse
    const sceneStore = useSceneStore();
    sceneStore.zoeBehavior = "exitTheHouse";
  },
  // Zoe is doing wallpapers. This is Zoe Comportment 8 in the original script
  doWallpapers: (objectId) => {
    // If Twinsen approached
    if (ida.lifef(objectId, ida.Life.LF_DISTANCE, twinsenId) < 1400) {
      // Set movement mode to follow Twinsen
      ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.FollowActor, twinsenId);

      // Start coroutine to switch to idle animation and wait 1 second so Zoe is turning to face Twinsen
      startCoroutine(objectId, "zoeIsStartingDialogInKidsRoom");

      // Switch Zoe behavior to dialog about Esmers or Twinsen Wizard
      const sceneStore = useSceneStore();
      sceneStore.zoeBehavior = "dialogInKidsRoom";
    }
  },
  // Twinsen and Zoe are talking about aliens or about twinsen has become a wizard. This matches to Zoe Comportment 9 in the original script
  dialogInKidsRoom: (objectId) => {
    const sceneStore = useSceneStore();

    // If Twinsen has left
    if (ida.lifef(objectId, ida.Life.LF_DISTANCE, twinsenId) > 1500) {
      // Set Zoe control back to none
      ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.NoMovement);

      // Start coroutine to turn to the wall and resume wallpapering
      startCoroutine(objectId, "zoeIsEndingDialogInKidsRoom");

      // Switching life behavior back to wallpapering
      sceneStore.zoeBehavior = "doWallpapers";
    } else {
      // If the turning coroutine still running - do nothing
      if (isCoroutineRunning(zoeId)) {
        return;
      }

      // If Twinsen didn't activate the dialog in the kids room yet, do nothing
      if (!sceneStore.isDialogInKidsRoomActive) {
        return;
      }

      // If Twinsen is already a Wizard
      if (scene.getGameVariable(varTwinsenIsWizard) === 1) {
        ida.life(objectId, ida.Life.LM_MESSAGE, 450); // Twinsen, you have became the wizard!

        // ****** This is a bonus :) Not present in the original script ******//
        // In the original script Twinsen doesn't respond anything here. Let's make it better.
        // This also demonstrates how we do the custom dialog
        ida.life(
          objectId,
          ida.Life.LM_MESSAGE_OBJ,
          twinsenId,
          text.update(scriptTextId, "Yes, my love! Now I have become a wizard myself!")
        );

        ida.life(
          objectId,
          ida.Life.LM_MESSAGE,

          // Using user dialog sprite here.
          // Put your dialog sprite image into media/sprites folder under the mod. Only .png are supported.
          // The dialog must have a radio flag for sprite to show
          text.update(scriptTextId, {
            text: "Oh, Twinsen, I love you so much!",
            flags: text.Flags.DialogRadio,
            sprite: "hearts.png",
          })
        );
        startCoroutine(objectId, "zoeIsKissingTwinsen");
        // ****** End bonus **************************************************//
      } else {
        ida.life(objectId, ida.Life.LM_MESSAGE, 705); // I'm worried about those Esmers
        ida.life(objectId, ida.Life.LM_MESSAGE_OBJ, twinsenId, 385); // Twinsen: yup, they are weird.
      }

      // Deactivating the dialog in the kids room
      sceneStore.isDialogInKidsRoomActive = false;
    }
  },
  // Zoe is staying worried in the middle of the room in Chapter 4. This corresponds to Zoe Comportment 6 in the original script
  chapter4InitiateDialog: (objectId) => {
    if (ida.lifef(objectId, ida.Life.LF_DISTANCE, twinsenId) < 1500) {
      // Saving current Twinsen stance to a hidden variable
      ida.life(objectId, ida.Life.LM_SAVE_HERO);

      // Setting Twinsen stance to normal
      ida.life(objectId, ida.Life.LM_COMPORTEMENT_HERO, object.TwinsenStances.Normal);

      // Playing idle animation on Twinsen
      ida.life(objectId, ida.Life.LM_ANIM_OBJ, twinsenId, 0);

      // Setting Twinsen movement control mode, to follow Zoe
      ida.life(
        objectId,
        ida.Life.LM_SET_CONTROL_OBJ,
        twinsenId,
        object.ControlModes.FollowActor,
        zoeId
      );

      // Start coroutine to turn to Twinsen
      startCoroutine(objectId, "zoeIsTurningToTwinsen");

      // Switch Zoe behavior to dialog with Twinsen
      const sceneStore = useSceneStore();
      sceneStore.zoeBehavior = "chapter4Dialog";
    }
  },

  // Dialogs of Zoe and Twinsen in Chapter 4 - this corresponds to Zoe Comportment 7 in the original script
  chapter4Dialog: (objectId) => {
    const sceneStore = useSceneStore();

    // Trigger when Zoe has finished turning to Twinsen
    // This is another way to make sure dialog happens single time, rather than introducing a variable
    if (
      isTriggeredFalse(
        sceneStore,
        "zoeIsStillTurning",
        isCoroutineRunning(objectId, "zoeIsTurningToTwinsen")
      )
    ) {
      const childrenQuestState = scene.getGameVariable(varKidnappedChildrenQuestState);
      if (childrenQuestState === 7) {
        // Long dialog with Zoe about Esmers kidnapped the kids and what Twinsen should do now

        // Center camera
        ida.life(objectId, ida.Life.LM_CAMERA_CENTER, 0);
        ida.life(objectId, ida.Life.LM_MESSAGE, 551);

        // Removing marker 0 from the holo map
        ida.life(objectId, ida.Life.LM_CLR_HOLO_POS, 0);
        ida.life(objectId, ida.Life.LM_MESSAGE_OBJ, twinsenId, 525);
        ida.life(objectId, ida.Life.LM_MESSAGE, 552);

        // Activating marker 5 on the holo map
        ida.life(objectId, ida.Life.LM_SET_HOLO_POS, 5);
        ida.life(objectId, ida.Life.LM_MESSAGE_OBJ, twinsenId, 526);
        ida.life(objectId, ida.Life.LM_MESSAGE, 553);

        // Activating marker 28 on the holo map
        ida.life(objectId, ida.Life.LM_SET_HOLO_POS, 28);
        // Updating the quest state
        scene.setGameVariable(varKidnappedChildrenQuestState, 8);

        // Restoring Twinsen stance
        ida.life(objectId, ida.Life.LM_RESTORE_HERO);

        // Set Twinsen back to player control
        ida.life(
          objectId,
          ida.Life.LM_SET_CONTROL_OBJ,
          twinsenId,
          object.ControlModes.PlayerControl
        );
      } else if (childrenQuestState >= 12) {
        ida.life(objectId, ida.Life.LM_MESSAGE, 557);
        ida.life(objectId, ida.Life.LM_MESSAGE_OBJ, twinsenId, 539);

        // Restoring Twinsen stance
        ida.life(objectId, ida.Life.LM_RESTORE_HERO);

        // Set Twinsen back to player control
        ida.life(
          objectId,
          ida.Life.LM_SET_CONTROL_OBJ,
          twinsenId,
          object.ControlModes.PlayerControl
        );
      } else {
        ida.life(objectId, ida.Life.LM_MESSAGE, 555);
        ida.life(
          objectId,
          ida.Life.LM_MESSAGE_OBJ,
          twinsenId,
          childrenQuestState >= 10 ? 541 : 539
        );
        // No need to set Twinsen back to player control here as he initiated the dialog in this case
      }
    }
  },
};

// The behaviors on the actor 5 ("zoeOut") control the timer to simulate Zoe walking outside
const outsideZoeBehaviors = {
  // Main behavior (corresponds to Comportment main in the original script)
  // The comportment 1 from the original script is not needed, since we do it in the coroutine
  start: (objectId) => {
    let zoeLocation = scene.getGameVariable(varZoeLocation);

    // 2-13 -> moving to the Dino Fly case
    // 15-20 -> moving to the car to repair case
    if ((zoeLocation > 1 && zoeLocation < 13) || (zoeLocation > 14 && zoeLocation < 20)) {
      // Increasing to 1 because we spent time reentering the house
      scene.setGameVariable(varZoeLocation, ++zoeLocation);

      // Start the coroutine for Zoe walking outside
      // This coroutine is just a timer, that will increase zoeLocation every 2 seconds
      // Thus, while we are waiting in the room, it will create an effect of Zoe is walking outside,
      // so when we exit, she will be in different position, depending on how long we waited.
      startCoroutine(
        objectId,
        "zoeIsMovingOutside",
        zoeLocation,
        zoeLocation > 14 ? 20 : 14 // The last position is 20 when going to the car and 14 when going to the Dino
      );

      // Set this object life behavior to none
      const sceneStore = useSceneStore();
      sceneStore.outsideZoeBehavior = "";
    } else {
      // Disabling the outside Zoe object completely as it's not needed in this case
      ida.life(objectId, ida.Life.LM_SUICIDE);
    }
  },
};

// The life behaviors of the door to the cellar - the door can open and close, also needs a key
const houseCellarDoorBehaviors = {
  // Default behavior - when the scene is started
  start: (objectId) => {
    const sceneStore = useSceneStore();
    // If the player started in the door zone, means he just exited the cellar room
    if (ida.lifef(objectId, ida.Life.LF_ZONE_OBJ, twinsenId) === zoneCellarDoorValue) {
      // Set the door into open state (shifting 1024 points to the South)
      ida.life(objectId, ida.Life.LM_SET_DOOR_SOUTH, 1024);

      // Start behavior that will automatically close the door
      sceneStore.cellarDoorBehavior = "opened";
    } else {
      // Door remains in closed state, set behavior that will control the key and will open the door
      sceneStore.cellarDoorBehavior = "closed";
    }
  },
  // Behavior of the door in the opened state - corresponds to the Door Comportment 1 in the original script
  opened: (objectId) => {
    // If the player is already far away from the door
    if (
      ida.lifef(objectId, ida.Life.LF_ZONE_OBJ, twinsenId) !== zoneCellarDoorValue &&
      ida.lifef(objectId, ida.Life.LF_DISTANCE, twinsenId) > 1200
    ) {
      // Start door closing animation
      startCoroutine(objectId, "cellarDoorAnimation", false);

      // Switching the door life behavior to closed
      const sceneStore = useSceneStore();
      sceneStore.cellarDoorBehavior = "closed";
    }
  },
  // Behavior of the door in the closed state - corresponds to the Door Comportment 2 in the original script
  closed: (objectId) => {
    // If the player is in the cellar door zone and has at least one key
    if (
      scene.getNumKeys() > 0 &&
      ida.lifef(objectId, ida.Life.LF_ZONE_OBJ, twinsenId) === zoneCellarDoorValue
    ) {
      // Removing 1 key
      ida.life(objectId, ida.Life.LM_USE_ONE_LITTLE_KEY);

      // Setting the door to play the open animation
      startCoroutine(objectId, "cellarDoorAnimation", true);

      // Setting the door behavior to empty, to not trigger any other behavior for it anymore until the scene is reloaded
      const sceneStore = useSceneStore();
      sceneStore.cellarDoorBehavior = "";
    }
  },
};

function houseBeforeAllZoeBehavior(objectId) {
  // ****** A little bonus :) Not present in the original script ******//

  // If the player hits Zoe - there should be consequences!
  // This is not present in the original script

  // Checking actorId of who Zoe was last hit by. If no one - will return -1
  const lastHitBy = ida.lifef(objectId, ida.Life.LF_HIT_BY);

  // If it was Twinsen
  if (lastHitBy === twinsenId) {
    // Calling GameOver
    ida.life(objectId, ida.Life.LM_GAME_OVER);

    // If you prefer to remove 1 life from Twinsen instead of game over, you can do it like this:
    // ida.life(objectId, ida.Life.LM_HIT_OBJ, 0, 255);
    return false;
  }

  // ****** End bonus **************************************************//

  return true;
}

// When Twinsen is controlled by player, we will handle the interactions with Zoe here
function twinsenHandleInteractionsWithZoe(objectId) {
  const sceneStore = useSceneStore();

  if (scene.getGameVariable(varKidnappedChildrenQuestState) > 7) {
    // Initiate dialogs about kidnapped children in the chapter 4

    if (scene.getGameVariable(varKidnappedChildrenQuestState) >= 12) {
      ida.life(objectId, ida.Life.LM_SAVE_HERO); // Saving Twinsen's current stance
    }

    // Turning Zoe to Twinsen
    startCoroutine(zoeId, "zoeIsTurningToTwinsen");

    // Switching her behavior to the dialog
    sceneStore.zoeBehavior = "chapter4Dialog";
  } else if (scene.getGameVariable(varDragonIsCured) < 1) {
    // If the DinoFly is not yet cured

    // If Zoe is already turning to Twinsen, we should not start new interaction
    if (!sceneStore.isDragonDialogEnabled || isCoroutineRunning(zoeId, "zoeIsTurningToTwinsen")) {
      // If Zoe is not ready to talk yet, or if she is already turning to Twinsen, we should skip the interaction
      return;
    }

    // Here in the original script Zoe's comportment is set to 4, but we can just do all its actions here
    if (isCoroutineRunning(zoeId, "zoeIsExitingTheHouse")) {
      // If Zoe is exiting, then pause her coroutine
      pauseCoroutine(zoeId, "zoeIsExitingTheHouse");
    }

    // Now Zoe should start turning to Twinsen for the dialog
    startCoroutine(zoeId, "zoeIsTurningToTwinsen");

    // Change Zoe's life behavior to the Dragon dialog
    sceneStore.zoeBehavior = "dialogAboutDragon";
  } else if (!sceneStore.isDialogInKidsRoomActive) {
    // In the original script it's var_cube 3, here we use isDialogInKidsRoomActive scene variable instead
    // Initiating the dialog with Zoe

    // Twinsen is saying "Hello" in 2 different ways
    ida.life(objectId, ida.Life.LM_MESSAGE, [100, 101].random()); // Sometimes "Salut", sometimes "Bonjour"

    // Starting the coroutine on Zoe so she goes into idle animation and waits 1 second for a dramatic pause
    startCoroutine(zoeId, "zoeIsStartingDialogInKidsRoom");

    // Setting the dialog state as active, so Twinsen doesn't repeat it again while it's happening
    sceneStore.isDialogInKidsRoomActive = true;
  }
}

// When Twinsen is controlled by player, we will handle the interactions with house sceneric zones here
function twinsenHandleInteractionsWithHouseZones(objectId) {
  const twinsen = scene.getObject(objectId);
  // Getting the sceneric zone the player is in now
  const currentZoneValue = ida.lifef(objectId, ida.Life.LF_ZONE);

  switch (currentZoneValue) {
    // Sendell portrait
    case zoneSendellPortraitValue:
      // The Sendel portrait look directoon is North, checking the player look direction is matching it
      // This gives player a pieslice of angle to look within, and depending on how wide the zone is, he might be
      // still looking at the zone needed direction.
      if (twinsen.isFacingZoneDirection(zoneSendellPortraitId, object.ZoneDirections.North)) {
        const sceneStore = useSceneStore();
        if (sceneStore.isSendellPortraitOpened) {
          readTextBehindSendellPortrait(objectId);
        } else {
          // Need to start opening of the portrait
          startCoroutine(sendellPortraitId, "sendellPortraitIsOpening");
        }
      }

      break;
    case zoneZoeDiaryValue:
      // Checking if Twinsen is facing Zoe's diary
      if (twinsen.isFacingZoneDirection(zoneZoeDiaryId, object.ZoneDirections.West)) {
        ida.life(objectId, ida.Life.LM_MESSAGE_ZOE, 4); // Showing Zoe's diary text with her text color
      }
      break;
    case zoneCellarDoorValue:
      const sceneStore = useSceneStore();

      // If the door is in the closed state and we have no keys
      // Also we are checking Twinsen are facing the door to have this dialog.
      // The original game script doesn't check it, so it will appear even if Twinsen stays back to the door
      if (
        scene.getNumKeys() === 0 &&
        sceneStore.cellarDoorBehavior === "closed" &&
        twinsen.isFacingZoneDirection(zoneCellarDoorId, object.ZoneDirections.West)
      ) {
        ida.life(objectId, ida.Life.LM_MESSAGE, 110); // Showing the message about locked door
      }

      break;
    case zoneWindowValue:
      // We don't need to show this message, if the Dino Fly is already cured,
      if (scene.getGameVariable(varDragonIsCured) > 0) {
        return;
      }

      // If facing the Window
      if (twinsen.isFacingZoneDirection(zoneWindowId, object.ZoneDirections.North)) {
        ida.life(objectId, ida.Life.LM_MESSAGE, 530); // Showing text "I cannot see my Dino Fly"
      }

      break;
  }
}

// The function to read the text behind the Sendell portrait. Used in 2 places, thus extracted into a function
function readTextBehindSendellPortrait(objectId) {
  // If the portrait is already opened, we can show a text
  ida.life(objectId, ida.Life.LM_MESSAGE, 29); // To my future descendants...

  // Checking inventory - if the player doesn't have Tunic yet
  // The original game inventory items are checked through the LBA game variables
  // The variable value means its count in the inventory
  if (scene.getGameVariable(scene.GameVariables.INV_TUNIC) === 0) {
    ida.life(objectId, ida.Life.LM_SET_HOLO_POS, 15); // Set the museum marker on the holomap
  }
}

// House scene coroutines
// Coroutines are modern replacement for the LBA move scripts
// They are designed to control the sequence of object actions
// Every coroutine runs its commands one by one until finished
// Coroutines current step is saved with the save game and restored when the game is loaded
// Coroutines can be paused and resumed

// This corresponds to Label 1 in the original Twinsen move script
function* cutsceneTwinsenMoveToZoe() {
  // Start walking animation
  yield doMove(ida.Move.TM_ANIM, 1);

  // Go to waypoint 0
  yield doMove(ida.Move.TM_GOTO_POINT, 0);

  // Player idle animation
  yield doMove(ida.Move.TM_ANIM, 0);

  // Facing 180 deg (North)
  yield doMove(ida.Move.TM_ANGLE, object.directionToAngle(object.ZoneDirections.North));
}

// This corresponds to Label 0 in the original Zoe move script
function* cutsceneZoeIsTurningToTwinsen() {
  // There was anim 91 here in the original script, but it apparently is not doing anything
  // yield doMove(ida.Move.TM_ANIM, 91);

  // Wait 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1, 0);

  // Play idle animation
  yield doMove(ida.Move.TM_ANIM, 0);

  // Facing Twinsen
  yield doMove(ida.Move.TM_FACE_TWINSEN, -1);
}

// If Twinsen reenters the house while Zoe is still walking out, we start her walking from wp5,
// hence we need initialWaypoint argument
// This corresponds to Label 101 in the original Zoe move script
function* zoeIsExitingTheHouse(initialWaypoint = 0) {
  // If it's walking out from the very beginning
  if (initialWaypoint === 0) {
    // Play idle animation
    yield doMove(ida.Move.TM_ANIM, 0);

    // Set angle 0 (South)
    yield doMove(ida.Move.TM_ANGLE, 0);

    // Start walking
    yield doMove(ida.Move.TM_ANIM, 1);

    // Set the Zoe started walking out variable to true, this will tell the life script to re-center the camera on Twinsen (we left it here, as it's present in the original script)
    yield doSceneStore((store) => (store.isZoeWalkingOut = true));
  }

  // Following the waypoints initialWaypoint..6
  for (let i = initialWaypoint; i < 7; i++) {
    yield doMove(ida.Move.TM_GOTO_POINT, i);
  }
}

// This corresponds to Label 10 in the original Zoe move script
function* zoeIsKissingTwinsen() {
  yield doMove(ida.Move.TM_ANIM, 84); // 84 is the kissing animation
  yield doMove(ida.Move.TM_WAIT_ANIM); // Wait for the animation to finish
}

// Labels 11 and 200 in the original Zoe Move script
function* zoeIsTurningToTwinsen() {
  // Playing Idle animation (stop walking)
  yield doMove(ida.Move.TM_ANIM, 0);

  // Turning to face Twinsen
  yield doMove(ida.Move.TM_FACE_TWINSEN, -1);
}

// This corresponds to Label 52 of the original Zoe move script
function* zoeIsStartingDialogInKidsRoom() {
  // Start idle animation
  yield doMove(ida.Move.TM_ANIM, 0);

  // Wait 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);
}

// This corresponds to Label 50 of the original Zoe move script
function* zoeIsEndingDialogInKidsRoom() {
  // Back to wallpapers animation
  yield doMove(ida.Move.TM_ANIM, 90);

  // Turning back to the West
  yield doMove(ida.Move.TM_ANGLE, object.directionToAngle(object.ZoneDirections.West));
}

// This corresponds to the Sendel portrait original move script
function* sendellPortraitIsOpening() {
  // Play sound sample of the portrait opening
  yield doMove(ida.Move.TM_SAMPLE, 386);

  // Disabling the background flag on the portrait object, so it can change
  yield doMove(ida.Move.TM_BACKGROUND, 0);

  // Setting the sprite to 102 - the text
  yield doMove(ida.Move.TM_SPRITE, 102);

  // Waiting 0.4 second
  yield doMove(ida.Move.TM_WAIT_NB_DIZIEME, 4);

  // Putting the object back to the background mode
  yield doMove(ida.Move.TM_BACKGROUND, 1);

  // Setting the sendel portrait opened scene variable
  yield doSceneStore((store) => (store.isSendellPortraitOpened = true));
}

// Cellar door open/close coroutine
// Here is also a demonstration how you can use arguments in coroutines
// This corresponds to Label 0 and Label 1 in the Cellar Door original move script
function* cellarDoorAnimation(isOpening) {
  // Play door sliding audio
  yield doMove(ida.Move.TM_SAMPLE, 349);

  if (isOpening) {
    // Playing slide south animation if it's opening
    yield doMove(ida.Move.TM_OPEN_SOUTH, 1024);
  } else {
    // Playing restore to the original position animation if it's closing
    yield doMove(ida.Move.TM_CLOSE);
  }

  // Wait for the door animation to finish
  yield doMove(ida.Move.TM_WAIT_DOOR);
}

// Starting from startLocation setting varZoeLocation to startLocation, startLocation+1, and so on up to endLocation every 2 seconds
// This will determine Zoe's position towards the Dino Fly or towards the car, used by the scripts of the outside scene
// So, the more we are waiting in house, the closer Zoe will appear to the target (Dino or car) when we exit
// This corresponds to actor 5 original move script
function* zoeIsMovingOutside(startLocation, endLocation) {
  for (let i = startLocation; i < endLocation + 1; i++) {
    // In move script coroutine, we have to wrap our actions in doAction if we change outside world in general
    // To change the game store or scene store there are particular facilitators: doSceneStore and doGameStore

    yield doAction(() => scene.setGameVariable(varZoeLocation, i));

    if (i < endLocation) {
      yield doMove(ida.Move.TM_WAIT_NB_SECOND, 2);
    }
  }
}
