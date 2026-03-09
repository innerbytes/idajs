const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const { spawn } = require("child_process");

const { createZipFromDirectories } = require("./archive");
const { getPackageName } = require("./project");

function runNodeScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, scriptName), ...args], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

function createZip(zipPath, sourceDir, rootName) {
  return createZipFromDirectories(
    zipPath,
    [{ sourceDir, zipRoot: rootName }],
    { compressionLevel: 0 }
  );
}

function request(server, method, requestPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = server.origin.startsWith("https://") ? https : http;
    const options = {
      method,
      hostname: server.host,
      port: server.port,
      path: requestPath,
      headers,
    };

    const req = client.request(options, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const responseBody = Buffer.concat(chunks).toString("utf8");

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (!responseBody) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(responseBody));
          } catch (error) {
            resolve(responseBody);
          }
          return;
        }

        reject(
          new Error(
            `${method} ${requestPath} failed with ${res.statusCode}: ${responseBody || "no body"}`
          )
        );
      });
    });

    req.on("error", (error) => {
      if (error.code === "EHOSTUNREACH" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        reject(
          new Error(
            `Cannot reach remote Ida listener at ${server.host}:${server.port}. ` +
              `Start it on the Windows machine with 'npm run listen' in the Ida folder and verify the host/port is reachable. ` +
              `Original error: ${error.code}`
          )
        );
        return;
      }

      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

async function stageMod(targetRoot) {
  const args = [];
  if (targetRoot) {
    args.push("--target-root", targetRoot);
  }

  await runNodeScript("sync.js", args);
}

async function stageAndZip(targetRoot) {
  const modName = getPackageName();
  const stagedModDir = path.join(targetRoot, modName);
  const zipPath = path.join(targetRoot, `${modName}.zip`);

  await stageMod(targetRoot);
  if (fs.existsSync(zipPath)) {
    fs.rmSync(zipPath, { force: true });
  }
  await createZip(zipPath, stagedModDir, modName);

  return { modName, stagedModDir, zipPath };
}

async function uploadMod(server, modName, zipPath) {
  const body = fs.readFileSync(zipPath);
  return request(server, "POST", `/sync?modName=${encodeURIComponent(modName)}`, body, {
    "Content-Type": "application/zip",
    "Content-Length": Buffer.byteLength(body),
  });
}

async function startRemoteGame(server, modName) {
  return request(
    server,
    "POST",
    "/game/start",
    Buffer.from(JSON.stringify({ modName }), "utf8"),
    {
      "Content-Type": "application/json",
    }
  );
}

async function killRemoteGame(server) {
  return request(server, "POST", "/game/kill");
}

async function getRemoteGameStatus(server) {
  return request(server, "GET", "/game/status");
}

module.exports = {
  getRemoteGameStatus,
  killRemoteGame,
  stageMod,
  stageAndZip,
  startRemoteGame,
  uploadMod,
};
