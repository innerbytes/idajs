const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const { getArgValue, parseServerAddress } = require("./project");
const { getRemoteGameStatus, stageAndZip, startRemoteGame, uploadMod } = require("./remote");

async function main() {
  const args = process.argv.slice(2);
  const server = parseServerAddress(getArgValue("--server", args));
  const sessionRoot = fs.mkdtempSync(path.join(os.tmpdir(), "idajs-remote-"));
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;
    fs.rmSync(sessionRoot, { recursive: true, force: true });
  };

  try {
    console.log(`Checking remote Ida listener at ${server.origin}...`);
    await getRemoteGameStatus(server);

    console.log(`Using remote staging directory: ${sessionRoot}`);
    const { modName, zipPath } = await stageAndZip(sessionRoot);
    await uploadMod(server, modName, zipPath);
    await startRemoteGame(server, modName);

    const child = spawn(
      process.execPath,
      [
        path.join(__dirname, "watch.js"),
        "--server",
        server.value,
        "--session-root",
        sessionRoot,
      ],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      }
    );

    child.on("exit", (code) => {
      cleanup();
      process.exit(code ?? 0);
    });

    child.on("error", (error) => {
      cleanup();
      console.error(error.message);
      process.exit(1);
    });

    process.on("SIGINT", () => {
      child.kill("SIGINT");
    });

    process.on("SIGTERM", () => {
      child.kill("SIGTERM");
    });
  } catch (error) {
    cleanup();
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
