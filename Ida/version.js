// Script to calculate version using SemVer format based on git commits since last tag
// Outputs the version string to stdout

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  // Read package.json to get the base version
  const packageJsonPath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const packageVersion = packageJson.version;

  try {
    // Use git describe to get version info
    const gitDescribe = execSync('git describe --tags --long --match "v*"', {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    const match = gitDescribe.match(/^v?(\d+\.\d+\.\d+)-(\d+)-g([a-f0-9]+)$/);

    if (match) {
      const [, tagVersion, commits, hash] = match;
      const commitCount = parseInt(commits, 10);

      if (commitCount === 0) {
        // No commits since tag, use clean version
        console.log(packageVersion);
      } else {
        // Commits exist, append dev pre-release identifier
        console.log(`${packageVersion}-dev.${commitCount}`);
      }
    } else {
      // Could not parse git describe output
      console.log(packageVersion);
    }
  } catch (err) {
    // Git command failed (not a git repo, git not installed, or no tags)
    console.log(packageVersion);
  }
} catch (err) {
  console.error("Failed to calculate version:", err.message);
  process.exit(1);
}
