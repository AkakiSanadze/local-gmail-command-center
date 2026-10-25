/**
 * Local Gmail Command Center - Service Worker (background.js)
 * Manifest V3, 2027-ready, Zero-Dependency.
 */

// Embedded Base64 Data URL for Chrome Notifications (Ensures 100% reliable icons)
const NOTIFICATION_ICON_DATA_URL = 'data:image/png;base64,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';

const ALARM_NAME = 'GMAIL_CHECK_ALARM';
const DEFAULT_POLL_INTERVAL = 1; // 1 minute
const MAX_NOTIFIED_IDS = 500;

const DEFAULT_SETTINGS = {
  accounts: [
    { index: 0, name: 'Personal', enabled: true },
    { index: 1, name: 'Work', enabled: false },
    { index: 2, name: 'Secondary', enabled: false }
  ],
  pollInterval: DEFAULT_POLL_INTERVAL,
  soundEnabled: true,
  focusMode: false, // DND
  vipOnly: false,
  vipKeywords: 'urgent, invoice, სასწრაფო, კოდი, verification, გადახდა, security, auth',
  aiEndpoint: 'http://localhost:1234/v1/chat/completions',
  aiModel: 'local-model',
  notifiedIds: [],
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
 */
async function fetchAccountFeed(accountIndex) {
  const url = `https://mail.google.com/mail/u/${accountIndex}/feed/atom`;
  try {
    const res = await fetch(url, {
      credentials: 'include',
      cache: 'no-store'
    });

    if (res.status === 401 || res.status === 403 || res.redirected && res.url.includes('ServiceLogin')) {
      return {
        accountIndex,
        unauthorized: true,
        fullcount: 0,
        accountEmail: '',
        entries: [],
        error: 'Unauthorized'
      };
    }

    if (!res.ok) {
      return {
        accountIndex,
        unauthorized: false,
        fullcount: 0,
        accountEmail: '',
        entries: [],
        error: `HTTP ${res.status}`
      };
    }

    const xmlText = await res.text();
    await ensureOffscreenDocument();

    const parseResponse = await chrome.runtime.sendMessage({
      action: 'PARSE_GMAIL_ATOM',
      xmlText,
      accountIndex
    });

    if (!parseResponse || !parseResponse.success) {
      return {
        accountIndex,
        unauthorized: false,
        fullcount: 0,
        accountEmail: '',
        entries: [],
        error: parseResponse?.error || 'Parse failure'
      };
    }

    return {
      accountIndex,
      unauthorized: false,
      fullcount: parseResponse.fullcount || 0,
      accountEmail: parseResponse.accountEmail || '',
      entries: parseResponse.entries || [],
      error: null
    };
  } catch (err) {
    return {
      accountIndex,
      unauthorized: false,
      fullcount: 0,
      accountEmail: '',
      entries: [],
      error: err.message
    };
  }
}

/**
 * Orchestrates multi-account checking, new email notifications, sound, and badge updates.
 */
async function checkAllAccounts() {
  const settings = await getSettings();
  const enabledAccounts = settings.accounts.filter(a => a.enabled);

  if (enabledAccounts.length === 0) {
    await updateBadge(0, false, false);
    return { totalUnread: 0, results: [] };
  }

  // Fetch all enabled accounts in parallel
  const fetchPromises = enabledAccounts.map(acc => fetchAccountFeed(acc.index));
  const results = await Promise.all(fetchPromises);

  let totalUnread = 0;
  let allUnauthorized = true;
  const newNotifiedIds = new Set(settings.notifiedIds || []);
  const brandNewEntries = [];

  const cachedFeeds = {};

  for (const res of results) {
    if (!res.unauthorized) {
      allUnauthorized = false;
      totalUnread += res.fullcount;
    }

    cachedFeeds[res.accountIndex] = {
      unauthorized: res.unauthorized,
      fullcount: res.fullcount,
      accountEmail: res.accountEmail,
      entries: res.entries,
      lastUpdated: new Date().toISOString(),
      error: res.error
    };

    // Collect new entries not seen before
    for (const entry of res.entries) {
      if (!newNotifiedIds.has(entry.id)) {
        brandNewEntries.push(entry);
        newNotifiedIds.add(entry.id);
      }
    }
  }

  // Update Badge
  await updateBadge(totalUnread, allUnauthorized, true);

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

  // Save cache and notifiedIds
  await chrome.storage.local.set({
    cachedFeeds,
    notifiedIds: trimmedNotifiedIds,
    lastGlobalCheck: new Date().toISOString()
  });

  return { totalUnread, allUnauthorized, results };
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
  const settings = await getSettings();
  await setupAlarm(settings.pollInterval);
  await checkAllAccounts();
});

chrome.runtime.onStartup.addListener(async () => {
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
        const windowId = message.windowId || sender.tab?.windowId;
        if (windowId) {
          await chrome.sidePanel.open({ windowId });
          sendResponse({ success: true });
        } else {
          const currentWindow = await chrome.windows.getCurrent();
          await chrome.sidePanel.open({ windowId: currentWindow.id });
          sendResponse({ success: true });
        }
      } catch (err) {
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

  return false;
});
