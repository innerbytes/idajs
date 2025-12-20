// typedoc-plugin.js
// Extends the header with custom html

const { PageEvent } = require("typedoc");
const fs = require("fs");
const path = require("path");

// Auto-load .env if present
try {
  const dotenvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(dotenvPath)) {
    require("dotenv").config({ path: dotenvPath });
    console.log(`[typedoc-plugin] Loaded .env from ${dotenvPath}`);
  } else {
    console.warn(`[typedoc-plugin] No .env file found at ${dotenvPath}`);
  }
} catch (err) {
  console.warn("[typedoc-plugin] Failed to load .env:", err.message);
}

exports.load = function (app) {
  app.renderer.on(PageEvent.END, (page) => {
    if (page.url !== "index.html") return;
    if (!page.contents) return;

    page.contents = injectCanonicalTag(page.contents);
    page.contents = processIndexReferences(page.contents);
    page.contents = processExternalUrls(page.contents);
  });
};

/**
 * Injects canonical tag into HTML if not already present.
 */
function injectCanonicalTag(html) {
  const canonicalUrl = process.env.DOC_HOST_URL;
  if (!canonicalUrl) {
    console.warn("[typedoc-plugin] DOC_HOST_URL is not set. Skipping canonical tag injection.");
    return html;
  }

  if (html.includes('rel="canonical"')) {
    return html;
  }

  const canonicalTag = `<link rel="canonical" href="${canonicalUrl}">`;

  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${canonicalTag}\n</head>`);
  } else {
    return `${canonicalTag}\n${html}`;
  }
}

/**
 * Extracts global instance mappings from global.d.ts
 * @returns Array of {typeName, varName} objects for @globalInstance declarations within declare global scope
 */
function getGlobalInstances() {
  const globalDtsPath = path.resolve(__dirname, "srcjs/types/global.d.ts");

  if (!fs.existsSync(globalDtsPath)) {
    console.warn("[typedoc-plugin] global.d.ts not found, using empty mappings");
    return [];
  }

  const content = fs.readFileSync(globalDtsPath, "utf8");
  const instances = [];

  // First, extract the declare global { ... } block
  const declareGlobalMatch = content.match(/declare\s+global\s*\{([\s\S]*)\}/);
  if (!declareGlobalMatch) {
    console.warn("[typedoc-plugin] No 'declare global' block found in global.d.ts");
    return [];
  }

  const globalScope = declareGlobalMatch[1];

  // Match JSDoc comments with @globalInstance followed by var declarations within the global scope
  const pattern = /\/\*\*[\s\S]*?@globalInstance[\s\S]*?\*\/\s*var\s+(\w+)\s*:\s*(\w+)/g;
  let match;

  while ((match = pattern.exec(globalScope)) !== null) {
    const varName = match[1]; // e.g., "ida"
    const typeName = match[2]; // e.g., "Ida"
    instances.push({ typeName, varName });
  }

  return instances;
}

/**
 * Extracts global access mappings from all .d.ts files in srcjs/types
 * @returns Object mapping type names to their global access paths (e.g., { LogLevels: "ida.LogLevels" })
 */
function getGlobalAccessInstances() {
  const typesDir = path.resolve(__dirname, "srcjs/types");

  if (!fs.existsSync(typesDir)) {
    console.warn(
      "[typedoc-plugin] srcjs/types directory not found, using empty global access mappings"
    );
    return {};
  }

  const globalAccessMap = {};
  const files = fs.readdirSync(typesDir).filter((file) => file.endsWith(".d.ts"));

  for (const file of files) {
    const filePath = path.join(typesDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Match JSDoc comments with @globalAccess {@link ...} followed by interface/type declarations
    const pattern =
      /\/\*\*[\s\S]*?@globalAccess\s+\{@link\s+([\w.]+)\}[\s\S]*?\*\/\s*export\s+(?:interface|type)\s+(\w+)/g;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const globalAccessPath = match[1]; // e.g., "ida.LogLevels"
      const typeName = match[2]; // e.g., "LogLevels"
      globalAccessMap[typeName] = globalAccessPath;
    }
  }

  return globalAccessMap;
}

/**
 * Processes index.html to replace displayed text in <a> elements containing "!"
 * while keeping href attributes unchanged.
 */
function processIndexReferences(html) {
  const globalInstances = getGlobalInstances();
  const globalAccessMap = getGlobalAccessInstances();

  console.log(`[typedoc-plugin] Found ${globalInstances.length} global instances for replacement.`);

  return html.replace(/<a\s+([^>]*?)>([^<]*!+[^<]*)<\/a>/g, (match, attributes, text) => {
    console.log(`[typedoc-plugin] Processing link text: ${text}`);

    const returnUpdated = (newText) => {
      newText = newText.trim();
      console.log(`[typedoc-plugin] Updated link text: ${newText}`);
      return `<a ${attributes}>${newText}</a>`;
    };

    let newText;

    // Replace global object references with JS notation
    for (const { typeName, varName } of globalInstances) {
      const regex = new RegExp(`index!${typeName}(\\.(\\w+))?\\b`, "g");
      newText = text.replace(regex, `${varName}$1`);
      if (newText !== text) return returnUpdated(newText);
    }

    // Replace global access references with full path
    for (const [typeName, globalPath] of Object.entries(globalAccessMap)) {
      const regex = new RegExp(`index!${typeName}(\\.(\\w+))?\\b`, "g");
      newText = text.replace(regex, `${globalPath}$1`);
      if (newText !== text) return returnUpdated(newText);
    }

    // Replace global references (remove global! prefix)
    newText = text.replace(/global!(\w+)/g, "$1");
    if (newText !== text) return returnUpdated(newText);

    // Replace other index references (remove index! prefix)
    newText = text.replace(/index!(\w+)(\.(\w+))?\b/g, "$1$2");
    return returnUpdated(newText);
  });
}
/**
 * Processes HTML to add target="_blank" to external links
 * (links starting with http/https but not matching DOC_HOST_URL)
 */
function processExternalUrls(html) {
  const docHostUrl = process.env.DOC_HOST_URL;

  if (!docHostUrl) {
    console.warn("[typedoc-plugin] DOC_HOST_URL is not set. Skipping external URL processing.");
    return html;
  }

  // Normalize DOC_HOST_URL (remove trailing slash for comparison)
  const normalizedHostUrl = docHostUrl.replace(/\/$/, "");

  return html.replace(/<a\s+([^>]*?)>/g, (match, attributes) => {
    // Extract href attribute
    const hrefMatch = attributes.match(/href=["']([^"']+)["']/);
    if (!hrefMatch) return match;

    const href = hrefMatch[1];

    // Check if it's an external link (starts with http/https but not our DOC_HOST_URL)
    const isExternal = /^https?:\/\//i.test(href) && !href.startsWith(normalizedHostUrl);

    if (!isExternal) return match;

    // Check if target="_blank" already exists
    if (/target=["']_blank["']/i.test(attributes)) return match;

    // Add target="_blank" to attributes
    return `<a ${attributes} target="_blank">`;
  });
}
