#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * View save names from LBA save files
 * Usage: node view-savenames.js [subfolder]
 */

function extractSaveName(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);

    let nameBytes = [];
    for (let i = 5; i < buffer.length; i++) {
      if (buffer[i] === 0) {
        // Found null terminator
        break;
      }
      nameBytes.push(buffer[i]);
    }

    // Convert bytes to ASCII string
    const saveName = Buffer.from(nameBytes).toString("ascii");
    return saveName;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function viewSaveNames(subfolder = "") {
  const baseSavePath = path.join(__dirname, "..", "GameRun", "save");
  const targetPath = subfolder ? path.join(baseSavePath, subfolder) : baseSavePath;

  // Check if directory exists
  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Directory not found: ${targetPath}`);
    process.exit(1);
  }

  // Read all files in the directory (non-recursive)
  let files;
  try {
    files = fs.readdirSync(targetPath);
  } catch (error) {
    console.error(`Error reading directory ${targetPath}:`, error.message);
    process.exit(1);
  }

  // Filter for .LBA files
  const lbaFiles = files.filter((file) => file.toLowerCase().endsWith(".lba"));

  if (lbaFiles.length === 0) {
    console.log(`No .LBA files found in ${targetPath}`);
    return;
  }

  console.log(`\nSave files in: ${targetPath}\n`);
  console.log("─".repeat(60));

  // Process each LBA file
  const results = [];
  for (const file of lbaFiles) {
    const filePath = path.join(targetPath, file);
    const saveName = extractSaveName(filePath);
    results.push({ file, saveName });
  }

  // Sort by filename
  results.sort((a, b) => a.file.localeCompare(b.file));

  // Display results
  for (const { file, saveName } of results) {
    if (saveName !== null) {
      console.log(`${file.padEnd(30)} → ${saveName}`);
    } else {
      console.log(`${file.padEnd(30)} → [Error reading save name]`);
    }
  }

  console.log("─".repeat(60));
  console.log(`Total: ${lbaFiles.length} save file(s)\n`);
}

// Handle command line arguments
const allArgs = process.argv.slice(2);
const paths = allArgs.filter((arg) => !arg.startsWith("--"));

// Get subfolder argument (if any)
const subfolder = paths[0] || "";

// Run the viewer
viewSaveNames(subfolder);
