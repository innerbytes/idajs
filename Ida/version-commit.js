// Script to commit version bump with standardized message
// Reads version from package.json and commits staged files

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  // Read package.json to get the version
  const packageJsonPath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const version = packageJson.version;

  // Run git commit with version message
  execSync(`git commit -m "chore: bump version to ${version}"`, {
    stdio: "inherit",
  });
} catch (err) {
  console.error("Failed to commit version:", err.message);
  process.exit(1);
}
