const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const { getArgValue, getIdaJsPath, getPackageName, isTypeScriptProject } = require("./project");

const args = process.argv.slice(2);
const packageName = getPackageName();
const targetRoot = getArgValue("--target-root", args);

let resolvedTargetRoot = targetRoot;
const typeScriptProject = isTypeScriptProject();
if (!resolvedTargetRoot) {
  const idaJsPath = getIdaJsPath();

  if (!idaJsPath) {
    console.error("Error: .idajs.json not found in current directory or user home directory.");
    console.error("Please build IdaJS first or create .idajs.json with 'installDir' property.");
    process.exit(1);
  }

  if (!fs.existsSync(idaJsPath)) {
    console.error(`Error: IdaJS installation directory does not exist: ${idaJsPath}`);
    console.error("Please build IdaJS first.");
    process.exit(1);
  }

  resolvedTargetRoot = path.join(idaJsPath, "GameRun", "mods");
}

const targetBase = path.join(resolvedTargetRoot, packageName);
const deleteExcludeArgs = '--delete-exclude "*.ida" --delete-exclude "*.md5"';

console.log(`Syncing ${packageName}...`);

if (typeScriptProject) {
  console.log("TypeScript project detected, compiling...");

  if (fs.existsSync("dist")) {
    console.log("Cleaning dist folder...");
    fs.rmSync("dist", { recursive: true, force: true });
  }

  execSync("tsc", { stdio: "inherit" });
  console.log("Compilation complete!");
}

if (fs.existsSync("media")) {
  const mediaSyncCmd = `idasync media "${path.join(targetBase, "media")}" ${deleteExcludeArgs}`;
  console.log(`Running: ${mediaSyncCmd}`);
  execSync(mediaSyncCmd, { stdio: "inherit" });
} else {
  console.log("No media folder found, skipping media sync");
}

const sourceFolder = typeScriptProject ? "dist" : "src";
const srcSyncCmd = `idasync "${sourceFolder}" "${targetBase}" ${deleteExcludeArgs} --delete-exclude "media/*"`;
console.log(`Running: ${srcSyncCmd}`);
execSync(srcSyncCmd, { stdio: "inherit" });

console.log("Sync completed!");
