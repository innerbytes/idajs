const { SceneProperties, StoryPhases } = require("./props");

// === Behaviors: Twinsen ===
module.exports = {
  start: (objectId) => {
    const S = useSceneStore();

    // No control of Twinsen by player
    // Not turning cinema mode on here, as we want to show the dialog choices, and cinema mode hides the half of the top one.
    ida.life(objectId, ida.Life.LM_CAM_FOLLOW, SceneProperties.twinsenId);
    ida.life(objectId, ida.Life.LM_SET_CONTROL, object.ControlModes.NoMovement);

    // Switching to the next behavior
    S.twinsenBehavior = "talkAfterKissing";
  },
  talkAfterKissing: (objectId) => {
    const S = useSceneStore();
    // Waiting for the kissing to stop
    if (S.storyPhase !== StoryPhases.TalkAfterKissing) {
      return;
    }

    // Dialog after kissing

    // Demo on how we can randomize text from a list, so it sounds different each time
    const twinsenIsWorriedAboutDinoText = [
      "Yo bae, chill... lemme peep Dino real quick, man be moving mad sus fr fr.",
      "Hold up shawty, my dragon homie lowkey acting shady, gotta go vibe-check him.",
      "Ayo pause the smoochies, bae. Dino out there tweaking after that storm.",
      "Wait wait, lips on cooldown - Dino lookin' hella down bad rn.",
      "Babe, timeout... gotta see what's up with Dino, he been acting like he lost wifi.",
      "Bruh, Dino landed like an NPC glitching in Roblox, lemme check my lil dude.",
      "Hang tight, queen. Dino's sus energy is giving red flags rn.",
      "Hold on bae, Dino's out there acting goofy, storm did him dirty.",
      "Lowkey need a Dino status update, not gonna cap.",
      "Bae, hold up... I gotta check on Dino, anyway. Man's been acting sus lately.",
    ].random();

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(SceneProperties.textId, twinsenIsWorriedAboutDinoText)
    );

    // Now, for Zoe's answer, give Twinsen choices whether he wants to go check on Dino or stay with Zoe

    // The first choice is also the default one if player just presses Escape
    ida.life(
      objectId,
      ida.Life.LM_ADD_CHOICE,
      text.update(SceneProperties.choices[0], "Aight bet, if that's the vibe")
    );
    ida.life(
      objectId,
      ida.Life.LM_ADD_CHOICE,
      text.update(
        SceneProperties.choices[1],
        "Bae, gimme sec, gotta peep on him real quick"
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_ASK_CHOICE_OBJ, // This work the same as normal dialog message, but will add choices that we prepared above
      SceneProperties.zoeId,
      text.update(SceneProperties.textId, [
        "Bruh, Dino again? He will be fine, chill.",
        text.Flags.DialogRadio,
        text.Colors.ZoeRed,
        "hearts.png",
      ])
    );

    // Now checking what player selected
    if (
      ida.lifef(objectId, ida.Life.LF_CHOICE) === SceneProperties.choices[0]
    ) {
      // Chosing to stay with Zoe, back to kissing
      S.storyPhase = StoryPhases.Kissing;
      startCoroutine(SceneProperties.zoeId, "kissing");
      return;
    }

    // The choice is to check on Dino - starting going to the window
    ida.life(objectId, ida.Life.LM_CINEMA_MODE, 1); // Enabling cinema mode now. Did not enable earlier, because choices look bad in cinema mode.
    startCoroutine(SceneProperties.twinsenId, "goingToTheWindow");

    // Switching to the next story phase and Twinsen behavior
    S.storyPhase = StoryPhases.GoingToTheWindow;
    S.twinsenBehavior = "talkNearWindow";
  },
  talkNearWindow: (objectId) => {
    const S = useSceneStore();
    // Waiting for the Twinsen to reach the window
    if (S.storyPhase !== StoryPhases.TalkNearWindow) {
      return;
    }

    // Twinsen's dialog with Dino near the Window
    ida.life(objectId, ida.Life.LM_MESSAGE, 530); // I don't see Dino fly
    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(SceneProperties.textId, "Oh, wait...")
    );

    // Showing Dino's image
    ida.life(objectId, ida.Life.LM_PCX, image.use("dino.png"), 0);

    // Disabling dialog bullet, before the dialog with image
    ida.life(objectId, ida.Life.LM_BULLE, 0);

    // Dino image with a dialog on top
    ida.life(
      objectId,
      ida.Life.LM_PCX_MESS_OBJ,
      image.use("dino.png"),
      0,
      SceneProperties.dinoId,
      text.update(
        SceneProperties.textId,
        // Custom text properties can be passed as well as an object, like here
        {
          text: "Sup losers. Yeah, I see you making out. Maybe stop simping for Zoe and actually buy me a cure?\n\nI'm literally dying over here :(",
          flags: text.Flags.DialogBig,
        }
      )
    );

    // Enabling dialog bullet, after the dialog with image
    ida.life(objectId, ida.Life.LM_BULLE, 1);

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(
        SceneProperties.textId,
        "OMG Dino, chill fam! I'm on it, I swear."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(SceneProperties.textId, ["Sheesh!", text.Flags.DialogSay])
    );

    // Twinsen and Zoe are starting to approaching one another
    startCoroutine(SceneProperties.twinsenId, "twinsenIsGoingToZoe");
    startCoroutine(SceneProperties.zoeId, "zoeIsGoingToTwinsen");

    // Switching Twinsen's life behavior to none for now, the coroutine will put it to talkAfterWindow, when it's finished
    S.twinsenBehavior = "";
  },
  talkAfterWindow: (objectId) => {
    // Dialog with Zoe near the window starts here

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(
        SceneProperties.textId,
        "No cap babe, Dino's literally crying in 4K. Lemme go grab that cure before he rage-quits life."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE_OBJ,
      SceneProperties.zoeId,
      text.update(SceneProperties.textId, [
        "Or... you could stay here, babe. Bubble bath, you 'n me. Way more fun than Dino.",
        text.Flags.DialogRadio,
        text.Colors.ZoeRed,
        "hearts.png",
        null,
        303,
      ])
    );

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(
        SceneProperties.textId,
        "Sweetheart... plot twist: we don't even have a bathroom.\nDevs were too lazy, they just copy-pasted furniture and dipped."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE_OBJ,
      SceneProperties.zoeId,
      text.update(
        SceneProperties.textId,
        "Lmaoo no, bestie, they did give us a bathroom.\nThey just hid the door so you wouldn't get distracted simping in there."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE,
      text.update(SceneProperties.textId, "Wait, what-fr?")
    );

    ida.life(
      objectId,
      ida.Life.LM_MESSAGE_OBJ,
      SceneProperties.zoeId,
      text.update(
        SceneProperties.textId,
        "Yuh. Come, lemme show you. Follow me, daddy."
      )
    );

    // Zoe will go to the bathroom now
    startCoroutine(SceneProperties.zoeId, "zoeIsGoingToBathroom");

    // Exiting cinema mode and giving control to player
    ida.life(objectId, ida.Life.LM_CINEMA_MODE, 0);
    ida.life(
      objectId,
      ida.Life.LM_SET_CONTROL,
      object.ControlModes.PlayerControl
    );

    // Switching story phase and behavior
    const S = useSceneStore();
    S.storyPhase = StoryPhases.TwinsenIsControlledByPlayer;

    // Twinsen's life behavior is now playerControlled, where we will check the sceneric zones he interacts with
    S.twinsenBehavior = "playerControlled";

    // Enabling Zoe's life behavior
    S.zoeBehavior = "zoeIsWalkingToBathroom";
  },
  playerControlled: (objectId) => {
    const S = useSceneStore();

    // Checking the zone where Twinsen is
    const currentZone = ida.lifef(objectId, ida.Life.LF_ZONE);

    // If already at Bathroom entrance
    if (currentZone === SceneProperties.zoneBathroomEntranceValue) {
      // Removing control from Twinsen and making him invisible
      ida.life(
        objectId,
        ida.Life.LM_SET_CONTROL,
        object.ControlModes.NoMovement
      );
      ida.life(objectId, ida.Life.LM_INVISIBLE, 1);

      // Set normal stance, so we don't hear his legs if he was in a sportive mode
      ida.life(
        objectId,
        ida.Life.LM_COMPORTEMENT_HERO,
        object.TwinsenStances.Normal
      );

      // Setting anim to Idle
      ida.life(objectId, ida.Life.LM_ANIM, 0);

      // Switching story phase and winsen behavior to the next one
      S.storyPhase = StoryPhases.DialogInBathhroom;
      S.twinsenBehavior = "talkInBathroom";
      return;
    }

    // Handling if Twinsen wants to try to exit the house
    // Here we use trigger, again - only when he entered the ZoneExit. If he stays there - will not trigger.
    // If he reenters - will trigger again.
    if (
      isTriggeredTrue(
        S,
        "twinsenWantsToExitHouse",
        currentZone === SceneProperties.zoneExitValue
      )
    ) {
      // Telling player he can't leave yet
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(
          SceneProperties.textId,
          "Nah, gotta see where Zoe dipped first. Can't ghost bae."
        )
      );

      return;
    }

    // If player pressed action inside of the Window zone
    if (
      currentZone === SceneProperties.zoneWindowValue &&
      isTriggeredTrue(
        this, // When triggering Action we use "this" object as a store, because we don't need to persist the previous state of action pressed between save/load
        "action",
        ida.lifef(objectId, ida.Life.LF_ACTION) > 0
      )
    ) {
      // Twinsen is at the window, and can "look outside"
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE,
        text.update(
          SceneProperties.textId,
          "Bruh, Dino was literally right here... now he dipped? Dude prolly gave up"
        )
      );
    }
  },
  talkInBathroom: (objectId) => {
    // Disabling dialog bullet to do the dialog on top of image
    ida.life(objectId, ida.Life.LM_BULLE, 0);

    // Showing just bathing image first
    ida.life(objectId, ida.Life.LM_PCX, image.use("bath.png"), 0);

    // Now showing image with dialog
    ida.life(
      objectId,
      ida.Life.LM_PCX_MESS_OBJ,
      image.use("bath.png"),
      0,
      SceneProperties.zoeId,
      text.update(SceneProperties.textId, "Soo, how u likin' this vibe, babe?")
    );

    ida.life(
      objectId,
      ida.Life.LM_PCX_MESS_OBJ,
      image.use("bath.png"),
      0,
      SceneProperties.twinsenId,
      text.update(
        SceneProperties.textId,
        "fr? With you here? 10/10, no patch notes needed."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_PCX_MESS_OBJ,
      image.use("bath.png"),
      0,
      SceneProperties.zoeId,
      text.update(
        SceneProperties.textId,
        "Lmaoo, you've been adventuring nonstop, and didn't even know we had a bathroom."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_PCX_MESS_OBJ,
      image.use("bath.png"),
      0,
      SceneProperties.twinsenId,
      text.update(
        SceneProperties.textId,
        "Okay, okay... guilty. But ngl, Dino still on my mind. I'm worried 'bout my lil guy."
      )
    );

    ida.life(
      objectId,
      ida.Life.LM_PCX_MESS_OBJ,
      image.use("bath.png"),
      0,
      SceneProperties.zoeId,
      text.update(
        SceneProperties.textId,
        "Chilllll. This rain outside feels almost as warm as our bath. Dino can wait a hot sec."
      )
    );

    // The bathtube dialog is over, switching now to the Dino in the house scene
    ida.life(objectId, ida.Life.LM_BULLE, 1); // Enabling dialog bullets
    const S = useSceneStore();
    S.storyPhase = StoryPhases.DinoScene; // Switching story phase to DinoScene
    S.twinsenBehavior = ""; // Twinsen doesn't need to do anything anymore
    S.dinoBehavior = "lookingAround"; // Enabling Dino life behavior
  },
};
