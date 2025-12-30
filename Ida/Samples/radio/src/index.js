/**
 * Welcome to IdaJS modding!
 * Read the documentation here: https://ida.innerbytes.com
 */
console.log(
  "Welcome to the IdaJS project!\nThis is a mod, demonstrating a secret dialog with Baldino over the radio.\nTalk to the radio while Zoe is still at home to trigger it."
);

const cellarSceneId = 1;

let tempStore;
let textId;

// Vanilla Game variable, responsible for tracking Zoe's location
const varZoeLocation = 40;

/**
 * Start with this event handler to setup every scene, the mod needs to modify
 */
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, sceneLoadMode) => {
  tempStore = {};

  if (sceneId !== cellarSceneId) {
    return;
  }

  textId = text.create();
  const twinsen = scene.getObject(0);
  twinsen.handleMoveScript();

  registerCoroutine("waitForResponse", waitForResponse);

  twinsen.handleLifeScript((objectId) => {
    const sceneStore = useSceneStore();

    // Only allowing this secret dialog with Baldino, if Zoe didn't leave the house yet
    if (scene.getGameVariable(varZoeLocation) > 1) {
      // If Zoe has left, let the original LBA2 life script handle the situation
      return true;
    }

    // Baldino already finished talking - allow LBA2 life script to continue
    if (sceneStore.baldinoIsDoneTalking) {
      return true;
    }

    if (sceneStore.baldinoIsTalking) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(textId, [
          "Twinsen! I managed to get through for a moment!",
          text.Flags.DialogRadio,
          text.Colors.DustyBlue,
        ])
      );

      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(textId, [
          "Right before this storm started, I detected very strange signals from space. They don't match anything I've ever recorded.",
          text.Flags.DialogRadio,
          text.Colors.DustyBlue,
        ])
      );

      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(textId, ["What kind of signals?", text.Flags.DialogDefault])
      );

      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(textId, [
          "I don't know yet. Not planetary. Not military. Just... different.",
          text.Flags.DialogRadio,
          text.Colors.DustyBlue,
        ])
      );

      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(textId, [
          "With this storm, my instruments are useless.\nOnce the weather clears up, I'll investigate more.",
          text.Flags.DialogRadio,
          text.Colors.DustyBlue,
        ])
      );

      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(textId, ["This feels... wrong.", text.Flags.DialogSay])
      );

      sceneStore.baldinoIsDoneTalking = true;
      sceneStore.baldinoIsTalking = false;

      // Our script is handling the interaction - prevent LBA2 life script from running
      return false;
    }

    const isActionPressed = ida.lifef(objectId, ida.Life.LF_ACTION);
    if (isTriggeredTrue(tempStore, "actionPressed", isActionPressed === 1)) {
      // Do something
      const zoneValue = ida.lifef(objectId, ida.Life.LF_ZONE);

      if (
        zoneValue === 2 &&
        scene.getObject(0).isFacingZoneDirection(1, object.ZoneDirections.North)
      ) {
        ida.life(objectId, ida.Life.LM_MESSAGE, 30); // Hello !
        startCoroutine(objectId, "waitForResponse");

        // Our script is handling the interacton - prevent LBA2 life script from running
        return false;
      }
    }

    // In other situation, allowing LBA2 life script to continue
    return true;
  });
});

function* waitForResponse() {
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);
  yield doSceneStore((store) => (store.baldinoIsTalking = true));
}
