import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateEmails,
  computeAccountDisplayCounts,
  createTwoStepConfirm,
  escapeHtml,
  filterVisibleEmails,
  formatRelativeTime,
  getCandidateLocalEndpoints,
  normalizeAccountRows,
  resolveActiveAccountIndex
} from '../src/shared/ui-logic.js';

test('escapeHtml neutralizes XSS vectors', () => {
  assert.equal(
    escapeHtml(`<script>alert("x" & 'y')</script>`),
    '&lt;script&gt;alert(&quot;x&quot; &amp; &#039;y&#039;)&lt;/script&gt;'
  );
  assert.equal(escapeHtml(''), '');
});

test('formatRelativeTime formats seconds, minutes, same-day HH:MM, and older DD/MM', () => {
  const now = new Date('2026-11-26T15:30:00');
  assert.equal(formatRelativeTime('2026-11-26T15:29:40', now), 'ახლახან');
  assert.equal(formatRelativeTime('2026-11-26T15:18:00', now), '12 წთ წინ');
  assert.equal(formatRelativeTime('2026-11-26T09:05:00', now), '09:05');
  assert.equal(formatRelativeTime('2026-11-24T09:05:00', now), '24/11');
  assert.equal(formatRelativeTime('invalid-date', now), '');
});

test('filterVisibleEmails filters by active tab and search query (including OTP)', () => {
  const emails = [
    {
      id: '1',
      accountIndex: 0,
      title: 'OTP login',
      summary: 'Code 918273',
      authorName: 'GitHub',
      authorEmail: 'noreply@github.com',
      otpCode: '918273'
    },
    {
      id: '2',
      accountIndex: 1,
      title: 'Monthly Invoice',
      summary: 'Please pay',
      authorName: 'Cloud',
      authorEmail: 'billing@cloud.io',
      otpCode: null
    }
  ];

  assert.equal(filterVisibleEmails(emails, 'all', '').length, 2);
  assert.equal(filterVisibleEmails(emails, '1', '').length, 1);
  assert.equal(filterVisibleEmails(emails, 'all', '918273').map(e => e.id).join(','), '1');
  assert.equal(filterVisibleEmails(emails, 'all', 'billing@cloud').map(e => e.id).join(','), '2');
  assert.equal(filterVisibleEmails(emails, '0', 'invoice').length, 0);
});

test('computeAccountDisplayCounts mirrors fullcount and computes hiddenOverflowCount accurately', () => {
  const entries20 = Array.from({ length: 20 }, (_, i) => ({
    id: `tag-${i}`,
    messageId: `18f3a4b5c6d7e8${String(i).padStart(2, '0')}`
  }));

  const cachedFeeds = {
    0: {
      unauthorized: false,
      fullcount: 145,
      rawCount: 145,
      entries: entries20
    },
    1: {
      unauthorized: true,
      fullcount: 0,
      entries: []
    },
    2: {
      unauthorized: false,
      fullcount: 3,
      rawCount: 3,
      entries: [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    }
  };
  const accounts = [
    { index: 0, name: 'Personal', enabled: true },
    { index: 1, name: 'Work', enabled: true },
    { index: 2, name: 'Alt', enabled: true }
  ];

  const counts = computeAccountDisplayCounts(cachedFeeds, accounts, ['tag-0']);
  assert.equal(counts.perAccount.get(0).fullcount, 144);
  assert.equal(counts.perAccount.get(0).visibleCount, 19);
  assert.equal(counts.perAccount.get(0).hiddenOverflowCount, 125);
  assert.equal(counts.perAccount.get(1).unauthorized, true);
  assert.equal(counts.perAccount.get(2).fullcount, 3);
  assert.equal(counts.allFullcount, 147);
  assert.equal(counts.allVisibleCount, 22);
  assert.equal(counts.allHiddenOverflowCount, 125);
});

test('createTwoStepConfirm arms, confirms, resets on cancel, and auto-expires', async () => {
  let autoResetFired = false;
  const fsm = createTwoStepConfirm(30, () => {
    autoResetFired = true;
  });

  assert.equal(fsm.isArmed(), false);
  assert.equal(fsm.confirm(), false);

  fsm.arm(5);
  assert.equal(fsm.isArmed(), true);
  assert.equal(fsm.getArmedCount(), 5);
  assert.equal(fsm.confirm(), true);
  assert.equal(fsm.isArmed(), false);

  fsm.arm(2);
  await new Promise(r => setTimeout(r, 60));
  assert.equal(autoResetFired, true);
  assert.equal(fsm.isArmed(), false);
});

test('resolveActiveAccountIndex selects first enabled account when u/0 is disabled', () => {
  const accounts = [
    { index: 0, name: 'Personal', enabled: false, manuallyDisabled: true },
    { index: 1, name: 'Work', enabled: true },
    { index: 2, name: 'Other', enabled: true }
  ];

  assert.equal(resolveActiveAccountIndex('all', accounts), 1);
  assert.equal(resolveActiveAccountIndex('2', accounts), 2);
  assert.equal(resolveActiveAccountIndex('all', []), 0);
});

test('normalizeAccountRows preserves emails and applies manuallyDisabled properly', () => {
  const existing = [{ index: 0, email: 'user@gmail.com', name: 'user', enabled: true }];
  const normalized = normalizeAccountRows(
    [
      { index: 0, enabled: true, inputValue: 'My Personal' },
      { index: 1, enabled: false, inputValue: 'work@company.com' }
    ],
    existing
  );

  assert.deepEqual(normalized, [
    {
      index: 0,
      email: 'user@gmail.com',
      name: 'My Personal',
      enabled: true,
      manuallyDisabled: false
    },
    {
      index: 1,
      email: 'work@company.com',
      name: 'work',
      enabled: false,
      manuallyDisabled: true
    }
  ]);
});

test('getCandidateLocalEndpoints provides deduplicated 127.0.0.1 <-> localhost fallback', () => {
  assert.deepEqual(getCandidateLocalEndpoints('http://127.0.0.1:1234/v1/chat/completions'), [
    'http://127.0.0.1:1234/v1/chat/completions',
    'http://localhost:1234/v1/chat/completions'
  ]);
  assert.deepEqual(getCandidateLocalEndpoints('http://localhost:1234/v1/chat/completions'), [
    'http://localhost:1234/v1/chat/completions',
    'http://127.0.0.1:1234/v1/chat/completions'
  ]);
  assert.deepEqual(getCandidateLocalEndpoints('http://192.168.1.10:1234/v1/chat/completions'), [
    'http://192.168.1.10:1234/v1/chat/completions'
  ]);
});

test('aggregateEmails sorts descending and respects locallyReadIds & disabled accounts', () => {
  const cachedFeeds = {
    0: {
      unauthorized: false,
      accountEmail: 'u0@gmail.com',
      entries: [
        { id: 'old', issued: '2026-11-26T01:00:00Z', title: 'Old' },
        { id: 'skip', messageId: '18f3a4b5c6d7e8f9', issued: '2026-11-26T05:00:00Z', title: 'Skip' }
      ]
    },
    1: {
      unauthorized: false,
      accountEmail: 'u1@gmail.com',
      entries: [{ id: 'new', issued: '2026-11-26T04:00:00Z', title: 'New' }]
    }
  };
  const accounts = [
    { index: 0, name: 'Main', enabled: true },
    { index: 1, name: 'Work', enabled: true }
  ];

  const { allEmails, anyAuthorizedAccount } = aggregateEmails(cachedFeeds, accounts, [
    '18f3a4b5c6d7e8f9'
  ]);
  assert.equal(anyAuthorizedAccount, true);
  assert.deepEqual(
    allEmails.map(e => e.id),
    ['new', 'old']
  );
});
