#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

// Get the current working directory (where the user runs this script from)
const targetDir = process.cwd();

// Validate execution context: target must be Ida/Samples/<sample>
const parentDir = path.dirname(targetDir);
const grandParentDir = path.dirname(parentDir);
const parentName = path.basename(parentDir);
const grandParentName = path.basename(grandParentDir);

if (parentName !== "Samples" || grandParentName !== "Ida") {
  console.error(
    [
      "This installer must be run from inside an IdaJS sample folder.",
      "Run it like:",
      "",
      "  node ../install.js",
      "",
      "Example: from inside Ida/Samples/storm",
    ].join("\n")
  );
  process.exit(1);
}

// Path to the actual install script
const installScriptPath = path.join(__dirname, "..", "srcjs", "create-mod", "install.js");

// Ida root is the parent directory of this Samples folder
const idaRoot = path.join(__dirname, "..");

// Run the install script with the target directory and ida-root as arguments
const child = spawn("node", [installScriptPath, targetDir, `--ida-root=${idaRoot}`], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code);
});
