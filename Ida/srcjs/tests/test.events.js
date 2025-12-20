const { test, expect } = require("./idatest");
// @ts-ignore
const { EventHandler } = require("./srcjs/events");

test.group("EventHandler Tests", () => {
  let eventHandler;

  test.beforeEach(() => {
    eventHandler = new EventHandler();
    // Set up a mock events object for validation
    // @ts-ignore
    eventHandler.Events = {
      TEST_EVENT: "TEST_EVENT",
      ANOTHER_EVENT: "ANOTHER_EVENT",
      THIRD_EVENT: "THIRD_EVENT",
    };
  });

  test("constructor initializes empty eventListeners object", () => {
    const handler = new EventHandler();
    expect.true(handler.eventListeners instanceof Map);
    expect.equal(handler.eventListeners.size, 0);
  });

  test("addEventListener adds callback to new event", () => {
    const callback = () => {};

    eventHandler.addEventListener("TEST_EVENT", callback);

    expect.true(eventHandler.eventListeners.has("TEST_EVENT"));
    expect.array(eventHandler.eventListeners.get("TEST_EVENT"));
    expect.count(1, eventHandler.eventListeners.get("TEST_EVENT"));
    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[0][0], callback);
    expect.equal(eventHandler.eventListeners.get("TEST_EVENT")[0][1], "");
  });

  test("addEventListener adds callback with name", () => {
    const callback = () => {};
    const name = "testCallback";

    eventHandler.addEventListener("TEST_EVENT", callback, name);

    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[0][0], callback);
    expect.equal(eventHandler.eventListeners.get("TEST_EVENT")[0][1], name);
  });

  test("addEventListener adds multiple callbacks to same event", () => {
    const callback1 = () => {};
    const callback2 = () => {};
    const callback3 = () => {};

    eventHandler.addEventListener("TEST_EVENT", callback1, "first");
    eventHandler.addEventListener("TEST_EVENT", callback2, "second");
    eventHandler.addEventListener("TEST_EVENT", callback3);

    expect.count(3, eventHandler.eventListeners.get("TEST_EVENT"));
    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[0][0], callback1);
    expect.equal(eventHandler.eventListeners.get("TEST_EVENT")[0][1], "first");
    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[1][0], callback2);
    expect.equal(eventHandler.eventListeners.get("TEST_EVENT")[1][1], "second");
    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[2][0], callback3);
    expect.equal(eventHandler.eventListeners.get("TEST_EVENT")[2][1], "");
  });

  test("addEventListener preserves order of event subscribers", () => {
    const executionOrder = [];
    const callback1 = () => executionOrder.push(1);
    const callback2 = () => executionOrder.push(2);
    const callback3 = () => executionOrder.push(3);

    eventHandler.addEventListener("TEST_EVENT", callback1);
    eventHandler.addEventListener("TEST_EVENT", callback2);
    eventHandler.addEventListener("TEST_EVENT", callback3);

    eventHandler._handleEvent("TEST_EVENT");

    expect.collectionEqual(executionOrder, [1, 2, 3]);
  });

  test("addEventListener calls signalEventSubscribed when available", () => {
    let subscribedEvents = [];
    eventHandler.signalEventSubscribed = (event) =>
      subscribedEvents.push(event);

    eventHandler.addEventListener("TEST_EVENT", () => {});
    eventHandler.addEventListener("ANOTHER_EVENT", () => {});

    expect.collectionEqual(subscribedEvents, ["TEST_EVENT", "ANOTHER_EVENT"]);
  });

  test("addEventListener validates event type", () => {
    const callback = () => {};

    expect.throws(() => {
      eventHandler.addEventListener("INVALID_EVENT", callback);
    });
  });

  test("removeEventListener removes callback by function reference", () => {
    const callback1 = () => {};
    const callback2 = () => {};

    eventHandler.addEventListener("TEST_EVENT", callback1);
    eventHandler.addEventListener("TEST_EVENT", callback2);

    eventHandler.removeEventListener("TEST_EVENT", callback1);

    expect.count(1, eventHandler.eventListeners.get("TEST_EVENT"));
    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[0][0], callback2);
  });

  test("removeEventListener removes callback by name", () => {
    const callback1 = () => {};
    const callback2 = () => {};

    eventHandler.addEventListener("TEST_EVENT", callback1, "first");
    eventHandler.addEventListener("TEST_EVENT", callback2, "second");

    eventHandler.removeEventListener("TEST_EVENT", "first");

    expect.count(1, eventHandler.eventListeners.get("TEST_EVENT"));
    expect.eq(eventHandler.eventListeners.get("TEST_EVENT")[0][0], callback2);
    expect.equal(eventHandler.eventListeners.get("TEST_EVENT")[0][1], "second");
  });

  test("removeEventListener throws error for invalid callbackOrName type", () => {
    eventHandler.addEventListener("TEST_EVENT", () => {});

    expect.throws(() => {
      eventHandler.removeEventListener("TEST_EVENT", 123);
    });

    expect.throws(() => {
      eventHandler.removeEventListener("TEST_EVENT", {});
    });

    expect.throws(() => {
      eventHandler.removeEventListener("TEST_EVENT", null);
    });
  });

  test("removeEventListener validates event type", () => {
    expect.throws(() => {
      eventHandler.removeEventListener("INVALID_EVENT", () => {});
    });
  });

  test("removeEventListener handles non-existent event gracefully", () => {
    // Should not throw error when trying to remove from non-existent event
    eventHandler.removeEventListener("TEST_EVENT", () => {});
    expect.true(true); // Test passes if no error is thrown
  });

  test("removeEventListener calls signalEventUnsubscribed when last listener removed", () => {
    let unsubscribedEvents = [];
    eventHandler.signalEventUnsubscribed = (event) =>
      unsubscribedEvents.push(event);

    const callback1 = () => {};
    const callback2 = () => {};

    eventHandler.addEventListener("TEST_EVENT", callback1);
    eventHandler.addEventListener("TEST_EVENT", callback2);

    // Remove first callback - should not signal unsubscribed
    eventHandler.removeEventListener("TEST_EVENT", callback1);
    expect.count(0, unsubscribedEvents);

    // Remove last callback - should signal unsubscribed
    eventHandler.removeEventListener("TEST_EVENT", callback2);
    expect.collectionEqual(unsubscribedEvents, ["TEST_EVENT"]);
  });

  test("removeEventListener does not call signalEventUnsubscribed when listeners remain", () => {
    let unsubscribedEvents = [];
    eventHandler.signalEventUnsubscribed = (event) =>
      unsubscribedEvents.push(event);

    const callback1 = () => {};
    const callback2 = () => {};

    eventHandler.addEventListener("TEST_EVENT", callback1);
    eventHandler.addEventListener("TEST_EVENT", callback2);

    eventHandler.removeEventListener("TEST_EVENT", callback1);

    expect.count(0, unsubscribedEvents);
    expect.count(1, eventHandler.eventListeners.get("TEST_EVENT"));
  });

  test("callbacks modify shared state in order", () => {
    const sharedState = { count: 0 };

    const callback1 = () => {
      sharedState.count += 1;
    };
    const callback2 = () => {
      sharedState.count *= 2;
    };
    const callback3 = () => {
      sharedState.count += 10;
    };

    eventHandler.addEventListener("TEST_EVENT", callback1);
    eventHandler.addEventListener("TEST_EVENT", callback2);
    eventHandler.addEventListener("TEST_EVENT", callback3);

    eventHandler._handleEvent("TEST_EVENT");

    // Should be: 0 + 1 = 1, 1 * 2 = 2, 2 + 10 = 12
    expect.equal(sharedState.count, 12);
  });

  test("complex scenario: multiple events with add/remove operations", () => {
    let event1Calls = [];
    let event2Calls = [];

    const callback1 = (data) => event1Calls.push(`callback1: ${data}`);
    const callback2 = (data) => event1Calls.push(`callback2: ${data}`);
    const callback3 = (data) => event2Calls.push(`callback3: ${data}`);

    // Add listeners to first event
    eventHandler.addEventListener("TEST_EVENT", callback1, "cb1");
    eventHandler.addEventListener("TEST_EVENT", callback2, "cb2");

    // Add listener to second event
    eventHandler.addEventListener("ANOTHER_EVENT", callback3);

    // Trigger first event
    eventHandler._handleEvent("TEST_EVENT", "test1");

    expect.count(2, event1Calls);
    expect.count(0, event2Calls);

    // Remove one callback from first event
    eventHandler.removeEventListener("TEST_EVENT", "cb1");

    // Trigger both events
    eventHandler._handleEvent("TEST_EVENT", "test2");
    eventHandler._handleEvent("ANOTHER_EVENT", "test3");

    expect.count(3, event1Calls); // callback2 called again
    expect.count(1, event2Calls); // callback3 called once

    expect.equal(event1Calls[0], "callback1: test1");
    expect.equal(event1Calls[1], "callback2: test1");
    expect.equal(event1Calls[2], "callback2: test2");
    expect.equal(event2Calls[0], "callback3: test3");
  });
});
