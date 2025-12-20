const { test, expect } = require("./idatest");

test.group("Core Tests", () => {
  test("window === globalThis", () => {
    expect.eq(window, globalThis);
    expect.eq(window.window, window);
    expect.eq(global.global, global);
    expect.eq(window, this);
    expect.eq(window, global);
  });

  test("window variable works as global", () => {
    // @ts-ignore
    window.h = 5;
    // @ts-ignore
    expect.equal(h, 5);
  });

  test("correct order of microtasks and macrotasks", () => {
    const order = [];
    setTimeout(() => {
      order.push("setTimeout");
    }, 0);
    Promise.resolve().then(() => {
      order.push("Promise");
    });
    order.push("sync");

    setTimeout(() => {
      expect.equal(order[0], "sync");
      expect.equal(order[1], "Promise");
      expect.equal(order[2], "setTimeout");
    }, 100);
  });

  test("setTimeout runs function after delay", () => {
    const startTime = performance.now();
    setTimeout(() => {
      const elapsedTime = performance.now() - startTime; // Calculate elapsed time
      expect.between(950, 1050, elapsedTime);
    }, 1000);
  });

  test("clearTimeout clears timeout", () => {
    let success = false;
    const timeoutId = setTimeout(() => {
      success = true;
    }, 100);
    clearTimeout(timeoutId);
    setTimeout(() => {
      expect.false(success);
    }, 200);
  });

  test("setInterval runs function periodically", () => {
    let counter = 0;
    let counterCheck1 = false;
    let counterCheck2 = false;
    const intervalId = setInterval(() => {
      counter++;
    }, 100);

    setTimeout(() => {
      counterCheck1 = counter == 1;
    }, 150);

    setTimeout(() => {
      counterCheck2 = counter == 2;
    }, 250);

    setTimeout(() => {
      clearInterval(intervalId);
      expect.between(5, 7, counter);
      expect.true(counterCheck1);
      expect.true(counterCheck2);
    }, 600);
  });

  test("clearInterval clears interval", () => {
    let counter = 0;
    const intervalId = setInterval(() => {
      counter++;
    }, 100);
    setTimeout(() => {
      clearInterval(intervalId);
      setTimeout(() => {
        expect.between(2, 4, counter);
      }, 200);
    }, 300);
  });

  test("setTimeout runs function with default delay 0", () => {
    let success = false;
    setTimeout(() => {
      success = true;
    });
    setTimeout(() => {
      expect.true(success);
    }, 50);
  });

  test("setInterval runs function periodically with default delay around 0-55ms", () => {
    let counter = 0;

    let lastTime = performance.now();
    let averagePeriod = 0;
    let violatedPassedTime = 0;
    const intervalId = setInterval(() => {
      const passedTime = performance.now() - lastTime;
      lastTime = performance.now();
      averagePeriod += passedTime;
      if (passedTime > 55) {
        violatedPassedTime = passedTime;
      }
      counter++;
    });
    setTimeout(() => {
      averagePeriod /= counter;
      clearInterval(intervalId);
      expect.gt(20, counter);
      expect.equal(violatedPassedTime, 0);
      expect.lte(20, averagePeriod);
    }, 600);
  });

  test("setTimeout runs function with custom arguments", () => {
    setTimeout(
      (a, b, c) => {
        expect.equal(a, 2);
        expect.false(b);
        expect.equal(c, "str");
      },
      100,
      2,
      false,
      "str"
    );
  });

  test("setInterval runs function periodically with custom arguments", () => {
    let counter = 0;
    let argumentsViolated = false;
    const intervalId = setInterval(
      (a, b, c) => {
        counter++;
        argumentsViolated = a !== 2 || b !== false || c !== "str";
      },
      100,
      2,
      false,
      "str"
    );

    setTimeout(() => {
      clearInterval(intervalId);
      expect.between(5, 7, counter);
      expect.false(argumentsViolated);
    }, 600);
  });

  test("object function is bound to object", () => {
    const obj = {
      f: function () {
        expect.eq(this, obj);
      },
    };
    obj.f();
  });

  test("setTimeout callback this is global", () => {
    let returnedThis = null;

    const obj = {
      f: function () {
        returnedThis = this;
      },
    };

    setTimeout(obj.f, 50);

    setTimeout(() => {
      expect.eq(returnedThis, globalThis);
    }, 100);
  });

  test("setTimeout callback this is local if function is rebound", () => {
    let returnedThis = null;

    const obj = {
      f: function () {
        returnedThis = this;
      },
    };

    setTimeout(obj.f.bind(obj), 50);

    setTimeout(() => {
      expect.eq(returnedThis, obj);
    }, 100);
  });

  test("setTimeout called within object with different this, callback's this stays global", () => {
    let returnedThis = null;

    const obj = {
      f: function () {
        setTimeout(function () {
          returnedThis = this;
        }, 50);
      },
    };

    obj.f();

    setTimeout(() => {
      expect.eq(returnedThis, globalThis);
    }, 100);
  });

  test("setTimeout called within object with different this, and callback is arrow function, callback's this is object this", () => {
    let returnedThis = null;

    const obj = {
      f: function () {
        setTimeout(() => {
          returnedThis = this;
        }, 50);
      },
    };

    obj.f();

    setTimeout(() => {
      expect.eq(returnedThis, obj);
    }, 100);
  });

  test("exceptions in setTimeout and setInterval callback are caught", () => {
    setTimeout(() => {
      throw new Error("This error means everything is fine");
    }, 50);

    const intervalId = setInterval(() => {
      throw new Error("This error means everything is fine");
    }, 50);

    setTimeout(() => {
      clearInterval(intervalId);
      expect.true(true);
    }, 100);
  });

  test("exceptions in promise is caught", () => {
    Promise.resolve().then(() => {
      throw new Error("This error means everything is fine");
    });

    setTimeout(() => {
      expect.true(true);
    }, 50);
  });

  test("ICU works", () => {
    const formatter = new Intl.DateTimeFormat("fr", { dateStyle: "long" });
    const formattedDate = formatter.format(new Date(2025, 0, 27));
    expect.eq(formattedDate, "27 janvier 2025");
  });

  test("require works when file name is specified", () => {
    // @ts-ignore
    const testModule = require("./tests.module.js");
    const result = testModule.testFunction();
    expect.eq(result, "test");
  });

  test("require works when file name is specified without extension", () => {
    // @ts-ignore
    const testModule = require("./tests.module");
    const result = testModule.testFunction();
    expect.eq(result, "test");
  });

  test("require works with Windows relative path", () => {
    // @ts-ignore
    const testModule = require(".\\tests.module");
    const result = testModule.testFunction();
    expect.eq(result, "test");
  });

  test("require works with absolute path", () => {
    const path = __dirname + "tests.module3.js";
    const testModule = require(path);
    const result = testModule.getValue1988();
    expect.eq(result, 1988);
  });

  test("require works for nested modules", () => {
    // @ts-ignore
    const testModule = require("./tests.module.js");
    const result = testModule.getValueFromNestedModule();
    expect.eq(result, 29);
  });

  test("require works with upper path", () => {
    const testModule = require("./test-modules/test-module-01");
    const result = testModule.getValueFromUpperPathModule();
    expect.eq(result, 42);
  });

  test("require works with Windows upper path", () => {
    const testModule = require(".\\test-modules\\test-module-01");
    const result = testModule.getValueFromWindowsUpperPathModule();
    expect.eq(result, 42);
  });

  test("require works when the full exports is overwritten", () => {
    const testModule = require("./tests.module4.js");
    const result = testModule();
    expect.eq(result, 1983);
  });

  test("require provide correct directory path", () => {
    // @ts-ignore
    const testModule = require("./tests.module.js");
    const result = testModule.getDirectory();
    expect.true(result.endsWith("\\mods\\tests\\"));
  });

  test("require provide correct file path", () => {
    // @ts-ignore
    const testModule = require("./tests.module.js");
    const result = testModule.getFileName();
    expect.true(result.endsWith("\\mods\\tests\\tests.module.js"));
  });

  test("module is singleton", () => {
    const testModule1 = require("./tests.module.js");
    testModule1.setSingleValue(5);
    const testModule2 = require("./tests.module.js");
    const value = testModule2.getSingleValue();
    expect.true(testModule1 === testModule2 && value === 5);
  });

  test("module.exports equals exports", () => {
    // @ts-ignore
    const testModule = require("./tests.module.js");
    const module = testModule.getModule();
    expect.eq(module.exports, testModule);
  });

  test("require throws when file does not exist", () => {
    try {
      // @ts-ignore
      require("./non-existing-file.js");
    } catch (e) {
      expect.true(
        e instanceof Error &&
          e.message.startsWith("File not found:") &&
          e.message.endsWith("non-existing-file.js")
      );
    }
  });

  test("require throws when path is for node_modules", () => {
    try {
      // @ts-ignore
      require("tests.module.js");
    } catch (e) {
      expect.true(
        e instanceof Error && e.message.startsWith("Unexpected characters")
      );
    }
  });

  test("async test", async () => {
    await new Promise((resolve) => {
      setTimeout(() => {
        expect.true(true);
        resolve();
      }, 50);
    });
  });
});
