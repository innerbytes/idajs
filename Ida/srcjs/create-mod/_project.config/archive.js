const fs = require("fs");
const path = require("path");
const yazl = require("yazl");

function normalizeZipPath(value) {
  return String(value || "")
    .split(path.sep)
    .join("/")
    .replace(/\/+/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

async function collectDirectoryEntries(sourceDir, zipRoot) {
  const dirents = await fs.promises.readdir(sourceDir, { withFileTypes: true });
  const sortedDirents = dirents.slice().sort((a, b) => a.name.localeCompare(b.name));
  const entries = [];

  if (sortedDirents.length === 0 && zipRoot) {
    entries.push({
      type: "directory",
      metadataPath: normalizeZipPath(zipRoot),
    });
  }

  for (const dirent of sortedDirents) {
    const sourcePath = path.join(sourceDir, dirent.name);
    const metadataPath = normalizeZipPath(path.posix.join(zipRoot, dirent.name));

    if (dirent.isDirectory()) {
      entries.push(...(await collectDirectoryEntries(sourcePath, metadataPath)));
      continue;
    }

    if (dirent.isFile()) {
      entries.push({
        type: "file",
        sourcePath,
        metadataPath,
      });
      continue;
    }

    throw new Error(`Unsupported entry type in archive source: ${sourcePath}`);
  }

  return entries;
}

async function createZipFromDirectories(zipPath, mappings, options = {}) {
  const zipfile = new yazl.ZipFile();
  const output = fs.createWriteStream(zipPath);
  const zipOptions = {};

  if (typeof options.compressionLevel === "number") {
    zipOptions.compressionLevel = options.compressionLevel;
  }

  const collectedEntries = [];
  for (const mapping of mappings) {
    if (!fs.existsSync(mapping.sourceDir)) {
      throw new Error(`Source directory not found: ${mapping.sourceDir}`);
    }

    collectedEntries.push(...(await collectDirectoryEntries(mapping.sourceDir, mapping.zipRoot)));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    function finish(error) {
      if (settled) {
        return;
      }
      settled = true;
      if (error) {
        reject(error);
        return;
      }
      resolve();
    }

    output.on("close", () => finish());
    output.on("error", finish);
    zipfile.outputStream.on("error", finish);

    zipfile.outputStream.pipe(output);

    try {
      for (const entry of collectedEntries) {
        if (entry.type === "directory") {
          zipfile.addEmptyDirectory(entry.metadataPath);
        } else {
          zipfile.addFile(entry.sourcePath, entry.metadataPath, zipOptions);
        }
      }

      zipfile.end();
    } catch (error) {
      finish(error);
    }
  });
}

module.exports = {
  createZipFromDirectories,
};
