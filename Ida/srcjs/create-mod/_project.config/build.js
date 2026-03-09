const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { createZipFromDirectories } = require("./archive");
const { getPackageName } = require("./project");

// Get mod name from command line argument
const modName = process.argv[2] || getPackageName();

if (!modName) {
  console.error("Error: Mod name is required as an argument");
  console.error("Usage: node build.js [mod-name]");
  process.exit(1);
}

console.log(`Building mod: ${modName}`);

// Check if it's a TypeScript project
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
  console.log("✓ Compilation complete");
}

// Determine source folder
const sourceFolder = isTypeScriptProject ? "dist" : "src";

if (!fs.existsSync(sourceFolder)) {
  console.error(`Error: ${sourceFolder} folder not found`);
  process.exit(1);
}

// Create build folder if it doesn't exist
const buildFolder = "build";
if (!fs.existsSync(buildFolder)) {
  fs.mkdirSync(buildFolder, { recursive: true });
}

// Create zip file
const zipPath = path.join(buildFolder, `${modName}.zip`);

async function main() {
  console.log(`Creating ${zipPath}...`);

  const mappings = [{ sourceDir: sourceFolder, zipRoot: modName }];

  console.log(`Adding ${sourceFolder}/ → ${modName}/`);

  const mediaFolder = "media";
  if (fs.existsSync(mediaFolder)) {
    console.log(`Adding ${mediaFolder}/ → ${modName}/media/`);
    mappings.push({ sourceDir: mediaFolder, zipRoot: `${modName}/media` });
  } else {
    console.log("No media folder found, skipping");
  }

  await createZipFromDirectories(zipPath, mappings, {
    compressionLevel: 9,
  });

  const sizeInKB = (fs.statSync(zipPath).size / 1024).toFixed(2);
  console.log(`✓ Build complete: ${zipPath} (${sizeInKB} KB)`);
}

main().catch((error) => {
  console.error("Error creating archive:", error);
  process.exit(1);
});
