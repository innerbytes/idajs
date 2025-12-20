const { SceneProperties } = require("./props");

// === Behaviors for Dino ===
module.exports = {
  // Dino has only the behavior when he's looking aroind in the end
  lookingAround: (objectId) => {
    const S = useSceneStore();

    // If no Dino phase is set and the Dino turning coroutine is started yet, it means we just started the Dino behavior.
    // We need to do some initial setup
    if (!S.dinoPhase && !isCoroutineRunning(objectId, "dinoTurningAround")) {
      // Switching to the Cinema mode
      ida.life(objectId, ida.Life.LM_CINEMA_MODE, 1);

      // Positioning Dino on the wp3 (in the middle of the house room)
      ida.life(objectId, ida.Life.LM_POS_POINT, 3);

      // Making Dino visible
      ida.life(objectId, ida.Life.LM_INVISIBLE, 0);

      // Making camera to be centered on Dino
      ida.life(objectId, ida.Life.LM_CAM_FOLLOW, SceneProperties.dinoId);

      // Starting the coroutine where Dino is turning around
      startCoroutine(objectId, "dinoTurningAround");
    }
    // If the dinoPhase just became 1 - do a dialog
    // isTriggeredTrue helps to check if some condition was just fulfilled, and it will not return true again after it was triggered until the condition becomes false and then true again.
    // To track this, the backing state name needs to be used (in this example we pass the backing state "dinoPhase#" to be saved in the Scene variables.
    else if (isTriggeredTrue(S, "dinoPhase1", S.dinoPhase === 1)) {
      ida.life(
        // Dino says a phrase
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(SceneProperties.textId, [
          "Hello?? Where they at tho??",
          text.Flags.DialogSay, // This flag indicates that the text will be displayed on top of the actor, and not in a dialog
        ])
      );
    }
    // If the dinoPhase just became 2 - do next dialog
    else if (isTriggeredTrue(S, "dinoPhase2", S.dinoPhase === 2)) {
      // Say a text
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(SceneProperties.textId, [
          "They were literally right here!",
          text.Flags.DialogSay,
        ])
      );

      // At this point Dino will start hearing sounds from the bathroom
      startCoroutine(SceneProperties.twinsenId, "soundsFromBathroom");
      startCoroutine(SceneProperties.zoe2Id, "kissingInBath");
    }
    // If the dinoPhase just became 3 - do next dialog
    else if (isTriggeredTrue(S, "dinoPhase3", S.dinoPhase === 3)) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(SceneProperties.textId, [
          "...And what's that noise??",
          text.Flags.DialogSay,
        ])
      );
    }
    // If the dinoPhase just became 4 - do next dialog
    else if (isTriggeredTrue(S, "dinoPhase4", S.dinoPhase === 4)) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(SceneProperties.textId, [
          "Bruh. I hate it here.",
          text.Flags.DialogSay,
        ])
      );
    } else if (isTriggeredTrue(S, "dinoPhase5", S.dinoPhase === 5)) {
      // Ending the game
      ida.life(objectId, ida.Life.LM_THE_END);
    }
  },
};
