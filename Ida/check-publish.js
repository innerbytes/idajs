// Script to check if there are changes in specific folders or files since the last version tag
// Usage: node check-publish.js <path1> [<path2> ...] [--skip-check-changes] [--dev-publish]
// Example: node check-publish.js srcjs/types
// Example: node check-publish.js srcjs/types file.txt path/folder2
// Example: node check-publish.js srcjs/types --skip-check-changes
// Example: node check-publish.js srcjs/types --dev-publish

const { execSync } = require("child_process");

/**
 * Check if there are changes in any of the specified paths between two git refs
 * @param {string[]} paths - Array of paths to check
 * @param {string} compareFromTag - Starting git ref
 * @param {string} compareToTag - Ending git ref
 * @returns {{changesFound: boolean, allChanges: Array<{path: string, changes: string}>}}
 */
function checkChangesInPaths(paths, compareFromTag, compareToTag) {
  let allChanges = [];
  let changesFound = false;

  for (const path of paths) {
    const changesInPath = execSync(
      `git diff --name-only ${compareFromTag}..${compareToTag} -- ${path}`,
      {
        encoding: "utf8",
      }
    ).trim();

    if (changesInPath) {
      changesFound = true;
      allChanges.push({ path, changes: changesInPath });
    }
  }

  return { changesFound, allChanges };
}

/**
 * Report changes and exit appropriately
 * @param {boolean} changesFound - Whether changes were found
 * @param {Array<{path: string, changes: string}>} allChanges - Array of changes by path
 * @param {string[]} paths - Array of paths that were checked
 * @param {string} compareFromTag - Starting git ref
 * @param {string} compareToTag - Ending git ref
 */
function reportChanges(changesFound, allChanges, paths, compareFromTag, compareToTag) {
  if (!changesFound) {
    const pathsString = paths.length > 1 ? `[${paths.join(", ")}]` : paths[0];
    const comparison =
      compareFromTag === compareToTag
        ? `at ${compareFromTag}`
        : compareToTag === "HEAD"
          ? `since ${compareFromTag}`
          : `between ${compareFromTag} and ${compareToTag}`;
    console.log(`✓ No changes in ${pathsString} ${comparison}. Nothing to publish.`);
    process.exit(1); // Exit with code 1 to stop the script chain
  }

  console.log(`Changes detected in the following paths:`);
  for (const { path, changes } of allChanges) {
    console.log(`\n${path}:`);
    console.log(changes);
  }
  console.log("\nProceeding with publish...");
  process.exit(0);
}

try {
  // Get all paths from command line arguments (excluding flags)
  const allArgs = process.argv.slice(2);
  const paths = allArgs.filter((arg) => !arg.startsWith("--"));

  // Check for flags in command line arguments or npm config
  const skipCheck =
    allArgs.includes("--skip-check-changes") ||
    process.env.npm_config_skip_check_changes === "true";
  const devPublish =
    allArgs.includes("--dev-publish") || process.env.npm_config_dev_publish === "true";

  if (paths.length === 0) {
    console.error("Error: Please specify at least one path to check.");
    console.error(
      "Usage: node check-publish.js <path1> [<path2> ...] [--skip-check-changes] [--dev-publish]"
    );
    process.exit(1);
  }

  // Check version type (always check, even with --skip-check-changes)
  try {
    const calculatedVersion = execSync("node version.js", { encoding: "utf8" }).trim();

    if (devPublish) {
      // For dev publish, ensure version includes "-dev."
      if (!calculatedVersion.includes("-dev.")) {
        console.error(`
❌ Error: Can only publish dev versions with --dev-publish flag.
   Current version: ${calculatedVersion}`);
        process.exit(1);
      }
    } else {
      // For stable publish, ensure version does NOT include "-dev."
      if (calculatedVersion.includes("-dev.")) {
        console.error(`
❌ Error: Cannot publish dev version as stable release.
   Current version: ${calculatedVersion}`);
        process.exit(1);
      }
    }
  } catch (err) {
    console.warn("❌ Error: Could not calculate version.", err.message);
    process.exit(1);
  }

  // If --skip-check-changes flag is present, skip remaining checks
  if (skipCheck) {
    console.log("⚠️  Skipping change checks...");
    process.exit(0);
  }

  // Get the current version
  const packageJson = require("./package.json");
  const currentVersion = packageJson.version;
  const currentTag = `v${currentVersion}`;

  try {
    // Separate logic for dev publish
    if (devPublish) {
      // For dev publish, compare current tag with HEAD
      const compareFromTag = currentTag;
      const compareToTag = "HEAD";

      console.log(
        `Checking changes in ${paths.length > 1 ? "specified paths" : paths[0]} since ${compareFromTag}...`
      );

      const { changesFound, allChanges } = checkChangesInPaths(paths, compareFromTag, compareToTag);
      reportChanges(changesFound, allChanges, paths, compareFromTag, compareToTag);
    }

    // Get all tags sorted by version
    const allTags = execSync("git tag --sort=-v:refname", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
      .trim()
      .split("\n")
      .filter((t) => t);

    if (allTags.length === 0) {
      console.log("No previous tags found, proceeding with publish...");
      process.exit(0);
    }

    // Check if current tag exists
    const currentTagExists = allTags.includes(currentTag);
    let compareFromTag, compareToTag;
    if (currentTagExists) {
      // We're on a tag, compare current tag with previous tag
      const currentTagIndex = allTags.indexOf(currentTag);

      if (currentTagIndex >= allTags.length - 1) {
        // This is the first tag
        console.log(`${currentTag} is the first tag, proceeding with publish...`);
        process.exit(0);
      }

      compareFromTag = allTags[currentTagIndex + 1]; // Previous tag
      compareToTag = currentTag;

      console.log(
        `Checking changes in ${
          paths.length > 1 ? "specified paths" : paths[0]
        } between ${compareFromTag} and ${compareToTag}...`
      );
    } else {
      // Not on a tag yet, compare latest tag with HEAD
      compareFromTag = allTags[0];
      compareToTag = "HEAD";

      console.log(
        `Checking changes in ${paths.length > 1 ? "specified paths" : paths[0]} since ${compareFromTag}...`
      );
    }

    const { changesFound, allChanges } = checkChangesInPaths(paths, compareFromTag, compareToTag);
    reportChanges(changesFound, allChanges, paths, compareFromTag, compareToTag);
  } catch (err) {
    console.log("Could not check git status");
    process.exit(1);
  }
} catch (err) {
  console.error("Error checking version:", err.message);
  process.exit(1);
}
