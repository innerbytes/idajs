// We can have different parts of the scenario in separate files for easier scripts management
// In this example we have put all the coroutines in a separate file

// Using StoryPhases and Scene setup from a separate module
const { StoryPhases, SceneProperties } = require("./props");

// Zoe is kissing...
function* kissing() {
  yield doMove(ida.Move.TM_ANIM, 84); // Kiss animation starts on Zoe (it will loop until we run another animation)
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 7); // Kissing for 7 seconds
  yield doMove(ida.Move.TM_ANIM, 0); // Switching Zoe to Idle animation
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1); // Waiting for 1 second

  // Switching story phase to the dialog after the kissing
  yield doSceneStore((s) => (s.storyPhase = StoryPhases.TalkAfterKissing));
}

// Twinsen walks from the kissing spot to the window, idle & faces north
function* goingToTheWindow() {
  // Waiting 0.5 seconds
  yield doMove(ida.Move.TM_WAIT_NB_DIZIEME, 5);
  // Starting walking animation
  yield doMove(ida.Move.TM_ANIM, 1);

  // Waiting until animation gets Twinsen to the window point
  yield doMove(ida.Move.TM_GOTO_POINT, SceneProperties.wpWindowId);

  // Switching to the Idle animation
  yield doMove(ida.Move.TM_ANIM, 0);

  // Waiting for 0.5 seconds
  yield doMove(ida.Move.TM_WAIT_NB_DIZIEME, 5);

  // Switching story phase to the dialog near the window
  yield doSceneStore((s) => (s.storyPhase = StoryPhases.TalkNearWindow));
}

// After the dialog near the window, Twinsen makes a few steps towards Zoe
function* twinsenIsGoingToZoe() {
  // Turning South to face Zoe
  yield doMove(ida.Move.TM_ANGLE, object.directionToAngle(object.ZoneDirections.South));

  // Start walking animation
  yield doMove(ida.Move.TM_ANIM, 1);
  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);
  // Stop walking by switching to idle animation
  yield doMove(ida.Move.TM_ANIM, 0);

  // Waiting 0.5 seconds
  yield doMove(ida.Move.TM_WAIT_NB_DIZIEME, 5);

  // Switching story phase to the dialog after the window
  yield doSceneStore((s) => (s.twinsenBehavior = "talkAfterWindow"));
}

// After the dialog near the Window, Zoe makes a few step towards Twinsen
function* zoeIsGoingToTwinsen() {
  // Face Twinsen
  yield doMove(ida.Move.TM_FACE_TWINSEN, -1);

  // Start walking
  yield doMove(ida.Move.TM_ANIM, 1);

  // Wait 1s
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Stop walking
  yield doMove(ida.Move.TM_ANIM, 0);
}

// Zoe is walking to the bathroom
function* zoeIsGoingToBathroom() {
  // The sequence of the scene waypoints we need Zoe to walk to to reach the bathroom
  const routeToBathroom = [
    0,
    1,
    2,
    3,
    SceneProperties.wpToBathroom1,
    SceneProperties.wpToBathroom2,
    SceneProperties.wpToBathroom3,
  ];

  // Starting walk animation
  yield doMove(ida.Move.TM_ANIM, 1);

  // Iterating through all the waypoints in our route
  for (const waypoint of routeToBathroom) {
    // Going to the next waypoint
    yield doMove(ida.Move.TM_GOTO_POINT, waypoint);
  }

  // Stopping walk animation
  yield doMove(ida.Move.TM_ANIM, 0);
}

// The scene with dino turning around, looking for Twinsen and Zoe
// We are synchronizing this with dinoPhase scene variable, so he will say different things in the life script while turning
function* dinoTurningAround() {
  // Idle anim
  yield doMove(ida.Move.TM_ANIM, 0);

  // Turning to some angle between East and North
  yield doMove(ida.Move.TM_ANGLE, 1569);

  // Wait one second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Turning to almost West
  yield doMove(ida.Move.TM_ANGLE, 3058);

  // Switching phase to 1, so the Life script will speak (Hello? Where is everybody?)
  yield doSceneStore((s) => (s.dinoPhase = 1));

  // Waiting for 2 seconds
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 2);

  // Turning Dino to a random angle
  yield doMove(ida.Move.TM_ANGLE_RND, 4096, -1);

  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Switching phase to 2, so the Life script will speak (They've just been here!)
  yield doSceneStore((s) => (s.dinoPhase = 2));

  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Turning Dino to a random angle
  yield doMove(ida.Move.TM_ANGLE_RND, 4096, -1);

  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Switching phase to 3, so the Life script will speak (What's this noise ?)
  yield doSceneStore((s) => (s.dinoPhase = 3));

  // Turning to the East
  yield doMove(ida.Move.TM_ANGLE, object.directionToAngle(object.ZoneDirections.East));

  // Playing "cringed" animation
  yield doMove(ida.Move.TM_ANIM, 7);

  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Playing Idle animation
  yield doMove(ida.Move.TM_ANIM, 0);

  // Waiting for 5 seconds
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 5);

  // Switching phase to 4, so the Life script will speak (I hate it here).
  yield doSceneStore((s) => (s.dinoPhase = 4));

  // Waiting for 4 seconds
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 4);

  // Laying on the floor
  yield doMove(ida.Move.TM_ANIM, 335);

  // Waiting for 5 seconds to let player see the dino laying on the floor
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 5);

  // Moving dino to phase 5 - end of the scene
  yield doSceneStore((s) => (s.dinoPhase = 5));
}

// Sounds from the bathroom - water splashes and Zoe's geegling
function* soundsFromBathroom() {
  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Doing infinitely
  while (true) {
    // Good practice to put in the beginning of infinite loops to avoid coroutine counter from increasing indefinitely. Otherwise it might slow down the loading of new scenes after a while.
    yield doReduce();

    // Wait randomly for 0 - 0.4 seconds
    yield doMove(ida.Move.TM_WAIT_NB_DIZIEME_RND, 40);

    // Playing a random sound from either the water splashes (3/4 probability) or Zoe's giggling (1/4 probability)
    yield doMove(ida.Move.TM_SAMPLE, [191, 191, 191, 179].random());
  }
}

// A parallel coroutine for kissing sounds from the bathroom
function* kissingInBath() {
  // Waiting for 1 second
  yield doMove(ida.Move.TM_WAIT_NB_SECOND, 1);

  // Doing infinitely
  while (true) {
    // Waiting for a random time between 0 and 4 seconds
    yield doMove(ida.Move.TM_WAIT_NB_SECOND_RND, 4);

    // Playing kissing sound
    yield doMove(ida.Move.TM_SAMPLE, 174);
  }
}

// All the coroutines must be registered
const registerCoroutines = () => {
  registerCoroutine("kissing", kissing);
  registerCoroutine("goingToTheWindow", goingToTheWindow);
  registerCoroutine("twinsenIsGoingToZoe", twinsenIsGoingToZoe);
  registerCoroutine("zoeIsGoingToTwinsen", zoeIsGoingToTwinsen);
  registerCoroutine("zoeIsGoingToBathroom", zoeIsGoingToBathroom);
  registerCoroutine("dinoTurningAround", dinoTurningAround);
  registerCoroutine("soundsFromBathroom", soundsFromBathroom);
  registerCoroutine("kissingInBath", kissingInBath);
};

// Export the registerCoroutines function to call it in the scene setup
module.exports = {
  registerCoroutines,
};
