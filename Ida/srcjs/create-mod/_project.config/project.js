const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_PORT = 7770;

function getArgs(argv = process.argv.slice(2)) {
  return argv;
}

function getArgValue(name, argv = getArgs()) {
  const index = argv.findIndex((arg) => arg === name || arg.startsWith(`${name}=`));
  if (index === -1) {
    return null;
  }

  const arg = argv[index];
  if (arg.includes("=")) {
    return arg.split("=").slice(1).join("=");
  }

  return argv[index + 1] || null;
}

function getPackageName(projectDir = process.cwd()) {
  const packagePath = path.join(projectDir, "package.json");

  if (!fs.existsSync(packagePath)) {
    throw new Error(`package.json not found in ${projectDir}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (!packageJson.name) {
    throw new Error("package.json is missing the 'name' field");
  }

  return packageJson.name;
}

function getIdaJsPath(projectDir = process.cwd()) {
  const configPaths = [path.join(projectDir, ".idajs.json"), path.join(os.homedir(), ".idajs.json")];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) {
      continue;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.installDir) {
        return config.installDir;
      }
    } catch (error) {
      // Ignore parse failures and keep looking.
    }
  }

  return null;
}

function getIdaJsServer(projectDir = process.cwd()) {
  const configPaths = [path.join(projectDir, ".idajs.json"), path.join(os.homedir(), ".idajs.json")];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) {
      continue;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      if (config.server) {
        return config.server;
      }
    } catch (error) {
      // Ignore parse failures and keep looking.
    }
  }

  return null;
}

function isTypeScriptProject(projectDir = process.cwd()) {
  const tsConfigPath = path.join(projectDir, "tsconfig.json");
  const srcDir = path.join(projectDir, "src");

  if (!fs.existsSync(tsConfigPath) || !fs.existsSync(srcDir)) {
    return false;
  }

  const files = fs.readdirSync(srcDir);
  return files.some((file) => file.endsWith(".ts"));
}

function parseServerAddress(serverInput) {
  if (!serverInput) {
    throw new Error("Server address is required. Use --server <host[:port]>.");
  }

  const trimmedInput = String(serverInput).trim();
  const withProtocol = trimmedInput.includes("://") ? trimmedInput : `http://${trimmedInput}`;
  const url = new URL(withProtocol);

  return {
    host: url.hostname,
    port: Number(url.port || DEFAULT_PORT),
    origin: `${url.protocol}//${url.hostname}:${url.port || DEFAULT_PORT}`,
    value: `${url.hostname}:${url.port || DEFAULT_PORT}`,
  };
}

module.exports = {
  DEFAULT_PORT,
  getArgValue,
  getArgs,
  getIdaJsPath,
  getIdaJsServer,
  getPackageName,
  isTypeScriptProject,
  parseServerAddress,
};
