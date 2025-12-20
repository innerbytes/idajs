const { run, wait } = require("./idatest");

require("./test.core.js");
require("./test.events.js");
require("./test.enums.js");
require("./test.scene.js");
require("./test.store.js");
require("./test.text.js");
require("./test.image.js");
require("./test.objectHelper.js");
require("./test.utils.js");
require("./test.coroutines.js");
require("./test.integration.js");

mark.disableHotReload();

run(async (result) => {
  mark.setGameInputOnce(mark.InputFlags.MENUS);
  await wait(10);
  mark.exit(result);
});
