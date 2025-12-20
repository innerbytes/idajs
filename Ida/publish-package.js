// Script to publish any IdaJS dependent package to npm
// Usage: node publish-package.js <package-path> [--dev]
// Example: node publish-package.js srcjs/types --dev

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

try {
  const packagePath = process.argv[2];

  if (!packagePath) {
    console.error("Error: Package path is required");
    console.error("Usage: node publish-package.js <package-path> [--dev]");
    process.exit(1);
  }

  const isDev = process.argv.includes("--dev");

  const licenseSource = path.join(__dirname, "..", "LICENSE");
  const packageDir = path.join(__dirname, packagePath);
  const licenseTarget = path.join(packageDir, "LICENSE");
  const packageJsonPath = path.join(packageDir, "package.json");

  // Verify package directory exists
  if (!fs.existsSync(packageDir)) {
    console.error(`Error: Package directory not found: ${packageDir}`);
    process.exit(1);
  }

  // Sync version from version.js to package.json
  const version = execSync("node version.js", { encoding: "utf8" }).trim();
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  console.log(`Synced version ${version} to ${packagePath}/package.json`);

  // Copy LICENSE file
  fs.copyFileSync(licenseSource, licenseTarget);
  console.log(`Copied LICENSE to ${packagePath}/`);

  // Publish package
  const publishCmd = isDev
    ? "npm publish --access public --tag dev"
    : "npm publish --access public";

  let publishSuccess = false;
  try {
    execSync(publishCmd, {
      cwd: packageDir,
      stdio: "inherit",
    });
    console.log(`Successfully published package from ${packagePath}/`);
    publishSuccess = true;
  } catch (err) {
    console.error("Failed to publish package:", err.message);
  } finally {
    // Always cleanup, even if publish failed
    try {
      execSync(`git checkout ${packagePath}/package.json`, {
        cwd: __dirname,
        stdio: "inherit",
      });
      execSync(`git clean -f ${packagePath}/LICENSE`, {
        cwd: __dirname,
        stdio: "inherit",
      });
      console.log(`Cleaned up ${packagePath}/`);
    } catch (cleanupErr) {
      console.error("Failed to cleanup after publish:", cleanupErr.message);
      process.exit(1);
    }
  }

  if (!publishSuccess) {
    process.exit(1);
  }
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
