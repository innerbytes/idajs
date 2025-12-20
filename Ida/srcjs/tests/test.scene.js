const { test, expect } = require("./idatest");
const { createMockFn } = require("./idamock");
// @ts-ignore
const { sceneProto } = require("./srcjs/scene");

test.group("Scene Tests", () => {
  test.beforeEach(() => {
    // Reset handlers to defaults
    sceneProto._setSaveHandler(() => {});
    sceneProto._setLoadHandler(() => {});
  });

  test("setSaveHandler should set handler and __save should call it with false", () => {
    const saveHandler = createMockFn(undefined);
    sceneProto._setSaveHandler(saveHandler);

    sceneProto.__save();

    expect.equal(saveHandler.calls.length, 1);
    expect.collectionEqual(saveHandler.calls[0], [false]);
  });

  test("setSaveHandler should throw error for invalid handler", () => {
    expect.throws(() => sceneProto._setSaveHandler(null));
    expect.throws(() => sceneProto._setSaveHandler(123));
    expect.throws(() => sceneProto._setSaveHandler({}));
  });

  test("setLoadHandler should set handler and __load should call it with json and return its value", () => {
    const loadHandler = createMockFn("ok");
    sceneProto._setLoadHandler(loadHandler);

    const json = { a: 1 };
    const result = sceneProto.__load(json);

    expect.equal(loadHandler.calls.length, 1);
    expect.collectionEqual(loadHandler.calls[0], [json]);
    expect.equal(result, "ok");
  });

  test("__load should call handler even when json is falsy", () => {
    const loadHandler = createMockFn("ok");
    sceneProto._setLoadHandler(loadHandler);

    const result = sceneProto.__load(undefined);

    expect.equal(loadHandler.calls.length, 1);
    expect.collectionEqual(loadHandler.calls[0], [undefined]);
    expect.equal(result, "ok");
  });

  test("__saveBackup should call save handler with true", () => {
    const saveHandler = createMockFn(undefined);
    sceneProto._setSaveHandler(saveHandler);

    sceneProto.__saveBackup();

    expect.equal(saveHandler.calls.length, 1);
    expect.collectionEqual(saveHandler.calls[0], [true]);
  });

  test("__loadBackup should call load handler with no arguments", () => {
    const loadHandler = createMockFn("backup data");
    sceneProto._setLoadHandler(loadHandler);

    const result = sceneProto.__loadBackup();

    expect.equal(loadHandler.calls.length, 1);
    expect.collectionEqual(loadHandler.calls[0], []);
    expect.equal(result, "backup data");
  });

  const zt = object.ZoneTypes;
  for (let zoneType of [
    zt.Camera,
    zt.Sceneric,
    zt.Fragment,
    zt.Ladder,
    zt.Conveyor,
    zt.Spike,
    zt.Rail,
  ]) {
    test("findFreeZoneValue should return 0 when there are no zones", () => {
      const mockScene = {
        getNumZones: () => 0,
        getZone: () => null,
      };

      const id = sceneProto.findFreeZoneValue.call(mockScene, zoneType);
      expect.equal(id, 0);
    });

    test("findFreeZoneValue should return 0 when no zone of such type exist", () => {
      const zones = [
        {
          getType: () => global.object.ZoneTypes.Teleport,
          getZoneValue: () => 3,
        },
        {
          getType: () => global.object.ZoneTypes.Bonus,
          getZoneValue: () => 7,
        },
      ];
      const mockScene = {
        getNumZones: () => zones.length,
        getZone: (i) => zones[i],
      };

      const id = sceneProto.findFreeZoneValue.call(mockScene, zoneType);
      expect.equal(id, 0);
    });

    test("findFreeZoneValue should return max value for this zone type + 1", () => {
      const zones = [
        {
          getType: () => global.object.ZoneTypes.Text,
          getZoneValue: () => 5,
        },
        {
          getType: () => zoneType,
          getZoneValue: () => 6,
        },
        {
          getType: () => global.object.ZoneTypes.Bonus,
          getZoneValue: () => 99,
        },
        {
          getType: () => zoneType,
          getZoneValue: () => 10,
        },
        {
          getType: () => global.object.ZoneTypes.Text,
          getZoneValue: () => 18,
        },
      ];
      const mockScene = {
        getNumZones: () => zones.length,
        getZone: (i) => zones[i],
      };

      const id = sceneProto.findFreeZoneValue.call(mockScene, zoneType);
      expect.equal(id, 11);
    });
  }

  test("objects iterator should work with empty scene", () => {
    const mockScene = {
      getNumObjects: () => 0,
      getObject: () => null,
      _objectsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const objects = [...mockScene.objects];
    expect.equal(objects.length, 0);
  });

  test("objects iterator should iterate through all objects", () => {
    const mockObjects = [
      { getId: () => 0 },
      { getId: () => 1 },
      { getId: () => 2 },
    ];

    const mockScene = {
      getNumObjects: () => mockObjects.length,
      getObject: (i) => mockObjects[i],
      _objectsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const objects = [...mockScene.objects];
    expect.equal(objects.length, 3);
    expect.equal(objects[0].getId(), 0);
    expect.equal(objects[1].getId(), 1);
    expect.equal(objects[2].getId(), 2);
  });

  test("objects iterator should work with for...of loop", () => {
    const mockObjects = [{ getId: () => 10 }, { getId: () => 20 }];

    const mockScene = {
      getNumObjects: () => mockObjects.length,
      getObject: (i) => mockObjects[i],
      _objectsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const ids = [];
    for (const obj of mockScene.objects) {
      ids.push(obj.getId());
    }

    expect.collectionEqual(ids, [10, 20]);
  });

  test("zones iterator should work with empty scene", () => {
    const mockScene = {
      getNumZones: () => 0,
      getZone: () => null,
      _zonesIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const zones = [...mockScene.zones];
    expect.equal(zones.length, 0);
  });

  test("zones iterator should iterate through all zones", () => {
    const mockZones = [
      { getType: () => 1 },
      { getType: () => 2 },
      { getType: () => 3 },
    ];

    const mockScene = {
      getNumZones: () => mockZones.length,
      getZone: (i) => mockZones[i],
      _zonesIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const zones = [...mockScene.zones];
    expect.equal(zones.length, 3);
    expect.equal(zones[0].getType(), 1);
    expect.equal(zones[1].getType(), 2);
    expect.equal(zones[2].getType(), 3);
  });

  test("zones iterator should work with for...of loop", () => {
    const mockZones = [
      { getType: () => 100, getZoneValue: () => 1 },
      { getType: () => 200, getZoneValue: () => 2 },
    ];

    const mockScene = {
      getNumZones: () => mockZones.length,
      getZone: (i) => mockZones[i],
      _zonesIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const types = [];
    for (const zone of mockScene.zones) {
      types.push(zone.getType());
    }

    expect.collectionEqual(types, [100, 200]);
  });

  test("waypoints iterator should work with empty scene", () => {
    const mockScene = {
      getNumWaypoints: () => 0,
      getWaypoint: () => null,
      _waypointsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const waypoints = [...mockScene.waypoints];
    expect.equal(waypoints.length, 0);
  });

  test("waypoints iterator should iterate through all waypoints", () => {
    const mockWaypoints = [
      [10, 20, 30],
      [40, 50, 60],
      [70, 80, 90],
    ];

    const mockScene = {
      getNumWaypoints: () => mockWaypoints.length,
      getWaypoint: (i) => mockWaypoints[i],
      _waypointsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const waypoints = [...mockScene.waypoints];
    expect.equal(waypoints.length, 3);
    expect.collectionEqual(waypoints[0], [10, 20, 30]);
    expect.collectionEqual(waypoints[1], [40, 50, 60]);
    expect.collectionEqual(waypoints[2], [70, 80, 90]);
  });

  test("waypoints iterator should work with for...of loop", () => {
    const mockWaypoints = [
      [1, 2, 3],
      [4, 5, 6],
    ];

    const mockScene = {
      getNumWaypoints: () => mockWaypoints.length,
      getWaypoint: (i) => mockWaypoints[i],
      _waypointsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    const coords = [];
    for (const [x, y, z] of mockScene.waypoints) {
      coords.push(x + y + z);
    }

    expect.collectionEqual(coords, [6, 15]);
  });

  test("iterator should get fresh data on each iteration", () => {
    let objectCount = 1;
    const mockScene = {
      getNumObjects: () => objectCount,
      getObject: (i) => ({ getId: () => i }),
      _objectsIterator: null,
    };
    Object.setPrototypeOf(mockScene, sceneProto);

    // First iteration
    let objects = [...mockScene.objects];
    expect.equal(objects.length, 1);

    // Change the count
    objectCount = 3;

    // Second iteration should see new count
    objects = [...mockScene.objects];
    expect.equal(objects.length, 3, "Should get fresh data on each iteration");
  });
});
