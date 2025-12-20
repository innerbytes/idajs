const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// Get mod name from command line argument
const modName = process.argv[2];

if (!modName) {
  console.error("Error: Mod name is required as an argument");
  console.error("Usage: node build.js <mod-name>");
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
const output = fs.createWriteStream(zipPath);
const archive = archiver("zip", {
  zlib: { level: 9 }, // Maximum compression
});

console.log(`Creating ${zipPath}...`);

// Handle archive events
output.on("close", () => {
  const sizeInKB = (archive.pointer() / 1024).toFixed(2);
  console.log(`✓ Build complete: ${zipPath} (${sizeInKB} KB)`);
});

archive.on("error", (err) => {
  console.error("Error creating archive:", err);
  process.exit(1);
});

archive.on("warning", (err) => {
  if (err.code === "ENOENT") {
    console.warn("Warning:", err);
  } else {
    throw err;
  }
});

// Pipe archive data to the file
archive.pipe(output);

// Add source folder contents to zip under modName directory
console.log(`Adding ${sourceFolder}/ → ${modName}/`);
archive.directory(sourceFolder, modName);

// Add media folder if it exists
const mediaFolder = "media";
if (fs.existsSync(mediaFolder)) {
  console.log(`Adding ${mediaFolder}/ → ${modName}/media/`);
  archive.directory(mediaFolder, `${modName}/media`);
} else {
  console.log("No media folder found, skipping");
}

// Finalize the archive
archive.finalize();
