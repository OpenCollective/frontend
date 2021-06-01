/**
 * A map of keys used for local storage.
 */
export const LOCAL_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  GUEST_TOKENS: 'guestTokens',
  HOST_DASHBOARD_FILTER_PREFERENCES: 'hostDashBoardFilterPreferences',
};

// The below helpers use a try-catch to gracefully fallback in these scenarios:
// - SSR (server-side rendering), where the emulated context might not have localStorage.
// - Some robots and crawlers (like Google), although these usually either don't execute JS,
//   or do so in a modern engine with supported (but ignored) localStorage.
// - Private browsing mode. Here, localStorage methods may throw exceptions.
// - Regular browsing mode, if the user configured the browser to require permission before
//   storing data. If the current site isn't yet whitelisted and JS attempts to access
//   window.localStorage, an exception is thrown. Even `if (window.localStorage)` crashes.
// - Regular browsing mode, where localStorage is full. In those cases, localStorage.setItem()
//   will throw an exception.

/**
 * A helper to get a value from localStorage.
 * Returns the value, or null if no value exists or if storage is unavailable.
 */
export const getFromLocalStorage = key => {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

/**
 * A helper to set a value in localStorage.
 * Ignores errors about full, disallowed or unsupported storage.
 */
export const setLocalStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    // Ignore errors
  }
};

/**
 * A helper to remove an entry in localStorage.
 * Ignores errors about full, disallowed or unsupported storage.
 */
export const removeFromLocalStorage = key => {
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    // Ignore errors
  }
};
