#!/usr/bin/env node

require("dotenv").config();

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Configuration
const GIT_URL =
  process.env.MAIN_REPO_URL ||
  (() => {
    console.warn(
      "⚠️  Warning: MAIN_REPO_URL not set in .env file. Using default: https://example.com/repo"
    );
    return "https://example.com/repo";
  })().replace(/\/$/, "");

/**
 * Executes a shell command and returns the output
 * @param {string} command - The command to execute
 * @param {object} options - Options for execSync
 * @returns {string} The command output
 */
function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
    // When stdio is 'inherit', execSync returns null
    return result ? result.trim() : "";
  } catch (error) {
    if (options.ignoreError) {
      return "";
    }
    throw error;
  }
}

/**
 * Gets the latest release tag using version.js
 * @returns {string|null} The latest release tag (v#.#.#), or null if not found
 */
function getCurrentReleaseTag() {
  // Call version.js to get the version
  const versionOutput = exec("node version.js", {
    silent: true,
    ignoreError: true,
  });

  if (!versionOutput) {
    // version.js returned error
    return null;
  }

  // Parse version string - can be #.#.# or #.#.#-dev.#
  const versionMatch = versionOutput.match(/^(\d+\.\d+\.\d+)(?:-dev\.\d+)?$/);

  if (versionMatch) {
    // Return v + the base version (first #.#.#)
    return `v${versionMatch[1]}`;
  }

  return null;
}

/**
 * Recursively removes a directory
 * @param {string} dir - Directory to remove
 */
function removeRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Main function to generate README
 */
async function generateReadme() {
  console.log("Starting README generation process...\n");

  let tempDir = null;

  try {
    // Step 1: Check if we're on a release tag
    console.log("Step 1: Checking current tag...");
    const currentTag = getCurrentReleaseTag();

    if (!currentTag) {
      console.error("❌ ERROR: Cannot find the current release tag.");
      process.exit(1);
    }

    console.log(`✓ Currently on release tag: ${currentTag}\n`);

    // Extract version without the 'v' prefix
    const version = currentTag.substring(1);

    // Step 2: Generate README.vars.json in temporary folder
    console.log("Step 2: Generating README.vars.json...");
    tempDir = path.join(os.tmpdir(), `readme-vars-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const varsPath = path.join(tempDir, "README.vars.json");
    const vars = {
      GIT_URL: GIT_URL,
      VERSION: version,
      ida: '<span class="idajs">IdaJS</span>',
    };

    fs.writeFileSync(varsPath, JSON.stringify(vars, null, 2), "utf8");
    console.log(`✓ Created README.vars.json with version ${version}\n`);

    // Step 3: Run mustache to generate README.md
    console.log("Step 3: Running mustache to generate README.md...");
    const templatePath = path.join(process.cwd(), "README.template.md");
    const outputPath = path.join(process.cwd(), "README.md");

    if (!fs.existsSync(templatePath)) {
      console.error(`❌ ERROR: Template file not found: ${templatePath}`);
      process.exit(1);
    }

    exec(`npx mustache "${varsPath}" "${templatePath}" > "${outputPath}"`);
    console.log("✓ README.md generated successfully\n");

    // Step 4: Cleanup
    console.log("Step 4: Cleaning up...");
    removeRecursive(tempDir);
    console.log("✓ Removed temporary files\n");

    console.log("🎉 README.md generated successfully!");
    console.log(`Version: ${version}`);
    console.log(`Git URL: ${GIT_URL}`);
  } catch (error) {
    console.error("\n❌ Error during README generation:");
    console.error(error.message);

    // Cleanup on error
    console.log("\nCleaning up after error...");
    try {
      if (tempDir && fs.existsSync(tempDir)) {
        removeRecursive(tempDir);
        console.log("✓ Removed temporary vars folder");
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError.message);
    }

    process.exit(1);
  }
}

// Run the script
generateReadme();
