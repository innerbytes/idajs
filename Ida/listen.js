const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile, spawn } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const DEFAULT_PORT = 7770;
const PROC_NAME = "LBA2.exe";
const idaRoot = __dirname;
const hostRoot = path.resolve(idaRoot, "..");

function getArgValue(name, args = process.argv.slice(2)) {
  const index = args.findIndex((arg) => arg === name || arg.startsWith(`${name}=`));
  if (index === -1) {
    return null;
  }

  const arg = args[index];
  if (arg.includes("=")) {
    return arg.split("=").slice(1).join("=");
  }

  return args[index + 1] || null;
}

function getDefaultHost() {
  const interfaces = os.networkInterfaces();

  for (const network of Object.values(interfaces)) {
    for (const address of network || []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }

  return "127.0.0.1";
}

function parseBindAddress(hostArg) {
  if (!hostArg) {
    return {
      host: getDefaultHost(),
      port: DEFAULT_PORT,
    };
  }

  const input = hostArg.includes("://") ? hostArg : `http://${hostArg}`;
  const url = new URL(input);

  return {
    host: url.hostname,
    port: Number(url.port || DEFAULT_PORT),
  };
}

function assertModName(modName) {
  if (!modName || !/^[A-Za-z0-9._-]+$/.test(modName)) {
    throw new Error("A valid modName is required.");
  }
}

function resolveGamePaths() {
  const candidateRoots = [hostRoot, idaRoot];

  for (const root of candidateRoots) {
    const debugPath = path.join(root, "Debug", PROC_NAME);
    if (fs.existsSync(debugPath)) {
      return {
        exePath: debugPath,
        workingDir: path.dirname(debugPath),
      };
    }

    const releasePath = path.join(root, "Release", PROC_NAME);
    if (fs.existsSync(releasePath)) {
      return {
        exePath: releasePath,
        workingDir: path.dirname(releasePath),
      };
    }
  }

  throw new Error("LBA2.exe not found in Debug or Release folders.");
}

async function isGameRunning() {
  try {
    const { stdout } = await execFileAsync("tasklist", [
      "/FI",
      `IMAGENAME eq ${PROC_NAME}`,
      "/FO",
      "CSV",
      "/NH",
    ]);
    return stdout.toLowerCase().includes(`"${PROC_NAME.toLowerCase()}"`);
  } catch (error) {
    return false;
  }
}

async function killGame() {
  try {
    await execFileAsync("taskkill", ["/IM", PROC_NAME, "/F", "/T"]);
  } catch (error) {
    const output = `${error.stdout || ""}\n${error.stderr || ""}`;
    if (!/not found|no running instance/i.test(output)) {
      throw error;
    }
  }
}

function escapePowerShell(value) {
  return String(value).replace(/'/g, "''");
}

async function expandArchive(zipPath, destinationPath) {
  const command = `Expand-Archive -LiteralPath '${escapePowerShell(
    zipPath
  )}' -DestinationPath '${escapePowerShell(destinationPath)}' -Force`;

  await execFileAsync("powershell", ["-ExecutionPolicy", "Bypass", "-Command", command]);
}

function getModsRoot() {
  const candidateRoots = [hostRoot, idaRoot];

  for (const root of candidateRoots) {
    const modsRoot = path.join(root, "GameRun", "mods");
    if (fs.existsSync(path.join(root, "GameRun"))) {
      return modsRoot;
    }
  }

  return path.join(hostRoot, "GameRun", "mods");
}

function replaceModDirectory(sourceDir, targetDir) {
  const replacementDir = path.join(
    path.dirname(targetDir),
    `.incoming-${path.basename(targetDir)}-${Date.now()}`
  );

  fs.rmSync(replacementDir, { recursive: true, force: true });
  fs.renameSync(sourceDir, replacementDir);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.renameSync(replacementDir, targetDir);
}

const app = express();

app.use(express.json());

app.get("/game/status", async (req, res) => {
  try {
    res.json({ running: await isGameRunning() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/game/start", async (req, res) => {
  try {
    const modName = req.body && req.body.modName;
    assertModName(modName);

    if (await isGameRunning()) {
      res.status(409).json({ error: `${PROC_NAME} is already running.` });
      return;
    }

    const { exePath, workingDir } = resolveGamePaths();
    const child = spawn(exePath, [], {
      cwd: workingDir,
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        LBA_IDA_MOD: modName,
        LBA_IDA_NOLOGO: "1",
      },
    });
    child.unref();

    res.json({ started: true, modName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/game/kill", async (req, res) => {
  try {
    await killGame();
    res.json({ killed: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/sync",
  express.raw({
    type: "application/zip",
    limit: "1gb",
  }),
  async (req, res) => {
    let tempRoot = null;

    try {
      const modName = req.query.modName;
      assertModName(modName);

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: "Request body must contain a zip archive." });
        return;
      }

      const modsRoot = getModsRoot();
      fs.mkdirSync(modsRoot, { recursive: true });
      tempRoot = fs.mkdtempSync(path.join(modsRoot, ".incoming-"));

      const zipPath = path.join(tempRoot, "mod.zip");
      const extractPath = path.join(tempRoot, "extract");

      fs.writeFileSync(zipPath, req.body);
      fs.mkdirSync(extractPath, { recursive: true });
      await expandArchive(zipPath, extractPath);

      const extractedModDir = path.join(extractPath, modName);
      if (!fs.existsSync(extractedModDir)) {
        res.status(400).json({ error: `Archive must contain a top-level '${modName}' folder.` });
        return;
      }

      const targetDir = path.join(modsRoot, modName);
      replaceModDirectory(extractedModDir, targetDir);
      fs.rmSync(tempRoot, { recursive: true, force: true });
      tempRoot = null;

      res.json({ synced: true, modName, targetDir });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      if (tempRoot) {
        fs.rmSync(tempRoot, { recursive: true, force: true });
      }
    }
  }
);

const bindAddress = parseBindAddress(getArgValue("--host"));

app.listen(bindAddress.port, bindAddress.host, () => {
  console.log(`Ida remote listener running on http://${bindAddress.host}:${bindAddress.port}`);
});
