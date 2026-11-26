import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractHexMessageId,
  normalizeGmailLink,
  resolveHexMessageId,
  toHexThreadId
} from '../src/shared/gmail-ids.js';

test('toHexThreadId handles hex, prefixed tags, 64-bit decimals, and invalid inputs', () => {
  assert.equal(toHexThreadId('18F3A4B5C6D7E8F9'), '18f3a4b5c6d7e8f9');
  assert.equal(toHexThreadId('  192a3b4c5d6e7f8  '), '192a3b4c5d6e7f8');

  const dec = '1827491048192847291';
  const expectedHex = BigInt(dec).toString(16).toLowerCase();
  assert.equal(toHexThreadId(`tag:gmail.google.com,2004:${dec}`), expectedHex);
  assert.equal(toHexThreadId(`msg-f:${dec}`), expectedHex);
  assert.equal(toHexThreadId(`thread-f:${dec}`), expectedHex);
  assert.equal(toHexThreadId(dec), expectedHex);

  assert.equal(toHexThreadId(''), null);
  assert.equal(toHexThreadId(null), null);
  assert.equal(toHexThreadId('not-a-valid-id'), null);
  assert.equal(toHexThreadId('12345'), null);
});

test('extractHexMessageId parses query params, hash routes, and atom IDs', () => {
  assert.equal(
    extractHexMessageId(
      'https://mail.google.com/mail?account_id=user@gmail.com&message_id=18F3A4B5C6D7E8F9&view=conv',
      null
    ),
    '18f3a4b5c6d7e8f9'
  );
  assert.equal(
    extractHexMessageId('https://mail.google.com/mail/u/0/?th=192a3b4c5d6e7f80', null),
    '192a3b4c5d6e7f80'
  );
  assert.equal(
    extractHexMessageId('https://mail.google.com/mail/u/1/#inbox/192a3b4c5d6e7f80', null),
    '192a3b4c5d6e7f80'
  );

  const dec = '1827491048192847291';
  assert.equal(
    extractHexMessageId('', `tag:gmail.google.com,2004:${dec}`),
    BigInt(dec).toString(16).toLowerCase()
  );
  assert.equal(extractHexMessageId('https://example.com', 'invalid'), null);
});

test('resolveHexMessageId resolves from link, id, or messageId fallback', () => {
  assert.equal(
    resolveHexMessageId({
      id: 'tag:gmail.google.com,2004:1827491048192847291',
      link: 'https://mail.google.com/mail/u/0/#inbox/18f3a4b5c6d7e8f9'
    }),
    '18f3a4b5c6d7e8f9'
  );
  assert.equal(
    resolveHexMessageId({ id: 'x', link: '', messageId: '192A3B4C5D6E7F80' }),
    '192a3b4c5d6e7f80'
  );
  assert.equal(resolveHexMessageId(null), null);
});

test('normalizeGmailLink enforces https and target account index', () => {
  assert.equal(
    normalizeGmailLink('http://mail.google.com/mail/u/0/?message_id=abc123', 2),
    'https://mail.google.com/mail/u/2/?message_id=abc123'
  );
  assert.equal(
    normalizeGmailLink('https://mail.google.com/mail?account_id=test@gmail.com', 1),
    'https://mail.google.com/mail/u/1?account_id=test@gmail.com'
  );
  assert.equal(
    normalizeGmailLink('', 3, '18f3a4b5c6d7e8f9'),
    'https://mail.google.com/mail/u/3/#inbox/18f3a4b5c6d7e8f9'
  );
  assert.equal(
    normalizeGmailLink('', 0),
    'https://mail.google.com/mail/u/0/#inbox'
  );
});
