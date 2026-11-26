/**
 * Local Gmail Command Center - Cross-Browser MV3 Background Script
 * Supports Chrome (Service Worker + Offscreen + Side Panel)
 * and Firefox (Event Page + Direct DOMParser/Audio + Sidebar Action).
 */

import { parseGmailAtom } from './shared/atom-parser.js';
import { playChime } from './shared/audio.js';
import {
  getExtensionApi,
  getSessionStore,
  hasOffscreenApi,
  setBadgeTextColorSafe
} from './shared/browser-api.js';
import {
  AI_SUMMARY_TIMEOUT_MS,
  AI_TEST_TIMEOUT_MS,
  ALARM_NAME,
  DEFAULT_AI_ENDPOINT,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_PROVIDER,
  DEFAULT_POLL_INTERVAL,
  DEFAULT_SETTINGS,
  DEFAULT_VENICE_MODEL,
  LOCALLY_READ_GRACE_MS,
  MAX_AI_SUMMARIES,
  MAX_LOCALLY_READ_IDS,
  MAX_NOTIFICATION_LINKS,
  MAX_NOTIFIED_IDS,
  VENICE_API_ENDPOINT,
  VENICE_MODELS_ENDPOINT
} from './shared/config.js';
import { resolveHexMessageId, toHexThreadId } from './shared/gmail-ids.js';
import { getCandidateLocalEndpoints } from './shared/ui-logic.js';
import { isVipEmail } from './shared/vip.js';

// Embedded Base64 Data URL for Notifications (Gmail Icon)
const NOTIFICATION_ICON_DATA_URL =
  'data:image/png;base64,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';

/**
 * Creates a self-contained background controller with injectable WebExtension API & platform deps.
 */
export function createBackgroundController(api = getExtensionApi(), deps = {}) {
  const fetchFn = deps.fetchImpl || globalThis.fetch;
  const DOMParserCtor = deps.DOMParser || globalThis.DOMParser;
  const AudioContextCtor =
    deps.AudioContext || globalThis.AudioContext || globalThis.webkitAudioContext;
  const nowFn = deps.now || Date.now;

  // Ephemeral caches (safe to rebuild after SW/Event-Page restart)
  const gmailTokensCache = new Map();
  const gmailSimplePageUrlCache = new Map();
  let creatingOffscreenPromise = null;
  let inFlightCheckPromise = null;

  /**
   * Ensures Chrome's single offscreen document exists when needed.
   */
  async function ensureOffscreenDocument() {
    if (!hasOffscreenApi(api)) return false;

    const offscreenUrl = api.runtime.getURL('offscreen.html');
    if (typeof api.runtime.getContexts === 'function') {
      const existing = await api.runtime.getContexts({
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
        await api.offscreen.createDocument({
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

    try {
      await creatingOffscreenPromise;
    } finally {
      creatingOffscreenPromise = null;
    }
    return true;
  }

  /**
   * Parses Gmail Atom XML via Chrome offscreen DOMParser or directly in Firefox event page.
   */
  async function parseAtomXml(xmlText, accountIndex) {
    if (hasOffscreenApi(api)) {
      await ensureOffscreenDocument();
      return await api.runtime.sendMessage({
        action: 'PARSE_GMAIL_ATOM',
        xmlText,
        accountIndex
      });
    }
    return parseGmailAtom(xmlText, accountIndex, DOMParserCtor);
  }

  /**
   * Plays notification chime via Chrome offscreen or directly in Firefox event page.
   */
  async function playNotificationChime() {
    if (hasOffscreenApi(api)) {
      await ensureOffscreenDocument();
      return await api.runtime.sendMessage({ action: 'PLAY_NOTIFICATION_SOUND' });
    }
    await playChime(AudioContextCtor);
    return { success: true };
  }

  /**
   * Ensures Chrome Side Panel default path is enabled when supported.
   */
  async function initSidePanelOptions() {
    if (api?.sidePanel && typeof api.sidePanel.setOptions === 'function') {
      try {
        await api.sidePanel.setOptions({
          path: 'sidepanel.html',
          enabled: true
        });
      } catch (err) {
        console.warn('Could not set side panel options:', err);
      }
    }
  }

  /**
   * Loads settings from storage.local merged with defaults.
   */
  async function getSettings() {
    const stored = await api.storage.local.get(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  /**
   * Persists notificationId -> link URL in session storage (survives MV3 SW restarts).
   */
  async function saveNotificationLinks(entries) {
    if (!entries || entries.length === 0) return;
    const store = getSessionStore(api);
    if (!store) return;

    try {
      const data = await store.get({ notificationLinks: {} });
      const map = { ...(data.notificationLinks || {}) };
      for (const [id, url] of entries) {
        map[id] = url;
      }

      const keys = Object.keys(map);
      if (keys.length > MAX_NOTIFICATION_LINKS) {
        const dropCount = keys.length - MAX_NOTIFICATION_LINKS;
        for (let i = 0; i < dropCount; i++) {
          delete map[keys[i]];
        }
      }

      await store.set({ notificationLinks: map });
    } catch (err) {
      console.warn('Failed to persist notification links:', err);
    }
  }

  /**
   * Consumes and removes a stored notification link on click.
   */
  async function consumeNotificationLink(notificationId) {
    const store = getSessionStore(api);
    if (!store) return null;

    try {
      const data = await store.get({ notificationLinks: {} });
      const map = { ...(data.notificationLinks || {}) };
      const targetUrl = map[notificationId] || null;
      if (notificationId in map) {
        delete map[notificationId];
        await store.set({ notificationLinks: map });
      }
      return targetUrl;
    } catch (_) {
      return null;
    }
  }

  /**
   * Updates toolbar badge text & colors according to unread count and auth state.
   */
  async function updateBadge(totalUnread, allUnauthorized, anyEnabled) {
    try {
      if (!anyEnabled) {
        await api.action.setBadgeText({ text: '' });
        return;
      }

      if (allUnauthorized) {
        await api.action.setBadgeText({ text: '?' });
        await api.action.setBadgeBackgroundColor({ color: '#5F6368' });
        await setBadgeTextColorSafe(api, '#FFFFFF');
        return;
      }

      if (totalUnread > 0) {
        const displayCount = totalUnread > 999 ? '999+' : String(totalUnread);
        await api.action.setBadgeText({ text: displayCount });
        await api.action.setBadgeBackgroundColor({ color: '#D93025' });
        await setBadgeTextColorSafe(api, '#FFFFFF');
      } else {
        await api.action.setBadgeText({ text: '' });
      }
    } catch (err) {
      console.error('Badge update error:', err);
    }
  }

  /**
   * Fetches and parses a single Gmail account Atom feed.
   */
  async function fetchAccountFeed(accOrIndex) {
    const accountIndex =
      typeof accOrIndex === 'object' ? Number(accOrIndex.index) : Number(accOrIndex);
    const email =
      typeof accOrIndex === 'object' && accOrIndex.email ? accOrIndex.email.trim() : '';

    const urlsToTry = [];
    if (email && email.includes('@')) {
      urlsToTry.push(
        `https://mail.google.com/mail/feed/atom?authuser=${encodeURIComponent(email)}`
      );
      urlsToTry.push(
        `https://mail.google.com/mail/u/${encodeURIComponent(email)}/feed/atom`
      );
    }
    urlsToTry.push(`https://mail.google.com/mail/u/${accountIndex}/feed/atom`);

    let lastError = 'Unauthorized';

    for (const url of urlsToTry) {
      try {
        const res = await fetchFn(url, {
          credentials: 'include',
          cache: 'no-store'
        });

        if (
          res.status === 401 ||
          res.status === 403 ||
          (res.redirected && res.url && res.url.includes('ServiceLogin'))
        ) {
          lastError = res.status === 403 ? 'HTTP 403' : 'Unauthorized';
          // Explicit auth rejection on direct u/{index} slot doesn't need duplicate ?authuser= call
          if (url.includes(`/mail/u/${accountIndex}/feed/atom`)) {
            break;
          }
          continue;
        }

        if (!res.ok) {
          lastError = `HTTP ${res.status}`;
          continue;
        }

        const xmlText = await res.text();
        if (!xmlText.includes('<feed') && !xmlText.includes('<fullcount>')) {
          continue;
        }

        const parseResponse = await parseAtomXml(xmlText, accountIndex);
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
   * Builds normalized locallyReadMap from storage (migrating legacy locallyReadIds array).
   */
  function buildLocallyReadMap(settings, currentNowMs) {
    const map = {};
    if (settings.locallyReadMap && typeof settings.locallyReadMap === 'object') {
      for (const [id, ts] of Object.entries(settings.locallyReadMap)) {
        if (id && typeof ts === 'number') {
          map[id] = ts;
        }
      }
    }
    if (Array.isArray(settings.locallyReadIds)) {
      for (const id of settings.locallyReadIds) {
        if (id && !(id in map)) {
          map[id] = currentNowMs;
        }
      }
    }
    return map;
  }

  /**
   * Core multi-account check implementation (wrapped by single-flight concurrency lock).
   */
  async function runCheckAllAccounts() {
    const settings = await getSettings();
    const existingAccounts = settings.accounts || [];
    const currentNowMs = nowFn();

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

    const anyEnabled = accountsToScan.length > 0;
    const results = await Promise.all(accountsToScan.map(acc => fetchAccountFeed(acc)));

    const slot0Result = results.find(r => r.accountIndex === 0 && !r.unauthorized);
    const primaryEmail = slot0Result ? slot0Result.accountEmail : null;

    let totalUnread = 0;
    let allEnabledUnauthorized = anyEnabled;
    const newNotifiedIds = new Set(settings.notifiedIds || []);
    const locallyReadMap = buildLocallyReadMap(settings, currentNowMs);
    const activeRawFeedIds = new Set();
    const brandNewEntries = [];
    const cachedFeeds = {};

    for (const res of results) {
      if (res.accountIndex > 0 && primaryEmail && res.accountEmail === primaryEmail) {
        cachedFeeds[res.accountIndex] = {
          unauthorized: true,
          fullcount: 0,
          rawCount: 0,
          accountEmail: '',
          entries: [],
          lastUpdated: new Date(currentNowMs).toISOString(),
          error: 'Redirect duplicate'
        };
        continue;
      }

      let effectiveCount = 0;
      if (!res.unauthorized) {
        allEnabledUnauthorized = false;

        const entries = res.entries || [];
        for (const e of entries) {
          if (e.id) activeRawFeedIds.add(e.id);
          if (e.messageId) activeRawFeedIds.add(e.messageId);
        }

        const unreadEntries = entries.filter(
          e => !(e.id in locallyReadMap) && !(e.messageId && e.messageId in locallyReadMap)
        );
        const readDeduction = entries.length - unreadEntries.length;
        effectiveCount = Math.max(0, (res.fullcount || 0) - readDeduction);
        totalUnread += effectiveCount;

        for (const entry of unreadEntries) {
          if (
            !newNotifiedIds.has(entry.id) &&
            !(entry.messageId && newNotifiedIds.has(entry.messageId))
          ) {
            brandNewEntries.push(entry);
            newNotifiedIds.add(entry.id);
            if (entry.messageId) newNotifiedIds.add(entry.messageId);
          }
        }
      }

      cachedFeeds[res.accountIndex] = {
        unauthorized: res.unauthorized,
        fullcount: effectiveCount,
        rawCount: res.fullcount || 0,
        accountEmail: res.accountEmail,
        entries: res.entries,
        lastUpdated: new Date(currentNowMs).toISOString(),
        error: res.error
      };
    }

    // Preserve disabled accounts in cachedFeeds metadata cleanly? Keep disabled accounts out of active scan.
    // Reconcile locallyReadMap: prune IDs no longer in Gmail's unread feed once past grace period
    const reconciledReadMap = {};
    for (const [id, ts] of Object.entries(locallyReadMap)) {
      if (activeRawFeedIds.has(id) || currentNowMs - ts < LOCALLY_READ_GRACE_MS) {
        reconciledReadMap[id] = ts;
      }
    }
    const reconciledEntries = Object.entries(reconciledReadMap).slice(-MAX_LOCALLY_READ_IDS);
    const prunedReadMap = Object.fromEntries(reconciledEntries);
    const prunedReadIds = Object.keys(prunedReadMap);

    // Preserve user-configured accounts, updating discovered emails/default names
    const updatedAccounts = existingAccounts.map(acc => {
      const res = results.find(r => r.accountIndex === acc.index);
      if (res && !res.unauthorized && res.accountEmail) {
        const emailPrefix = res.accountEmail.split('@')[0];
        const hasCustomName =
          acc.name &&
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

    for (const res of results) {
      if (
        !res.unauthorized &&
        res.accountEmail &&
        (res.accountEmail !== primaryEmail || res.accountIndex === 0)
      ) {
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

    await updateBadge(totalUnread, allEnabledUnauthorized, anyEnabled);

    // Trigger notifications & chime
    let shouldPlaySound = false;
    const newNotificationPairs = [];

    if (brandNewEntries.length > 0 && !settings.focusMode) {
      for (const entry of brandNewEntries) {
        const isVip = isVipEmail(entry, settings.vipKeywords);
        if (settings.vipOnly && !isVip) {
          continue;
        }

        try {
          const notifId = `email-${nowFn()}-${Math.random().toString(36).substring(2, 7)}`;
          newNotificationPairs.push([notifId, entry.link]);

          const titleText = `${entry.authorName || 'Gmail'}: ${entry.title || '(No Subject)'}`;
          const messageText = entry.summary
            ? entry.summary.substring(0, 150)
            : 'ახალი წერილი მიღებულია';

          await api.notifications.create(notifId, {
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

    if (newNotificationPairs.length > 0) {
      await saveNotificationLinks(newNotificationPairs);
    }

    if (shouldPlaySound && settings.soundEnabled && !settings.focusMode) {
      try {
        await playNotificationChime();
      } catch (err) {
        console.warn('Audio chime trigger notice:', err);
      }
    }

    const trimmedNotifiedIds = Array.from(newNotifiedIds).slice(-MAX_NOTIFIED_IDS);
    const storageUpdate = {
      cachedFeeds,
      notifiedIds: trimmedNotifiedIds,
      locallyReadMap: prunedReadMap,
      locallyReadIds: prunedReadIds,
      lastGlobalCheck: new Date(currentNowMs).toISOString()
    };

    if (JSON.stringify(updatedAccounts) !== JSON.stringify(existingAccounts)) {
      storageUpdate.accounts = updatedAccounts;
    }

    await api.storage.local.set(storageUpdate);

    return { totalUnread, allEnabledUnauthorized, anyEnabled, results };
  }

  /**
   * Single-flight wrapper for checkAllAccounts.
   * When afterInFlight is true (e.g. after a server mutation), waits for active check then runs a fresh check.
   */
  async function checkAllAccounts({ afterInFlight = false } = {}) {
    if (inFlightCheckPromise) {
      if (!afterInFlight) {
        return await inFlightCheckPromise;
      }
      try {
        await inFlightCheckPromise;
      } catch (_) {
        // Proceed with fresh check
      }
    }

    inFlightCheckPromise = runCheckAllAccounts();
    try {
      return await inFlightCheckPromise;
    } finally {
      inFlightCheckPromise = null;
    }
  }

  /**
   * Configures periodic polling alarm without double-firing immediately on startup.
   */
  async function setupAlarm(intervalMinutes) {
    const period = Math.max(0.5, Number(intervalMinutes) || DEFAULT_POLL_INTERVAL);
    await api.alarms.clear(ALARM_NAME);
    await api.alarms.create(ALARM_NAME, {
      delayInMinutes: period,
      periodInMinutes: period
    });
  }

  /**
   * Retrieves the GMAIL_AT anti-CSRF token isolated per account index.
   * Never leaks u/0's fallback /mail cookie to u/1+ accounts.
   */
  async function getGmailAtCookie(accountIndex) {
    const exactUrls = [
      `https://mail.google.com/mail/u/${accountIndex}`,
      `https://mail.google.com/mail/u/${accountIndex}/`
    ];
    for (const url of exactUrls) {
      try {
        const c = await api.cookies.get({ name: 'GMAIL_AT', url });
        if (c && c.value) return c.value;
      } catch (_) {}
    }

    try {
      const cookies = await api.cookies.getAll({ name: 'GMAIL_AT' });
      if (cookies && cookies.length > 0) {
        const targetPath = `/mail/u/${accountIndex}`;
        const exactMatch = cookies.find(
          c => c.path === targetPath || c.path === `${targetPath}/`
        );
        if (exactMatch && exactMatch.value) {
          return exactMatch.value;
        }

        if (accountIndex === 0) {
          let fallback = cookies.find(
            c => c.path === '/mail' || c.path === '/' || !c.path?.includes('/u/')
          );
          if (!fallback && cookies.length === 1) {
            fallback = cookies[0];
          }
          if (fallback && fallback.value) {
            return fallback.value;
          }
        }
      }
    } catch (err) {
      console.warn('GMAIL_AT cookie getAll notice:', err);
    }

    if (accountIndex === 0) {
      for (const url of ['https://mail.google.com/mail', 'https://mail.google.com/mail/']) {
        try {
          const c = await api.cookies.get({ name: 'GMAIL_AT', url });
          if (c && c.value) return c.value;
        } catch (_) {}
      }
    }

    return null;
  }

  /**
   * Fetches Gmail Simple View (/s/) to obtain ID_KEY (ik token), following meta-refresh redirects.
   */
  async function getGmailIkFromSimpleView(accountIndex, forceResetUrl = false) {
    if (forceResetUrl) {
      gmailSimplePageUrlCache.delete(accountIndex);
    }
    let currentHref =
      gmailSimplePageUrlCache.get(accountIndex) ||
      `https://mail.google.com/mail/u/${accountIndex}/s/`;

    for (let hop = 0; hop < 4; hop++) {
      try {
        const res = await fetchFn(currentHref, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (!res.ok) break;

        const content = await res.text();
        if (content.includes('/spreauth')) {
          const links = content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || [];
          const preauthUrl =
            links.find(l => l.includes('spreauth')) ||
            `https://mail.google.com/mail/u/${accountIndex}/spreauth`;
          return { ik: null, needsPreauth: true, preauthUrl };
        }

        const idKeyMatch = content.match(/ID_KEY\s*=\s*['"](?<ik>[^'"]+)['"]/);
        if (idKeyMatch && idKeyMatch.groups && idKeyMatch.groups.ik) {
          return { ik: idKeyMatch.groups.ik, needsPreauth: false };
        }

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
    if (!forceRefresh && cached && cached.expiresAt > nowFn() && cached.at && cached.ik) {
      return cached;
    }

    let at = await getGmailAtCookie(accountIndex);
    const ikResult = await getGmailIkFromSimpleView(accountIndex, forceRefresh);
    let ik = ikResult.ik;

    if (!at) {
      at = await getGmailAtCookie(accountIndex);
    }

    if (!at || !ik) {
      try {
        const hRes = await fetchFn(`https://mail.google.com/mail/u/${accountIndex}/h/`, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (hRes.ok) {
          if (!at) at = await getGmailAtCookie(accountIndex);
          const hHtml = await hRes.text();
          if (!at) {
            const atHrefMatch = hHtml.match(/href=["'][^"']*[?&]at=([^&"'<>]+)/i);
            const atInputMatch =
              hHtml.match(/name=["']at["'][^>]*value=["']([^"']+)["']/i) ||
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
        const res = await fetchFn(`https://mail.google.com/mail/u/${accountIndex}/`, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (res.ok) {
          if (!at) at = await getGmailAtCookie(accountIndex);
          const html = await res.text();
          if (!ik) {
            const ikInGlobals = html.match(
              /var\s+GLOBALS\s*=\s*\[(?:[^,\]]*,){9}\s*["']([a-zA-Z0-9_-]+)["']/
            );
            const gmIdMatch = html.match(/GM_ID_KEY\s*=\s*["']([a-zA-Z0-9_-]+)["']/);
            const ikKeyMatch = html.match(/["']ik["']\s*[:=,]\s*["']([a-zA-Z0-9_-]+)["']/);
            ik = ikInGlobals?.[1] || gmIdMatch?.[1] || ikKeyMatch?.[1] || null;
          }
          if (!at) {
            const gmMatch = html.match(/GM_ACTION_TOKEN\s*=\s*["']([^"']+)["']/);
            const atJsonMatch = html.match(/["']at["']\s*[:=,]\s*["']([^"']+)["']/);
            const atParamMatch = html.match(/[?&]at=([^&"'<>]+)/);
            at =
              gmMatch?.[1] ||
              atJsonMatch?.[1] ||
              (atParamMatch?.[1] ? decodeURIComponent(atParamMatch[1]) : null);
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
      const entry = { at, ik, expiresAt: nowFn() + 10 * 60 * 1000, needsPreauth: false };
      gmailTokensCache.set(accountIndex, entry);
      return entry;
    }

    return { at: at || null, ik: ik || null, needsPreauth: false };
  }

  /**
   * Performs Gmail Simple View (/s/?v=or) batch RPC request for Trash ('tr' = 9) or Mark Read ('rd' = 3).
   */
  async function sendGmailBatchRpc(accountIndex, validIds, cmd, ik, at) {
    const actionCode = cmd === 'tr' ? 9 : 3;
    const body = new FormData();
    body.append(
      's_jr',
      JSON.stringify([
        null,
        [
          ...validIds.map(id => [null, null, null, [null, actionCode, id, id, 'l:all', [], [], []]]),
          [null, null, null, null, null, null, [null, true, false]],
          [null, null, null, null, null, null, [null, true, false]]
        ],
        2,
        null,
        null,
        null,
        ik
      ])
    );

    const url = `https://mail.google.com/mail/u/${accountIndex}/s/?v=or&ik=${encodeURIComponent(
      ik
    )}&at=${encodeURIComponent(at)}&subui=chrome&hl=en&ts=${nowFn()}`;
    const res = await fetchFn(url, {
      method: 'POST',
      credentials: 'include',
      body
    });

    const content = await res.text();
    if (!content || content.includes('/spreauth')) {
      const links = content ? content.match(/\bhttps?:\/\/[^\s<>"'()]+/gi) || [] : [];
      const preauthUrl =
        links.find(l => l.includes('spreauth')) ||
        `https://mail.google.com/mail/u/${accountIndex}/spreauth`;
      return { ok: false, needsPreauth: true, preauthUrl };
    }

    if (res.ok && !content.includes('<html') && !content.includes('<!DOCTYPE')) {
      return { ok: true, needsPreauth: false };
    }

    return { ok: false, needsPreauth: false, status: res.status };
  }

  /**
   * Handles Gmail's /spreauth security gate via a brief background tab before escalating to user interaction.
   */
  async function performSpreauthHandshake(accountIndex, preauthUrl) {
    const targetUrl = preauthUrl || `https://mail.google.com/mail/u/${accountIndex}/spreauth`;
    let tab = null;
    try {
      tab = await api.tabs.create({ url: targetUrl, active: false });
      const startTime = nowFn();

      while (nowFn() - startTime < 4500) {
        await new Promise(r => setTimeout(r, 250));
        let currentTab;
        try {
          currentTab = await api.tabs.get(tab.id);
        } catch (_) {
          return { completedSilently: false };
        }

        const tabUrl = currentTab.url || '';
        if (
          currentTab.status === 'complete' &&
          tabUrl.startsWith('https://mail.google.com/') &&
          !tabUrl.includes('spreauth')
        ) {
          await new Promise(r => setTimeout(r, 300));
          try {
            await api.tabs.remove(tab.id);
          } catch (_) {}
          return { completedSilently: true };
        }

        if (
          currentTab.status === 'complete' &&
          nowFn() - startTime > 1500 &&
          (tabUrl.includes('accounts.google.com') || tabUrl.includes('spreauth'))
        ) {
          await api.tabs.update(tab.id, { active: true });
          return { completedSilently: false, tabOpened: true };
        }
      }

      if (tab && tab.id) {
        await api.tabs.update(tab.id, { active: true });
      }
      return { completedSilently: false, tabOpened: true };
    } catch (err) {
      console.warn('spreauth handshake notice:', err);
      return { completedSilently: false };
    }
  }

  /**
   * Executes a server-side action on Gmail ('tr' = Trash, 'rd' = Mark Read).
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
      let rpcResult = await sendGmailBatchRpc(
        accountIndex,
        validIds,
        cmd,
        tokenInfo.ik,
        tokenInfo.at
      );
      if (rpcResult.ok) {
        return { synced: true, needsPreauth: false };
      }

      if (rpcResult.needsPreauth) {
        const handshake = await performSpreauthHandshake(accountIndex, rpcResult.preauthUrl);
        gmailTokensCache.delete(accountIndex);
        if (handshake.completedSilently) {
          const freshTokens = await getAccountActionTokens(accountIndex, true);
          if (freshTokens.at && freshTokens.ik) {
            const retryResult = await sendGmailBatchRpc(
              accountIndex,
              validIds,
              cmd,
              freshTokens.ik,
              freshTokens.at
            );
            if (retryResult.ok) {
              return { synced: true, needsPreauth: false };
            }
            if (retryResult.needsPreauth) {
              await api.tabs.create({
                url:
                  retryResult.preauthUrl ||
                  `https://mail.google.com/mail/u/${accountIndex}/spreauth`,
                active: true
              });
            }
          }
        }
        return { synced: false, needsPreauth: true };
      }

      gmailTokensCache.delete(accountIndex);
      const refreshed = await getAccountActionTokens(accountIndex, true);
      if (refreshed.at && refreshed.ik) {
        rpcResult = await sendGmailBatchRpc(
          accountIndex,
          validIds,
          cmd,
          refreshed.ik,
          refreshed.at
        );
        if (rpcResult.ok) {
          return { synced: true, needsPreauth: false };
        }
      }
    } catch (err) {
      console.warn('executeGmailServerAction error:', err);
    }

    return { synced: false, needsPreauth: false };
  }

  /**
   * Commits locally read/deleted IDs and deducts exact count from cachedFeeds.
   */
  async function commitLocallyRemovedItems(itemsByAccount) {
    const settings = await getSettings();
    const currentNowMs = nowFn();
    const readMap = buildLocallyReadMap(settings, currentNowMs);
    const cachedFeeds = { ...(settings.cachedFeeds || {}) };

    for (const [accIdx, { rawIds, msgIds }] of itemsByAccount.entries()) {
      for (const id of rawIds) {
        if (id) readMap[id] = currentNowMs;
      }
      for (const msgId of msgIds) {
        if (msgId) readMap[msgId] = currentNowMs;
      }

      const feed = cachedFeeds[accIdx];
      if (feed && Array.isArray(feed.entries)) {
        const rawIdSet = new Set(rawIds);
        const msgIdSet = new Set(msgIds);
        const beforeLen = feed.entries.length;
        const filteredEntries = feed.entries.filter(
          e => !rawIdSet.has(e.id) && !(e.messageId && msgIdSet.has(e.messageId))
        );
        const removedCount = beforeLen - filteredEntries.length;
        const nextFullcount = Math.max(
          0,
          (typeof feed.fullcount === 'number' ? feed.fullcount : beforeLen) - removedCount
        );
        const nextRawCount = Math.max(
          0,
          (typeof feed.rawCount === 'number' ? feed.rawCount : nextFullcount) - removedCount
        );

        cachedFeeds[accIdx] = {
          ...feed,
          entries: filteredEntries,
          fullcount: nextFullcount,
          rawCount: nextRawCount
        };
      }
    }

    const trimmedEntries = Object.entries(readMap).slice(-MAX_LOCALLY_READ_IDS);
    const trimmedMap = Object.fromEntries(trimmedEntries);
    await api.storage.local.set({
      locallyReadMap: trimmedMap,
      locallyReadIds: Object.keys(trimmedMap),
      cachedFeeds
    });
  }

  /**
   * Shared handler for single-email mark-read ('rd') or delete ('tr').
   */
  async function handleSingleServerAction(message, cmd) {
    const messageId = resolveHexMessageId(message);
    const accountIndex = Number(message.accountIndex) || 0;
    let actionResult = { synced: false, needsPreauth: false };

    if (messageId) {
      actionResult = await executeGmailServerAction(accountIndex, [messageId], cmd);
    }

    if (actionResult.synced) {
      const itemsByAccount = new Map([
        [accountIndex, { rawIds: [message.id].filter(Boolean), msgIds: [messageId].filter(Boolean) }]
      ]);
      await commitLocallyRemovedItems(itemsByAccount);
    }

    const summary = await checkAllAccounts({ afterInFlight: true });
    return {
      success: true,
      serverSynced: actionResult.synced,
      needsPreauth: actionResult.needsPreauth,
      summary
    };
  }

  /**
   * Shared handler for bulk mark-read ('rd') or delete ('tr') across one or multiple accounts.
   */
  async function handleBulkServerAction(message, cmd) {
    const items = Array.isArray(message.items) ? message.items : [];
    const grouped = new Map();

    for (const item of items) {
      const accIdx = Number(item.accountIndex) || 0;
      const msgId = resolveHexMessageId(item);
      if (!msgId) continue;

      if (!grouped.has(accIdx)) {
        grouped.set(accIdx, { rawIds: [], msgIds: [] });
      }
      const bucket = grouped.get(accIdx);
      if (item.id) bucket.rawIds.push(item.id);
      bucket.msgIds.push(msgId);
    }

    const accountEntries = Array.from(grouped.entries());
    const results = await Promise.all(
      accountEntries.map(async ([accIdx, bucket]) => {
        const res = await executeGmailServerAction(accIdx, bucket.msgIds, cmd);
        return { accIdx, bucket, res };
      })
    );

    const syncedItemsByAccount = new Map();
    const syncedIds = [];
    const syncedMessageIds = [];
    let syncedAccounts = 0;
    let failedAccounts = 0;
    let needsPreauth = false;

    for (const { accIdx, bucket, res } of results) {
      if (res.needsPreauth) needsPreauth = true;
      if (res.synced) {
        syncedAccounts++;
        syncedItemsByAccount.set(accIdx, bucket);
        syncedIds.push(...bucket.rawIds);
        syncedMessageIds.push(...bucket.msgIds);
      } else {
        failedAccounts++;
      }
    }

    if (syncedItemsByAccount.size > 0) {
      await commitLocallyRemovedItems(syncedItemsByAccount);
    }

    const allSynced = results.length > 0 && failedAccounts === 0;
    const partialSync = syncedAccounts > 0 && failedAccounts > 0;
    const summary = await checkAllAccounts({ afterInFlight: true });

    return {
      success: true,
      serverSynced: allSynced,
      partialSync,
      syncedCount: syncedIds.length,
      failedCount: failedAccounts,
      syncedIds,
      syncedMessageIds,
      needsPreauth,
      summary
    };
  }

  /**
   * Generates a 1-sentence AI summary via configured provider (LM Studio or Venice AI).
   */
  async function handleGenerateAiSummary(message) {
    const settings = await getSettings();
    const entryId = message.entryId;
    const aiSummaries = { ...(settings.aiSummaries || {}) };

    if (entryId && aiSummaries[entryId]) {
      return { success: true, summary: aiSummaries[entryId], cached: true };
    }

    const emailText = message.emailText || '';
    const systemPrompt =
      'You are a concise email assistant. Summarize the key point of this email in 1 clear, helpful sentence. If in Georgian, reply in Georgian; otherwise in English.';

    const provider = settings.aiProvider || DEFAULT_AI_PROVIDER;
    const isVenice = provider === 'venice';

    let endpointsToTry;
    let model;
    const headers = { 'Content-Type': 'application/json' };

    if (isVenice) {
      const apiKey = (settings.veniceApiKey || '').trim();
      if (!apiKey) {
        throw new Error('Venice AI API გასაღები არ არის შეყვანილი (გახსენით Settings)');
      }
      headers.Authorization = `Bearer ${apiKey}`;
      endpointsToTry = [VENICE_API_ENDPOINT];
      model = (settings.veniceModel || DEFAULT_VENICE_MODEL).trim();
    } else {
      const endpoint = (settings.aiEndpoint || DEFAULT_AI_ENDPOINT).trim();
      endpointsToTry = getCandidateLocalEndpoints(endpoint);
      model = (settings.aiModel || DEFAULT_AI_MODEL).trim();
    }

    let lastErr = null;
    let responseData = null;

    for (const ep of endpointsToTry) {
      try {
        const res = await fetchFn(ep, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(AI_SUMMARY_TIMEOUT_MS),
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: emailText }
            ],
            temperature: 0.2,
            max_tokens: 2048,
            stream: false
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'Server Error'}`);
        }

        responseData = await res.json();
        break;
      } catch (err) {
        lastErr =
          err?.name === 'TimeoutError' || err?.name === 'AbortError'
            ? new Error('მოთხოვნის დრო ამოიწურა (Timeout)')
            : err;
      }
    }

    if (!responseData) {
      throw lastErr || new Error('Connection failed');
    }

    const msg = responseData.choices?.[0]?.message;
    let summary = (msg?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    if (!summary && msg?.reasoning_content) {
      const reasoning = msg.reasoning_content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const lines = reasoning.split('\n').map(l => l.trim()).filter(Boolean);
      summary = lines[lines.length - 1] || reasoning;
    }

    if (!summary) {
      throw new Error('მოდელმა დააბრუნა ცარიელი პასუხი');
    }

    if (entryId) {
      aiSummaries[entryId] = summary;
      const keys = Object.keys(aiSummaries);
      if (keys.length > MAX_AI_SUMMARIES) {
        const dropCount = keys.length - MAX_AI_SUMMARIES;
        for (let i = 0; i < dropCount; i++) {
          delete aiSummaries[keys[i]];
        }
      }
      await api.storage.local.set({ aiSummaries });
    }

    return { success: true, summary, provider };
  }

  /**
   * Tests connectivity and fetches available models for LM Studio or Venice AI.
   */
  async function handleTestAiConnection(message) {
    const settings = await getSettings();
    const provider = message.provider || settings.aiProvider || DEFAULT_AI_PROVIDER;

    if (provider === 'venice') {
      const apiKey = (message.apiKey ?? settings.veniceApiKey ?? '').trim();
      if (!apiKey) {
        throw new Error('გთხოვთ შეიყვანოთ Venice AI API გასაღები');
      }
      try {
        const res = await fetchFn(VENICE_MODELS_ENDPOINT, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(AI_TEST_TIMEOUT_MS)
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'Auth/API Error'}`);
        }
        const data = await res.json();
        const models = (data.data || [])
          .filter(m => !m.type || m.type === 'text')
          .map(m => m.id)
          .filter(Boolean);
        return { success: true, models, provider: 'venice' };
      } catch (err) {
        throw err?.name === 'TimeoutError' || err?.name === 'AbortError'
          ? new Error('Venice AI სერვერმა დროულად არ უპასუხა (Timeout)')
          : err;
      }
    }

    const rawEndpoint = (message.endpoint || settings.aiEndpoint || DEFAULT_AI_ENDPOINT).trim();
    const candidates = getCandidateLocalEndpoints(rawEndpoint);

    let lastErr = null;
    for (const ep of candidates) {
      try {
        let baseUrl = ep.replace(/\/v1\/chat\/completions\/?$/, '');
        if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';
        const modelsUrl = `${baseUrl}/models`;

        const res = await fetchFn(modelsUrl, {
          signal: AbortSignal.timeout(AI_TEST_TIMEOUT_MS)
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        const models = (data.data || []).map(m => m.id);
        return { success: true, models, provider: 'lmstudio' };
      } catch (err) {
        lastErr =
          err?.name === 'TimeoutError' || err?.name === 'AbortError'
            ? new Error('სერვერმა დროულად არ უპასუხა (Timeout)')
            : err;
      }
    }

    throw lastErr || new Error('Connection failed');
  }

  /**
   * Handles incoming runtime messages from Popup / Side Panel.
   */
  async function handleMessage(message) {
    if (!message || !message.action) return null;

    switch (message.action) {
      case 'REFRESH_NOW': {
        const summary = await checkAllAccounts();
        return { success: true, summary };
      }

      case 'TEST_SOUND': {
        try {
          const res = await playNotificationChime();
          return res || { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      case 'OPEN_SIDE_PANEL': {
        try {
          let windowId = message.windowId;
          if (!windowId && api.windows?.getLastFocused) {
            const focusedWindow = await api.windows.getLastFocused({ populate: false });
            windowId = focusedWindow?.id;
          }
          if (!windowId) {
            return { success: false, error: 'No active window found' };
          }
          await initSidePanelOptions();
          if (api.sidePanel && typeof api.sidePanel.open === 'function') {
            await api.sidePanel.open({ windowId });
            return { success: true };
          }
          return { success: false, error: 'Side panel API unavailable' };
        } catch (err) {
          console.error('Side panel open error:', err);
          return { success: false, error: err.message };
        }
      }

      case 'SETTINGS_UPDATED': {
        const settings = await getSettings();
        await setupAlarm(settings.pollInterval);
        return { success: true };
      }

      case 'GENERATE_AI_SUMMARY': {
        try {
          return await handleGenerateAiSummary(message);
        } catch (err) {
          console.error('LM Studio summary error:', err);
          return { success: false, error: err.message };
        }
      }

      case 'TEST_AI_CONNECTION':
      case 'TEST_LM_STUDIO_CONNECTION': {
        try {
          return await handleTestAiConnection(message);
        } catch (err) {
          console.error('AI connection test failed:', err);
          return { success: false, error: err.message };
        }
      }

      case 'OPEN_AND_MARK_READ': {
        try {
          if (message.link) {
            await api.tabs.create({ url: message.link });
          }
          return await handleSingleServerAction(message, 'rd');
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      case 'MARK_EMAIL_READ': {
        try {
          return await handleSingleServerAction(message, 'rd');
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      case 'DELETE_EMAIL': {
        try {
          return await handleSingleServerAction(message, 'tr');
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      case 'MARK_ALL_READ': {
        try {
          return await handleBulkServerAction(message, 'rd');
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      case 'DELETE_ALL_EMAILS': {
        try {
          return await handleBulkServerAction(message, 'tr');
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      default:
        return null;
    }
  }

  /**
   * Registers WebExtension lifecycle, alarm, notification, and message listeners.
   */
  function registerListeners() {
    api.alarms.onAlarm.addListener(async alarm => {
      if (alarm?.name === ALARM_NAME) {
        await checkAllAccounts();
      }
    });

    api.runtime.onInstalled.addListener(async () => {
      await initSidePanelOptions();
      const settings = await getSettings();
      await setupAlarm(settings.pollInterval);
      await checkAllAccounts();
    });

    api.runtime.onStartup.addListener(async () => {
      await initSidePanelOptions();
      const settings = await getSettings();
      await setupAlarm(settings.pollInterval);
      await checkAllAccounts();
    });

    api.notifications.onClicked.addListener(async notificationId => {
      const targetUrl =
        (await consumeNotificationLink(notificationId)) ||
        'https://mail.google.com/mail/u/0/#inbox';
      await api.tabs.create({ url: targetUrl });
    });

    api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (
        message?.action === 'PARSE_GMAIL_ATOM' ||
        message?.action === 'PLAY_NOTIFICATION_SOUND'
      ) {
        return false;
      }

      handleMessage(message)
        .then(res => {
          if (res !== null) sendResponse(res);
        })
        .catch(err => {
          sendResponse({ success: false, error: err.message });
        });
      return true;
    });
  }

  return {
    ensureOffscreenDocument,
    initSidePanelOptions,
    getSettings,
    updateBadge,
    fetchAccountFeed,
    checkAllAccounts,
    setupAlarm,
    getGmailAtCookie,
    getGmailIkFromSimpleView,
    getAccountActionTokens,
    sendGmailBatchRpc,
    executeGmailServerAction,
    handleMessage,
    registerListeners
  };
}

if (!globalThis.__GMAIL_CMD_NO_AUTO_INIT__) {
  const controller = createBackgroundController();
  controller.registerListeners();
}
