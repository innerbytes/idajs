// Script to help create release tags with commit history
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

try {
  // Get the new version that was just bumped
  const packageJsonPath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const newVersion = packageJson.version;
  const newTag = `v${newVersion}`;

  console.log(`\nPreparing release notes for ${newTag}...\n`);

  // Find the previous version tag
  let commitsSinceLastTag = "";
  try {
    // Get the last tag before the current commit
    const lastTag = execSync("git describe --tags --abbrev=0 HEAD^", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    console.log(`Last version: ${lastTag}`);

    // Get commits since last tag
    commitsSinceLastTag = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    // No previous tags, get all commits
    console.log("No previous version tag found, showing all commits");
    commitsSinceLastTag = execSync("git log --oneline --no-merges", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  }

  // Create release notes template
  const template = `Release ${newTag}

Changes since last release:
${commitsSinceLastTag}

# Please write your release notes above this line.
# Lines starting with '#' will be removed.
# 
# Suggested structure:
# - New features:
# - Bug fixes:
# - Breaking changes:
# - Other changes:
`;

  // Write template to temporary file
  const tmpFile = path.join(os.tmpdir(), `release-notes-${newTag}.txt`);
  fs.writeFileSync(tmpFile, template);

  // Get the editor (default to vim if not set)
  const editor = process.env.EDITOR || process.env.VISUAL || "vim";

  console.log(`\nOpening editor to compose release notes...\n`);

  // Open editor
  execSync(`${editor} "${tmpFile}"`, { stdio: "inherit" });

  // Read the edited content
  let releaseNotes = fs.readFileSync(tmpFile, "utf8");

  // Remove comment lines
  releaseNotes = releaseNotes
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n")
    .trim();

  // Clean up temp file
  fs.unlinkSync(tmpFile);

  if (!releaseNotes) {
    console.error("Error: Release notes are empty. Tag not created.");
    process.exit(1);
  }

  // Create annotated tag with release notes
  const notesFile = path.join(os.tmpdir(), `notes-${newTag}.txt`);
  fs.writeFileSync(notesFile, releaseNotes);

  execSync(`git tag -a ${newTag} -F "${notesFile}"`, { stdio: "inherit" });

  fs.unlinkSync(notesFile);

  console.log(`\n✓ Created annotated tag ${newTag}`);
  console.log(`\nRelease notes:\n${releaseNotes}\n`);
} catch (err) {
  console.error("Error creating release tag:", err.message);
  process.exit(1);
}
