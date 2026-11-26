import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGmailComposeFromMailto,
  extractBodyUnsubscribeLink,
  isSafeHttpUrl,
  parseUnsubscribeHeaders
} from '../src/shared/email-parser.js';

test('parseUnsubscribeHeaders detects RFC 8058 One-Click headers', () => {
  const raw = [
    'From: Newsletter <news@example.com>',
    'Subject: Weekly Digest',
    'List-Unsubscribe: <https://example.com/unsub?token=abc123>',
    'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
    '',
    'Body content here'
  ].join('\r\n');

  const res = parseUnsubscribeHeaders(raw);
  assert.deepEqual(res, {
    type: 'one-click',
    url: 'https://example.com/unsub?token=abc123',
    mailtoUrl: null,
    source: 'header'
  });
});

test('parseUnsubscribeHeaders unfolds multi-line headers and prefers HTTPS over mailto', () => {
  const raw = [
    'From: Updates <updates@service.io>',
    'List-Unsubscribe: <mailto:leave@service.io?subject=unsubscribe>,',
    '  <https://service.io/optout/xyz>',
    'MIME-Version: 1.0',
    '',
    'Hello'
  ].join('\n');

  const res = parseUnsubscribeHeaders(raw);
  assert.deepEqual(res, {
    type: 'url',
    url: 'https://service.io/optout/xyz',
    mailtoUrl: 'mailto:leave@service.io?subject=unsubscribe',
    source: 'header'
  });
});

test('parseUnsubscribeHeaders unescapes HTML-wrapped view=om <pre> content', () => {
  const htmlWrapped = `
    <html><body>
      <pre id="raw_message_text">From: Shop &lt;shop@example.org&gt;
List-Unsubscribe: &lt;https://shop.example.org/unsub?id=42&amp;mode=all&gt;
List-Unsubscribe-Post: List-Unsubscribe=One-Click

&lt;html&gt;Body&lt;/html&gt;</pre>
    </body></html>
  `;

  const res = parseUnsubscribeHeaders(htmlWrapped);
  assert.deepEqual(res, {
    type: 'one-click',
    url: 'https://shop.example.org/unsub?id=42&mode=all',
    mailtoUrl: null,
    source: 'header'
  });
});

test('parseUnsubscribeHeaders handles mailto-only and ignores missing/body-only headers', () => {
  const mailtoOnly = [
    'From: Digest <digest@example.net>',
    'List-Unsubscribe: <mailto:unsub@example.net?subject=Remove%20Me>',
    '',
    'Body'
  ].join('\n');

  assert.deepEqual(parseUnsubscribeHeaders(mailtoOnly), {
    type: 'mailto',
    url: null,
    mailtoUrl: 'mailto:unsub@example.net?subject=Remove%20Me',
    source: 'header'
  });

  const bodyOnlyFakeHeader = [
    'From: Normal <friend@example.com>',
    'Subject: Hi',
    '',
    'List-Unsubscribe: <https://evil.example.com/fake>'
  ].join('\n');

  assert.equal(parseUnsubscribeHeaders(bodyOnlyFakeHeader), null);
  assert.equal(parseUnsubscribeHeaders(''), null);
});

test('buildGmailComposeFromMailto encodes recipient, subject, body, and accountIndex', () => {
  const url = buildGmailComposeFromMailto(
    'mailto:unsub@example.com?subject=Unsubscribe%20Now&body=Please%20remove%20me',
    2
  );
  assert.equal(
    url,
    'https://mail.google.com/mail/u/2/?view=cm&fs=1&to=unsub%40example.com&su=Unsubscribe%20Now&body=Please%20remove%20me'
  );

  assert.equal(buildGmailComposeFromMailto('https://example.com'), null);
  assert.equal(buildGmailComposeFromMailto('mailto:invalid-no-at'), null);
  assert.equal(buildGmailComposeFromMailto(''), null);
});

test('isSafeHttpUrl accepts http/https and rejects unsafe protocols', () => {
  assert.equal(isSafeHttpUrl('https://mail.google.com/mail'), true);
  assert.equal(isSafeHttpUrl('http://localhost:1234/test'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
  assert.equal(isSafeHttpUrl('not a url'), false);
});

test('extractBodyUnsubscribeLink scans bottom-to-top and enforces safe URLs', () => {
  const mockAnchors = [
    { getAttribute: () => 'https://example.com/home', textContent: 'Visit site' },
    { getAttribute: () => 'https://example.com/footer/unsub?u=1', textContent: 'Unsubscribe here' },
    { getAttribute: () => 'javascript:alert(1)', textContent: 'Unsubscribe malicious' }
  ];
  const mockDoc = {
    querySelectorAll: sel => (sel === 'a[href]' ? mockAnchors : [])
  };

  assert.deepEqual(extractBodyUnsubscribeLink(mockDoc), {
    type: 'url',
    url: 'https://example.com/footer/unsub?u=1',
    mailtoUrl: null,
    source: 'body'
  });
});
