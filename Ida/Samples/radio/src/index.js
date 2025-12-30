/**
 * Welcome to IdaJS modding!
 * Read the documentation here: https://ida.innerbytes.com
 */
console.log("Welcome to the IdaJS project!\n");

const cellarSceneId = 1;

let tempStore;
let textId;

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
      return;
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
      }
    }
  });
});

function* waitForResponse() {
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);
  yield doSceneStore((store) => (store.baldinoIsTalking = true));
}
