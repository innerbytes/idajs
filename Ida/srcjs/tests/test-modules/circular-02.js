// Due to circular dependency, circular01 is {} here because
// circular-01 hasn't finished exporting when this module loads.
const circular01 = require("./circular-01");

// TypeError: circular01.greetFrom01 is not a function
// because circular01 is an empty object due to the circular dependency.
const result = circular01.greetFrom01("world");

function greetFrom02(name) {
  return "test";
}

module.exports = { greetFrom02 };
