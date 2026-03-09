const path = require("path");
const { execFile, spawn } = require("child_process");

const { getArgValue, getIdaJsPath, getIdaJsServer, getPackageName } = require("./project");

function runCommand(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  let interruptHandled = false;

  if (options.onSigint) {
    process.on("SIGINT", async () => {
      if (interruptHandled) {
        return;
      }

      interruptHandled = true;

      try {
        await options.onSigint();
      } catch (error) {
        console.error(error.message);
      }
    });
  }

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

function killLocalGameProc() {
  return new Promise((resolve) => {
    execFile(
      "powershell",
      [
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "Stop-Process -Name 'LBA2' -Force -ErrorAction SilentlyContinue",
      ],
      () => resolve()
    );
  });
}

const args = process.argv.slice(2);
const server = getArgValue("--server", args);
const installDir = getIdaJsPath();
const configuredServer = getIdaJsServer();

if (server) {
  runCommand(process.execPath, [path.join(__dirname, "run-remote.js"), ...args]);
} else if (!installDir && configuredServer) {
  runCommand(process.execPath, [path.join(__dirname, "run-remote.js"), "--server", configuredServer]);
} else {
  runCommand(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(__dirname, "run.ps1"),
      getPackageName(),
    ],
    {
      onSigint: killLocalGameProc,
    }
  );
}
