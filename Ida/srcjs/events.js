function EventHandler() {
  this.eventListeners = new Map();
}

// Order of the event subscribers to the same event is preserved.
EventHandler.prototype.addEventListener = function (event, callback, name) {
  this._validateEvent(event);

  if (!this.eventListeners.has(event)) {
    this.eventListeners.set(event, []);
  }

  this.eventListeners.get(event).push([callback, name ?? ""]);
  // @ts-ignore
  this.signalEventSubscribed?.(event);
};

EventHandler.prototype.removeEventListener = function (event, callbackOrName) {
  this._validateEvent(event);

  const removeByFunction = typeof callbackOrName === "function";
  const removeByName = typeof callbackOrName === "string";
  if (!removeByFunction && !removeByName) {
    throw new Error("callbackOrName must be a function or a string");
  }

  if (this.eventListeners.has(event)) {
    this.eventListeners.set(
      event,
      this.eventListeners.get(event).filter((cb) => {
        if (removeByFunction) {
          return cb[0] !== callbackOrName;
        } else if (removeByName) {
          return cb[1] !== callbackOrName;
        }
      })
    );
    if (this.eventListeners.get(event).length === 0) {
      // @ts-ignore
      this.signalEventUnsubscribed?.(event);
    }
  }
};

EventHandler.prototype._validateEvent = function (event) {
  // @ts-ignore
  if (this.Events[event] !== event) {
    throw new Error(
      `invalid event type: ${event}; allowed values: ${Object.values(
        // @ts-ignore
        this.Events
      ).join(", ")}`
    );
  }
};

EventHandler.prototype._handleEvent = function (event, ...args) {
  if (this.eventListeners.has(event)) {
    this.eventListeners.get(event).forEach((callback) => callback[0](...args));
  }
};

module.exports.EventHandler = EventHandler;
