/**
 * Local Gmail Command Center - Service Worker (background.js)
 * Manifest V3, 2027-ready, Zero-Dependency.
 */

// Embedded Base64 Data URL for Chrome Notifications (Official Gmail Icon)
const NOTIFICATION_ICON_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAIJUlEQVR4nO1YXWwU1xU+596Z2Zld2/gHA4uxAeOEFr+0CqpafkTSh7ZSSx8qLVEVNW14QEoeaIv6WGnZPOWlqaoqxShSQeqPil1KH/qStgEc0QbJdhQQuFArVCE1EGqM1z87szP33lOd2TXY2Kz/logHf9Ld2Zl7zp1z5nz3nHsvwCpWsYpVPNUgAKQsCKLPuGXjKy7L6CyAOAdgwdOC7D4LsiDm68L5jM8BmOl7IkjBTVh/5x+259QCQggAzhMyNCxdRg1Qx+bIBwc+xS/A1AzjBOQe2jbHAaYLAtDplpZNm1x5hLR4HtdFTdt/NNKwpj2qVeOipLG8wC4IAv5yCAk7guv55MTLV569/58oec8WdD4YLfxs9OeXhoFphbHobAcI4hDR37dufKYW7bO1Urb4ZECHCCqh1eZXRsOWFwqu8YUwCgBk+Y1VALLhhCAFgZDKdA+vDX4y1O5MCtvyJAE4EkxBDStffXXkjb4hyAJOR2IWr/jru2AfqxGi5b5SxUCTiWxDEAnro1+sdf7V1eAroki4BkjFn2HFLhAAaY0gHQ1FoujIYHvhB4PbEwFIyzOKTGSMmQyLwpMtliOOlVSys5x/wPu/tbW1exYOxaGY6RwCCAQIxwXUbi8Gn/vhfUykg4SZsjhHLZ9SxA1BpBQUbrvF717voHeCNe56KwJNM3hSssEAEZlAP3v3jf4b0/MhNrKzbIKF2OYiCjPPi4wBsOo0RDc9N39sh5gaaPQhFRkhAMgs3QPWEfz2VGT8/kZ/5O1O8e/xWrfBmcf4sg1oSSlsaI3vBzM4h0KOlOVZ+piXagBwNUgjbP/UM8746S2BAoosVy/JCZZlHQUU5f+0JfBPdTiWFrZradCVxmGOC8Gz7wFm5fqEyoOwa8CgAElz4lCCQSCebEkt1cUNyfxwyq/J3FCJdOAtSKkyZWRKgX/LDab+2E7mv3VJOxmBEQhE86b6iihrZOLfS21f00WU4EYFYYRVeeYZAEwpwNu13vixTjnZ3+RjBUpNUwZTykz2NfqTXZ2CdUUyKslXSgfcbUiAIfCSjp7jQE93d3zzq8zvxVv7f0v3Umk/FYwCO1GxmnM0EgosEo5/qiORP72lqMuU4r6ZcvyM+1jG7+5ISBIO6047+9i3IILRnF6l39zaDOu2bYxtzpS++ew50Dg6gp9s+Qq++eJfcaD9m4WawghHNqZUJSeMIKaFUBfT3tjxz2v/UzfgzBI7wV+eKXPHDbhPXdzgyZQWrAMLzRtWj7RJptxCumM9JhuToMJoltIsy5TlghsoiJzaxK/3/8bp2fO6L6IgclUQR6MypRAwFQHeSbkTXTvEVF/TFCaV4TbZ1zQ1cXyH4D6WWYgyWO42mqL6DfV+89ZmR0iRMGruvJxjlRESRFSgVFFZZ790WH68YWfw0ruHdTp/w51INFSuXDGlNFhGOIVTHVINpwJ+HF5Iu1bSSJN4hFqPo4wyIG0RNLWuJa/OSxpOTUS8ypijPC83CAUYRKj18/hx6y7vzRffEX3bvl2o8e/xSFzDTUVKAVNKy+j9dJIb/+dnlYyn0moCjNLGS7l+un2D8Oo8z6jKk6Ri3tLCAjcYB23XOCe/dTJxas/rARplkghc7GZlgzkGcTb1VNz4f2VZ0gkhhFDG1K9fEzRvXecIWzoxZRYI2IKJN6aUDiFZnJDvffmw98v9f7jja3WtybYkEeiK66HyJH6s4cC2k250bBlofc3pWHdnbbrBI2Mk8ciLqI2LqhxlSpm6YhE/2rgrfG/b93aPh8UT9Y4lJQIa5ucSwToSARscW44V1Ylrm63dusEN0RASV5lFFvYllT6NAlJh3jn69SOTTWc/OHgvVK9agH6NJQWvTxdtPJBiHQvQ/18Yvtp0vu/gN37cOikj4yx1ebvk2q1Rms73P5G8Z914tq8rr9XeyNCVJtu2mA6VKDVNGZYNDV1h3U1nB7p4rMwgSEJcciSXvvgAgLt1rYQ5MP3PHbI3n/tg4Gohv2ssik7W2yVKsZFzjCfS3McyLDtYyO9i3f5Dz9k81t3m5LL2FstyYBo7B46r7kxG7vnn9Ynmd/tfGQn1IQlYqLGknEmpMmUk97EMy7JOdyYjdx4fWDT1qu4A40BPT5wvKJORLef63h6LaHdgzOWYUkCKW4ky5hL3sQzLss6Bnp6KqfgzcYDBlR/ZkX37rK29fR9evjW1eyxSJ+oty+LG/z+8NbWH+1iGZRdYfy4aVT37wd5e1Z0B+ULP4CQMwsHbz+8c4Ofp8/1v8ZX7sKd3RZR5FFU/vDrQExc35JMDzJUM5ywDOY5S5eq9HDyR07eYHjkg5np8n1s51xflAPKKa6GFyxLAXIdqgthG3rM+4sCOq6UJFZr8sBMhIW9gquhIVYAIJtQUaTPMtz1Xd9CDLJTLoclmSVzItQyR0RdsNymITFjyYrqVCunMY73qGwnl98xozAlDoZVyBGm6cPn7fx7KZrMCcrm5J3MMowqvqWIw4qRqHUQLAUWpsSwKjl9VUu+8IBLlTUvpioAoEe01CUcH0Qhqeo3FckcfqjwwhqPAmaM3l76igtG9qhicIYRRIOI9IC/qeQeukKCqaXA2UJHh4yIoXQEiQhpVBXXGTAR7+18+cwWyWQQsff1Y45ERALIkgJ0BgH3Z8bWWa9dBUIy7jBVvs9W5nzbcBJw9mVYMAvzi777TJqSxMN7x80EVABXD8YGX/jJSsu0hdSojS4LnBDwlyFJWxMbPg8rbBiKEo/PIlCNUdWTnMfJo7skmjlWsYhWrgJXg/9ETaQjDVo5ZAAAAAElFTkSuQmCC';

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
  aiEndpoint: 'http://127.0.0.1:1234/v1/chat/completions',
  aiModel: 'local-model',
  aiSummaries: {},
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
      const unreadEntries = (res.entries || []).filter(e => !locallyReadIds.has(e.id) && !(e.messageId && locallyReadIds.has(e.messageId)));
      const readDeduction = (res.entries || []).length - unreadEntries.length;
      effectiveCount = Math.max(0, res.fullcount - readDeduction);
      totalUnread += effectiveCount;

      // Collect new unread entries from authenticated feeds
      for (const entry of unreadEntries) {
        if (!newNotifiedIds.has(entry.id) && !(entry.messageId && newNotifiedIds.has(entry.messageId))) {
          brandNewEntries.push(entry);
          newNotifiedIds.add(entry.id);
          if (entry.messageId) newNotifiedIds.add(entry.messageId);
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

// Cache for per-account Gmail action tokens: accountIndex -> { ik, at, expiresAt }
const gmailTokensCache = new Map();
// Cache for per-account Simple View (/s/) resolved URL after meta-refresh
const gmailSimplePageUrlCache = new Map();

/**
 * Normalizes any Gmail ID format (64-bit decimal integer, prefixed tag, or hex)
 * into a standard 16-character lowercase hexadecimal thread/message ID.
 */
function toHexThreadId(val) {
  if (!val) return null;
  const str = String(val).trim();

  // 1. Standard 14-16 hex chars (Gmail hex IDs are 15-16 chars; 64-bit decimal IDs are 18-20 digits)
  if (/^[0-9a-fA-F]{14,16}$/.test(str)) {
    return str.toLowerCase();
  }

  // 2. If prefixed like tag:gmail.google.com,2004:1827491048192847291 or msg-f:1827491048192847291
  const tagMatch = str.match(/(?:tag:gmail\.google\.com,2004:|msg-f:|thread-f:)(\d+)/i);
  if (tagMatch && tagMatch[1]) {
    try {
      return BigInt(tagMatch[1]).toString(16).toLowerCase();
    } catch (_) {}
  }

  // 3. If it is a 64-bit decimal integer (17-20 digits)
  if (/^\d{17,20}$/.test(str)) {
    try {
      return BigInt(str).toString(16).toLowerCase();
    } catch (_) {}
  }

  return null;
}

/**
 * Extracts the 16-char hexadecimal Gmail message/thread ID from the Atom entry link or tag ID.
 */
function extractHexMessageId(rawLink, atomId) {
  if (rawLink) {
    const msgIdMatch = rawLink.match(/[?&](?:message_id|th|id)=([a-fA-F0-9]+)/i);
    if (msgIdMatch && msgIdMatch[1]) {
      const hex = toHexThreadId(msgIdMatch[1]);
      if (hex) return hex;
    }
    const hashMatch = rawLink.match(/#(?:[a-zA-Z0-9_-]+)\/([a-fA-F0-9]{14,16})/i);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1].toLowerCase();
    }
  }

  if (atomId) {
    const hex = toHexThreadId(atomId);
    if (hex) return hex;
    const decMatch = atomId.match(/\b(\d{17,20})\b/);
    if (decMatch && decMatch[1]) {
      const h = toHexThreadId(decMatch[1]);
      if (h) return h;
    }
  }

  return null;
}

/**
 * Resolves hex message ID from entry properties or link.
 */
function resolveHexMessageId(entry) {
  if (!entry) return null;
  const fromLinkOrId = extractHexMessageId(entry.link, entry.id);
  if (fromLinkOrId) return fromLinkOrId;
  if (entry.messageId) {
    const hex = toHexThreadId(entry.messageId);
    if (hex) return hex;
  }
  return null;
}

/**
 * Retrieves the GMAIL_AT anti-CSRF token for an account index from Chrome cookies.
 */
async function getGmailAtCookie(accountIndex) {
  const candidateUrls = [
    `https://mail.google.com/mail/u/${accountIndex}`,
    `https://mail.google.com/mail/u/${accountIndex}/`,
    'https://mail.google.com/mail',
    'https://mail.google.com/mail/'
  ];
  for (const url of candidateUrls) {
    try {
      const c = await chrome.cookies.get({ name: 'GMAIL_AT', url });
      if (c && c.value) return c.value;
    } catch (_) {}
  }

  try {
    const cookies = await chrome.cookies.getAll({ name: 'GMAIL_AT' });
    if (cookies && cookies.length > 0) {
      const targetPath = `/mail/u/${accountIndex}`;
      let matched = cookies.find(c => c.path === targetPath || c.path === `${targetPath}/`);
      if (!matched && accountIndex === 0) {
        matched = cookies.find(c => c.path === '/mail' || c.path === '/' || !c.path.includes('/u/'));
      }
      if (!matched && cookies.length === 1 && accountIndex === 0) {
        matched = cookies[0];
      }
      if (matched && matched.value) {
        return matched.value;
      }
    }
  } catch (err) {
    console.warn('GMAIL_AT cookie getAll notice:', err);
  }

  return null;
}

/**
 * Fetches the Simple View (/s/) page for an account index to obtain its ID_KEY (ik token),
 * following any <meta http-equiv="refresh"> redirects (matching ignotifier's gmail.page(n)).
 */
async function getGmailIkFromSimpleView(accountIndex, forceResetUrl = false) {
  if (forceResetUrl) {
    gmailSimplePageUrlCache.delete(accountIndex);
  }
  let currentHref = gmailSimplePageUrlCache.get(accountIndex) || `https://mail.google.com/mail/u/${accountIndex}/s/`;

  for (let hop = 0; hop < 4; hop++) {
    try {
      const res = await fetch(currentHref, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) break;

      const content = await res.text();
      if (content.includes('/spreauth')) {
        const links = content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || [];
        const preauthUrl = links.find(l => l.includes('spreauth')) || `https://mail.google.com/mail/u/${accountIndex}/spreauth`;
        return { ik: null, needsPreauth: true, preauthUrl };
      }

      const idKeyMatch = content.match(/ID_KEY\s*=\s*['"](?<ik>[^'"]+)['"]/);
      if (idKeyMatch && idKeyMatch.groups && idKeyMatch.groups.ik) {
        return { ik: idKeyMatch.groups.ik, needsPreauth: false };
      }

      // Check for <meta http-equiv="refresh" content="0; url=...">
      const metaTagMatch = content.match(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/i);
      if (metaTagMatch) {
        const contentAttrMatch = metaTagMatch[0].match(/content\s*=\s*["']([^"']+)["']/i);
        if (contentAttrMatch && contentAttrMatch[1]) {
          const rawUrlPart = contentAttrMatch[1].split(/url\s*=\s*/i)[1];
          if (rawUrlPart) {
            const cleanedUrl = rawUrlPart
              .replace(/&amp;/gi, '&')
              .replace(/&#39;/g, "'")
              .replace(/&quot;/gi, '"')
              .replace(/^['"]+|['"]+$/g, '')
              .trim();
            const nextUrl = new URL(cleanedUrl, currentHref).href;
            gmailSimplePageUrlCache.set(accountIndex, nextUrl);
            currentHref = nextUrl;
            continue;
          }
        }
      }
      break;
    } catch (err) {
      console.warn('Simple view ik fetch notice:', err);
      break;
    }
  }

  return { ik: null, needsPreauth: false };
}

/**
 * Gets cached or freshly retrieved action tokens (at, ik) for an account index.
 */
async function getAccountActionTokens(accountIndex, forceRefresh = false) {
  const cached = gmailTokensCache.get(accountIndex);
  if (!forceRefresh && cached && cached.expiresAt > Date.now() && cached.at && cached.ik) {
    return cached;
  }

  // 1. Get GMAIL_AT from cookies
  let at = await getGmailAtCookie(accountIndex);

  // 2. Get ik (ID_KEY) from /mail/u/{n}/s/
  const ikResult = await getGmailIkFromSimpleView(accountIndex, forceRefresh);
  let ik = ikResult.ik;

  if (!at) {
    at = await getGmailAtCookie(accountIndex);
  }

  // 3. Fallback: check /mail/u/{n}/h/ and /mail/u/{n}/ if at or ik is still missing
  if (!at || !ik) {
    try {
      const hRes = await fetch(`https://mail.google.com/mail/u/${accountIndex}/h/`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (hRes.ok) {
        if (!at) at = await getGmailAtCookie(accountIndex);
        const hHtml = await hRes.text();
        if (!at) {
          const atHrefMatch = hHtml.match(/href=["'][^"']*[?&]at=([^&"'<>]+)/i);
          const atInputMatch = hHtml.match(/name=["']at["'][^>]*value=["']([^"']+)["']/i) ||
                               hHtml.match(/value=["']([^"']+)["'][^>]*name=["']at["']/i);
          if (atHrefMatch && atHrefMatch[1]) {
            at = decodeURIComponent(atHrefMatch[1]);
          } else if (atInputMatch && atInputMatch[1] && atInputMatch[1] !== 'null') {
            at = atInputMatch[1];
          }
        }
      }
    } catch (_) {}
  }

  if (!at || !ik) {
    try {
      const res = await fetch(`https://mail.google.com/mail/u/${accountIndex}/`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.ok) {
        if (!at) at = await getGmailAtCookie(accountIndex);
        const html = await res.text();
        if (!ik) {
          const ikInGlobals = html.match(/var\s+GLOBALS\s*=\s*\[(?:[^,\]]*,){9}\s*["']([a-zA-Z0-9_-]+)["']/);
          const gmIdMatch = html.match(/GM_ID_KEY\s*=\s*["']([a-zA-Z0-9_-]+)["']/);
          const ikKeyMatch = html.match(/["']ik["']\s*[:=,]\s*["']([a-zA-Z0-9_-]+)["']/);
          ik = ikInGlobals?.[1] || gmIdMatch?.[1] || ikKeyMatch?.[1] || null;
        }
        if (!at) {
          const gmMatch = html.match(/GM_ACTION_TOKEN\s*=\s*["']([^"']+)["']/);
          const atJsonMatch = html.match(/["']at["']\s*[:=,]\s*["']([^"']+)["']/);
          const atParamMatch = html.match(/[?&]at=([^&"'<>]+)/);
          at = gmMatch?.[1] || atJsonMatch?.[1] || (atParamMatch?.[1] ? decodeURIComponent(atParamMatch[1]) : null);
        }
      }
    } catch (_) {}
  }

  if (ikResult.needsPreauth) {
    return {
      at: at || null,
      ik: ik || null,
      needsPreauth: true,
      preauthUrl: ikResult.preauthUrl
    };
  }

  if (at && ik) {
    const entry = { at, ik, expiresAt: Date.now() + 10 * 60 * 1000, needsPreauth: false };
    gmailTokensCache.set(accountIndex, entry);
    return entry;
  }

  return { at: at || null, ik: ik || null, needsPreauth: false };
}

/**
 * Performs the Gmail Simple View (/s/?v=or) batch RPC request for Trash (9) or Mark Read (3).
 */
async function sendGmailBatchRpc(accountIndex, validIds, cmd, ik, at) {
  const actionCode = cmd === 'tr' ? 9 : 3; // 9 = Trash/Delete, 3 = Mark as Read
  const body = new FormData();
  body.append('s_jr', JSON.stringify([null, [
    ...validIds.map(id => [null, null, null, [
      null, actionCode, id, id, 'l:all', [], [], []
    ]]),
    [null, null, null, null, null, null, [null, true, false]],
    [null, null, null, null, null, null, [null, true, false]]
  ], 2, null, null, null, ik]));

  const url = `https://mail.google.com/mail/u/${accountIndex}/s/?v=or&ik=${encodeURIComponent(ik)}&at=${encodeURIComponent(at)}&subui=chrome&hl=en&ts=${Date.now()}`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body
  });

  const content = await res.text();
  if (!content || content.includes('/spreauth')) {
    const links = content ? (content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || []) : [];
    const preauthUrl = links.find(l => l.includes('spreauth')) || `https://mail.google.com/mail/u/${accountIndex}/spreauth`;
    return { ok: false, needsPreauth: true, preauthUrl };
  }

  if (res.ok && !content.includes('<html') && !content.includes('<!DOCTYPE')) {
    return { ok: true, needsPreauth: false };
  }

  return { ok: false, needsPreauth: false, status: res.status };
}

/**
 * Handles Gmail's /spreauth security gate.
 * Opens the spreauth URL in a background tab first so top-level SameSite=Lax cookies can settle
 * without closing the extension popup. If it redirects back to mail.google.com automatically,
 * closes the background tab and returns true so the action can immediately retry.
 * If Google requires interactive confirmation on accounts.google.com, focuses the tab for the user.
 */
async function performSpreauthHandshake(accountIndex, preauthUrl) {
  const targetUrl = preauthUrl || `https://mail.google.com/mail/u/${accountIndex}/spreauth`;
  let tab = null;
  try {
    tab = await chrome.tabs.create({ url: targetUrl, active: false });
    const startTime = Date.now();

    while (Date.now() - startTime < 4500) {
      await new Promise(r => setTimeout(r, 250));
      let currentTab;
      try {
        currentTab = await chrome.tabs.get(tab.id);
      } catch (_) {
        // Tab was closed
        return { completedSilently: false };
      }

      const tabUrl = currentTab.url || '';
      if (
        currentTab.status === 'complete' &&
        tabUrl.startsWith('https://mail.google.com/') &&
        !tabUrl.includes('spreauth')
      ) {
        // Wait briefly for Set-Cookie headers to commit, then close background tab
        await new Promise(r => setTimeout(r, 300));
        try {
          await chrome.tabs.remove(tab.id);
        } catch (_) {}
        return { completedSilently: true };
      }

      if (
        currentTab.status === 'complete' &&
        Date.now() - startTime > 1500 &&
        (tabUrl.includes('accounts.google.com') || tabUrl.includes('spreauth'))
      ) {
        // Requires user click in Google account chooser / verification
        await chrome.tabs.update(tab.id, { active: true });
        return { completedSilently: false, tabOpened: true };
      }
    }

    // If still not finished after timeout, activate tab so user can complete it
    if (tab && tab.id) {
      await chrome.tabs.update(tab.id, { active: true });
    }
    return { completedSilently: false, tabOpened: true };
  } catch (err) {
    console.warn('spreauth handshake notice:', err);
    return { completedSilently: false };
  }
}

/**
 * Executes a real server-side action on Gmail ('tr' = Trash/Delete, 'rd' = Mark as Read).
 * Returns { synced: boolean, needsPreauth?: boolean }
 */
async function executeGmailServerAction(accountIndex, messageIds, cmd) {
  const validIds = (Array.isArray(messageIds) ? messageIds : [messageIds])
    .map(id => toHexThreadId(id))
    .filter(Boolean);
  if (validIds.length === 0) {
    return { synced: false, needsPreauth: false };
  }

  let tokenInfo = await getAccountActionTokens(accountIndex);
  if (!tokenInfo.at || !tokenInfo.ik) {
    tokenInfo = await getAccountActionTokens(accountIndex, true);
  }

  // If getting ik already detected /spreauth
  if (tokenInfo.needsPreauth) {
    const handshake = await performSpreauthHandshake(accountIndex, tokenInfo.preauthUrl);
    gmailTokensCache.delete(accountIndex);
    if (!handshake.completedSilently) {
      return { synced: false, needsPreauth: true };
    }
    tokenInfo = await getAccountActionTokens(accountIndex, true);
  }

  if (!tokenInfo.at || !tokenInfo.ik) {
    console.warn(`Could not obtain Gmail tokens (at/ik) for account u/${accountIndex}`);
    return { synced: false, needsPreauth: false };
  }

  try {
    let rpcResult = await sendGmailBatchRpc(accountIndex, validIds, cmd, tokenInfo.ik, tokenInfo.at);
    if (rpcResult.ok) {
      return { synced: true, needsPreauth: false };
    }

    if (rpcResult.needsPreauth) {
      const handshake = await performSpreauthHandshake(accountIndex, rpcResult.preauthUrl);
      gmailTokensCache.delete(accountIndex);
      if (handshake.completedSilently) {
        const freshTokens = await getAccountActionTokens(accountIndex, true);
        if (freshTokens.at && freshTokens.ik) {
          const retryResult = await sendGmailBatchRpc(accountIndex, validIds, cmd, freshTokens.ik, freshTokens.at);
          if (retryResult.ok) {
            return { synced: true, needsPreauth: false };
          }
          if (retryResult.needsPreauth) {
            // Silent tab didn't suffice; open visible tab for user
            await chrome.tabs.create({
              url: retryResult.preauthUrl || `https://mail.google.com/mail/u/${accountIndex}/spreauth`,
              active: true
            });
          }
        }
      }
      return { synced: false, needsPreauth: true };
    }

    // Token might have expired; refresh once and retry
    gmailTokensCache.delete(accountIndex);
    const refreshed = await getAccountActionTokens(accountIndex, true);
    if (refreshed.at && refreshed.ik) {
      rpcResult = await sendGmailBatchRpc(accountIndex, validIds, cmd, refreshed.ik, refreshed.at);
      if (rpcResult.ok) {
        return { synced: true, needsPreauth: false };
      }
    }
  } catch (err) {
    console.warn('executeGmailServerAction error:', err);
  }

  return { synced: false, needsPreauth: false };
}

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

  if (message.action === 'GENERATE_AI_SUMMARY') {
    (async () => {
      const startMs = Date.now();
      console.log(`[LM Studio SW] Started summary request for ID: ${message.entryId || 'unknown'}`);
      try {
        const settings = await getSettings();
        const entryId = message.entryId;
        const aiSummaries = settings.aiSummaries || {};

        if (entryId && aiSummaries[entryId]) {
          console.log(`[LM Studio SW] Returning cached summary for ${entryId}: "${aiSummaries[entryId]}"`);
          sendResponse({ success: true, summary: aiSummaries[entryId], cached: true });
          return;
        }

        const emailText = message.emailText;
        const systemPrompt = 'You are a concise email assistant. Summarize the key point of this email in 1 clear, helpful sentence. If in Georgian, reply in Georgian; otherwise in English.';

        let endpoint = (settings.aiEndpoint || 'http://127.0.0.1:1234/v1/chat/completions').trim();
        const model = (settings.aiModel || 'local-model').trim();

        // Endpoints to attempt with fallback between 127.0.0.1 and localhost
        const endpointsToTry = [endpoint];
        if (endpoint.includes('127.0.0.1')) {
          endpointsToTry.push(endpoint.replace('127.0.0.1', 'localhost'));
        } else if (endpoint.includes('localhost')) {
          endpointsToTry.push(endpoint.replace('localhost', '127.0.0.1'));
        }

        let lastErr = null;
        let responseData = null;

        for (const ep of endpointsToTry) {
          try {
            console.log(`[LM Studio SW] Sending fetch to: ${ep} (model: ${model})`);
            const res = await fetch(ep, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: emailText }
                ],
                temperature: 0.2,
                max_tokens: 2048
              })
            });

            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${res.statusText || 'Server Error'}`);
            }

            responseData = await res.json();
            console.log(`[LM Studio SW] Received response from ${ep} in ${Date.now() - startMs}ms`);
            break;
          } catch (err) {
            lastErr = err;
            console.warn(`[LM Studio SW] Attempt at ${ep} failed: ${err.message}`);
          }
        }

        if (!responseData) {
          throw lastErr || new Error('Connection failed');
        }

        const msg = responseData.choices?.[0]?.message;
        let summary = (msg?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // Support reasoning models where thoughts were in reasoning_content
        if (!summary && msg?.reasoning_content) {
          console.log('[LM Studio SW] Content empty; extracting from reasoning_content...');
          const reasoning = msg.reasoning_content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          const lines = reasoning.split('\n').map(l => l.trim()).filter(Boolean);
          summary = lines[lines.length - 1] || reasoning;
        }

        if (!summary) {
          throw new Error('მოდელმა დააბრუნა ცარიელი პასუხი');
        }

        console.log(`[LM Studio SW] Summary generated in ${Date.now() - startMs}ms: "${summary}"`);

        // Cache summary in storage
        if (entryId) {
          aiSummaries[entryId] = summary;
          await chrome.storage.local.set({ aiSummaries });
        }

        sendResponse({ success: true, summary });
      } catch (err) {
        console.error(`[LM Studio SW] Summary generation failed after ${Date.now() - startMs}ms:`, err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'TEST_LM_STUDIO_CONNECTION') {
    (async () => {
      try {
        const settings = await getSettings();
        let endpoint = (message.endpoint || settings.aiEndpoint || 'http://127.0.0.1:1234/v1/chat/completions').trim();
        let baseUrl = endpoint.replace(/\/v1\/chat\/completions\/?$/, '');
        if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';
        const modelsUrl = `${baseUrl}/models`;

        console.log(`[LM Studio SW] Testing connection at: ${modelsUrl}`);
        const res = await fetch(modelsUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        const models = (data.data || []).map(m => m.id);
        console.log(`[LM Studio SW] Available models:`, models);
        sendResponse({ success: true, models });
      } catch (err) {
        console.error(`[LM Studio SW] Connection test failed:`, err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'MARK_EMAIL_READ') {
    (async () => {
      try {
        const messageId = resolveHexMessageId(message);
        const accountIndex = Number(message.accountIndex) || 0;
        let actionResult = { synced: false, needsPreauth: false };
        if (messageId) {
          actionResult = await executeGmailServerAction(accountIndex, [messageId], 'rd');
        }

        if (actionResult.synced) {
          const settings = await getSettings();
          const locallyReadSet = new Set(settings.locallyReadIds || []);
          if (message.id) locallyReadSet.add(message.id);
          if (messageId) locallyReadSet.add(messageId);
          const trimmed = Array.from(locallyReadSet).slice(-1000);
          await chrome.storage.local.set({ locallyReadIds: trimmed });

          if (settings.cachedFeeds && settings.cachedFeeds[accountIndex]) {
            const feed = settings.cachedFeeds[accountIndex];
            if (Array.isArray(feed.entries)) {
              feed.entries = feed.entries.filter(e => e.id !== message.id && e.messageId !== messageId);
              feed.fullcount = Math.max(0, feed.entries.length);
            }
            await chrome.storage.local.set({ cachedFeeds: settings.cachedFeeds });
          }
        }

        const summary = await checkAllAccounts();
        sendResponse({
          success: true,
          serverSynced: actionResult.synced,
          needsPreauth: actionResult.needsPreauth,
          summary
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'MARK_ALL_READ') {
    (async () => {
      try {
        const items = Array.isArray(message.items) ? message.items : [];
        const ids = Array.isArray(message.ids) ? message.ids : items.map(i => i.id);

        // Group server requests by accountIndex
        const grouped = new Map();
        for (const item of items) {
          const accIdx = Number(item.accountIndex) || 0;
          const msgId = resolveHexMessageId(item);
          if (msgId) {
            if (!grouped.has(accIdx)) grouped.set(accIdx, []);
            grouped.get(accIdx).push(msgId);
          }
        }

        const results = await Promise.all(
          Array.from(grouped.entries()).map(([accIdx, msgIds]) =>
            executeGmailServerAction(accIdx, msgIds, 'rd')
          )
        );
        const allSynced = results.length > 0 && results.every(r => r.synced);
        const needsPreauth = results.some(r => r.needsPreauth);

        if (allSynced) {
          const settings = await getSettings();
          const locallyReadSet = new Set(settings.locallyReadIds || []);
          ids.forEach(id => {
            if (id) locallyReadSet.add(id);
          });
          for (const msgIds of grouped.values()) {
            msgIds.forEach(mId => locallyReadSet.add(mId));
          }
          const trimmed = Array.from(locallyReadSet).slice(-1000);
          await chrome.storage.local.set({ locallyReadIds: trimmed });

          if (settings.cachedFeeds) {
            for (const [accIdx, msgIds] of grouped.entries()) {
              const feed = settings.cachedFeeds[accIdx];
              if (feed && Array.isArray(feed.entries)) {
                const msgIdSet = new Set(msgIds);
                const idSet = new Set(ids);
                feed.entries = feed.entries.filter(e => !idSet.has(e.id) && !msgIdSet.has(e.messageId));
                feed.fullcount = Math.max(0, feed.entries.length);
              }
            }
            await chrome.storage.local.set({ cachedFeeds: settings.cachedFeeds });
          }
        }

        const summary = await checkAllAccounts();
        sendResponse({
          success: true,
          serverSynced: allSynced,
          needsPreauth,
          summary
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'DELETE_EMAIL') {
    (async () => {
      try {
        const messageId = resolveHexMessageId(message);
        const accountIndex = Number(message.accountIndex) || 0;
        let actionResult = { synced: false, needsPreauth: false };
        if (messageId) {
          actionResult = await executeGmailServerAction(accountIndex, [messageId], 'tr');
        }

        if (actionResult.synced) {
          const settings = await getSettings();
          const locallyReadSet = new Set(settings.locallyReadIds || []);
          if (message.id) locallyReadSet.add(message.id);
          if (messageId) locallyReadSet.add(messageId);
          const trimmed = Array.from(locallyReadSet).slice(-1000);
          await chrome.storage.local.set({ locallyReadIds: trimmed });

          if (settings.cachedFeeds && settings.cachedFeeds[accountIndex]) {
            const feed = settings.cachedFeeds[accountIndex];
            if (Array.isArray(feed.entries)) {
              feed.entries = feed.entries.filter(e => e.id !== message.id && e.messageId !== messageId);
              feed.fullcount = Math.max(0, feed.entries.length);
            }
            await chrome.storage.local.set({ cachedFeeds: settings.cachedFeeds });
          }
        }

        const summary = await checkAllAccounts();
        sendResponse({
          success: true,
          serverSynced: actionResult.synced,
          needsPreauth: actionResult.needsPreauth,
          summary
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.action === 'DELETE_ALL_EMAILS') {
    (async () => {
      try {
        const items = Array.isArray(message.items) ? message.items : [];
        const ids = Array.isArray(message.ids) ? message.ids : items.map(i => i.id);

        // Group server requests by accountIndex
        const grouped = new Map();
        for (const item of items) {
          const accIdx = Number(item.accountIndex) || 0;
          const msgId = resolveHexMessageId(item);
          if (msgId) {
            if (!grouped.has(accIdx)) grouped.set(accIdx, []);
            grouped.get(accIdx).push(msgId);
          }
        }

        const results = await Promise.all(
          Array.from(grouped.entries()).map(([accIdx, msgIds]) =>
            executeGmailServerAction(accIdx, msgIds, 'tr')
          )
        );
        const allSynced = results.length > 0 && results.every(r => r.synced);
        const needsPreauth = results.some(r => r.needsPreauth);

        if (allSynced) {
          const settings = await getSettings();
          const locallyReadSet = new Set(settings.locallyReadIds || []);
          ids.forEach(id => {
            if (id) locallyReadSet.add(id);
          });
          for (const msgIds of grouped.values()) {
            msgIds.forEach(mId => locallyReadSet.add(mId));
          }
          const trimmed = Array.from(locallyReadSet).slice(-1000);
          await chrome.storage.local.set({ locallyReadIds: trimmed });

          if (settings.cachedFeeds) {
            for (const [accIdx, msgIds] of grouped.entries()) {
              const feed = settings.cachedFeeds[accIdx];
              if (feed && Array.isArray(feed.entries)) {
                const msgIdSet = new Set(msgIds);
                const idSet = new Set(ids);
                feed.entries = feed.entries.filter(e => !idSet.has(e.id) && !msgIdSet.has(e.messageId));
                feed.fullcount = Math.max(0, feed.entries.length);
              }
            }
            await chrome.storage.local.set({ cachedFeeds: settings.cachedFeeds });
          }
        }

        const summary = await checkAllAccounts();
        sendResponse({
          success: true,
          serverSynced: allSynced,
          needsPreauth,
          summary
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});
