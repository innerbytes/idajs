const { SceneProperties, StoryPhases } = require("./props");

// === Behaviors: Zoe ===
module.exports = {
  // While Zoe is walking to the bathroom we need to check if she's already reached the destination
  zoeIsWalkingToBathroom: (objectId) => {
    const S = useSceneStore();

    // Twinsen might even enter the Bathroom first, then we need to remove Zoe's object from the scene
    if (
      S.storyPhase === StoryPhases.DialogInBathhroom ||
      S.storyPhase === StoryPhases.DinoScene
    ) {
      // Stopping walking coroutine
      stopCoroutine(SceneProperties.zoeId);

      // Set her animation to idle
      ida.life(objectId, ida.Life.LM_ANIM, 0);

      // Set Zoe invisible
      ida.life(objectId, ida.Life.LM_INVISIBLE, 1);

      // Put Zoe to the point outside of the scene
      ida.life(objectId, ida.Life.LM_POS_POINT, SceneProperties.wpNull);

      // Do not need to run Zoe behavior anymore
      S.zoeBehavior = "";
      return;
    }

    // If zoe is now in the bathroom
    if (
      ida.lifef(objectId, ida.Life.LF_ZONE) ===
      SceneProperties.zoneBathroomEntranceValue
    ) {
      // If Zoe entered the bathroom, and Twinsen is still just walking around, showing WTF exclamation on him - he is suprised where Zoe dipped
      if (S.storyPhase === StoryPhases.TwinsenIsControlledByPlayer) {
        ida.life(
          objectId,
          ida.Life.LM_MESSAGE_OBJ,
          SceneProperties.twinsenId,
          text.update(SceneProperties.textId, ["WTF ??", text.Flags.DialogSay])
        );
      }

      // Making Zoe invisible and putting her outside of the scene, same as above
      stopCoroutine(SceneProperties.zoeId);
      ida.life(objectId, ida.Life.LM_ANIM, 0);
      ida.life(objectId, ida.Life.LM_INVISIBLE, 1);
      ida.life(objectId, ida.Life.LM_POS_POINT, SceneProperties.wpNull);

      // Do not need to run Zoe behavior anymore
      S.zoeBehavior = "";
    }
  },
};
