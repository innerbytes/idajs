"use strict";

/** @returns {any} */
function createMockFn(returnValue) {
  const fn = function (...args) {
    fn.calls.push(args);

    if (typeof fn.returnValue === "function") {
      return fn.returnValue(...args);
    }

    return fn.returnValue !== undefined ? fn.returnValue : returnValue;
  };

  fn.calls = [];
  fn.returnValue = returnValue;
  fn.reset = () => {
    fn.calls = [];
    fn.returnValue = returnValue;
  };

  return fn;
}

/**
 * Creates a mock object that proxies unmocked properties to the original object
 */
function createMockObj(originalObj, mockOverrides) {
  if (!originalObj) {
    return mockOverrides || {};
  }

  if (!mockOverrides) {
    return originalObj;
  }

  const mockObj = {};
  return new Proxy(mockObj, {
    get(target, prop) {
      // If the property exists in the mock overrides, use that
      if (prop in mockOverrides) {
        return mockOverrides[prop];
      }
      
      // Otherwise, try to forward to the original object
      try {
        const originalValue = originalObj[prop];
        if (typeof originalValue === 'function') {
          // Return a bound function that calls the original method
          return function(...args) {
            return originalValue.apply(originalObj, args);
          };
        }
        return originalValue;
      } catch (e) {
        // If we can't access the property, return undefined
        return undefined;
      }
    },
    
    set(target, prop, value) {
      // If trying to set a mocked property, set it in the mock overrides
      if (prop in mockOverrides) {
        mockOverrides[prop] = value;
        return true;
      }
      
      // Otherwise set on the target mock object
      target[prop] = value;
      return true;
    },
    
    has(target, prop) {
      // Property exists if it's in mock overrides or we can access it on original
      if (prop in mockOverrides) {
        return true;
      }
      
      try {
        return prop in originalObj;
      } catch (e) {
        return false;
      }
    },
    
    ownKeys(target) {
      // Return keys from mock overrides and try to get original keys
      try {
        const originalKeys = Object.keys(originalObj);
        const mockKeys = Object.keys(mockOverrides);
        return [...new Set([...originalKeys, ...mockKeys])];
      } catch (e) {
        // If we can't get original keys, just return mock keys
        return Object.keys(mockOverrides);
      }
    },
    
    getOwnPropertyDescriptor(target, prop) {
      // If property is mocked, return descriptor for mock value
      if (prop in mockOverrides) {
        return {
          enumerable: true,
          configurable: true,
          value: mockOverrides[prop]
        };
      }
      
      // For non-mocked properties, return a basic descriptor
      return {
        enumerable: true,
        configurable: true,
        value: this.get(target, prop)
      };
    }
  });
}

module.exports = { createMockFn, createMockObj };
