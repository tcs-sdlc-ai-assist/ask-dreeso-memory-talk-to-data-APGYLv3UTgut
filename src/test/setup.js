/**
 * Vitest setup file for Ask Dreeso Memory.
 * Configures @testing-library/jest-dom matchers, mocks localStorage
 * for the test environment, and provides test utilities.
 *
 * @module test/setup
 */

import '@testing-library/jest-dom';

/**
 * In-memory storage implementation for localStorage mock.
 * Provides a Map-based store that mimics the Web Storage API.
 * @type {Map<string, string>}
 */
const store = new Map();

/**
 * Mock localStorage implementation for the test environment.
 * Uses an in-memory Map to simulate browser localStorage behavior
 * without requiring a real DOM storage backend.
 *
 * @type {Storage}
 */
const localStorageMock = {
  /**
   * Retrieves a value by key from the mock store.
   * @param {string} key - The storage key
   * @returns {string|null} The stored value, or null if not found
   */
  getItem(key) {
    if (typeof key !== 'string') {
      return null;
    }
    const value = store.get(key);
    return value !== undefined ? value : null;
  },

  /**
   * Stores a value by key in the mock store.
   * @param {string} key - The storage key
   * @param {string} value - The value to store
   */
  setItem(key, value) {
    store.set(String(key), String(value));
  },

  /**
   * Removes a value by key from the mock store.
   * @param {string} key - The storage key to remove
   */
  removeItem(key) {
    store.delete(String(key));
  },

  /**
   * Clears all entries from the mock store.
   */
  clear() {
    store.clear();
  },

  /**
   * Returns the key at the given index.
   * @param {number} index - The index of the key
   * @returns {string|null} The key at the index, or null if out of range
   */
  key(index) {
    const keys = Array.from(store.keys());
    return index >= 0 && index < keys.length ? keys[index] : null;
  },

  /**
   * Returns the number of entries in the mock store.
   * @returns {number} The number of stored entries
   */
  get length() {
    return store.size;
  },
};

/**
 * Assign the mock localStorage to the global object if not already
 * provided by the jsdom environment or if it needs to be overridden.
 */
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

/**
 * Mock matchMedia for components that use responsive breakpoints.
 * Returns a minimal MediaQueryList implementation.
 */
if (typeof globalThis.matchMedia === 'undefined' || globalThis.matchMedia === null) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query) => ({
      matches: false,
      media: typeof query === 'string' ? query : '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/**
 * Mock ResizeObserver for components that observe element size changes.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor() {
      this.observe = () => {};
      this.unobserve = () => {};
      this.disconnect = () => {};
    }
  };
}

/**
 * Mock IntersectionObserver for components that use intersection detection.
 */
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {
      this.root = null;
      this.rootMargin = '';
      this.thresholds = [];
      this.observe = () => {};
      this.unobserve = () => {};
      this.disconnect = () => {};
      this.takeRecords = () => [];
    }
  };
}

/**
 * Mock scrollTo for components that programmatically scroll.
 */
if (typeof globalThis.scrollTo === 'undefined') {
  globalThis.scrollTo = () => {};
}

/**
 * Mock import.meta.env values for the test environment.
 * These mirror the values from .env.example to ensure consistent
 * behavior across test runs.
 */
if (typeof import.meta !== 'undefined' && import.meta.env) {
  if (!import.meta.env.VITE_APP_TITLE) {
    import.meta.env.VITE_APP_TITLE = 'Ask Dreeso Memory';
  }
  if (!import.meta.env.VITE_APP_VERSION) {
    import.meta.env.VITE_APP_VERSION = '1.0.0';
  }
  if (!import.meta.env.VITE_MOCK_DELAY_MS) {
    import.meta.env.VITE_MOCK_DELAY_MS = '0';
  }
  if (!import.meta.env.VITE_ENABLE_AUDIT_LOG) {
    import.meta.env.VITE_ENABLE_AUDIT_LOG = 'true';
  }
}

/**
 * Clear localStorage before each test to ensure test isolation.
 */
beforeEach(() => {
  store.clear();
});

/**
 * Clean up after each test to prevent state leakage.
 */
afterEach(() => {
  store.clear();
});