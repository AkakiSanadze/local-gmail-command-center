/**
 * Pure, DOM-free UI state and formatting helpers (fully unit-testable in Node.js).
 */

import { DEFAULT_AI_ENDPOINT } from './config.js';

/**
 * Escapes HTML special characters to prevent XSS when interpolating strings into markup.
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats an ISO timestamp into relative Georgian label ("ახლახან", "5 წთ წინ", "14:20", "26/11").
 */
export function formatRelativeTime(isoString, nowDate = new Date()) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diffSec = Math.floor((nowDate.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'ახლახან';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} წთ წინ`;
  if (diffSec < 86400) {
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Resolves which numeric account index should be targeted for Inbox/Compose actions.
 */
export function resolveActiveAccountIndex(currentTab, accounts = []) {
  if (currentTab !== 'all' && currentTab !== null && currentTab !== undefined) {
    const parsed = Number(currentTab);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  if (Array.isArray(accounts) && accounts.length > 0) {
    const firstEnabled = accounts.find(a => a.enabled !== false && !a.manuallyDisabled);
    if (firstEnabled && Number.isFinite(Number(firstEnabled.index))) {
      return Number(firstEnabled.index);
    }
  }
  return 0;
}

/**
 * Checks whether an entry is marked read locally (either by entry.id or hex messageId).
 */
export function isEntryLocallyRead(entry, locallyReadSet) {
  if (!entry || !locallyReadSet || locallyReadSet.size === 0) return false;
  if (entry.id && locallyReadSet.has(entry.id)) return true;
  if (entry.messageId && locallyReadSet.has(entry.messageId)) return true;
  return false;
}

/**
 * Aggregates unread emails across all enabled & authorized cached feeds.
 */
export function aggregateEmails(cachedFeeds = {}, accounts = [], locallyReadIds = []) {
  const allEmails = [];
  const locallyReadSet =
    locallyReadIds instanceof Set ? locallyReadIds : new Set(locallyReadIds || []);
  let anyAuthorizedAccount = false;

  const feedIndices = Object.keys(cachedFeeds || {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  for (const idx of feedIndices) {
    const feed = cachedFeeds[idx];
    if (!feed) continue;

    const accConfig = (accounts || []).find(a => a.index === idx);
    if (accConfig && accConfig.enabled === false && accConfig.manuallyDisabled) {
      continue;
    }

    if (!feed.unauthorized) {
      anyAuthorizedAccount = true;
      if (Array.isArray(feed.entries)) {
        for (const entry of feed.entries) {
          if (isEntryLocallyRead(entry, locallyReadSet)) {
            continue;
          }
          allEmails.push({
            ...entry,
            accountIndex: idx,
            accountName:
              accConfig?.name ||
              (feed.accountEmail ? feed.accountEmail.split('@')[0] : `u/${idx}`),
            accountEmail: feed.accountEmail || accConfig?.email || ''
          });
        }
      }
    }
  }

  allEmails.sort((a, b) => new Date(b.issued || 0) - new Date(a.issued || 0));
  return { allEmails, anyAuthorizedAccount, feedIndices };
}

/**
 * Filters aggregated emails by active account tab and search query.
 */
export function filterVisibleEmails(allEmails = [], currentTab = 'all', searchQuery = '') {
  let filtered = Array.isArray(allEmails) ? allEmails : [];

  if (currentTab !== 'all') {
    const targetIdx = Number(currentTab);
    filtered = filtered.filter(e => e.accountIndex === targetIdx);
  }

  const trimmed = String(searchQuery || '').trim().toLowerCase();
  if (trimmed) {
    filtered = filtered.filter(e => {
      const titleMatch = (e.title || '').toLowerCase().includes(trimmed);
      const summaryMatch = (e.summary || '').toLowerCase().includes(trimmed);
      const authorMatch =
        (e.authorName || '').toLowerCase().includes(trimmed) ||
        (e.authorEmail || '').toLowerCase().includes(trimmed);
      const otpMatch = (e.otpCode || '').toLowerCase().includes(trimmed);
      return titleMatch || summaryMatch || authorMatch || otpMatch;
    });
  }

  return filtered;
}

/**
 * Computes consistent unread counts matching toolbar badge (`fullcount`) alongside visible Atom entries.
 */
export function computeAccountDisplayCounts(
  cachedFeeds = {},
  accounts = [],
  locallyReadIds = []
) {
  const locallyReadSet =
    locallyReadIds instanceof Set ? locallyReadIds : new Set(locallyReadIds || []);

  const enabledAccounts = (accounts || []).filter(
    a => a.enabled !== false && !a.manuallyDisabled
  );
  const indicesSet = new Set(enabledAccounts.map(a => a.index));

  for (const k of Object.keys(cachedFeeds || {})) {
    const idx = Number(k);
    const feed = cachedFeeds[idx];
    if (feed && !feed.unauthorized) {
      const accConfig = (accounts || []).find(a => a.index === idx);
      if (!(accConfig && accConfig.enabled === false && accConfig.manuallyDisabled)) {
        indicesSet.add(idx);
      }
    }
  }

  const indicesToShow = Array.from(indicesSet)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (indicesToShow.length === 0) {
    indicesToShow.push(0);
  }

  const perAccount = new Map();
  let allFullcount = 0;
  let allVisibleCount = 0;

  for (const idx of indicesToShow) {
    const feed = cachedFeeds[idx];
    const unauthorized = Boolean(feed && feed.unauthorized);

    if (!feed || unauthorized) {
      perAccount.set(idx, {
        fullcount: 0,
        visibleCount: 0,
        hiddenOverflowCount: 0,
        unauthorized
      });
      continue;
    }

    const entries = Array.isArray(feed.entries) ? feed.entries : [];
    const unreadEntries = entries.filter(e => !isEntryLocallyRead(e, locallyReadSet));
    const visibleCount = unreadEntries.length;

    // Prefer feed.fullcount if provided, subtracting any locally-read entries not yet reflected
    const rawCount =
      typeof feed.rawCount === 'number'
        ? feed.rawCount
        : typeof feed.fullcount === 'number'
          ? feed.fullcount
          : entries.length;
    const readDeduction = entries.length - visibleCount;
    const fullcount = Math.max(visibleCount, Math.max(0, rawCount - readDeduction));
    const hiddenOverflowCount = Math.max(0, fullcount - visibleCount);

    allFullcount += fullcount;
    allVisibleCount += visibleCount;

    perAccount.set(idx, {
      fullcount,
      visibleCount,
      hiddenOverflowCount,
      unauthorized: false
    });
  }

  return {
    indicesToShow,
    perAccount,
    allFullcount,
    allVisibleCount,
    allHiddenOverflowCount: Math.max(0, allFullcount - allVisibleCount)
  };
}

/**
 * Normalizes settings form account rows into clean persisted account objects.
 */
export function normalizeAccountRows(rawRows = [], existingAccounts = []) {
  return rawRows.map(row => {
    const idx = Number(row.index);
    const existing = (existingAccounts || []).find(a => a.index === idx) || {};
    const inputVal = String(row.inputValue || '').trim();
    const isEmail = inputVal.includes('@');
    const enabled = Boolean(row.enabled);

    return {
      ...existing,
      index: idx,
      email: isEmail ? inputVal : existing.email || '',
      name: isEmail
        ? inputVal.split('@')[0]
        : inputVal || existing.name || `Account ${idx + 1}`,
      enabled,
      manuallyDisabled: !enabled
    };
  });
}

/**
 * Generates candidate local LLM endpoints with 127.0.0.1 <-> localhost fallback (deduplicated).
 */
export function getCandidateLocalEndpoints(endpoint = DEFAULT_AI_ENDPOINT) {
  const clean = String(endpoint || DEFAULT_AI_ENDPOINT).trim();
  const candidates = [clean];
  if (clean.includes('127.0.0.1')) {
    candidates.push(clean.replace('127.0.0.1', 'localhost'));
  } else if (clean.includes('localhost')) {
    candidates.push(clean.replace('localhost', '127.0.0.1'));
  }
  return Array.from(new Set(candidates));
}

/**
 * Pure two-step confirmation state machine for destructive bulk actions.
 */
export function createTwoStepConfirm(timeoutMs = 4000, onAutoReset = null) {
  let armed = false;
  let armedCount = 0;
  let timerId = null;

  function reset() {
    armed = false;
    armedCount = 0;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function arm(count) {
    reset();
    armed = true;
    armedCount = count;
    timerId = setTimeout(() => {
      reset();
      if (typeof onAutoReset === 'function') {
        onAutoReset();
      }
    }, timeoutMs);
    return armedCount;
  }

  function isArmed() {
    return armed;
  }

  function getArmedCount() {
    return armedCount;
  }

  function confirm() {
    if (!armed) return false;
    reset();
    return true;
  }

  return { arm, isArmed, getArmedCount, confirm, reset };
}
