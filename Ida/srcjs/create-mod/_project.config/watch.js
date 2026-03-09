/**
 * Watches for file changes in the src/ and media/ directories.
 * Local mode syncs directly into the game mod directory.
 * Remote mode stages the mod into a session temp folder and uploads a full zip.
 */

const chokidar = require("chokidar");
const { exec } = require("child_process");
const { promisify } = require("util");

const { getArgValue, parseServerAddress } = require("./project");
const { getRemoteGameStatus, killRemoteGame, stageAndZip, stageMod, uploadMod } = require("./remote");

const execAsync = promisify(exec);
const PROC_NAME = "LBA2.exe";
const args = process.argv.slice(2);
const serverArg = getArgValue("--server", args);
const sessionRoot = getArgValue("--session-root", args);
const server = serverArg ? parseServerAddress(serverArg) : null;

if (server && !sessionRoot) {
  console.error("Remote watch mode requires --session-root <path>.");
  process.exit(1);
}

let syncing = false;
let syncQueued = false;

async function runLocalSync() {
  if (syncing) {
    syncQueued = true;
    return;
  }

  syncing = true;
  do {
    syncQueued = false;
    try {
      await stageMod();
    } catch (error) {
      console.error(error.message);
    }
  } while (syncQueued);
  syncing = false;
}

async function runRemoteSync() {
  if (syncing) {
    syncQueued = true;
    return;
  }

  syncing = true;
  do {
    syncQueued = false;
    try {
      const { modName, zipPath } = await stageAndZip(sessionRoot);
      await uploadMod(server, modName, zipPath);
    } catch (error) {
      console.error(error.message);
    }
  } while (syncQueued);
  syncing = false;
}

const watcher = chokidar.watch(["src/**/*.js", "src/**/*.ts", "media/**/*.png"], {
  ignoreInitial: true,
});

watcher.on("all", async () => {
  if (server) {
    await runRemoteSync();
    return;
  }

  await runLocalSync();
});

async function isLocalProcRunning() {
  try {
    const { stdout } = await execAsync(
      `tasklist /FI "IMAGENAME eq ${PROC_NAME}" /FO CSV /NH`,
      {
        timeout: 5000,
      }
    );
    return stdout.toLowerCase().includes(`"${PROC_NAME.toLowerCase()}"`);
  } catch (error) {
    return false;
  }
}

async function killLocalGameProc() {
  try {
    await execAsync(`taskkill /IM "${PROC_NAME}" /F /T`);
  } catch (error) {
    // Process may already be stopped.
  }
}

async function isProcRunning() {
  if (server) {
    const status = await getRemoteGameStatus(server);
    return Boolean(status && status.running);
  }

  return isLocalProcRunning();
}

async function killGameProc() {
  if (server) {
    await killRemoteGame(server);
    return;
  }

  await killLocalGameProc();
}

const interval = setInterval(async () => {
  try {
    const alive = await isProcRunning();
    if (!alive) {
      console.log(`${PROC_NAME} not running. Exiting watcher.`);

      clearInterval(interval);
      await watcher.close();
      process.exit(0);
    }
  } catch (error) {
    console.error(error.message);
  }
}, 1000);

process.on("SIGINT", async () => {
  console.log("Caught interrupt signal. Exiting watcher.");

  clearInterval(interval);
  await watcher.close();
  await killGameProc();

  process.exit(0);
});
