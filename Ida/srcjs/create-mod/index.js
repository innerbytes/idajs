#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const IdaSync = require("@idajs/sync");

// Parse command line arguments
const args = process.argv.slice(2);

// Helper to get argument value
function getArgValue(argName) {
  const index = args.findIndex((arg) => arg === argName || arg.startsWith(`${argName}=`));
  if (index === -1) return null;
  const arg = args[index];
  if (arg.includes("=")) {
    return arg.split("=")[1];
  }
  return args[index + 1];
}

const projectName = args.find((arg) => !arg.startsWith("--"));
const targetDirectory = getArgValue("--dir") || getArgValue("--directory");
const idajsDir = getArgValue("--idajs-dir") || getArgValue("--idajs");
const useTypeScript = args.includes("--typescript") || args.includes("--ts");
const useJavaScript = args.includes("--javascript") || args.includes("--js");
const skipInstall = args.includes("--skip-install");
const helpRequested = args.includes("--help") || args.includes("-h");

// Show help if requested
if (helpRequested) {
  console.log(`
Usage: npx @idajs/create-mod [project-name] [options]

Arguments:
  project-name                    Name of your mod project (default: my-ida-mod)

Options:
  --dir, --directory <path>       Target directory (default: project name)
  --idajs-dir, --idajs <path>     IdaJS installation directory
  --typescript, --ts              Use TypeScript
  --javascript, --js              Use JavaScript
  --skip-install                  Skip npm install
  -h, --help                      Show this help message

Examples:
  npx @idajs/create-mod
  npx @idajs/create-mod my-awesome-mod
  npx @idajs/create-mod my-mod --typescript
  npx @idajs/create-mod my-mod --dir ./projects/my-mod --idajs C:/Projects/idajs --js
  npx @idajs/create-mod my-mod --skip-install
`);
  process.exit(0);
}

// Function to read IdaJS directory from config file
function getIdaJsDirFromConfig() {
  const configPath = path.join(os.homedir(), ".idajs.json");
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.installDir) {
        return config.installDir;
      }
    }
  } catch (err) {
    // Ignore errors, will prompt user
  }
  return null;
}

async function main() {
  console.log("Welcome to IdaJS Mod Creator!\n");

  // Determine if we need prompts
  const needsPrompts =
    !projectName || (!useTypeScript && !useJavaScript) || (!idajsDir && !getIdaJsDirFromConfig());

  let config = {
    projectName: projectName || "my-ida-mod",
    targetDirectory: targetDirectory,
    idajsDir: idajsDir,
    language: useTypeScript ? "ts" : useJavaScript ? "js" : null,
    install: !skipInstall,
  };

  // Try to get IdaJS directory from config if not provided via CLI
  if (!config.idajsDir) {
    const configDir = getIdaJsDirFromConfig();
    if (configDir) {
      config.idajsDir = configDir;
      console.log(`Found IdaJS installation: ${configDir}\n`);
    } else {
      console.log("⚠️  Warning: ~/.idajs.json not found. Make sure you have built IdaJS first.\n");
    }
  }

  // Use prompts only if needed
  if (needsPrompts) {
    const prompts = require("prompts");

    const questions = [];

    if (!projectName) {
      questions.push({
        type: "text",
        name: "projectName",
        message: "Project name:",
        initial: "my-ida-mod",
        validate: (value) => (value.length > 0 ? true : "Project name cannot be empty"),
      });
    }

    if (!config.targetDirectory) {
      questions.push({
        type: "text",
        name: "targetDirectory",
        message: "Target directory:",
        initial: (prev) => prev || config.projectName,
      });
    }

    if (!config.idajsDir) {
      questions.push({
        type: "text",
        name: "idajsDir",
        message: "IdaJS installation directory:",
        validate: (value) => {
          if (!value || value.length === 0) {
            return "IdaJS installation directory is required";
          }
          if (!fs.existsSync(value)) {
            return `Directory does not exist: ${value}`;
          }
          return true;
        },
      });
    }

    if (!config.language) {
      questions.push({
        type: "select",
        name: "language",
        message: "Select language:",
        choices: [
          { title: "JavaScript", value: "js" },
          { title: "TypeScript", value: "ts" },
        ],
        initial: 0,
      });
    }

    const response = await prompts(questions, {
      onCancel: () => {
        console.log("\nCancelled by user");
        process.exit(1);
      },
    });

    config = { ...config, ...response };
  }

  // Set target directory to project name if not specified
  if (!config.targetDirectory) {
    config.targetDirectory = config.projectName;
  }

  const targetDir = path.isAbsolute(config.targetDirectory)
    ? config.targetDirectory
    : path.join(process.cwd(), config.targetDirectory);

  // Validate IdaJS directory exists
  if (!fs.existsSync(config.idajsDir)) {
    console.error(`\n❌ Error: IdaJS installation directory does not exist: ${config.idajsDir}`);
    process.exit(1);
  }

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    console.error(`\n❌ Error: Directory already exists: ${targetDir}`);
    process.exit(1);
  }

  console.log(`\nCreating IdaJS mod in ${targetDir}...`);
  console.log(`Language: ${config.language === "js" ? "JavaScript" : "TypeScript"}`);
  console.log(`IdaJS: ${config.idajsDir}\n`);

  try {
    // Create project directory
    fs.mkdirSync(targetDir, { recursive: true });

    // Get paths
    const templatesDir = path.join(__dirname, "_project.template");

    // Copy all files and folders from _project.template using IdaSync
    console.log("Copying template files...");

    // Exclude files based on selected language
    const copyExclusions =
      config.language === "js"
        ? ["src/index.ts", "tsconfig.json"]
        : ["src/index.js", "jsconfig.json"];

    const sync = new IdaSync({
      verbose: false,
      copyExclusions: copyExclusions,
    });

    await sync.sync(templatesDir, targetDir);
    console.log("✓ Copied template structure");

    // Modify package.template.json
    const packageTemplatePath = path.join(targetDir, "package.template.json");
    const packageTemplate = JSON.parse(fs.readFileSync(packageTemplatePath, "utf8"));
    packageTemplate.name = config.projectName;
    packageTemplate.description = "This is a new IdaJS project";
    fs.writeFileSync(packageTemplatePath, JSON.stringify(packageTemplate, null, 2) + "\n");
    console.log("✓ Updated package.template.json");

    // Create .idajs.json config file
    const idajsConfig = {
      installDir: config.idajsDir,
    };
    fs.writeFileSync(
      path.join(targetDir, ".idajs.json"),
      JSON.stringify(idajsConfig, null, 2) + "\n"
    );
    console.log("✓ Created .idajs.json");

    // Call Samples/install.js to set up the project
    console.log("\nSetting up development environment...");
    const installScript = path.join(__dirname, "install.js");
    const installArgs = [installScript, targetDir];

    if (!config.install) {
      installArgs.push("--skip-install");
    }

    execSync(`node ${installArgs.map((arg) => `"${arg}"`).join(" ")}`, {
      stdio: "inherit",
    });

    // Post-process package.json to remove setup script, author, and private properties
    const finalPackageJsonPath = path.join(targetDir, "package.json");
    const finalPackageJson = JSON.parse(fs.readFileSync(finalPackageJsonPath, "utf8"));

    if (finalPackageJson.scripts && finalPackageJson.scripts.setup) {
      delete finalPackageJson.scripts.setup;
    }
    if (finalPackageJson.author !== undefined) {
      delete finalPackageJson.author;
    }
    if (finalPackageJson.private !== undefined) {
      delete finalPackageJson.private;
    }

    // Remove TypeScript from devDependencies if it's a JavaScript project
    if (
      config.language === "js" &&
      finalPackageJson.devDependencies &&
      finalPackageJson.devDependencies.typescript
    ) {
      delete finalPackageJson.devDependencies.typescript;
    }

    fs.writeFileSync(finalPackageJsonPath, JSON.stringify(finalPackageJson, null, 2) + "\n");
    console.log("✓ Configured package.json");

    // Remove package.template.json as it's no longer needed
    fs.unlinkSync(packageTemplatePath);
    console.log("✓ Cleaned up template files");

    // Success message
    console.log(`\n✅ Successfully created "${config.projectName}"!\n`);
    console.log("Next steps:");
    console.log(`  cd ${path.relative(process.cwd(), targetDir) || config.targetDirectory}`);
    if (!config.install) {
      console.log("  npm install");
    }
    console.log("  npm start\n");
    console.log("Happy modding! 🎮");
  } catch (error) {
    console.error(`\n❌ Error creating project: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
