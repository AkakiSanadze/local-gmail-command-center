import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGmailAtom } from '../src/shared/atom-parser.js';
import { ALARM_NAME, MAX_AI_SUMMARIES } from '../src/shared/config.js';
import { MiniXmlDOMParser } from './helpers/mini-xml-dom.mjs';
import { createMockExtensionApi, MockAudioContext } from './helpers/mock-extension-api.mjs';

globalThis.__GMAIL_CMD_NO_AUTO_INIT__ = true;
const { createBackgroundController } = await import('../src/background.js');

function makeAtomFeedXml({ email, fullcount, entries = [] }) {
  const entryXml = entries
    .map(
      e => `
    <entry>
      <title>${e.title}</title>
      <summary>${e.summary}</summary>
      <link rel="alternate" href="${e.link}" />
      <issued>${e.issued || '2026-11-26T07:00:00Z'}</issued>
      <id>${e.id}</id>
      <author>
        <name>${e.authorName || 'Sender'}</name>
        <email>${e.authorEmail || 'sender@example.com'}</email>
      </author>
    </entry>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed version="0.3" xmlns="http://purl.org/atom/ns#">
  <title>Gmail - Inbox for ${email}</title>
  <fullcount>${fullcount}</fullcount>
  ${entryXml}
</feed>`;
}

function makeFetchResponse({ ok = true, status = 200, statusText = 'OK', url = '', redirected = false, body = '' }) {
  return {
    ok,
    status,
    statusText,
    url,
    redirected,
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
    async json() {
      return typeof body === 'string' ? JSON.parse(body) : body;
    }
  };
}

test('Badge displays "?" with #5F6368 when all enabled accounts are 401, "" when 0 enabled, and "999+" on >999 unread', async () => {
  const api401 = createMockExtensionApi({ mode: 'firefox' });
  const ctrl401 = createBackgroundController(api401, {
    DOMParser: MiniXmlDOMParser,
    AudioContext: MockAudioContext,
    fetchImpl: async () => makeFetchResponse({ ok: false, status: 401 })
  });

  const res401 = await ctrl401.checkAllAccounts();
  assert.equal(res401.allEnabledUnauthorized, true);
  assert.equal(api401._state.badge.text, '?');
  assert.equal(api401._state.badge.backgroundColor, '#5F6368');

  // 0 enabled accounts -> empty badge
  const apiNone = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: {
      accounts: [
        { index: 0, name: 'Personal', enabled: false, manuallyDisabled: true },
        { index: 1, name: 'Work', enabled: false, manuallyDisabled: true },
        { index: 2, name: 'A3', enabled: false, manuallyDisabled: true },
        { index: 3, name: 'A4', enabled: false, manuallyDisabled: true }
      ]
    }
  });
  const ctrlNone = createBackgroundController(apiNone, {
    DOMParser: MiniXmlDOMParser,
    fetchImpl: async () => {
      throw new Error('Should not fetch when all accounts disabled');
    }
  });
  await ctrlNone.checkAllAccounts();
  assert.equal(apiNone._state.badge.text, '');

  // >999 unread -> "999+"
  await ctrl401.updateBadge(1250, false, true);
  assert.equal(api401._state.badge.text, '999+');
  assert.equal(api401._state.badge.backgroundColor, '#D93025');
});

test('Chrome mode uses offscreen document for Atom parsing and audio; Firefox mode parses and plays directly without offscreen', async () => {
  const xml = makeAtomFeedXml({
    email: 'user0@gmail.com',
    fullcount: 1,
    entries: [
      {
        id: 'tag:gmail.google.com,2004:1827491048192847291',
        title: 'Security Code',
        summary: 'Your verification code is 519204',
        link: 'https://mail.google.com/mail/u/0/#inbox/18f3a4b5c6d7e8f9'
      }
    ]
  });

  // Chrome mode
  let offscreenParseCalls = 0;
  let offscreenAudioCalls = 0;
  const chromeApi = createMockExtensionApi({
    mode: 'chrome',
    initialLocal: {
      accounts: [{ index: 0, name: 'Personal', enabled: true }],
      cachedFeeds: {}
    },
    offscreenHandler: async msg => {
      if (msg.action === 'PARSE_GMAIL_ATOM') {
        offscreenParseCalls++;
        return parseGmailAtom(msg.xmlText, msg.accountIndex, MiniXmlDOMParser);
      }
      if (msg.action === 'PLAY_NOTIFICATION_SOUND') {
        offscreenAudioCalls++;
        return { success: true };
      }
      return null;
    }
  });
  const chromeCtrl = createBackgroundController(chromeApi, {
    fetchImpl: async url => {
      if (url.includes('/u/0/')) return makeFetchResponse({ body: xml });
      return makeFetchResponse({ ok: false, status: 401 });
    }
  });
  await chromeCtrl.checkAllAccounts();
  assert.ok(chromeApi._state.offscreenDocuments.length >= 1);
  assert.equal(offscreenParseCalls, 1);
  assert.equal(offscreenAudioCalls, 1);

  // Firefox mode
  const firefoxApi = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: {
      accounts: [{ index: 0, name: 'Personal', enabled: true }]
    }
  });
  const createdAudio = [];
  class TrackingAudioContext extends MockAudioContext {
    constructor() {
      super();
      createdAudio.push(this);
    }
  }
  const firefoxCtrl = createBackgroundController(firefoxApi, {
    DOMParser: MiniXmlDOMParser,
    AudioContext: TrackingAudioContext,
    fetchImpl: async url => {
      if (url.includes('/u/0/')) return makeFetchResponse({ body: xml });
      return makeFetchResponse({ ok: false, status: 401 });
    }
  });
  await firefoxCtrl.checkAllAccounts();
  assert.equal(firefoxApi.offscreen, undefined);
  assert.equal(firefoxApi._state.badge.text, '1');
  assert.equal(createdAudio.length, 1);
  assert.equal(createdAudio[0].oscillators.length, 4); // 2 tones + 2 overtones
});

test('Notification links survive MV3 Service Worker restart via session storage', async () => {
  const xml = makeAtomFeedXml({
    email: 'akaki@gmail.com',
    fullcount: 1,
    entries: [
      {
        id: 'tag:gmail.google.com,2004:1827491048192847292',
        title: 'Hello',
        summary: 'Body text',
        link: 'https://mail.google.com/mail/u/2/#inbox/18f3a4b5c6d7e8a1'
      }
    ]
  });

  const api1 = createMockExtensionApi({
    mode: 'chrome',
    initialLocal: { accounts: [{ index: 2, name: 'Work', enabled: true }] },
    offscreenHandler: async msg => {
      if (msg.action === 'PARSE_GMAIL_ATOM') {
        return parseGmailAtom(msg.xmlText, msg.accountIndex, MiniXmlDOMParser);
      }
      return { success: true };
    }
  });

  const ctrl1 = createBackgroundController(api1, {
    fetchImpl: async url => {
      if (url.includes('/u/2/')) return makeFetchResponse({ body: xml });
      return makeFetchResponse({ ok: false, status: 401 });
    }
  });
  await ctrl1.checkAllAccounts();

  const notifIds = Array.from(api1._state.notifications.keys());
  assert.equal(notifIds.length, 1);

  // Simulate SW restart: brand-new controller instance reading the same session store
  const api2 = createMockExtensionApi({
    mode: 'chrome',
    initialLocal: api1.storage.local._data,
    initialSession: api1.storage.session._data
  });
  const ctrl2 = createBackgroundController(api2, { DOMParser: MiniXmlDOMParser });
  ctrl2.registerListeners();

  await api2.notifications._triggerClick(notifIds[0]);
  assert.equal(api2._state.tabs.length, 1);
  assert.equal(
    api2._state.tabs[0].url,
    'https://mail.google.com/mail/u/2/#inbox/18f3a4b5c6d7e8a1'
  );
});

test('Single-flight concurrency lock deduplicates parallel checkAllAccounts calls', async () => {
  let u0FetchCount = 0;
  const xml = makeAtomFeedXml({ email: 'u0@gmail.com', fullcount: 0, entries: [] });
  const api = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: { accounts: [{ index: 0, name: 'Personal', enabled: true }] }
  });

  const ctrl = createBackgroundController(api, {
    DOMParser: MiniXmlDOMParser,
    AudioContext: MockAudioContext,
    fetchImpl: async url => {
      if (url.includes('/u/0/')) {
        u0FetchCount++;
        await new Promise(r => setTimeout(r, 25));
        return makeFetchResponse({ body: xml });
      }
      return makeFetchResponse({ ok: false, status: 401 });
    }
  });

  const [r1, r2] = await Promise.all([ctrl.checkAllAccounts(), ctrl.checkAllAccounts()]);
  assert.equal(u0FetchCount, 1);
  assert.equal(r1.totalUnread, 0);
  assert.equal(r2.totalUnread, 0);
});

test('Phantom duplicate slot returning same email as slot 0 is marked unauthorized', async () => {
  const xml = makeAtomFeedXml({ email: 'primary@gmail.com', fullcount: 3, entries: [] });
  const api = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: {
      accounts: [
        { index: 0, name: 'Personal', enabled: true },
        { index: 1, name: 'Slot 1', enabled: true }
      ]
    }
  });

  const ctrl = createBackgroundController(api, {
    DOMParser: MiniXmlDOMParser,
    fetchImpl: async url => {
      if (url.includes('/u/0/') || url.includes('/u/1/')) {
        return makeFetchResponse({ body: xml });
      }
      return makeFetchResponse({ ok: false, status: 401 });
    }
  });

  const summary = await ctrl.checkAllAccounts();
  assert.equal(summary.totalUnread, 3);
  const stored = await api.storage.local.get('cachedFeeds');
  assert.equal(stored.cachedFeeds[0].unauthorized, false);
  assert.equal(stored.cachedFeeds[1].unauthorized, true);
  assert.equal(stored.cachedFeeds[1].error, 'Redirect duplicate');
});

test('locallyReadIds reconciles after grace period so emails re-marked unread in Gmail reappear', async () => {
  let nowMs = 1_000_000;
  const entry = {
    id: 'tag:gmail.google.com,2004:1827491048192847299',
    title: 'Important',
    summary: 'Read then unread again',
    link: 'https://mail.google.com/mail/u/0/#inbox/18f3a4b5c6d7e899'
  };

  let feedReturnsEntry = false;
  const api = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: {
      accounts: [{ index: 0, name: 'Personal', enabled: true }],
      locallyReadIds: [entry.id, '18f3a4b5c6d7e899'],
      locallyReadMap: { [entry.id]: nowMs, '18f3a4b5c6d7e899': nowMs }
    }
  });

  const ctrl = createBackgroundController(api, {
    DOMParser: MiniXmlDOMParser,
    AudioContext: MockAudioContext,
    now: () => nowMs,
    fetchImpl: async url => {
      if (!url.includes('/u/0/')) return makeFetchResponse({ ok: false, status: 401 });
      return makeFetchResponse({
        body: makeAtomFeedXml({
          email: 'u0@gmail.com',
          fullcount: feedReturnsEntry ? 1 : 0,
          entries: feedReturnsEntry ? [entry] : []
        })
      });
    }
  });

  // Advance past 5-minute grace period while Gmail feed does NOT contain the entry -> gets pruned
  nowMs += 6 * 60 * 1000;
  await ctrl.checkAllAccounts();
  let stored = await api.storage.local.get(['locallyReadIds', 'locallyReadMap']);
  assert.deepEqual(stored.locallyReadIds, []);

  // User later marks that email unread in Gmail -> Gmail Atom returns it again -> badge must show 1
  feedReturnsEntry = true;
  const summary = await ctrl.checkAllAccounts();
  assert.equal(summary.totalUnread, 1);
  stored = await api.storage.local.get('cachedFeeds');
  assert.equal(stored.cachedFeeds[0].entries.length, 1);
});

test('getGmailAtCookie isolates u/0 fallback cookie and never leaks it to u/1+', async () => {
  const api = createMockExtensionApi({
    mode: 'firefox',
    cookies: [
      { name: 'GMAIL_AT', value: 'token-for-u0', domain: 'mail.google.com', path: '/mail' }
    ]
  });
  const ctrl = createBackgroundController(api, { DOMParser: MiniXmlDOMParser });

  assert.equal(await ctrl.getGmailAtCookie(0), 'token-for-u0');
  assert.equal(await ctrl.getGmailAtCookie(1), null);
  assert.equal(await ctrl.getGmailAtCookie(2), null);
});

test('Bulk action handles partial multi-account sync and OPEN_AND_MARK_READ opens tab + marks read', async () => {
  const entry0 = {
    id: 'tag:gmail.google.com,2004:1827491048192847300',
    messageId: '18f3a4b5c6d7e800',
    title: 'Mail 0',
    summary: 'Body 0',
    link: 'https://mail.google.com/mail/u/0/#inbox/18f3a4b5c6d7e800',
    accountIndex: 0
  };
  const entry1 = {
    id: 'tag:gmail.google.com,2004:1827491048192847301',
    messageId: '18f3a4b5c6d7e801',
    title: 'Mail 1',
    summary: 'Body 1',
    link: 'https://mail.google.com/mail/u/1/#inbox/18f3a4b5c6d7e801',
    accountIndex: 1
  };

  const api = createMockExtensionApi({
    mode: 'firefox',
    cookies: [
      { name: 'GMAIL_AT', value: 'at-u0', domain: 'mail.google.com', path: '/mail/u/0' }
      // Intentionally NO cookie or token for u/1 so u/1 fails!
    ],
    initialLocal: {
      accounts: [
        { index: 0, name: 'Personal', enabled: true },
        { index: 1, name: 'Work', enabled: true }
      ]
    }
  });

  const ctrl = createBackgroundController(api, {
    DOMParser: MiniXmlDOMParser,
    AudioContext: MockAudioContext,
    fetchImpl: async (url, opts = {}) => {
      if (url.includes('/u/0/feed/atom')) {
        return makeFetchResponse({
          body: makeAtomFeedXml({ email: 'u0@gmail.com', fullcount: 5, entries: [entry0] })
        });
      }
      if (url.includes('/u/1/feed/atom')) {
        return makeFetchResponse({
          body: makeAtomFeedXml({ email: 'u1@gmail.com', fullcount: 2, entries: [entry1] })
        });
      }
      if (url.includes('/u/0/s/') && opts.method !== 'POST') {
        return makeFetchResponse({ body: `<script>var ID_KEY='ik-u0';</script>` });
      }
      if (url.includes('/u/0/s/?v=or') && opts.method === 'POST') {
        return makeFetchResponse({ body: `[[null,"ok"]]` });
      }
      if (url.includes('/u/1/')) {
        return makeFetchResponse({ ok: false, status: 401 });
      }
      return makeFetchResponse({ ok: false, status: 404 });
    }
  });

  // Partial bulk delete across u/0 (succeeds) and u/1 (fails)
  const bulkRes = await ctrl.handleMessage({
    action: 'DELETE_ALL_EMAILS',
    ids: [entry0.id, entry1.id],
    items: [entry0, entry1]
  });

  assert.equal(bulkRes.success, true);
  assert.equal(bulkRes.serverSynced, false);
  assert.equal(bulkRes.partialSync, true);
  assert.equal(bulkRes.syncedCount, 1);
  assert.equal(bulkRes.failedCount, 1);
  assert.deepEqual(bulkRes.syncedIds, [entry0.id]);

  // OPEN_AND_MARK_READ opens tab and syncs read on u/0
  const openRes = await ctrl.handleMessage({
    action: 'OPEN_AND_MARK_READ',
    ...entry0
  });
  assert.equal(openRes.success, true);
  assert.equal(openRes.serverSynced, true);
  assert.equal(api._state.tabs[0].url, entry0.link);
});

test('LM Studio AI Summary & Connection Test support localhost fallback, <think> stripping, reasoning_content, pruning & timeouts', async () => {
  const prePopulatedSummaries = {};
  for (let i = 0; i < MAX_AI_SUMMARIES; i++) {
    prePopulatedSummaries[`old-${i}`] = `Summary ${i}`;
  }

  const api = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: {
      aiEndpoint: 'http://127.0.0.1:1234/v1/chat/completions',
      aiSummaries: prePopulatedSummaries
    }
  });

  const attemptedUrls = [];
  const ctrl = createBackgroundController(api, {
    DOMParser: MiniXmlDOMParser,
    fetchImpl: async url => {
      attemptedUrls.push(url);
      if (url.includes('127.0.0.1')) {
        throw new Error('ECONNREFUSED');
      }
      if (url.endsWith('/models')) {
        return makeFetchResponse({
          body: { data: [{ id: 'qwen-3-local' }] }
        });
      }
      return makeFetchResponse({
        body: {
          choices: [
            {
              message: {
                content: '<think>Internal thoughts</think>   Meeting moved to Friday at 3 PM.  '
              }
            }
          ]
        }
      });
    }
  });

  // Test connection fallback 127.0.0.1 -> localhost
  const connRes = await ctrl.handleMessage({ action: 'TEST_LM_STUDIO_CONNECTION' });
  assert.equal(connRes.success, true);
  assert.deepEqual(connRes.models, ['qwen-3-local']);
  assert.ok(attemptedUrls.includes('http://127.0.0.1:1234/v1/models'));
  assert.ok(attemptedUrls.includes('http://localhost:1234/v1/models'));

  // Test summary generation + <think> stripping + MAX_AI_SUMMARIES cap
  const sumRes = await ctrl.handleMessage({
    action: 'GENERATE_AI_SUMMARY',
    entryId: 'new-entry',
    emailText: 'Subject: Sync\nBody: Let us meet Friday 3 PM'
  });
  assert.equal(sumRes.success, true);
  assert.equal(sumRes.summary, 'Meeting moved to Friday at 3 PM.');

  const stored = await api.storage.local.get('aiSummaries');
  assert.equal(Object.keys(stored.aiSummaries).length, MAX_AI_SUMMARIES);
  assert.equal(stored.aiSummaries['old-0'], undefined);
  assert.equal(stored.aiSummaries['new-entry'], 'Meeting moved to Friday at 3 PM.');

  // Test reasoning_content fallback + timeout error handling
  const ctrlReasoning = createBackgroundController(
    createMockExtensionApi({ mode: 'firefox' }),
    {
      fetchImpl: async () =>
        makeFetchResponse({
          body: {
            choices: [
              {
                message: {
                  content: '',
                  reasoning_content: 'Step 1: read\nFinal summary: Invoice due tomorrow.'
                }
              }
            ]
          }
        })
    }
  );
  const rRes = await ctrlReasoning.handleMessage({
    action: 'GENERATE_AI_SUMMARY',
    entryId: 'r1',
    emailText: 'Invoice'
  });
  assert.equal(rRes.success, true);
  assert.equal(rRes.summary, 'Final summary: Invoice due tomorrow.');

  const ctrlTimeout = createBackgroundController(
    createMockExtensionApi({ mode: 'firefox' }),
    {
      fetchImpl: async () => {
        const err = new Error('Timed out');
        err.name = 'TimeoutError';
        throw err;
      }
    }
  );
  const tRes = await ctrlTimeout.handleMessage({
    action: 'TEST_LM_STUDIO_CONNECTION'
  });
  assert.equal(tRes.success, false);
  assert.match(tRes.error, /Timeout/);
});

test('onInstalled & onStartup configure alarm with delayInMinutes === period (no 6-second double-fire)', async () => {
  const api = createMockExtensionApi({
    mode: 'firefox',
    initialLocal: {
      pollInterval: 5,
      accounts: [{ index: 0, name: 'Personal', enabled: true }]
    }
  });
  const ctrl = createBackgroundController(api, {
    DOMParser: MiniXmlDOMParser,
    fetchImpl: async () => makeFetchResponse({ ok: false, status: 401 })
  });
  ctrl.registerListeners();

  await api.runtime.onInstalled._trigger({ reason: 'install' });
  const alarm = api._state.alarms.get(ALARM_NAME);
  assert.ok(alarm);
  assert.equal(alarm.periodInMinutes, 5);
  assert.equal(alarm.delayInMinutes, 5);

  await api.runtime.onStartup._trigger();
  const alarmAfterStartup = api._state.alarms.get(ALARM_NAME);
  assert.equal(alarmAfterStartup.delayInMinutes, 5);
});
