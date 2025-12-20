console.log(`
This is the smallest sample, that demonstrates how you can extend behavior of the original game script

Start new game to run the sample.
`);

// *** Handy constants ****

const twinsenId = 0; // The player has always id 0
const zoeId = 4; // Zoe

// ************************

// afterLoadScene event allows to modify the scene objects, zones, and waypoints when the scene is loaded
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, startMode) => {
  // In this mod we handle the main house room only - this is the scene with id 0
  if (sceneId === 0) {
    // Get a reference to Zoe
    const zoe = scene.getObject(zoeId);

    zoe.handleLifeScript(zoeLifeBehavior); // Telling the game engine that Zoe's Life script will be handled by our mod

    // Giving Twinsen some more weapon to try :)
    if (startMode === scene.LoadModes.NewGameStarted) {
      scene.setGameVariable(scene.GameVariables.INV_MECA_PENGUIN, 10);
    }
  }
});

// We will handle the life script of Zoe here
// Life script handler is called repeatedly, every frame, again and again, for each object that is setup to handle it
// Thus, you should not do any heavy or long operations in the life script
function zoeLifeBehavior(objectId) {
  // Checking actorId of who Zoe was last hit by. If no one - will return -1
  const lastHitBy = ida.lifef(objectId, ida.Life.LF_HIT_BY);

  // If it was Twinsen
  if (lastHitBy === twinsenId) {
    // Calling GameOver
    ida.life(objectId, ida.Life.LM_GAME_OVER);

    // If you prefer to remove 1 life from Twinsen instead of game over, you can do it like this:
    // ida.life(objectId, ida.Life.LM_HIT_OBJ, 0, 255);

    // Do not need to handle original Life scripts of Zoe anymore
    return false;
  }

  // Returning true, to let the original game lifescript to execute after us,
  // thus we do not interfere with the original game behavior, only adding our functionality on top
  return true;
}
