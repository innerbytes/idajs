#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Get configuration from arguments or defaults
const args = process.argv.slice(2);
const targetDirArg = args.find((arg) => !arg.startsWith("--"));
const skipInstall = args.includes("--skip-install");
const idaRootArg = args.find((arg) => arg.startsWith("--ida-root="));

// Get the directory where this script was called from or use provided argument
const targetDir = targetDirArg ? path.resolve(targetDirArg) : process.cwd();

// Configuration directory is in the same directory as this script
const configDir = path.join(__dirname, "_project.config");

// Get idaRoot from argument or assume standalone mode
const idaRoot = idaRootArg ? path.resolve(idaRootArg.split("=")[1]) : null;
const versionScriptPath = idaRoot ? path.join(idaRoot, "version.js") : null;

const isTypeScriptProject = (() => {
  // Check if there are any .ts files in src/
  const srcDir = path.join(targetDir, "src");
  if (!fs.existsSync(srcDir)) {
    return false;
  }

  const files = fs.readdirSync(srcDir);
  return files.some((file) => file.endsWith(".ts"));
})();

console.log(`Installing development environment in: ${targetDir}`);
if (idaRoot) {
  console.log(`Ida root: ${idaRoot}`);
} else {
  console.log(`Running in standalone mode`);
}

// Step 1: Merge package.template.json files to create package.json
function mergePackageJson() {
  const packagePath = path.join(targetDir, "package.json");
  const globalTemplatePath = path.join(configDir, "package.template.json");
  const sampleTemplatePath = path.join(targetDir, "package.template.json");

  if (!fs.existsSync(globalTemplatePath)) {
    console.error("Error: package.template.json not found in config directory");
    process.exit(1);
  }

  if (!fs.existsSync(sampleTemplatePath)) {
    console.error("Error: package.template.json not found in sample directory");
    process.exit(1);
  }

  console.log("Merging package.template.json files to create package.json...");

  // Start with global template
  const packageJson = JSON.parse(fs.readFileSync(globalTemplatePath, "utf8"));
  const sampleTemplate = JSON.parse(fs.readFileSync(sampleTemplatePath, "utf8"));

  // Get version from version.js or package.json (standalone mode)
  let version = null;
  if (versionScriptPath && fs.existsSync(versionScriptPath)) {
    try {
      const { execSync } = require("child_process");
      version = execSync(`node "${versionScriptPath}"`, { encoding: "utf8" }).trim();
      console.log(`Using version from version.js: ${version}`);
    } catch (error) {
      console.warn("Warning: Could not read version from version.js");
    }
  } else {
    // Standalone mode: get version from package.json in the same directory as this script
    const localPackagePath = path.join(__dirname, "package.json");
    if (fs.existsSync(localPackagePath)) {
      try {
        const localPackage = JSON.parse(fs.readFileSync(localPackagePath, "utf8"));
        version = localPackage.version;
        console.log(`Using version from package.json: ${version}`);
      } catch (error) {
        console.warn("Warning: Could not read version from package.json");
      }
    }
  }

  // Set version if available
  if (version) {
    packageJson.version = version;
  }

  // Merge sample template properties (sample template takes precedence)
  if (sampleTemplate.name) {
    packageJson.name = sampleTemplate.name;
  }

  if (sampleTemplate.description) {
    packageJson.description = sampleTemplate.description;
  }

  // Merge scripts (sample template takes precedence)
  if (sampleTemplate.scripts) {
    packageJson.scripts = { ...packageJson.scripts, ...sampleTemplate.scripts };
  }

  // Merge devDependencies (sample template takes precedence)
  if (sampleTemplate.devDependencies) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...sampleTemplate.devDependencies,
    };
  }

  // Merge dependencies (sample template takes precedence)
  if (sampleTemplate.dependencies) {
    packageJson.dependencies = { ...packageJson.dependencies, ...sampleTemplate.dependencies };
  }

  // Reorder properties to ensure consistent ordering
  const orderedPackageJson = {};
  const propertyOrder = ["name", "description", "version", "author", "private", "scripts"];

  // Add properties in the specified order
  propertyOrder.forEach((key) => {
    if (packageJson[key] !== undefined) {
      orderedPackageJson[key] = packageJson[key];
    }
  });

  // Add all remaining properties
  Object.keys(packageJson).forEach((key) => {
    if (!propertyOrder.includes(key)) {
      orderedPackageJson[key] = packageJson[key];
    }
  });

  fs.writeFileSync(packagePath, JSON.stringify(orderedPackageJson, null, 2) + "\n");
  console.log("✓ Package.json created successfully");
}

// Step 2: Copy necessary files
function copyFiles() {
  const filesToCopy = [
    { source: "run.ps1" },
    { source: "watch.js" },
    { source: "sync.js" },
    { source: "build.js" },
    { source: isTypeScriptProject ? "tsconfig.json" : "jsconfig.json" },
    { source: "settings.json", target: ".vscode/settings.json" },
    { source: "extensions.json", target: ".vscode/extensions.json" },
    { source: "template.prettierrc.json", target: ".prettierrc.json" },
  ];

  filesToCopy.forEach((file) => {
    const sourcePath = path.join(configDir, file.source);
    const targetPath = path.join(targetDir, file.target || file.source);

    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: ${file.source} not found in config directory`);
      process.exit(1);
    }

    if (!fs.existsSync(path.dirname(targetPath))) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    }

    console.log(`Copying ${file.source}...`);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✓ ${file.source} copied successfully to ${targetPath}`);
  });
}

// Step 3: Run npm install
function runNpmInstall() {
  console.log("Running npm install...");

  const npmProcess = exec("npm install", { cwd: targetDir }, (error, stdout, stderr) => {
    if (error) {
      console.error("Error running npm install:", error);
      process.exit(1);
    }

    if (stderr) {
      console.error("npm install stderr:", stderr);
    }

    console.log(stdout);
    console.log("✓ npm install completed successfully");
    console.log("\nInstallation complete! You can now use the development scripts.");
  });

  npmProcess.stdout.pipe(process.stdout);
  npmProcess.stderr.pipe(process.stderr);
}

// Main execution
try {
  mergePackageJson();
  copyFiles();
  if (!skipInstall) {
    runNpmInstall();
  } else {
    console.log("\nSkipped npm install");
    console.log("\nInstallation complete! Run 'npm install' to install dependencies.");
  }
} catch (error) {
  console.error("Installation failed:", error.message);
  process.exit(1);
}
