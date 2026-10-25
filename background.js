/**
 * Local Gmail Command Center - Service Worker (background.js)
 * Manifest V3, 2027-ready, Zero-Dependency.
 */

// Embedded Base64 Data URL for Chrome Notifications (Official Gmail Icon)
const NOTIFICATION_ICON_DATA_URL = 'data:image/png;base64,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';

const ALARM_NAME = 'GMAIL_CHECK_ALARM';
const DEFAULT_POLL_INTERVAL = 1; // 1 minute
const MAX_NOTIFIED_IDS = 500;

const DEFAULT_SETTINGS = {
  accounts: [
    { index: 0, name: 'Personal', enabled: true },
    { index: 1, name: 'Work', enabled: true },
    { index: 2, name: 'Account 3', enabled: true },
    { index: 3, name: 'Account 4', enabled: true }
  ],
  pollInterval: DEFAULT_POLL_INTERVAL,
  soundEnabled: true,
  focusMode: false, // DND
  vipOnly: false,
  vipKeywords: 'urgent, invoice, სასწრაფო, კოდი, verification, გადახდა, security, auth',
  aiEndpoint: 'http://localhost:1234/v1/chat/completions',
  aiModel: 'local-model',
  notifiedIds: [],
  locallyReadIds: [],
  cachedFeeds: {}
};

// Map notificationId -> target link URL
const notificationLinks = new Map();

// Concurrency lock for offscreen creation
let creatingOffscreenPromise = null;

/**
 * Ensures a single offscreen document is active for DOMParser and Web Audio.
 */
async function ensureOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');

  if ('getContexts' in chrome.runtime) {
    const existing = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [offscreenUrl]
    });
    if (existing.length > 0) return true;
  }

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return true;
  }

  creatingOffscreenPromise = (async () => {
    try {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DOM_PARSER', 'AUDIO_PLAYBACK'],
        justification: 'Gmail Atom XML parsing and audio notification chime'
      });
    } catch (err) {
      if (!err.message?.includes('Only a single offscreen document')) {
        console.warn('Offscreen creation notice:', err.message);
      }
    }
  })();

  await creatingOffscreenPromise;
  creatingOffscreenPromise = null;
  return true;
}

/**
 * Ensures side panel default path is enabled.
 */
async function initSidePanelOptions() {
  if (chrome.sidePanel?.setOptions) {
    try {
      await chrome.sidePanel.setOptions({
        path: 'sidepanel.html',
        enabled: true
      });
    } catch (err) {
      console.warn('Could not set side panel options:', err);
    }
  }
}

/**
 * Loads current settings from storage, merging with defaults.
 */
async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Sets extension action badge according to unread count and auth status.
 */
async function updateBadge(totalUnread, allUnauthorized, anyEnabled) {
  try {
    if (!anyEnabled) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    if (allUnauthorized) {
      await chrome.action.setBadgeText({ text: '?' });
      await chrome.action.setBadgeBackgroundColor({ color: '#5F6368' }); // Muted gray
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
      return;
    }

    if (totalUnread > 0) {
      const displayCount = totalUnread > 999 ? '999+' : String(totalUnread);
      await chrome.action.setBadgeText({ text: displayCount });
      await chrome.action.setBadgeBackgroundColor({ color: '#D93025' }); // Gmail Crimson
      await chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.error('Badge update error:', err);
  }
}

/**
 * Checks if an email matches VIP keywords.
 */
function isVipEmail(entry, keywordsString) {
  if (!keywordsString) return false;
  const keywords = keywordsString
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);

  if (keywords.length === 0) return false;

  const content = `${entry.title || ''} ${entry.summary || ''} ${entry.authorName || ''} ${entry.authorEmail || ''}`.toLowerCase();
  return keywords.some(keyword => content.includes(keyword));
}

/**
 * Fetches and parses a single Gmail account Atom feed.
 * Tries direct account index, user email, and authuser variations.
 */
async function fetchAccountFeed(accOrIndex) {
  const accountIndex = typeof accOrIndex === 'object' ? accOrIndex.index : Number(accOrIndex);
  const email = (typeof accOrIndex === 'object' && accOrIndex.email) ? accOrIndex.email.trim() : '';

  const urlsToTry = [];
  if (email && email.includes('@')) {
    urlsToTry.push(`https://mail.google.com/mail/feed/atom?authuser=${encodeURIComponent(email)}`);
    urlsToTry.push(`https://mail.google.com/mail/u/${encodeURIComponent(email)}/feed/atom`);
  }
  urlsToTry.push(`https://mail.google.com/mail/u/${accountIndex}/feed/atom`);
  urlsToTry.push(`https://mail.google.com/mail/feed/atom?authuser=${accountIndex}`);

  let lastError = 'Unauthorized';

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (res.status === 401 || res.status === 403 || (res.redirected && res.url.includes('ServiceLogin'))) {
        continue;
      }

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const xmlText = await res.text();
      // Ensure response is actually an XML Atom feed and not an HTML redirect
      if (!xmlText.includes('<feed') && !xmlText.includes('<fullcount>')) {
        continue;
      }

      await ensureOffscreenDocument();

      const parseResponse = await chrome.runtime.sendMessage({
        action: 'PARSE_GMAIL_ATOM',
        xmlText,
        accountIndex
      });

      if (parseResponse && parseResponse.success) {
        return {
          accountIndex,
          unauthorized: false,
          fullcount: parseResponse.fullcount || 0,
          accountEmail: parseResponse.accountEmail || email,
          entries: parseResponse.entries || [],
          error: null
        };
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return {
    accountIndex,
    unauthorized: true,
    fullcount: 0,
    accountEmail: email,
    entries: [],
    error: lastError
  };
}

/**
 * Orchestrates multi-account checking, new email notifications, sound, and badge updates.
 */
async function checkAllAccounts() {
  const settings = await getSettings();
  const existingAccounts = settings.accounts || [];

  // Collect accounts to scan:
  // 1. Any account already defined in settings.accounts that is not manually disabled
  // 2. Also ensure default slots 0, 1, 2, 3 are included for discovery
  const accountsToScan = [];
  const scannedIndices = new Set();

  for (const acc of existingAccounts) {
    scannedIndices.add(acc.index);
    if (!acc.manuallyDisabled && acc.enabled !== false) {
      accountsToScan.push(acc);
    }
  }

  for (let idx = 0; idx <= 3; idx++) {
    if (!scannedIndices.has(idx)) {
      accountsToScan.push({ index: idx, name: `Account ${idx + 1}`, enabled: true });
      scannedIndices.add(idx);
    }
  }

  // Fetch all accounts in parallel
  const fetchPromises = accountsToScan.map(acc => fetchAccountFeed(acc));
  const results = await Promise.all(fetchPromises);

  // Identify primary email (slot 0) to detect phantom duplicate redirects (e.g. slots 4/5 falling back to slot 0)
  const slot0Result = results.find(r => r.accountIndex === 0 && !r.unauthorized);
  const primaryEmail = slot0Result ? slot0Result.accountEmail : null;

  let totalUnread = 0;
  let anyAuthorized = false;
  let allEnabledUnauthorized = true;
  const newNotifiedIds = new Set(settings.notifiedIds || []);
  const locallyReadIds = new Set(settings.locallyReadIds || []);
  const brandNewEntries = [];
  const cachedFeeds = {};

  for (const res of results) {
    // Detect phantom Google redirect: non-zero slot returning the exact same email as slot 0
    if (res.accountIndex > 0 && primaryEmail && res.accountEmail === primaryEmail) {
      cachedFeeds[res.accountIndex] = {
        unauthorized: true,
        fullcount: 0,
        accountEmail: '',
        entries: [],
        lastUpdated: new Date().toISOString(),
        error: 'Redirect duplicate'
      };
      continue;
    }

    let effectiveCount = 0;
    if (!res.unauthorized) {
      anyAuthorized = true;
      allEnabledUnauthorized = false;

      // Filter out locally read entries
      const unreadEntries = (res.entries || []).filter(e => !locallyReadIds.has(e.id));
      const readDeduction = (res.entries || []).length - unreadEntries.length;
      effectiveCount = Math.max(0, res.fullcount - readDeduction);
      totalUnread += effectiveCount;

      // Collect new unread entries from authenticated feeds
      for (const entry of unreadEntries) {
        if (!newNotifiedIds.has(entry.id)) {
          brandNewEntries.push(entry);
          newNotifiedIds.add(entry.id);
        }
      }
    }

    cachedFeeds[res.accountIndex] = {
      unauthorized: res.unauthorized,
      fullcount: effectiveCount,
      rawCount: res.fullcount,
      accountEmail: res.accountEmail,
      entries: res.entries,
      lastUpdated: new Date().toISOString(),
      error: res.error
    };
  }

  // CRITICAL: NEVER delete user-configured accounts!
  // Start with all existing accounts, updating their email and details if found
  const updatedAccounts = existingAccounts.map(acc => {
    const res = results.find(r => r.accountIndex === acc.index);
    if (res && !res.unauthorized && res.accountEmail) {
      const emailPrefix = res.accountEmail.split('@')[0];
      const hasCustomName = acc.name &&
        !acc.name.startsWith('Account ') &&
        acc.name !== 'Personal' &&
        acc.name !== 'Work' &&
        acc.name !== 'Secondary';

      return {
        ...acc,
        email: res.accountEmail,
        name: hasCustomName ? acc.name : emailPrefix
      };
    }
    return { ...acc };
  });

  // Add any newly discovered authorized accounts not already in existingAccounts
  for (const res of results) {
    if (!res.unauthorized && res.accountEmail && (res.accountEmail !== primaryEmail || res.accountIndex === 0)) {
      if (!updatedAccounts.some(a => a.index === res.accountIndex)) {
        updatedAccounts.push({
          index: res.accountIndex,
          name: res.accountEmail.split('@')[0],
          email: res.accountEmail,
          enabled: true
        });
      }
    }
  }

  if (updatedAccounts.length === 0) {
    updatedAccounts.push({ index: 0, name: 'Personal', enabled: true });
  }

  updatedAccounts.sort((a, b) => a.index - b.index);

  // Update Badge
  await updateBadge(totalUnread, allEnabledUnauthorized, anyAuthorized);

  // Trigger sound & notifications for new unread emails
  let shouldPlaySound = false;

  if (brandNewEntries.length > 0 && !settings.focusMode) {
    for (const entry of brandNewEntries) {
      const isVip = isVipEmail(entry, settings.vipKeywords);

      // If vipOnly is active, only notify on VIP matches
      if (settings.vipOnly && !isVip) {
        continue;
      }

      // Prepare and show native notification
      try {
        const notifId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        notificationLinks.set(notifId, entry.link);

        const titleText = `${entry.authorName || 'Gmail'}: ${entry.title || '(No Subject)'}`;
        const messageText = entry.summary ? entry.summary.substring(0, 150) : 'ახალი წერილი მიღებულია';

        await chrome.notifications.create(notifId, {
          type: 'basic',
          iconUrl: NOTIFICATION_ICON_DATA_URL,
          title: titleText,
          message: messageText,
          priority: 2
        });

        shouldPlaySound = true;
      } catch (err) {
        console.warn('Notification trigger warning:', err);
      }
    }
  }

  // Play synthesized chime once per check cycle if new relevant emails arrived
  if (shouldPlaySound && settings.soundEnabled && !settings.focusMode) {
    try {
      await ensureOffscreenDocument();
      await chrome.runtime.sendMessage({ action: 'PLAY_NOTIFICATION_SOUND' });
    } catch (err) {
      console.warn('Audio chime trigger notice:', err);
    }
  }

  // Prune notifiedIds to prevent unbounded storage growth (keep latest MAX_NOTIFIED_IDS)
  const trimmedNotifiedIds = Array.from(newNotifiedIds).slice(-MAX_NOTIFIED_IDS);

  // Save cache, notifiedIds, and accounts safely
  const storageUpdate = {
    cachedFeeds,
    notifiedIds: trimmedNotifiedIds,
    lastGlobalCheck: new Date().toISOString()
  };
  const accountsChanged = JSON.stringify(updatedAccounts) !== JSON.stringify(existingAccounts);
  if (accountsChanged) {
    storageUpdate.accounts = updatedAccounts;
  }
  await chrome.storage.local.set(storageUpdate);

  return { totalUnread, allEnabledUnauthorized, results };
}

/**
 * Configure chrome.alarms for periodic polling.
 */
async function setupAlarm(intervalMinutes) {
  const period = Math.max(0.5, Number(intervalMinutes) || DEFAULT_POLL_INTERVAL);
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 0.1,
    periodInMinutes: period
  });
}

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await checkAllAccounts();
  }
});

// Extension Installation & Startup
chrome.runtime.onInstalled.addListener(async (details) => {
  await initSidePanelOptions();
  const settings = await getSettings();
  await setupAlarm(settings.pollInterval);
  await checkAllAccounts();
});

chrome.runtime.onStartup.addListener(async () => {
  await initSidePanelOptions();
  const settings = await getSettings();
  await setupAlarm(settings.pollInterval);
  await checkAllAccounts();
});

// Notification click listener: opens email in the corresponding account session
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const targetUrl = notificationLinks.get(notificationId) || 'https://mail.google.com/mail/u/0/#inbox';
  notificationLinks.delete(notificationId);
  await chrome.tabs.create({ url: targetUrl });
});

// Runtime message listener for UI commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'REFRESH_NOW') {
    (async () => {
      const summary = await checkAllAccounts();
      sendResponse({ success: true, summary });
    })();
    return true; // Keep channel open
  }

  if (message.action === 'TEST_SOUND') {
    (async () => {
      try {
        await ensureOffscreenDocument();
        const res = await chrome.runtime.sendMessage({ action: 'PLAY_NOTIFICATION_SOUND' });
        sendResponse(res || { success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'OPEN_SIDE_PANEL') {
    (async () => {
      try {
        let windowId = message.windowId;
        if (!windowId) {
          const focusedWindow = await chrome.windows.getLastFocused({ populate: false });
          windowId = focusedWindow?.id;
        }
        if (!windowId) {
          sendResponse({ success: false, error: 'No active window found' });
          return;
        }

        await initSidePanelOptions();
        await chrome.sidePanel.open({ windowId });
        sendResponse({ success: true });
      } catch (err) {
        console.error('Side panel open error in service worker:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'SETTINGS_UPDATED') {
    (async () => {
      const settings = await getSettings();
      await setupAlarm(settings.pollInterval);
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.action === 'MARK_EMAIL_READ') {
    (async () => {
      try {
        const settings = await getSettings();
        const locallyReadSet = new Set(settings.locallyReadIds || []);
        if (message.id) locallyReadSet.add(message.id);
        if (Array.isArray(message.ids)) {
          message.ids.forEach(id => locallyReadSet.add(id));
        }
        const trimmed = Array.from(locallyReadSet).slice(-1000);
        await chrome.storage.local.set({ locallyReadIds: trimmed });

        // If a message link is provided, briefly load it in a background tab to trigger Gmail web read flag
        if (message.link) {
          try {
            const tab = await chrome.tabs.create({ url: message.link, active: false });
            setTimeout(() => {
              chrome.tabs.remove(tab.id).catch(() => {});
            }, 2500);
          } catch (e) {
            console.warn('Background tab mark read notice:', e);
          }
        }

        const summary = await checkAllAccounts();
        sendResponse({ success: true, summary });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'MARK_ALL_READ') {
    (async () => {
      try {
        const settings = await getSettings();
        const locallyReadSet = new Set(settings.locallyReadIds || []);
        if (Array.isArray(message.ids)) {
          message.ids.forEach(id => locallyReadSet.add(id));
        }
        const trimmed = Array.from(locallyReadSet).slice(-1000);
        await chrome.storage.local.set({ locallyReadIds: trimmed });

        const summary = await checkAllAccounts();
        sendResponse({ success: true, summary });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});
