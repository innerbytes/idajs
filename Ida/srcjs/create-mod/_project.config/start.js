const path = require("path");
const { execFileSync, spawn } = require("child_process");

const { getArgValue, getIdaJsPath, getIdaJsServer, getPackageName } = require("./project");

function runRemote(args) {
  const child = spawn(process.execPath, [path.join(__dirname, "run-remote.js"), ...args], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

function runLocal() {
  try {
    execFileSync(
      "powershell",
      [
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(__dirname, "run.ps1"),
        getPackageName(),
      ],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      }
    );
    process.exit(0);
  } catch (error) {
    if (typeof error.status === "number") {
      process.exit(error.status);
    }

    console.error(error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const explicitServer = getArgValue("--server", args);
const installDir = getIdaJsPath();
const configuredServer = getIdaJsServer();

if (explicitServer) {
  runRemote(args);
} else if (!installDir && configuredServer) {
  runRemote(["--server", configuredServer]);
} else {
  runLocal();
}
