this.window = this;
this.globalThis = this;
window.global = window;

globalThis._logLevel = 0;
console.debug = (...args) => _logLevel === 0 && logger.debug(...args);
console.log = (...args) => _logLevel <= 1 && logger.log(...args);
console.info = (...args) => _logLevel <= 1 && logger.info(...args);
console.warn = (...args) => _logLevel <= 2 && logger.warn(...args);
console.error = (...args) => _logLevel <= 3 && logger.error(...args);

require("./system.js");

// It's important to load the mod index.js as a module, to make TypeScript projects work correctly
require(modScriptPath);
