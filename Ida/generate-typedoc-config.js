const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const TYPEDOC_CONFIG = "./typedoc.json";
const FOOTER_FILE = "./typedoc-footer.html";

// Check if typedoc-footer.html exists
if (!fs.existsSync(FOOTER_FILE)) {
  console.warn("⚠ Warning: typedoc-footer.html not found. Skipping footer injection script.");
  process.exit(0);
}

// Check for --reset argument
if (process.argv.includes("--reset")) {
  console.log("Resetting typedoc.json...");
  try {
    execSync(`git checkout -- ${TYPEDOC_CONFIG}`, { stdio: "inherit" });
    console.log("✓ typedoc.json reset successfully");
  } catch (error) {
    console.error("Failed to reset typedoc.json");
    process.exit(1);
  }
  process.exit(0);
}

// Check for unstaged changes in typedoc.json
try {
  const gitStatus = execSync(`git status --porcelain ${TYPEDOC_CONFIG}`, { encoding: "utf8" });
  const lines = gitStatus
    .split("\n")
    // Do NOT trim; leading spaces are significant (index status)
    .filter((l) => l && l.length >= 2);

  // In porcelain format, the first column (X) is the index (staged) status,
  // the second column (Y) is the work tree (unstaged) status.
  // We only want to error when there are UNSTAGED changes (Y != ' ') or untracked files (??).
  const hasUnstaged = lines.some((line) => {
    const X = line[0];
    const Y = line[1];
    if (X === "?" && Y === "?") return true; // untracked treated as unstaged
    return Y !== " ";
  });

  if (hasUnstaged) {
    console.error(
      `✗ Error: ${TYPEDOC_CONFIG} has unstaged changes. Please stage or reset them first.`
    );
    console.error('  Run "node generate-typedoc-config.js --reset" to undo changes.');
    process.exit(1);
  }
} catch (error) {
  // If git command fails, it might not be a git repo or file is not tracked
  console.error("✗ Error: Could not check git status.");
  process.exit(1);
}

// Read and process the footer file
const footerContent = fs
  .readFileSync(FOOTER_FILE, "utf8")
  .trim()
  .replace(/\n/g, "")
  .replace(/\s+/g, " ");

// Read typedoc.json
const typedocConfig = JSON.parse(fs.readFileSync(TYPEDOC_CONFIG, "utf8"));

// Inject footer content
typedocConfig.customFooterHtml = footerContent;

// Write updated config
fs.writeFileSync(TYPEDOC_CONFIG, JSON.stringify(typedocConfig, null, 2) + "\n");

console.log("✓ Footer injected into typedoc.json");
console.log('  Remember to run "node generate-typedoc.js --reset" after generating docs.');
