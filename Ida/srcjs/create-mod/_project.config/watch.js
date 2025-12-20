/**
 * Watches for file changes in the src/ and media/ directories
 * and runs the sync script to copy changed files to the game mod directory.
 * Exits when the LBA2.exe process is no longer running.
 */

const chokidar = require("chokidar");
const { spawn, exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);
const PROC_NAME = "LBA2.exe";

let syncing = null;
function runSync() {
  if (syncing) return; // prevent overlapping syncs
  syncing = spawn("npm", ["run", "sync"], { stdio: "inherit", shell: true });
  syncing.on("exit", () => (syncing = null));
}

const watcher = chokidar.watch(["src/**/*.js", "media/**/*.png"], {
  ignoreInitial: true,
});

watcher.on("all", () => runSync());

async function isProcRunning() {
  try {
    const { stdout } = await execAsync(
      `powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq '${PROC_NAME.replace(".exe", "")}'} | Select-Object -First 1"`,
      {
        timeout: 5000,
      }
    );
    return stdout.trim().length > 0;
  } catch (error) {
    // Process not found or command failed
    return false;
  }
}

async function killGameProc() {
  try {
    await execAsync(
      `powershell -Command "Stop-Process -Name '${PROC_NAME.replace(".exe", "")}' -Force -ErrorAction SilentlyContinue"`
    );
  } catch (e) {
    // Process may already be stopped
  }
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
  } catch (e) {
    // if process listing fails, you can decide to ignore or stop
  }
}, 1000);

// Ctrl+C cleanup
process.on("SIGINT", async () => {
  console.log("Caught interrupt signal. Exiting watcher.");

  clearInterval(interval);
  await watcher.close();
  await killGameProc();

  process.exit(0);
});
