// Script to commit version bump with standardized message
// Reads version from package.json and commits staged files
// Also updates @idajs/types version in package.template.json if needed

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Parses a semver version string and returns major and minor numbers
 * @param {string} versionStr - Version string like "0.2.9" or "^0.2.0"
 * @returns {{ major: number, minor: number }}
 */
function parseMajorMinor(versionStr) {
  // Remove ^ or ~ prefix if present
  const cleaned = versionStr.replace(/^[\^~]/, "");
  const parts = cleaned.split(".");
  return {
    major: parseInt(parts[0], 10),
    minor: parseInt(parts[1], 10),
  };
}

try {
  // Read package.json to get the version
  const packageJsonPath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const version = packageJson.version;

  // Check and update @idajs/types in package.template.json if needed
  const templatePath = path.join(
    __dirname,
    "srcjs/create-mod/_project.config/package.template.json"
  );
  const templateJson = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const typesVersion = templateJson.devDependencies["@idajs/types"];

  const current = parseMajorMinor(version);
  const template = parseMajorMinor(typesVersion);

  // Check if template major.minor is lower than current version
  const needsUpdate =
    template.major < current.major ||
    (template.major === current.major && template.minor < current.minor);

  let commitMessage = `chore: bump version to ${version}`;

  if (needsUpdate) {
    // Update to ^major.minor.0 format
    const newTypesVersion = `^${current.major}.${current.minor}.0`;
    templateJson.devDependencies["@idajs/types"] = newTypesVersion;
    fs.writeFileSync(templatePath, JSON.stringify(templateJson, null, 2) + "\n");

    console.log(
      `Updated @idajs/types in package.template.json: ${typesVersion} -> ${newTypesVersion}`
    );

    // Stage the template update
    execSync(`git add "${templatePath}"`, { stdio: "inherit" });

    // Extend commit message with types update info
    commitMessage += `\n\nUpdated @idajs/types to ${newTypesVersion} in package.template.json`;
  }

  // Run git commit with version message
  execSync(`git commit -m "${commitMessage}"`, {
    stdio: "inherit",
  });
} catch (err) {
  console.error("Failed to commit version:", err.message);
  process.exit(1);
}
