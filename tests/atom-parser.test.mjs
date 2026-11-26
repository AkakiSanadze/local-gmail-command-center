import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGmailAtom } from '../src/shared/atom-parser.js';
import { MiniXmlDOMParser } from './helpers/mini-xml-dom.mjs';

const SAMPLE_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed version="0.3" xmlns="http://purl.org/atom/ns#">
  <title>Gmail - Inbox for user@example.com</title>
  <fullcount>42</fullcount>
  <entry>
    <title>Your verification code</title>
    <summary>Use OTP code 847291 to sign in &amp; verify.</summary>
    <link rel="alternate" href="http://mail.google.com/mail?account_id=user@example.com&amp;message_id=18F3A4B5C6D7E8F9&amp;view=conv" />
    <issued>2026-11-26T07:00:00Z</issued>
    <id>tag:gmail.google.com,2004:1827491048192847291</id>
    <author>
      <name>Google Security</name>
      <email>no-reply@accounts.google.com</email>
    </author>
  </entry>
  <entry>
    <summary>Minimal entry without title or author name</summary>
    <link rel="alternate" href="https://mail.google.com/mail/u/0/#inbox/192a3b4c5d6e7f80" />
    <modified>2026-11-26T06:00:00Z</modified>
    <author>
      <email>alerts@service.org</email>
    </author>
  </entry>
</feed>`;

test('parseGmailAtom extracts fullcount, accountEmail, normalized links, hex IDs, and OTPs', () => {
  const res = parseGmailAtom(SAMPLE_FEED, 2, MiniXmlDOMParser);
  assert.equal(res.success, true);
  assert.equal(res.fullcount, 42);
  assert.equal(res.accountEmail, 'user@example.com');
  assert.equal(res.entries.length, 2);

  const [first, second] = res.entries;
  assert.equal(first.title, 'Your verification code');
  assert.equal(first.summary, 'Use OTP code 847291 to sign in & verify.');
  assert.equal(first.messageId, '18f3a4b5c6d7e8f9');
  assert.equal(
    first.link,
    'https://mail.google.com/mail/u/2?account_id=user@example.com&message_id=18F3A4B5C6D7E8F9&view=conv'
  );
  assert.equal(first.otpCode, '847291');
  assert.equal(first.authorName, 'Google Security');
  assert.equal(first.accountIndex, 2);

  // Graceful defaults on second entry
  assert.equal(second.title, '(No Subject)');
  assert.equal(second.authorName, 'alerts');
  assert.equal(second.messageId, '192a3b4c5d6e7f80');
  assert.equal(second.otpCode, null);
});

test('parseGmailAtom reports parsererror on malformed XML', () => {
  const res = parseGmailAtom('<feed><title>Broken', 0, MiniXmlDOMParser);
  assert.equal(res.success, false);
  assert.match(res.error, /XML parse error:/);
  assert.equal(res.entries.length, 0);
});
