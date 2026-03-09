// This require triggers circular-02 to load, which in turn requires
// circular-01 back. Since circular-01 hasn't finished exporting yet,
// circular-02 gets an empty object {} for circular01.
const circular02 = require("./circular-02");

function greetFrom01(name) {
  return circular02.greetFrom02(name);
}

module.exports = { greetFrom01 };
