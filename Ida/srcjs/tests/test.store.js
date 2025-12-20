const { test, expect } = require("./idatest");
const {
  resetScene,
  resetGame,
  resetSystem,
  saveToJson,
  loadFromJson,
  saveBackup,
  loadBackup,
  useGameStore,
  useSceneStore,
  useSystemStore,
  // @ts-ignore
} = require("./srcjs/store");
// @ts-ignore
const epp = require("./srcjs/epp");

test.group("Store Tests", () => {
  test.beforeEach(() => {
    // Reset all store data before each test
    loadFromJson(""); // This calls resetAll internally

    // Set epp into allowed phase
    epp.setCurrentPhase(epp.ExecutionPhase.InScene);
  });

  // useStore function tests
  test("useGameStore should return game store object", () => {
    const gameStore = useGameStore();
    expect.equal(typeof gameStore, "object");
    expect.false(gameStore === null);
  });

  test("useSceneStore should return scene store object", () => {
    const sceneStore = useSceneStore();
    expect.equal(typeof sceneStore, "object");
    expect.false(sceneStore === null);
  });

  test("useSystemStore should return system store object", () => {
    const systemStore = useSystemStore();
    expect.equal(typeof systemStore, "object");
    expect.false(systemStore === null);
  });

  for (const [functionName, useStore] of [
    ["useGameStore", useGameStore],
    ["useSceneStore", useSceneStore],
    ["useSystemStore", useSystemStore],
  ]) {
    test(`${functionName} with path should create nested objects`, () => {
      const playerData = useStore("player");
      playerData.name = "Twinsen";
      expect.equal(typeof playerData, "object");

      const statsData = useStore("player", "stats");
      statsData.level = 5;
      expect.equal(typeof statsData, "object");
      expect.equal(useStore().player.name, "Twinsen");
      expect.equal(useStore().player.stats.level, 5);
    });

    test(`${functionName} should throw error for invalid arguments`, () => {
      expect.throws(() => useStore(123));
      expect.throws(() => useStore("valid", null));
      expect.throws(() => useStore("valid", undefined));
      expect.throws(() => useStore([]));
      expect.throws(() => useStore({}));
    });
  }

  // Reset functions tests
  test("resetGame should clear only game store", () => {
    useGameStore("player").name = "Twinsen";
    useSceneStore("current").id = 1;
    useSystemStore("settings").volume = 50;

    resetGame();

    const gameStore = useGameStore();
    const sceneStore = useSceneStore();
    const systemStore = useSystemStore();

    expect.equal(Object.keys(gameStore).length, 0);
    expect.equal(sceneStore.current.id, 1);
    expect.equal(systemStore.settings.volume, 50);
  });

  test("resetScene should clear only scene store", () => {
    useGameStore("player").name = "Twinsen";
    useSceneStore("current").id = 1;
    useSystemStore("settings").volume = 50;

    resetScene();

    const gameStore = useGameStore();
    const sceneStore = useSceneStore();
    const systemStore = useSystemStore();

    expect.equal(gameStore.player.name, "Twinsen");
    expect.equal(Object.keys(sceneStore).length, 0);
    expect.equal(systemStore.settings.volume, 50);
  });

  test("resetSystem should clear only system store", () => {
    useGameStore("player").name = "Twinsen";
    useSceneStore("current").id = 1;
    useSystemStore("settings").volume = 50;

    resetSystem();

    const gameStore = useGameStore();
    const sceneStore = useSceneStore();
    const systemStore = useSystemStore();

    expect.equal(gameStore.player.name, "Twinsen");
    expect.equal(sceneStore.current.id, 1);
    expect.equal(Object.keys(systemStore).length, 0);
  });

  // JSON serialization tests
  test("saveToJson should return valid JSON string", () => {
    useGameStore("player").name = "Twinsen";
    useSceneStore("current").id = 5;
    useSystemStore("settings").volume = 75;

    const json = saveToJson();

    expect.equal(typeof json, "string");
    expect.true(json.length > 0);

    // Verify it's valid JSON
    const parsed = JSON.parse(json);
    expect.equal(typeof parsed, "object");
    expect.equal(parsed.game.player.name, "Twinsen");
    expect.equal(parsed.scene.current.id, 5);
    expect.equal(parsed.system.settings.volume, 75);
  });

  test("loadFromJson should restore from valid JSON", () => {
    const testData = {
      game: { player: { name: "Zoe", level: 10 } },
      scene: { current: { id: 3, name: "Citadel" } },
      system: { settings: { volume: 80, difficulty: "normal" } },
    };

    loadFromJson(JSON.stringify(testData));

    expect.equal(useGameStore("player", "name"), "Zoe");
    expect.equal(useGameStore("player", "level"), 10);
    expect.equal(useSceneStore("current", "id"), 3);
    expect.equal(useSceneStore("current", "name"), "Citadel");
    expect.equal(useSystemStore("settings", "volume"), 80);
    expect.equal(useSystemStore("settings", "difficulty"), "normal");
  });

  test("loadFromJson with null, undefined or empty string should reset all stores", () => {
    for (const input of ["", null, undefined]) {
      useGameStore("test").value = 1;
      useSceneStore("test").value = 2;
      useSystemStore("test").value = 3;

      loadFromJson(input);

      expect.equal(Object.keys(useGameStore()).length, 0);
      expect.equal(Object.keys(useSceneStore()).length, 0);
      expect.equal(Object.keys(useSystemStore()).length, 0);
    }
  });

  test("loadFromJson should handle invalid JSON gracefully", () => {
    useGameStore("original").value = "should remain";

    // This should not throw and should not change the store
    loadFromJson("invalid json {");

    expect.equal(useGameStore("original", "value"), "should remain");
  });

  test("loadFromJson should handle non-object JSON gracefully", () => {
    useGameStore("original").value = "should remain";

    loadFromJson(JSON.stringify("string value"));
    expect.equal(useGameStore("original", "value"), "should remain");

    loadFromJson(JSON.stringify(123));
    expect.equal(useGameStore("original", "value"), "should remain");

    loadFromJson(JSON.stringify(true));
    expect.equal(useGameStore("original", "value"), "should remain");
  });

  // Backup system tests
  test("saveBackup should create backup in system store", () => {
    useGameStore("player").name = "Twinsen";
    useSceneStore("current").id = 7;
    useSystemStore("settings").volume = 90;

    saveBackup();

    const backup = useSystemStore("backup");
    expect.equal(typeof backup, "object");
    expect.equal(backup.game.player.name, "Twinsen");
    expect.equal(backup.scene.current.id, 7);
    expect.equal(backup.system.settings.volume, 90);
  });

  test("saveBackup should not include existing backup in new backup", () => {
    useGameStore("player").name = "Twinsen";
    useSystemStore("settings").volume = 50;

    // Create first backup
    saveBackup();

    // Verify backup was created and contains current data
    let backup = useSystemStore("backup");
    expect.equal(backup.game.player.name, "Twinsen");
    expect.equal(backup.system.settings.volume, 50);
    expect.equal(backup.system.backup, undefined); // No nested backup

    // Change data and create second backup
    useGameStore("player").name = "Zoe";
    useSystemStore("settings").volume = 75;
    saveBackup();

    // Verify new backup doesn't contain the previous backup
    backup = useSystemStore("backup");
    expect.equal(backup.game.player.name, "Zoe");
    expect.equal(backup.system.settings.volume, 75);
    expect.equal(backup.system.backup, undefined); // Still no nested backup - this is the key test
  });

  test("loadBackup should restore from backup", () => {
    // Set initial data and create backup
    useGameStore("player").name = "Twinsen";
    useSceneStore("current").id = 8;
    saveBackup();

    // Change data
    useGameStore("player").name = "Zoe";
    useSceneStore("current").id = 9;
    useSystemStore("newData").value = "new";

    // Load backup
    loadBackup();

    expect.equal(useGameStore("player", "name"), "Twinsen");
    expect.equal(useSceneStore("current", "id"), 8);
    expect.equal(useSystemStore("newData"), {});
  });

  test("loadBackup with no backup should reset all and log error", () => {
    useGameStore("player").name = "Twinsen";

    // Capture console.error
    let errorMessage = "";
    const originalError = console.error;
    console.error = (msg) => {
      errorMessage = msg;
    };

    loadBackup();

    // Restore console.error
    console.error = originalError;

    expect.equal(Object.keys(useGameStore()).length, 0);
    expect.equal(errorMessage, "No backup found to load");
  });

  test("multiple backups should only keep the latest", () => {
    useGameStore("version").number = 1;
    saveBackup();

    useGameStore("version").number = 2;
    saveBackup();

    useGameStore("version").number = 3;

    loadBackup();

    expect.equal(useGameStore("version", "number"), 2);
  });

  // Store structure tests
  test("deep nesting should work correctly", () => {
    const deepData = useGameStore("level1", "level2", "level3", "level4");
    deepData.value = "deep";

    expect.equal(
      useGameStore("level1", "level2", "level3", "level4", "value"),
      "deep"
    );
    expect.equal(useGameStore().level1.level2.level3.level4.value, "deep");
  });

  // Edge cases and error handling
  test("accessing non-existent paths should create empty objects", () => {
    const nonExistent = useGameStore("does", "not", "exist");
    nonExistent.value = "created";
    expect.equal(typeof nonExistent, "object");
    expect.equal(Object.keys(nonExistent).length, 1);
    expect.equal(useGameStore().does.not.exist.value, "created");
  });
});
