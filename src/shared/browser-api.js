/**
 * Cross-browser WebExtension API abstraction (Chrome MV3 + Firefox MV3).
 * Supports dependency injection in automated Node.js tests.
 */

let injectedApi = null;

/**
 * Overrides the resolved extension API object (for unit/integration tests).
 */
export function setApiForTesting(mockApi) {
  injectedApi = mockApi || null;
}

/**
 * Returns the active extension API namespace (browser or chrome).
 */
export function getExtensionApi() {
  if (injectedApi) return injectedApi;
  return globalThis.browser ?? globalThis.chrome;
}

export function hasOffscreenApi(api = getExtensionApi()) {
  return Boolean(api?.offscreen && typeof api.offscreen.createDocument === 'function');
}

export function hasChromeSidePanel(api = getExtensionApi()) {
  return Boolean(api?.sidePanel && typeof api.sidePanel.open === 'function');
}

export function hasFirefoxSidebar(api = getExtensionApi()) {
  return Boolean(api?.sidebarAction && typeof api.sidebarAction.open === 'function');
}

export function hasSessionStorage(api = getExtensionApi()) {
  return Boolean(api?.storage?.session && typeof api.storage.session.get === 'function');
}

/**
 * Returns chrome/browser.storage.session when supported, falling back to storage.local.
 */
export function getSessionStore(api = getExtensionApi()) {
  return hasSessionStorage(api) ? api.storage.session : api?.storage?.local;
}

/**
 * Sets badge text color safely (some browser versions omit setBadgeTextColor).
 */
export async function setBadgeTextColorSafe(api = getExtensionApi(), color = '#FFFFFF') {
  if (api?.action && typeof api.action.setBadgeTextColor === 'function') {
    try {
      await api.action.setBadgeTextColor({ color });
    } catch (_) {
      // Ignore on browsers/versions that don't support setBadgeTextColor
    }
  }
}

/**
 * Checks whether Gmail host permissions are granted (relevant in Firefox MV3 where host_permissions can be user-revoked).
 */
export async function checkGmailHostPermission(api = getExtensionApi()) {
  if (!api?.permissions || typeof api.permissions.contains !== 'function') {
    return true;
  }
  try {
    return await api.permissions.contains({
      origins: ['https://mail.google.com/*']
    });
  } catch (_) {
    return true;
  }
}

/**
 * Prompts user to grant Gmail & Google Accounts host permissions if missing.
 */
export async function requestGmailHostPermission(api = getExtensionApi()) {
  if (!api?.permissions || typeof api.permissions.request !== 'function') {
    return true;
  }
  return await api.permissions.request({
    origins: ['https://mail.google.com/*', 'https://accounts.google.com/*']
  });
}
