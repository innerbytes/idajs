#!/usr/bin/env node

// Load environment variables from .env file
require("dotenv").config();

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Configuration
const DEPLOY_REPO_URL = process.env.DEPLOY_REPO_URL;
const DOC_HOST_URL = process.env.DOC_HOST_URL;

if (!DEPLOY_REPO_URL || !DOC_HOST_URL) {
  console.error(`❌ ERROR: DEPLOY_REPO_URL or DOC_HOST_URL environment variable is not set.

For local development:
  1. Copy .env.example to .env
  2. Add your deployment repository URL to .env

For GitHub Actions:
  Set DEPLOY_REPO_URL as a repository secret
  Set DOC_HOST_URL pointing to your documentation site root URL`);
  process.exit(1);
}

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
 * Recursively copies directory contents
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
 * Gets current version information using version.js
 * @returns {{isDev: boolean, lastReleaseTag: string, revision: number}} Version info object
 */
function getCurrentReleaseTag() {
  // Get version from version.js
  const versionOutput = exec("node version.js", {
    silent: true,
    ignoreError: false,
  });

  if (!versionOutput) {
    throw new Error("Could not get version from version.js");
  }

  // Parse version string
  // Format: #.#.# or #.#.#-dev.#
  const devMatch = versionOutput.match(/^(\d+\.\d+\.\d+)-dev\.(\d+)$/);
  if (devMatch) {
    // Dev version
    return {
      isDev: true,
      lastReleaseTag: `v${devMatch[1]}`,
      revision: parseInt(devMatch[2], 10),
    };
  }

  const releaseMatch = versionOutput.match(/^(\d+\.\d+\.\d+)$/);
  if (releaseMatch) {
    // Release version
    return {
      isDev: false,
      lastReleaseTag: `v${releaseMatch[1]}`,
      revision: 0,
    };
  }

  throw new Error(`Invalid version format from version.js: ${versionOutput}`);
}

/**
 * Gets all release tags sorted by version
 * @returns {string[]} Array of release tags sorted from oldest to newest
 */
function getAllReleaseTags() {
  // Use git's built-in version sort (v:refname) for proper numeric comparison
  const tags = exec("git tag --sort=v:refname", { silent: true });
  const releaseTagPattern = /^v\d+\.\d+\.\d+$/;

  return tags.split("\n").filter((tag) => tag && releaseTagPattern.test(tag));
}

/**
 * Checks if the current tag is the latest release tag
 * @param {string} currentTag - The current tag
 * @returns {boolean} True if current tag is the latest
 */
function isLatestTag(currentTag) {
  const allTags = getAllReleaseTags();
  return allTags.length > 0 && allTags[allTags.length - 1] === currentTag;
}

/**
 * Parses version string (v#.#.# or v#.#.#-#) into comparable array [major, minor, patch]
 * @param {string} versionStr - Version string like "v0.1.2" or "v0.1.2-5"
 * @returns {number[]} Array of [major, minor, patch]
 */
function parseVersion(versionStr) {
  const match = versionStr.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-\d+)?$/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

/**
 * Compares two version strings
 * @param {string} a - First version
 * @param {string} b - Second version
 * @returns {number} -1 if a < b, 0 if equal, 1 if a > b
 */
function compareVersions(a, b) {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

/**
 * Discovers all available versions from the deploy repository
 * @param {string} deployRepoPath - Path to cloned deploy repository
 * @param {boolean} isDev - Whether the current version is a dev version
 * @param {string} currentTag - The current tag being published
 * @param {number} revision - The revision number for dev versions
 * @returns {string[]} Array of version strings (v#.#.#) sorted from latest to oldest
 */
function discoverVersions(deployRepoPath, isDev, currentTag, revision) {
  const versions = new Set();
  const versionPattern = /^v\d+\.\d+\.\d+(-\d+)?$/;

  // Find all v#.#.# or v#.#.#-# directories in the deploy repo
  const entries = fs.readdirSync(deployRepoPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (isDev) {
        // For dev mode, skip versions that match currentTag or start with currentTag-
        if (entry.name === currentTag || entry.name.startsWith(`${currentTag}-`)) {
          continue;
        }
        // Add other versions matching the pattern
        if (versionPattern.test(entry.name)) {
          versions.add(entry.name);
        }
      } else {
        // For release mode, add all versions matching the pattern
        if (versionPattern.test(entry.name)) {
          versions.add(entry.name);
        }
      }
    }
  }

  if (isDev) {
    // For dev mode, add the latest revision
    versions.add(`${currentTag}-${revision}`);
  } else {
    // For release mode, add current tag
    versions.add(currentTag);
  }

  // Convert to array and sort from newest to oldest
  const sortedVersions = Array.from(versions).sort((a, b) => compareVersions(b, a));

  return sortedVersions;
}

/**
 * Builds the versions.json array
 * @param {string[]} versions - Array of version strings sorted from latest to oldest
 * @returns {object[]} Array of version objects with name and url
 */
function buildVersionsJson(versions) {
  const result = [];
  const baseUrl = DOC_HOST_URL.replace(/\/$/, "");

  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    // Remove 'v' prefix and anything after '-' (e.g., v0.1.2-5 -> 0.1.2)
    const versionWithoutV = version.substring(1).split("-")[0];

    // First version (newest) gets the " (latest)" suffix
    const name = i === 0 ? `${versionWithoutV} (latest)` : versionWithoutV;

    result.push({
      name: name,
      url: `${baseUrl}/${version}`,
    });
  }

  return result;
}

/**
 * Main function to publish documentation
 */
async function publishDocs() {
  console.log("Starting documentation publishing process...\n");

  const docsDir = path.join(process.cwd(), "docs");
  const tempDir = path.join(os.tmpdir(), `ida-docs-deploy-${Date.now()}`);

  let deployRepoCloned = false;
  let step = 1;

  try {
    // Check if we're on a release tag
    console.log(`Step ${step++}: Checking current tag...`);

    const { isDev, lastReleaseTag: currentTag, revision } = getCurrentReleaseTag();
    if (!isDev) {
      console.log(`✓ Currently on release tag: ${currentTag}`);
    } else {
      console.log(
        `Currently on a dev version (not a release tag): ${currentTag}, rev ${revision}. Will update the latest documentation version`
      );
    }

    // Clone the docs deploy repository
    console.log(`Step ${step++}: Cloning docs deploy repository...`);
    console.log(`Cloning to: ${tempDir}`);
    exec(`git clone ${DEPLOY_REPO_URL} "${tempDir}"`);
    deployRepoCloned = true;
    console.log("✓ Repository cloned successfully\n");

    // Discover versions and generate versions.json
    console.log(`Step ${step++}: Discovering versions and generating versions.json...`);
    const versions = discoverVersions(tempDir, isDev, currentTag, revision);
    const versionsJson = buildVersionsJson(versions);
    const versionsJsonPath = path.join(tempDir, "versions.json");
    fs.writeFileSync(versionsJsonPath, JSON.stringify(versionsJson, null, 2), "utf8");
    console.log(`✓ Generated versions.json with ${versions.length} version(s): ${versions.join(", ")}\n`);

    // Run typedoc
    console.log(`Step ${step++}: Generating documentation with typedoc...`);
    exec("npx typedoc");
    console.log("✓ Documentation generated successfully\n");

    // Prapering version
    const version = isDev ? `${currentTag}-${revision}` : currentTag;

    // Create version.txt in docs folder
    console.log(`Step ${step++}: Creating version.txt...`);
    const versionFilePath = path.join(docsDir, "version.txt");
    fs.writeFileSync(versionFilePath, version, "utf8");
    console.log(`✓ Created version.txt with content: ${version}\n`);

    // Copy documentation to deploy repo
    console.log(`Step ${step++}: Copying documentation files...`);

    // If it's dev mode, remove the old versioned folder (should start with currentTag- or be exactly currentTag)
    if (isDev) {
      const entries = fs.readdirSync(tempDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && (entry.name === currentTag || entry.name.startsWith(`${currentTag}-`))) {
          const oldVersionPath = path.join(tempDir, entry.name);
          console.log(`  → Removing old dev version folder: ${entry.name}`);
          removeRecursive(oldVersionPath);
        }
      }
    }

    const isLatest = isDev || isLatestTag(currentTag);
    if (isLatest) {
      console.log(`Current version ${version} is on or after the latest release.`);
      console.log(`Deploying to ${version} subdirectory and version.txt to root...`);

      // Copy version.txt to root
      console.log(`  → Copying version.txt to root...`);
      const rootVersionFile = path.join(tempDir, "version.txt");
      fs.copyFileSync(versionFilePath, rootVersionFile);

      // Copy to versioned subdirectory
      const versionedDir = path.join(tempDir, version);
      console.log(`  → Copying to ${version} subdirectory...`);
      if (!fs.existsSync(versionedDir)) {
        fs.mkdirSync(versionedDir, { recursive: true });
      }

      copyRecursive(docsDir, versionedDir);

      console.log("✓ Documentation files copied to versioned folder and version.txt to root\n");
    } else {
      console.log(`Current version ${version} is an older release.`);
      console.log(`Deploying only to ${version} subdirectory...`);

      const versionedDir = path.join(tempDir, version);
      if (!fs.existsSync(versionedDir)) {
        fs.mkdirSync(versionedDir, { recursive: true });
      }
      copyRecursive(docsDir, versionedDir);

      console.log("✓ Documentation files copied to versioned folder\n");
    }

    // Commit and push
    console.log(`Step ${step++}: Committing and pushing changes...`);

    // Stage all changes
    exec("git add -A", { cwd: tempDir });

    // Check if there are changes to commit
    const status = exec("git status --porcelain", { cwd: tempDir, silent: true });

    if (!status) {
      console.log("ℹ No changes to commit. Documentation is already up to date.");
    } else {
      const commitMessage = isLatest
        ? `Update documentation for ${version} (latest)\n\nGenerated with TypeDoc`
        : `Add documentation for ${version}\n\nGenerated with TypeDoc`;

      exec(`git commit -m "${commitMessage}"`, { cwd: tempDir });
      exec("git push", { cwd: tempDir });
      console.log("✓ Changes committed and pushed successfully\n");
    }

    // Cleanup
    console.log(`Step ${step++}: Cleaning up...`);
    removeRecursive(docsDir);
    console.log("✓ Removed ./docs folder");
    removeRecursive(tempDir);
    console.log("✓ Removed temporary deploy repository\n");

    console.log("🎉 Documentation published successfully!");
    console.log(`Version: ${version} ${isLatest ? "(latest)" : ""}`);
  } catch (error) {
    console.error("\n❌ Error during documentation publishing:");
    console.error(error.message);

    // Cleanup on error
    console.log("\nCleaning up after error...");
    try {
      if (fs.existsSync(docsDir)) {
        removeRecursive(docsDir);
        console.log("✓ Removed ./docs folder");
      }
      if (deployRepoCloned && fs.existsSync(tempDir)) {
        removeRecursive(tempDir);
        console.log("✓ Removed temporary deploy repository");
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError.message);
    }

    process.exit(1);
  }
}

// Run the script
publishDocs();
