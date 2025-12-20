/**
 * Welcome to IdaJS modding!
 * Read the documentation here: https://ida.innerbytes.com
 */
console.log("Welcome to the IdaJS project!\n");

/**
 * Start with this event handler to setup every scene, the mod needs to modify
 */
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, sceneLoadMode) => {
  // Setup initial behavior for the Twinsen house scene here
  if (sceneId === 0) {
    // Do something with Twinsen and Zoe objects here.
    // See Samples for mod examples
    const twinsen = scene.getObject(0);
    const zoe = scene.getObject(4);

    // Handle move script if you will run custom coroutines on the object
    // twinsen.handleMoveScript();

    // Handle life script if you want to have custom behavior on the object
    // twinsen.handleLifeScript(myLifeScriptFunction);

    // Register your coroutines
    registerCoroutine("myCoroutine", myCoroutineFunction);

    // Do more setup - add and modify Zones, Waypoints, Objects, etc - as needed

    // If new game started, do initialization of your game variables here as well, as needed:
    if (sceneLoadMode === scene.LoadModes.NewGameStarted) {
      const gameStore = useGameStore();
      gameStore.myVariable = "some value";
    }

    // If it's any other load mode, except loading from saved state, do scene state initialization here - init scene variables, start some coroutines, that should run from scene start, etc
    if (sceneLoadMode !== scene.LoadModes.WillLoadSavedState) {
      const sceneStore = useSceneStore();
      sceneStore.mySceneVariable = 42;

      // Start the previously registered "myCoroutine" on object 0 (Twinsen), with some arguments
      // startCoroutine(0, "myCoroutine", 1, 2, 3, 4);
    }
  }
  // Setup initial behavior for the outside Twinsen house scene here
  else if (sceneId === 49) {
    // Scene setup
  }

  // Etc
  // Look at https://lba2remake.net to see the needed scene ids
  // Teleport to the desired scene in the Editor, the id will be shown in the inspector
  /* 
  else if (sceneId === 1) {
    // Scene setup
  }
  */
});

// Example of a coroutine function with some arguments
function* myCoroutineFunction(arg1, arg2, arg3, etc) {
  // Your coroutine code goes here
  yield doMove(ida.Move.TM_ANIM, 0);
}
