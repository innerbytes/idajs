const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Function to read IdaJS installation directory from .idajs.json
function getIdaJsPath() {
  // Try local config first, then user home config
  const configPaths = [path.join(__dirname, ".idajs.json"), path.join(os.homedir(), ".idajs.json")];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (config.installDir) {
          return config.installDir;
        }
      } catch (err) {
        // Ignore parse errors and try next config
      }
    }
  }

  return null;
}

// Get package name from command line argument
const packageName = process.argv[2];

if (!packageName) {
  console.error("Error: Package name is required as an argument");
  console.error("Usage: node sync.js <package-name>");
  process.exit(1);
}

// Get IdaJS installation path
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

const isTypeScriptProject = (() => {
  // Check if tsconfig.json exists
  if (!fs.existsSync("tsconfig.json")) {
    return false;
  }

  // Check if there are any .ts files in src/
  if (!fs.existsSync("src")) {
    return false;
  }

  const files = fs.readdirSync("src");
  return files.some((file) => file.endsWith(".ts"));
})();

const targetBase = path.join(idaJsPath, "GameRun", "mods", packageName);
const deleteExcludeArgs = '--delete-exclude "*.ida" --delete-exclude "*.md5"';

console.log(`Syncing ${packageName}...`);

// If TypeScript project, compile first
if (isTypeScriptProject) {
  console.log("TypeScript project detected, compiling...");

  // Clean dist folder
  if (fs.existsSync("dist")) {
    console.log("Cleaning dist folder...");
    fs.rmSync("dist", { recursive: true, force: true });
  }

  // Compile TypeScript
  execSync("tsc", { stdio: "inherit" });
  console.log("Compilation complete!");
}

// Sync media folder if it exists
if (fs.existsSync("media")) {
  const mediaSyncCmd = `idasync media "${path.join(targetBase, "media")}" ${deleteExcludeArgs}`;
  console.log(`Running: ${mediaSyncCmd}`);
  execSync(mediaSyncCmd, { stdio: "inherit" });
} else {
  console.log("No media folder found, skipping media sync");
}

// Sync src folder
const sourceFolder = isTypeScriptProject ? "dist" : "src";
const srcSyncCmd = `idasync "${sourceFolder}" "${targetBase}" ${deleteExcludeArgs} --delete-exclude "media/*"`;
console.log(`Running: ${srcSyncCmd}`);
execSync(srcSyncCmd, { stdio: "inherit" });

console.log("Sync completed!");
