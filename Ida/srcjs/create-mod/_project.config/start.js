const path = require("path");
const { spawn } = require("child_process");

const { getArgValue, getPackageName } = require("./project");

function runCommand(command, args) {
  const child = spawn(command, args, {
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

const args = process.argv.slice(2);
const server = getArgValue("--server", args);

if (server) {
  runCommand(process.execPath, [path.join(__dirname, "run-remote.js"), ...args]);
} else {
  runCommand("powershell", [
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    path.join(__dirname, "run.ps1"),
    getPackageName(),
  ]);
}
