/**
 * @typedef {import('../types').DialogColor} DialogColor
 */

const { test, expect, wait, waitFor } = require("./idatest");
const { md5 } = require("./js-md5/md5");
// @ts-ignore
const { encoding, restrictedAscii } = require("./srcjs/encoding");
const { setEncoding, encodeString } = require("./test-utils/encoding");

setEncoding(encoding, restrictedAscii);

test.group("Integration Tests", () => {
  test.beforeEach(async () => {
    ida.useImages({
      images: {
        "bath.png": { paletteIndex: 0 },
        "folder/dino.png": { paletteIndex: 0 },
        "folder/dino-imported.png": { paletteIndex: 0 },
      },
    });

    scene.removeEventListener("beforeLoadScene", "test");
    scene.removeEventListener("afterLoadScene", "test");
    mark.setGameInputOnce(mark.InputFlags.MENUS);

    ida.setEppEnabled(false);
    ida.setStartSceneId(0);
    ida.setEppEnabled(true);

    await waitFor(() => mark.getGameLoop() === mark.GameLoops.GameMenu);
  });

  test("when the scene is loaded, can read info about objects, zones, and waypoints", async () => {
    // Arrange
    let _sceneId, _sceneLoadMode, _numObjects, _numZones, _numWaypoints;
    let _zoePortraitZoneType, _zoePortraitZoneValue, _zoePortraitZoneRegisters, _zoePortraitZoneId;
    let _zoePortraitZonePos1 = [],
      _zoePortraitZonePos2 = [];
    let _zoeStaticFlags,
      _zoeId,
      _zoeControlMode,
      _zoeArmor,
      _zoeHitPower,
      _zoeLife,
      _zoeAngle,
      _zoeRotationSpeed,
      _zoeTalkColor,
      _zoeEntityId,
      _zoeBody,
      _zoeAnimation,
      _zoeRegisters,
      _zoePos;

    let _wayPoint1Pos;

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        (sceneId, sceneLoadMode) => {
          resolve();

          _sceneId = sceneId;
          _sceneLoadMode = sceneLoadMode;

          _numObjects = scene.getNumObjects();
          _numZones = scene.getNumZones();
          _numWaypoints = scene.getNumWaypoints();

          const zoePortraitZone = scene.getZone(10);
          _zoePortraitZonePos1 = zoePortraitZone.getPos1();
          _zoePortraitZonePos2 = zoePortraitZone.getPos2();
          _zoePortraitZoneType = zoePortraitZone.getType();
          _zoePortraitZoneId = zoePortraitZone.getId();
          _zoePortraitZoneValue = zoePortraitZone.getZoneValue();
          _zoePortraitZoneRegisters = zoePortraitZone.getRegisters();

          const zoe = scene.getObject(4);
          _zoeId = zoe.getId();
          _zoeStaticFlags = zoe.getStaticFlags();
          _zoeControlMode = zoe.getControlMode();
          _zoeArmor = zoe.getArmor();
          _zoeHitPower = zoe.getHitPower();
          _zoeLife = zoe.getLifePoints();
          _zoeAngle = zoe.getAngle();
          _zoeRotationSpeed = zoe.getRotationSpeed();
          _zoeTalkColor = zoe.getTalkColor();
          _zoeEntityId = zoe.getEntity();
          _zoeBody = zoe.getBody();
          _zoeAnimation = zoe.getAnimation();
          _zoeRegisters = zoe.getRegisters();
          _zoePos = zoe.getPos();

          _wayPoint1Pos = scene.getWaypoint(1);
        },
        "test"
      );
    });

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await afterLoadScene;

    // Assert
    expect.equal(_sceneId, 0);
    expect.equal(_sceneLoadMode, scene.LoadModes.NewGameStarted);
    expect.equal(_numObjects, 6);
    expect.equal(_numZones, 16);
    expect.equal(_numWaypoints, 8);

    expect.equal(_zoePortraitZoneId, 10);
    expect.equal(_zoePortraitZoneType, object.ZoneTypes.Text);
    expect.equal(_zoePortraitZoneValue, 531);
    expect.collectionEqual(_zoePortraitZoneRegisters, [0x0c, 0, 0x01, 0, 0, 0, 0, 0x01]);

    expect.collectionEqual(_zoePortraitZonePos1, [10240, 2048, 1024]);
    expect.collectionEqual(_zoePortraitZonePos2, _zoePortraitZonePos1.plus([1536, 1024, 512]));

    const f = object.Flags;
    expect.equal(
      _zoeStaticFlags,
      f.CheckCollisionsWithActors | f.CheckCollisionsWithScene | f.CheckScenericZones | f.CanFall
    );

    expect.equal(_zoeId, 4);
    expect.equal(_zoeControlMode, object.ControlModes.NoMovement);
    expect.equal(_zoeArmor, 51);
    expect.equal(_zoeHitPower, 0);
    expect.equal(_zoeLife, 255);
    expect.equal(_zoeAngle, 2048);
    expect.equal(_zoeRotationSpeed, 1462);
    expect.equal(_zoeTalkColor, text.Colors.ZoeRed);
    expect.equal(_zoeEntityId, 15);
    expect.equal(_zoeBody, 0);
    expect.equal(_zoeAnimation, 0);
    expect.collectionEqual(_zoeRegisters, [-1, -1, -1, 2]);
    expect.collectionEqual(_zoePos, [3931, 2048, 877]);

    expect.collectionEqual(_wayPoint1Pos, [6016, 2048, 3424]);
  });

  test("when the scene is loaded, can add new objects, zones, and waypoints", async () => {
    // Arrange
    let _initialNumObjects = 0,
      _initialNumZones = 0,
      _initialNumWaypoints = 0;
    let _finalNumObjects, _finalNumZones, _finalNumWaypoints;
    let _addedObjectId, _addedZoneId, _addedWaypointId;
    let _newZoneType, _newZoneValue, _newZoneRegisters, _newZonePos1, _newZonePos2;
    let _waypoint1Pos, _waypoint2Pos, _waypoint3Pos;
    let _object1Data = {},
      _object2Data = {};

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        () => {
          resolve();

          // Store initial counts
          _initialNumObjects = scene.getNumObjects();
          _initialNumZones = scene.getNumZones();
          _initialNumWaypoints = scene.getNumWaypoints();

          // Add 2 more objects
          _addedObjectId = scene.addObjects(2);

          // Configure first new object
          const object1 = scene.getObject(_addedObjectId);
          object1.setPos([7000, 2048, 5000]);
          object1.setAngle(1024);
          object1.setLifePoints(150);
          object1.setArmor(25);
          object1.setHitPower(10);
          object1.setRotationSpeed(800);
          object1.setTalkColor(text.Colors.Goldenrod);
          object1.setEntity(20);
          object1.setBody(1);
          object1.setRegisters([5, 10, 15, 20]);
          object1.setStaticFlags(
            object.Flags.CheckCollisionsWithActors | object.Flags.CheckScenericZones
          );

          // Configure second new object
          const object2 = scene.getObject(_addedObjectId + 1);
          object2.setPos([8000, 2048, 6000]);
          object2.setAngle(2048);
          object2.setLifePoints(200);
          object2.setArmor(40);
          object2.setHitPower(15);
          object2.setRotationSpeed(1200);
          object2.setTalkColor(text.Colors.TwinsenBlue);
          object2.setEntity(25);
          object2.setBody(2);
          object2.setRegisters([100, 200, 300, 400]);
          object2.setStaticFlags(object.Flags.CheckCollisionsWithScene | object.Flags.CanFall);

          // Add 1 more zone
          _addedZoneId = scene.addZones();
          const newZone = scene.getZone(_addedZoneId);
          newZone.setType(object.ZoneTypes.Sceneric);
          newZone.setPos1([5000, 2000, 3000]);
          newZone.setPos2([5500, 2500, 3500]);
          newZone.setZoneValue(100);
          newZone.setRegisters([1, 0, 0, 2, 0, 0, 0, 3]);

          // Add 3 more waypoints
          _addedWaypointId = scene.addWaypoints(3);
          scene.updateWaypoint(_addedWaypointId, [4000, 2048, 4000]);
          scene.updateWaypoint(_addedWaypointId + 1, [5000, 2048, 5000]);
          scene.updateWaypoint(_addedWaypointId + 2, [6000, 2048, 6000]);

          // Store final counts
          _finalNumObjects = scene.getNumObjects();
          _finalNumZones = scene.getNumZones();
          _finalNumWaypoints = scene.getNumWaypoints();

          // Read back the newly created zone data
          const createdZone = scene.getZone(_addedZoneId);
          _newZoneType = createdZone.getType();
          _newZoneValue = createdZone.getZoneValue();
          _newZoneRegisters = createdZone.getRegisters();
          _newZonePos1 = createdZone.getPos1();
          _newZonePos2 = createdZone.getPos2();

          // Read back the newly created waypoints
          _waypoint1Pos = scene.getWaypoint(_addedWaypointId);
          _waypoint2Pos = scene.getWaypoint(_addedWaypointId + 1);
          _waypoint3Pos = scene.getWaypoint(_addedWaypointId + 2);

          // Read back the newly created objects data
          const readObject1 = scene.getObject(_addedObjectId);
          _object1Data = {
            pos: readObject1.getPos(),
            angle: readObject1.getAngle(),
            lifePoints: readObject1.getLifePoints(),
            armor: readObject1.getArmor(),
            hitPower: readObject1.getHitPower(),
            rotationSpeed: readObject1.getRotationSpeed(),
            talkColor: readObject1.getTalkColor(),
            entity: readObject1.getEntity(),
            body: readObject1.getBody(),
            registers: readObject1.getRegisters(),
            staticFlags: readObject1.getStaticFlags(),
          };

          const readObject2 = scene.getObject(_addedObjectId + 1);
          _object2Data = {
            pos: readObject2.getPos(),
            angle: readObject2.getAngle(),
            lifePoints: readObject2.getLifePoints(),
            armor: readObject2.getArmor(),
            hitPower: readObject2.getHitPower(),
            rotationSpeed: readObject2.getRotationSpeed(),
            talkColor: readObject2.getTalkColor(),
            entity: readObject2.getEntity(),
            body: readObject2.getBody(),
            registers: readObject2.getRegisters(),
            staticFlags: readObject2.getStaticFlags(),
          };
        },
        "test"
      );
    });

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await afterLoadScene;

    // Assert
    expect.equal(_initialNumObjects, 6); // From the first test
    expect.equal(_initialNumZones, 16); // From the first test
    expect.equal(_initialNumWaypoints, 8); // From the first test

    expect.equal(_finalNumObjects, _initialNumObjects + 2);
    expect.equal(_finalNumZones, _initialNumZones + 1);
    expect.equal(_finalNumWaypoints, _initialNumWaypoints + 3);

    expect.equal(_addedObjectId, 6); // First new object ID
    expect.equal(_addedZoneId, 16); // First new zone ID
    expect.equal(_addedWaypointId, 8); // First new waypoint ID

    // Assert the newly created zone data is correct
    expect.equal(_newZoneType, object.ZoneTypes.Sceneric);
    expect.equal(_newZoneValue, 100);
    expect.collectionEqual(_newZoneRegisters, [1, 0, 0, 2, 0, 0, 0, 3]);
    expect.collectionEqual(_newZonePos1, [5000, 2000, 3000]);
    expect.collectionEqual(_newZonePos2, [5500, 2500, 3500]);

    // Assert the newly created waypoints are correct
    expect.collectionEqual(_waypoint1Pos, [4000, 2048, 4000]);
    expect.collectionEqual(_waypoint2Pos, [5000, 2048, 5000]);
    expect.collectionEqual(_waypoint3Pos, [6000, 2048, 6000]);

    // Assert the newly created objects data is correct
    expect.collectionEqual(_object1Data.pos, [7000, 2048, 5000]);
    expect.equal(_object1Data.angle, 1024);
    expect.equal(_object1Data.lifePoints, 150);
    expect.equal(_object1Data.armor, 25);
    expect.equal(_object1Data.hitPower, 10);
    expect.equal(_object1Data.rotationSpeed, 800);
    expect.equal(_object1Data.talkColor, text.Colors.Goldenrod);
    expect.equal(_object1Data.entity, 20);
    expect.equal(_object1Data.body, 1);
    expect.collectionEqual(_object1Data.registers, [5, 10, 15, 20]);

    expect.equal(
      _object1Data.staticFlags,
      object.Flags.CheckCollisionsWithActors | object.Flags.CheckScenericZones
    );

    expect.collectionEqual(_object2Data.pos, [8000, 2048, 6000]);
    expect.equal(_object2Data.angle, 2048);
    expect.equal(_object2Data.lifePoints, 200);
    expect.equal(_object2Data.armor, 40);
    expect.equal(_object2Data.hitPower, 15);
    expect.equal(_object2Data.rotationSpeed, 1200);
    expect.equal(_object2Data.talkColor, text.Colors.TwinsenBlue);
    expect.equal(_object2Data.entity, 25);
    expect.equal(_object2Data.body, 2);
    expect.collectionEqual(_object2Data.registers, [100, 200, 300, 400]);

    expect.equal(
      _object2Data.staticFlags,
      object.Flags.CheckCollisionsWithScene | object.Flags.CanFall
    );
  });

  test("object move and life script work", async () => {
    // Arrange
    const m = ida.Move;

    function* zoeMoveScript() {
      yield doMove(m.TM_ANIM, 1);
      yield doMove(m.TM_GOTO_POINT, 0);
      yield doMove(m.TM_GOTO_POINT, 1);
      yield doMove(m.TM_GOTO_POINT, 2);
      yield doMove(m.TM_GOTO_POINT, 3);
      yield doMove(m.TM_ANIM, 0);
    }

    function* twinsenMoveScript() {
      yield doMove(m.TM_ANIM, 1);
      yield doMove(m.TM_GOTO_POINT, 2);
      yield doMove(m.TM_GOTO_POINT, 1);
      yield doMove(m.TM_ANIM, 0);
    }

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        () => {
          resolve();

          const zoe = scene.getObject(4);
          const twinsen = scene.getObject(0);

          zoe.handleLifeScript(lifeHandlerZoe);
          zoe.handleMoveScript();
          twinsen.handleLifeScript(lifeHandlerTwinsen);
          twinsen.handleMoveScript();

          const wp1Pos = scene.getWaypoint(1).minus([0, 0, 300]); // To make Zoe and Twinsen collide
          scene.updateWaypoint(1, wp1Pos);

          registerCoroutine("zoeMove", zoeMoveScript);
          registerCoroutine("twinsenMove", twinsenMoveScript);

          startCoroutine(4, "zoeMove");
          startCoroutine(0, "twinsenMove");
        },
        "test"
      );
    });

    let isTwinsenSet = false;
    let zoeCollidedWithTwinsen = false;

    function lifeHandlerTwinsen() {
      if (isTwinsenSet) {
        return;
      }

      isTwinsenSet = true;
      ida.life(0, ida.Life.LM_SET_CONTROL, object.ControlModes.NoMovement);

      return false;
    }

    function lifeHandlerZoe() {
      if (ida.lifef(4, ida.Life.LF_COL) == 0) {
        zoeCollidedWithTwinsen = true;
      }

      return false;
    }

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await afterLoadScene;
    await waitFor(() => zoeCollidedWithTwinsen, 15000);

    // Assert
    expect.true(zoeCollidedWithTwinsen);
  });

  test("execution protection policy works", async () => {
    // Arrange
    const m = ida.Move;

    let lifeScriptCalled = false;
    let coroutineFinished = false;

    // Errors in before scene load
    let sceneSetupInBeforeSceneError = null;
    let registerCoroutineInBeforeSceneError = null;
    let lifeInBeforeSceneError = null;
    let lifefInBeforeSceneError = null;
    let moveInBeforeSceneError = null;
    let cmoveInBeforeSceneError = null;
    let mvInBeforeSceneError = null;
    let doInBeforeSceneError = null;

    // Errors in the scene load
    let lifeInSceneError = null;
    let setStormInSceneError = null;
    let lifefInSceneError = null;
    let moveInSceneError = null;
    let cmoveInSceneError = null;
    let mvInSceneError = null;
    let doInSceneError = null;
    let doSceneStoreInSceneError = null;
    let doGameStoreInSceneError = null;

    // Errors in the life script
    let moveInLifeError = null;
    let setStormInLifeError = null;
    let cmoveInLifeError = null;
    let mvInLifeError = null;
    let doInLifeError = null;
    let doSceneStoreInLifeError = null;
    let doGameStoreInLifeError = null;
    let haltInLifeError = null;
    let useImagesInLifeError = null;
    let objectSetterInLifeError = null;
    let zoneSetterInLifeError = null;
    let sceneSetterInLifeError = null;
    let objectAddInLifeError = null;
    let zoneAddInLifeError = null;
    let waypointAddInLifeError = null;

    // Errors in the coroutine
    let lifeInCoroutineError = null;
    let setStormInCoroutineError = null;
    let lifefInCoroutineError = null;
    let sceneStoreInCoroutineError = null;
    let gameStoreInCoroutineError = null;
    let startCoroutineInCoroutineError = null;
    let stopCoroutineInCoroutineError = null;
    let pauseCoroutineInCoroutineError = null;
    let unpauseCoroutineInCoroutineError = null;
    let stopPausedCoroutineInCoroutineError = null;
    let registerCoroutineInCoroutineError = null;

    function doMischief(mischief) {
      try {
        mischief();
      } catch (e) {
        return e;
      }
    }

    function* coroutineWithWrongAction() {
      yield doMove(m.TM_ANIM, 1);

      // Test life commands here
      lifeInCoroutineError = doMischief(() => ida.life(4, ida.Life.LM_ANIM, 0));
      lifefInCoroutineError = doMischief(() => ida.lifef(4, ida.Life.LF_COL));

      setStormInCoroutineError = doMischief(() => ida.setStorm(2));

      // Test using store here direectly
      sceneStoreInCoroutineError = doMischief(() => useSceneStore());
      gameStoreInCoroutineError = doMischief(() => useGameStore());

      // Test some of the coroutines commands here directly
      startCoroutineInCoroutineError = doMischief(() =>
        startCoroutine(0, "coroutineWithWrongAction")
      );
      stopCoroutineInCoroutineError = doMischief(() => stopCoroutine(0));
      pauseCoroutineInCoroutineError = doMischief(() => pauseCoroutine(0));
      unpauseCoroutineInCoroutineError = doMischief(() =>
        unpauseCoroutine(0, "coroutineWithWrongAction")
      );
      stopPausedCoroutineInCoroutineError = doMischief(() =>
        stopPausedCoroutine(0, "coroutineWithWrongAction")
      );
      registerCoroutineInCoroutineError = doMischief(() =>
        registerCoroutine("test", function* () {})
      );

      yield doMove(m.TM_WAIT_NB_DIZIEME, 2, 0);
      yield doMove(m.TM_ANIM, 0);
      coroutineFinished = true;
    }

    scene.addEventListener(
      "beforeLoadScene",
      () => {
        ida.setStorm(0);

        useGameStore();
        useSceneStore();

        sceneSetupInBeforeSceneError = doMischief(() => {
          scene.setStartPos([1, 2, 3]);
        });

        registerCoroutineInBeforeSceneError = doMischief(() => {
          registerCoroutine("coroutineWithWrongAction", coroutineWithWrongAction);
        });

        // Test life commands here
        lifeInBeforeSceneError = doMischief(() => ida.life(4, ida.Life.LM_ANIM, 0));
        lifefInBeforeSceneError = doMischief(() => ida.lifef(4, ida.Life.LF_COL));

        // Test move commands here
        moveInBeforeSceneError = doMischief(() => ida._move(4, [], m.TM_ANIM, 0));
        cmoveInBeforeSceneError = doMischief(() => ida._cmove(4));

        // Test coroutine commands here
        mvInBeforeSceneError = doMischief(() => doMove(m.TM_ANIM, 1));
        doInBeforeSceneError = doMischief(() => doAction(() => {}));
      },
      "test"
    );

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        () => {
          resolve();

          const zoe = scene.getObject(4);
          const twinsen = scene.getObject(0);
          zoe.handleLifeScript();
          zoe.handleMoveScript();
          twinsen.handleLifeScript(lifeHandler);
          twinsen.handleMoveScript();

          registerCoroutine("coroutineWithWrongAction", coroutineWithWrongAction);

          setStormInSceneError = doMischief(() => ida.setStorm(2));

          // Test life commands here
          lifeInSceneError = doMischief(() => ida.life(4, ida.Life.LM_ANIM, 0));
          lifefInSceneError = doMischief(() => ida.lifef(4, ida.Life.LF_COL));

          // Test move commands here
          moveInSceneError = doMischief(() => ida._move(4, [], m.TM_ANIM, 0));
          cmoveInSceneError = doMischief(() => ida._cmove(4));

          // Test coroutine commands here
          mvInSceneError = doMischief(() => doMove(m.TM_ANIM, 1));
          doInSceneError = doMischief(() => doAction(() => {}));
          doSceneStoreInSceneError = doMischief(() => doSceneStore((s) => {}));
          doGameStoreInSceneError = doMischief(() => doGameStore((s) => {}));
        },
        "test"
      );
    });

    function lifeHandler() {
      if (lifeScriptCalled) {
        return false;
      }

      lifeScriptCalled = true;

      setStormInLifeError = doMischief(() => ida.setStorm(2));

      // Test move commands here
      moveInLifeError = doMischief(() => ida._move(0, [], m.TM_ANIM, 0));
      cmoveInLifeError = doMischief(() => ida._cmove(0));

      // Test coroutine commands here
      mvInLifeError = doMischief(() => doMove(m.TM_ANIM, 1));
      doInLifeError = doMischief(() => doAction(() => {}));
      doSceneStoreInLifeError = doMischief(() => doSceneStore((s) => {}));
      doGameStoreInLifeError = doMischief(() => doGameStore((s) => {}));

      // Test halt and useImages
      haltInLifeError = doMischief(() => ida.halt());
      useImagesInLifeError = doMischief(() => ida.useImages());

      // Test some of the scene, object, zone setters here
      objectSetterInLifeError = doMischief(() => scene.getObject(0).setLifePoints(100));
      zoneSetterInLifeError = doMischief(() => scene.getZone(0).setZoneValue(100));
      sceneSetterInLifeError = doMischief(() => scene.setStartPos([1, 2, 3]));
      objectAddInLifeError = doMischief(() => scene.addObjects(1));
      zoneAddInLifeError = doMischief(() => scene.addZones(1));
      waypointAddInLifeError = doMischief(() => scene.addWaypoints(1));

      startCoroutine(4, "coroutineWithWrongAction");

      return false;
    }

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await afterLoadScene;
    await waitFor(() => lifeScriptCalled && coroutineFinished, 1000);

    // Assert
    expect.equal(
      // @ts-ignore
      sceneSetupInBeforeSceneError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );
    expect.equal(
      // @ts-ignore
      registerCoroutineInBeforeSceneError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines. However, current phase is: in beforeLoadScene event"
    );
    expect.equal(
      // @ts-ignore
      lifeInBeforeSceneError?.message,
      "Execution of this function is only allowed in the following phases: LifeScript"
    );
    expect.equal(
      // @ts-ignore
      lifefInBeforeSceneError?.message,
      "Execution of this function is only allowed in the following phases: LifeScript"
    );
    expect.equal(
      // @ts-ignore
      moveInBeforeSceneError?.message,
      "Execution of this function is only allowed in the following phases: MoveScript"
    );
    expect.equal(
      // @ts-ignore
      cmoveInBeforeSceneError?.message,
      "Execution of this function is only allowed in the following phases: MoveScript"
    );
    expect.equal(
      // @ts-ignore
      mvInBeforeSceneError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in beforeLoadScene event"
    );
    expect.equal(
      // @ts-ignore
      doInBeforeSceneError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in beforeLoadScene event"
    );

    expect.equal(
      // @ts-ignore
      setStormInSceneError?.message,
      "Execution of this function is only allowed in the following phases: BeforeLoadScene"
    );
    expect.equal(
      // @ts-ignore
      lifeInSceneError?.message,
      "Execution of this function is only allowed in the following phases: LifeScript"
    );
    expect.equal(
      // @ts-ignore
      lifefInSceneError?.message,
      "Execution of this function is only allowed in the following phases: LifeScript"
    );
    expect.equal(
      // @ts-ignore
      moveInSceneError?.message,
      "Execution of this function is only allowed in the following phases: MoveScript"
    );
    expect.equal(
      // @ts-ignore
      cmoveInSceneError?.message,
      "Execution of this function is only allowed in the following phases: MoveScript"
    );
    expect.equal(
      // @ts-ignore
      mvInSceneError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      doInSceneError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      doSceneStoreInSceneError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      doGameStoreInSceneError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );

    expect.equal(
      // @ts-ignore
      setStormInLifeError?.message,
      "Execution of this function is only allowed in the following phases: BeforeLoadScene"
    );
    expect.equal(
      // @ts-ignore
      moveInLifeError?.message,
      "Execution of this function is only allowed in the following phases: MoveScript"
    );
    expect.equal(
      // @ts-ignore
      cmoveInLifeError?.message,
      "Execution of this function is only allowed in the following phases: MoveScript"
    );
    expect.equal(
      // @ts-ignore
      mvInLifeError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      doInLifeError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      doSceneStoreInLifeError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      doGameStoreInLifeError?.message,
      "This function can only be called in the following phases: in a coroutine. However, current phase is: in afterLoadScene event, and afterwards, excl. coroutines"
    );
    expect.equal(
      // @ts-ignore
      haltInLifeError?.message,
      "Execution of this function is only allowed in the following phases: None, InScene"
    );
    expect.equal(
      // @ts-ignore
      useImagesInLifeError?.message,
      "Execution of this function is only allowed in the following phases: None, InScene"
    );
    expect.equal(
      // @ts-ignore
      objectSetterInLifeError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );
    expect.equal(
      // @ts-ignore
      zoneSetterInLifeError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );
    expect.equal(
      // @ts-ignore
      sceneSetterInLifeError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );
    expect.equal(
      // @ts-ignore
      objectAddInLifeError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );
    expect.equal(
      // @ts-ignore
      zoneAddInLifeError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );
    expect.equal(
      // @ts-ignore
      waypointAddInLifeError?.message,
      "Execution of this function is only allowed in the following phases: AfterLoadScene"
    );

    expect.equal(
      // @ts-ignore
      setStormInCoroutineError?.message,
      "Execution of this function is only allowed in the following phases: BeforeLoadScene"
    );
    expect.equal(
      // @ts-ignore
      lifeInCoroutineError?.message,
      "Execution of this function is only allowed in the following phases: LifeScript"
    );
    expect.equal(
      // @ts-ignore
      lifefInCoroutineError?.message,
      "Execution of this function is only allowed in the following phases: LifeScript"
    );
    expect.equal(
      // @ts-ignore
      sceneStoreInCoroutineError?.message,
      "This function can only be called in the following phases: in beforeLoadScene event, in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      gameStoreInCoroutineError?.message,
      "This function can only be called in the following phases: in beforeLoadScene event, in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      startCoroutineInCoroutineError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      stopCoroutineInCoroutineError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      pauseCoroutineInCoroutineError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      unpauseCoroutineInCoroutineError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      stopPausedCoroutineInCoroutineError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines, in yield do...() or yield doMove coroutine action. However, current phase is: in a coroutine"
    );
    expect.equal(
      // @ts-ignore
      registerCoroutineInCoroutineError?.message,
      "This function can only be called in the following phases: in afterLoadScene event, and afterwards, excl. coroutines. However, current phase is: in a coroutine"
    );
  });

  test("setting initial scene id works", async () => {
    // Arrange

    // Starting in Volcano island. Need to disable EPP, as we are not hot-reloading in test, and the phase None will not be set here.
    ida.setEppEnabled(false);
    ida.setStartSceneId(95);
    ida.setEppEnabled(true);

    let loadedSceneId = -1;
    let souvenirSellerEntity = -1;

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        (sceneId) => {
          resolve();

          loadedSceneId = sceneId;
          souvenirSellerEntity = scene.getObject(5).getEntity();
        },
        "test"
      );
    });

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await afterLoadScene;

    // Assert

    // Validating the scene Id and the entity of the survivor guy to make sure the right scene is loaded
    expect.equal(loadedSceneId, 95);
    expect.equal(souvenirSellerEntity, 213);
  });

  test("coroutine pause/unpause works", async () => {
    // Arrange
    const m = ida.Move;
    function* zoeMove() {
      yield doMove(m.TM_ANIM, 1);
      yield doMove(m.TM_GOTO_POINT, 0);
      yield doMove(m.TM_GOTO_POINT, 1);
      yield doMove(m.TM_GOTO_POINT, 2);
      yield doMove(m.TM_GOTO_POINT, 3);
      yield doMove(m.TM_ANIM, 0);
    }

    function* doNothing() {}

    function* zoeStop() {
      yield doMove(m.TM_ANIM, 0);
    }

    function* zoeResume() {
      yield doMove(m.TM_ANIM, 1);
    }

    let zoe = {};
    let twinsen = {};

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        () => {
          resolve();

          zoe = scene.getObject(4);
          twinsen = scene.getObject(0);
          zoe.handleLifeScript();
          zoe.handleMoveScript();
          twinsen.handleLifeScript();
          twinsen.handleMoveScript();

          // Moving Twinsen out of the way, also gives better camera view
          const startPos = scene.getStartPos();
          scene.setStartPos(startPos.minus([0, 0, 3000]));

          registerCoroutine("zoeMove", zoeMove);
          registerCoroutine("zoeStop", zoeStop);
          registerCoroutine("zoeResume", zoeResume);
          registerCoroutine("doNothing", doNothing);

          startCoroutine(4, "zoeMove");
          startCoroutine(0, "doNothing");
        },
        "test"
      );
    });

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await afterLoadScene;

    // Checking the doNothing coroutine is just stopped
    await waitFor(() => !isCoroutineRunning(0, "doNothing"), 2);

    // Waiting for Zoe to be between wp1 and wp2
    await waitFor(() => zoe.getPos()[0] >= 6936, 30000);
    pauseCoroutine(4, "zoeMove");
    startCoroutine(4, "zoeStop");
    await waitFor(() => zoe.getAnimation() === 0, 100);

    // Waiting before resuming
    await wait(1000);

    // Resuming Zoe's movement and waiting till the end
    startCoroutine(4, "zoeResume");
    await waitFor(() => !isCoroutineRunning(4, "zoeResume"), 100);
    unpauseCoroutine(4, "zoeMove");
    await waitFor(() => !isCoroutineRunning(4, "zoeMove"), 30000);

    // Assert
    // Checking Zoe's final position should be close to wp3
    const distanceToWp3 = zoe.getPos().minus(scene.getWaypoint(3)).magnitude();
    expect.lessThan(600, distanceToWp3);

    // Twinsen should not have moved
    const distanceTwinsenToStart = twinsen.getPos().minus(scene.getStartPos()).magnitude();

    expect.equal(distanceTwinsenToStart, 0);
  });

  test("save/load works", async () => {
    // Arrange
    const m = ida.Move;

    function* zoeMove() {
      yield doMove(m.TM_ANIM, 1);
      yield doMove(m.TM_GOTO_POINT, 0);
      yield doMove(m.TM_GOTO_POINT, 1);
      yield doMove(m.TM_GOTO_POINT, 2);
      yield doMove(m.TM_GOTO_POINT, 3);
      yield doMove(m.TM_ANIM, 0);
    }

    const sceneLoadModes = [];
    let zoe = {};
    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        (sceneId, sceneLoadMode) => {
          resolve();

          sceneLoadModes.push(sceneLoadMode);

          zoe = scene.getObject(4);
          const twinsen = scene.getObject(0);
          zoe.handleLifeScript();
          zoe.handleMoveScript();
          twinsen.handleLifeScript();
          twinsen.handleMoveScript();
          registerCoroutine("zoeMove", zoeMove);

          if (sceneLoadMode !== scene.LoadModes.WillLoadSavedState) {
            // Moving Twinsen out of the way, also gives better camera view
            const startPos = scene.getStartPos();
            scene.setStartPos(startPos.minus([0, 0, 3000]));
            startCoroutine(4, "zoeMove");

            // Setting some store variables to test they are saved and loaded
            const gameStore = useGameStore();
            gameStore.testStr = "test1";
            gameStore.testNum = 42;
            gameStore.testObj = { a: 1, b: 2, c: 3 };
            const sceneStore = useSceneStore();
            sceneStore.testStr = "test2";
            sceneStore.testNum = 84;
            sceneStore.testObj = { x: 10, y: 20, z: 30 };
          }
        },
        "test"
      );
    });

    mark.skipVideoOnce();

    // Act
    console.log("Starting new game");
    mark.newGame();
    await afterLoadScene;

    // Waiting for Zoe to be between wp1 and wp2
    await waitFor(() => zoe.getPos()[0] >= 6936, 30000);

    const zoePosBeforeSave = zoe.getPos();

    // Saving the game
    mark.setGameInputOnce(mark.InputFlags.MENUS);
    await waitFor(() => mark.getGameLoop() === mark.GameLoops.GameMenu);
    mark.saveGame("--ida--");

    // Loading the game back
    await wait(1000);
    mark.loadGame("--ida--");
    const zoePosAfterLoad = zoe.getPos();

    // Waiting for zoe move to finish
    await waitFor(() => !isCoroutineRunning(4, "zoeMove"), 30000);

    // Assert

    // Checking Zoe's final position should be close to wp3
    const distanceToWp3 = zoe.getPos().minus(scene.getWaypoint(3)).magnitude();
    expect.lessThan(600, distanceToWp3);

    // Checking Zoe's position after loading is the same as before saving
    expect.lessThan(1, zoePosAfterLoad.minus(zoePosBeforeSave).magnitude());

    // Checking the scene load modes
    expect.collectionEqual(sceneLoadModes, [
      scene.LoadModes.NewGameStarted,
      scene.LoadModes.WillLoadSavedState,
    ]);

    // Checking the variables
    const gameStore = useGameStore();
    expect.equal(gameStore.testStr, "test1");
    expect.equal(gameStore.testNum, 42);
    expect.objectEqual(gameStore.testObj, { a: 1, b: 2, c: 3 });
    const sceneStore = useSceneStore();
    expect.equal(sceneStore.testStr, "test2");
    expect.equal(sceneStore.testNum, 84);
    expect.objectEqual(sceneStore.testObj, { x: 10, y: 20, z: 30 });
  });

  test("starting the new game resets the scene and game variables", async () => {
    // Arrange
    const m = ida.Move;

    function* zoeMove() {
      yield doMove(m.TM_ANIM, 1);
      yield doMove(m.TM_GOTO_POINT, 0);
      yield doMove(m.TM_GOTO_POINT, 1);
      yield doMove(m.TM_GOTO_POINT, 2);
      yield doMove(m.TM_GOTO_POINT, 3);
      yield doMove(m.TM_ANIM, 0);
    }

    const sceneLoadModes = [];
    let zoe = {};
    let isSceneLoaded = false;
    let changeState = true;

    scene.addEventListener(
      "afterLoadScene",
      (sceneId, sceneLoadMode) => {
        sceneLoadModes.push(sceneLoadMode);

        zoe = scene.getObject(4);
        const twinsen = scene.getObject(0);
        zoe.handleLifeScript();
        zoe.handleMoveScript();
        twinsen.handleLifeScript();
        twinsen.handleMoveScript();
        registerCoroutine("zoeMove", zoeMove);

        if (changeState && sceneLoadMode !== scene.LoadModes.WillLoadSavedState) {
          // Moving Twinsen out of the way, also gives better camera view
          const startPos = scene.getStartPos();
          scene.setStartPos(startPos.minus([0, 0, 3000]));
          startCoroutine(4, "zoeMove");

          // Setting some store variables to test they are saved and loaded
          const gameStore = useGameStore();
          gameStore.testStr = "test1";
          gameStore.testNum = 42;
          gameStore.testObj = { a: 1, b: 2, c: 3 };
          const sceneStore = useSceneStore();
          sceneStore.testStr = "test2";
          sceneStore.testNum = 84;
          sceneStore.testObj = { x: 10, y: 20, z: 30 };
        }

        isSceneLoaded = true;
      },
      "test"
    );

    mark.skipVideoOnce();

    // Act
    mark.newGame();
    await waitFor(() => isSceneLoaded, 2000);
    await wait(1000);
    const isZoeCoroutineRunningFirstTime = isCoroutineRunning(4, "zoeMove");

    // Starting new game again
    mark.setGameInputOnce(mark.InputFlags.MENUS);
    await waitFor(() => mark.getGameLoop() === mark.GameLoops.GameMenu);

    mark.skipVideoOnce();
    isSceneLoaded = false;
    changeState = false;
    mark.newGame();
    await waitFor(() => isSceneLoaded, 2000);

    // Assert
    // Checking the scene load modes
    expect.collectionEqual(sceneLoadModes, [
      scene.LoadModes.NewGameStarted,
      scene.LoadModes.NewGameStarted,
    ]);

    // Checking Zoe's coroutine is not running second time
    expect.equal(isZoeCoroutineRunningFirstTime, true);
    expect.equal(isCoroutineRunning(4, "zoeMove"), false);

    // Checking the variables
    const gameStore = useGameStore();
    expect.equal(gameStore.testStr, undefined);
    expect.equal(gameStore.testNum, undefined);
    expect.equal(gameStore.testObj, undefined);
    const sceneStore = useSceneStore();
    expect.equal(sceneStore.testStr, undefined);
    expect.equal(sceneStore.testNum, undefined);
    expect.equal(sceneStore.testObj, undefined);
  });

  test("scene variables are reset", async () => {
    // Arrange
    let teleportToScene1 = false;
    let teleportToScene0 = false;

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        (sceneId, loadMode) => {
          resolve();

          const zoe = scene.getObject(4);
          const twinsen = scene.getObject(0);
          zoe.handleLifeScript();
          zoe.handleMoveScript();
          twinsen.handleLifeScript(sceneId === 0 ? lifeHandlerScene0 : lifeHandlerScene1);
          twinsen.handleMoveScript();

          if (sceneId === 0 && loadMode === scene.LoadModes.NewGameStarted) {
            // Setting some store variables to test the scene variables are reset
            const gameStore = useGameStore();
            gameStore.testNum = 42;
            const sceneStore = useSceneStore();
            sceneStore.testNum = 84;
          }
        },
        "test"
      );
    });

    function lifeHandlerScene0(objectId) {
      if (teleportToScene1) {
        teleportToScene1 = false;
        ida.life(objectId, ida.Life.LM_CHANGE_CUBE, 1);
      }

      return false;
    }

    function lifeHandlerScene1(objectId) {
      if (teleportToScene0) {
        teleportToScene0 = false;
        ida.life(objectId, ida.Life.LM_CHANGE_CUBE, 0);
      }
      return false;
    }

    mark.skipVideoOnce();

    // Act
    console.log("Starting new game");
    mark.newGame();
    await afterLoadScene;

    // Teleporting to scene 1 to check scene variables reset
    await wait(1000);
    teleportToScene1 = true;
    await waitFor(() => scene.getId() === 1, 1000);

    const gameStore = useGameStore();
    const sceneStore = useSceneStore();
    const testNumGameStoreScene1 = gameStore.testNum;
    const testNumSceneStoreScene1 = sceneStore.testNum;

    // Teleporting back to scene 0 to check scene variables are still reset
    await wait(1000);
    teleportToScene0 = true;
    await waitFor(() => scene.getId() === 0, 1000);
    const testNumGameStoreScene0 = gameStore.testNum;
    const testNumSceneStoreScene0 = sceneStore.testNum;

    // Assert
    expect.equal(testNumGameStoreScene1, 42);
    expect.equal(testNumSceneStoreScene1, undefined);
    expect.equal(testNumGameStoreScene0, 42);
    expect.equal(testNumSceneStoreScene0, undefined);
  });

  test("custom dialogs work", async () => {
    // Arrange
    let triggerDialog = false;
    let dialogCompleted = false;
    let currentDialogId;
    let currentDialogObjectId = 0;

    const showDialog = async (dialogId, dialogObjectId = 0) => {
      await wait(100);
      currentDialogId = dialogId;
      currentDialogObjectId = dialogObjectId;
      mark.doDialogSpy(500);
      triggerDialog = true;
      await waitFor(() => dialogCompleted, 5000);
      dialogCompleted = false;

      return mark.getDialogSpyInfo();
    };

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        () => {
          resolve();

          const zoe = scene.getObject(4);
          const twinsen = scene.getObject(0);
          zoe.handleLifeScript(lifeHandler);
          zoe.handleMoveScript();
          twinsen.handleLifeScript(lifeHandler);
          twinsen.handleMoveScript();

          zoe.setPos(scene.getStartPos().plus([500, 0, 500]));
        },
        "test"
      );
    });

    function lifeHandler(objectId) {
      if (objectId !== currentDialogObjectId) {
        return false;
      }

      if (triggerDialog) {
        triggerDialog = false;
        ida.life(objectId, ida.Life.LM_MESSAGE, currentDialogId);
        dialogCompleted = true;
      }

      return false;
    }

    mark.skipVideoOnce();

    // Act
    console.log("Starting new game");
    mark.newGame();
    await afterLoadScene;

    // The simpliest way to create a custom dialog - just pass text
    const simpleDialogInfo = await showDialog(text.create("This is a simple test dialog"));

    // Another way - pass array with text as fitst parameter, also testing Zoe dialog here
    const simpleDialogInfo2 = await showDialog(
      text.create(["Zoe: this is another simple test dialog"]),
      4
    );

    // Passing custom flags
    const simpleDialogWithFlags = await showDialog(
      text.create([
        "This is a test dialog with radio flag",
        text.Flags.DialogRadio | text.Flags.DialogDefault,
      ]),
      4
    );

    // Can also pass color
    const simpleDialogWithFlagsAndColor = await showDialog(
      text.create([
        "This is a big test dialog with radio flag and color and special characters: ←✓ÇüéâäàçêëèïîìÄÉ æÆôöòûùÿÖÜ£áí óúñÑ¿¡ãõœŒÀ ÃÕ©™ßº",
        text.Flags.DialogRadio | text.Flags.DialogBig,
        text.Colors.PaleSand,
      ])
    );

    // Can display custom sprite
    const simpleDialogWithCustomSprite = await showDialog(
      text.create([
        "This is a test dialog with a custom sprite",
        text.Flags.DialogRadio,
        text.Colors.Seafoam,
        "hearts.png",
      ]),
      0
    );

    const simpleDialogWithCustomSprite2 = await showDialog(
      text.create([
        "This is a big test dialog with a custom sprite and offset",
        text.Flags.DialogRadio | text.Flags.DialogBig,
        text.Colors.TwinsenBlue,
        "ida/ida.png",
        480,
        10,
      ]),
      0
    );

    const simpleDialogWithCustomCachedSprite = await showDialog(
      text.create([
        "This is a test dialog with a custom cached sprite and offset",
        text.Flags.DialogRadio,
        text.Colors.TwinsenBlue,
        "ida/ida-imported.png",
        480,
        10,
      ]),
      0
    );

    // Can pass full object with dialog info, this allowes also to set 256-pallette colors and do color animation
    const simpleDialogThroughObject = await showDialog(
      text.create({
        text: "This is a test of the dialog with color animation and very long word: superdukabukawukapoligizmasuperdukabukawukapoligizmasuperdukabukawukapoligizma",
        flags: text.Flags.DialogDefault,
        color256Start: 0,
        color256End: 64,
      })
    );

    // Any existing dialog can be created once and then updated
    const simpleUpdatedDialogId = text.create(["This is a new dialog", text.Flags.DialogDefault]);

    text.update(simpleUpdatedDialogId, ["I love you, Twinsen", text.Flags.DialogSay]);
    const simpleUpdatedDialogInfo = await showDialog(simpleUpdatedDialogId, 4);
    await wait(500);

    // You can make dialog to be a function, so it displays dynamic content
    let dialogVariable = 1;

    /** @type {number} */
    let dialogFlag = text.Flags.DialogDefault;

    /** @type {DialogColor} */
    let dialogColor = text.Colors.Peach;

    const dynamicDialogId = text.create(() => [
      `Dynamic dialog: ${dialogVariable}`,
      dialogFlag,
      dialogColor,
    ]);
    const dynamicDialogInfo1 = await showDialog(dynamicDialogId);
    dialogVariable++;
    dialogFlag = text.Flags.DialogBigNoFrame;
    dialogColor = text.Colors.TealGreen;
    const dynamicDialogInfo2 = await showDialog(dynamicDialogId);

    // Test replacement of game text ID 303: "I'm still looking for a cure. Don't worry, I'll find one."
    // Scenario 1: Replace with empty text (use original), but with different flags, color and sprite
    const replacedAllExceptText = await showDialog(
      text.replace(303, {
        text: "",
        flags: text.Flags.DialogRadio | text.Flags.DialogBig,
        color: text.Colors.Peach,
        sprite: "hearts.png",
        x: 300,
        y: 250,
      })
    );

    // Scenario 2: Replace with non-empty text, keep original parameters (TwinsenBlue color)
    const replacedTextOnly = await showDialog(
      text.replace(303, {
        text: "This is a custom replacement text for the cure dialog",
      })
    );

    // Scenario 3: Replace with both non-empty text and custom parameters
    const replacedAll = await showDialog(
      text.replace(303, {
        text: "Fully customized replacement dialog with all parameters",
        flags: text.Flags.DialogRadio | text.Flags.DialogBigNoFrame,
        color: text.Colors.CinematicWhiteGold,
        sprite: "ida/ida.png",
        x: 400,
        y: 100,
      })
    );

    // Assert
    expect.objectEqual(simpleDialogInfo, {
      text: encodeString("This is a simple test dialog"),
      flags: text.Flags.DialogDefault,
      minColor: text.Colors.TwinsenBlue * 16,
      maxColor: text.Colors.TwinsenBlue * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    expect.objectEqual(simpleDialogInfo2, {
      text: encodeString("Zoe: this is another simple test dialog"),
      flags: text.Flags.DialogDefault,
      minColor: text.Colors.ZoeRed * 16,
      maxColor: text.Colors.ZoeRed * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    expect.objectEqual(simpleDialogWithFlags, {
      text: encodeString("This is a test dialog with radio flag"),
      flags: text.Flags.DialogRadio | text.Flags.DialogDefault,
      minColor: text.Colors.ZoeRed * 16,
      maxColor: text.Colors.ZoeRed * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    expect.objectEqual(simpleDialogWithFlagsAndColor, {
      text: encodeString(
        "This is a big test dialog with radio flag and color and special characters: ←✓ÇüéâäàçêëèïîìÄÉ æÆôöòûùÿÖÜ£áí óúñÑ¿¡ãõœŒÀ ÃÕ©™ßº"
      ),
      flags: text.Flags.DialogRadio | text.Flags.DialogBig,
      minColor: text.Colors.PaleSand * 16,
      maxColor: text.Colors.PaleSand * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    expect.objectEqual(simpleDialogThroughObject, {
      text: encodeString(
        "This is a test of the dialog with color animation and very long word: superdukabukawukapoligizmasuperdukabukawukapoligizmasuperdukabukawukapoligizma"
      ),
      flags: text.Flags.DialogDefault,
      minColor: 0,
      maxColor: 64,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    // In the say mode, the passed colors are ignored, just the character dialog color is used
    expect.objectEqual(simpleUpdatedDialogInfo, {
      text: encodeString("I love you, Twinsen"),
      flags: text.Flags.DialogSay,
      minColor: text.Colors.ZoeRed,
      maxColor: 0,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    expect.objectEqual(dynamicDialogInfo1, {
      text: encodeString("Dynamic dialog: 1"),
      flags: text.Flags.DialogDefault,
      minColor: text.Colors.Peach * 16,
      maxColor: text.Colors.Peach * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    expect.objectEqual(dynamicDialogInfo2, {
      text: encodeString("Dynamic dialog: 2"),
      flags: text.Flags.DialogBigNoFrame,
      minColor: text.Colors.TealGreen * 16,
      maxColor: text.Colors.TealGreen * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    const expectedHeartsHash = "db1ab132135e7eace4eec8577dcfa9c8";
    const expectedIdaHash = "e511e5285c6229d728810daacf054ece";

    expect.objectEqual(
      simpleDialogWithCustomSprite,
      {
        text: encodeString("This is a test dialog with a custom sprite"),
        flags: text.Flags.DialogRadio,
        minColor: text.Colors.Seafoam * 16,
        maxColor: text.Colors.Seafoam * 16 + 12,
        spriteId: 0,
        spriteXOfs: 485,
        spriteYOfs: 342,
      },
      "",
      true
    );

    // @ts-ignore
    expect.equal(md5(simpleDialogWithCustomSprite.spriteBytes), expectedHeartsHash);

    expect.objectEqual(
      simpleDialogWithCustomSprite2,
      {
        text: encodeString("This is a big test dialog with a custom sprite and offset"),
        flags: text.Flags.DialogRadio | text.Flags.DialogBig,
        minColor: text.Colors.TwinsenBlue * 16,
        maxColor: text.Colors.TwinsenBlue * 16 + 12,
        spriteId: 0,
        spriteXOfs: 480,
        spriteYOfs: 10,
      },
      "",
      true
    );
    expect.equal(
      // @ts-ignore
      md5(simpleDialogWithCustomSprite2.spriteBytes),
      expectedIdaHash
    );

    expect.objectEqual(
      simpleDialogWithCustomCachedSprite,
      {
        text: encodeString("This is a test dialog with a custom cached sprite and offset"),
        flags: text.Flags.DialogRadio,
        minColor: text.Colors.TwinsenBlue * 16,
        maxColor: text.Colors.TwinsenBlue * 16 + 12,
        spriteId: 0,
        spriteXOfs: 480,
        spriteYOfs: 10,
      },
      "",
      true
    );
    expect.equal(
      // @ts-ignore
      md5(simpleDialogWithCustomCachedSprite.spriteBytes),
      expectedIdaHash
    );

    // Assertions for game text replacement scenarios
    // Scenario 1: Empty text should use original text, but with custom flags, color and sprite
    expect.objectEqual(
      replacedAllExceptText,
      {
        text: encodeString("I'm still looking for a cure. Don't worry, I'll find one."),
        flags: text.Flags.DialogRadio | text.Flags.DialogBig,
        minColor: text.Colors.Peach * 16,
        maxColor: text.Colors.Peach * 16 + 12,
        spriteId: 0,
        spriteXOfs: 300,
        spriteYOfs: 250,
      },
      "",
      true
    );
    expect.equal(
      // @ts-ignore
      md5(replacedAllExceptText.spriteBytes),
      expectedHeartsHash
    );

    // Scenario 2: Custom text with default parameters (TwinsenBlue color)
    expect.objectEqual(replacedTextOnly, {
      text: encodeString("This is a custom replacement text for the cure dialog"),
      flags: text.Flags.DialogDefault,
      minColor: text.Colors.TwinsenBlue * 16,
      maxColor: text.Colors.TwinsenBlue * 16 + 12,
      spriteId: -1,
      spriteXOfs: 0,
      spriteYOfs: 0,
      spriteBytes: {},
    });

    // Scenario 3: Fully customized replacement with all parameters
    expect.objectEqual(
      replacedAll,
      {
        text: encodeString("Fully customized replacement dialog with all parameters"),
        flags: text.Flags.DialogRadio | text.Flags.DialogBigNoFrame,
        minColor: text.Colors.CinematicWhiteGold * 16,
        maxColor: text.Colors.CinematicWhiteGold * 16 + 12,
        spriteId: 0,
        spriteXOfs: 400,
        spriteYOfs: 100,
      },
      "",
      true
    );
    expect.equal(
      // @ts-ignore
      md5(replacedAll.spriteBytes),
      expectedIdaHash
    );
  });

  test("custom images work", async () => {
    // Arrange
    let triggerImage = false;
    let imageCompleted = false;
    let currentImageName;
    let currentReplaceImageId = 0;
    let currentObjectId = 0;
    let withDialog = false;

    const showImage = async (imageName, replaceImageId = 0) => {
      withDialog = false;
      await wait(100);
      currentImageName = imageName;
      currentReplaceImageId = replaceImageId;
      mark.doImageSpy(500);
      triggerImage = true;
      await waitFor(() => imageCompleted, 5000);
      imageCompleted = false;
      return mark.getImageSpyInfo();
    };

    const showImageWithDialog = async (imageName, replaceImageId = 0) => {
      withDialog = true;
      await wait(100);
      currentImageName = imageName;
      currentReplaceImageId = replaceImageId;
      mark.doImageSpy(500);
      mark.doDialogSpy(500);
      triggerImage = true;
      await waitFor(() => imageCompleted, 5000);
      imageCompleted = false;
      return {
        imageInfoWithDialog: mark.getImageSpyInfo(),
        dialogInfo: mark.getDialogSpyInfo(),
      };
    };

    const afterLoadScene = new Promise((resolve) => {
      scene.addEventListener(
        "afterLoadScene",
        () => {
          resolve();

          const zoe = scene.getObject(4);
          const twinsen = scene.getObject(0);
          zoe.handleLifeScript(lifeHandler);
          zoe.handleMoveScript();
          twinsen.handleLifeScript(lifeHandler);
          twinsen.handleMoveScript();

          zoe.setPos(scene.getStartPos().plus([500, 0, 500]));
        },
        "test"
      );
    });

    function lifeHandler(objectId) {
      if (objectId !== currentObjectId) {
        return false;
      }

      if (triggerImage) {
        triggerImage = false;

        if (!withDialog) {
          if (currentReplaceImageId > 0) {
            ida.life(objectId, ida.Life.LM_PCX, currentReplaceImageId, 0);
          } else {
            ida.life(objectId, ida.Life.LM_PCX, image.use(currentImageName), 0);
          }
        } else {
          if (currentReplaceImageId > 0) {
            ida.life(
              objectId,
              ida.Life.LM_PCX_MESS_OBJ,
              currentReplaceImageId,
              0,
              0,
              text.create("Test dialog on replaced image")
            );
          } else {
            ida.life(
              objectId,
              ida.Life.LM_PCX_MESS_OBJ,
              image.use(currentImageName),
              0,
              0,
              text.create("Test dialog on custom image")
            );
          }
        }

        imageCompleted = true;
      }

      return false;
    }

    mark.skipVideoOnce();

    // Act
    console.log("Starting new game");
    mark.newGame();
    await afterLoadScene;

    const bathImageMD5 = "d825bb64075467d00061f1254a211002";
    const dinoImageMD5 = "56757109a88e2c32ad6857127fce4ede";
    const lbaPaletteMD5 = "14f943293fb93cd70a005b29fae50bee";
    const bathNativeImageMD5 = "620ab977a5afbcddab4e8ef7a18e04e4";
    const bathNativePaletteMD5 = "d12ea018d6d52d84542c10c2fa00b069";

    const simpleImageInfo = await showImage("bath-native.png");
    const imageInfoWithFolder = await showImage("folder/dino.png");
    const imageFromCache = await showImage("folder/dino-imported.png");

    image.replace(4, "bath.png");
    const replaceImage = await showImage("", 4);

    const { imageInfoWithDialog, dialogInfo: dialogInfo1 } =
      await showImageWithDialog("folder/dino.png");

    image.replace(5, "bath.png");
    const { imageInfoWithDialog: replacedImageInfoWithDialog, dialogInfo: dialogInfo2 } =
      await showImageWithDialog("", 5);

    // Assert
    expect.equal(simpleImageInfo.effectId, 0);
    expect.equal(simpleImageInfo.paletteBytes.length, 768);
    // @ts-ignore
    expect.equal(md5(simpleImageInfo.imageBytes), bathNativeImageMD5);
    // @ts-ignore
    expect.equal(md5(simpleImageInfo.paletteBytes), bathNativePaletteMD5);

    expect.equal(imageInfoWithFolder.effectId, 0);
    expect.equal(imageInfoWithFolder.paletteBytes.length, 768);
    // @ts-ignore
    expect.equal(md5(imageInfoWithFolder.imageBytes), dinoImageMD5);
    // @ts-ignore
    expect.equal(md5(imageInfoWithFolder.paletteBytes), lbaPaletteMD5);

    expect.equal(imageFromCache.effectId, 0);
    expect.equal(imageFromCache.paletteBytes.length, 768);
    // @ts-ignore
    expect.equal(md5(imageFromCache.imageBytes), dinoImageMD5);
    // @ts-ignore
    expect.equal(md5(imageFromCache.paletteBytes), lbaPaletteMD5);

    expect.equal(replaceImage.effectId, 0);
    expect.equal(replaceImage.paletteBytes.length, 768);
    // @ts-ignore
    expect.equal(md5(replaceImage.imageBytes), bathImageMD5);
    // @ts-ignore
    expect.equal(md5(replaceImage.paletteBytes), lbaPaletteMD5);

    expect.equal(imageInfoWithDialog.effectId, 0);
    expect.equal(imageInfoWithDialog.paletteBytes.length, 768);
    // @ts-ignore
    expect.equal(md5(imageInfoWithDialog.imageBytes), dinoImageMD5);
    // @ts-ignore
    expect.equal(md5(imageInfoWithDialog.paletteBytes), lbaPaletteMD5);
    expect.equal(dialogInfo1.text, encodeString("Test dialog on custom image"));

    expect.equal(replacedImageInfoWithDialog.effectId, 0);
    expect.equal(replacedImageInfoWithDialog.paletteBytes.length, 768);
    // @ts-ignore
    expect.equal(md5(replacedImageInfoWithDialog.imageBytes), bathImageMD5);
    // @ts-ignore
    expect.equal(md5(replacedImageInfoWithDialog.paletteBytes), lbaPaletteMD5);
    expect.equal(dialogInfo2.text, encodeString("Test dialog on replaced image"));
  });
});
