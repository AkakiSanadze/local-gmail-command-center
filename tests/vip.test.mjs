import assert from 'node:assert/strict';
import test from 'node:test';
import { isVipEmail, parseVipKeywords } from '../src/shared/vip.js';

test('parseVipKeywords handles comma-separated strings and arrays', () => {
  assert.deepEqual(parseVipKeywords(' Urgent, სასწრაფო , , OTP '), [
    'urgent',
    'სასწრაფო',
    'otp'
  ]);
  assert.deepEqual(parseVipKeywords(['Invoice', '  Security  ', '']), [
    'invoice',
    'security'
  ]);
  assert.deepEqual(parseVipKeywords(''), []);
  assert.deepEqual(parseVipKeywords(null), []);
});

test('isVipEmail matches case-insensitively across subject, summary, and sender fields', () => {
  const entry = {
    title: 'Action Required: Invoice #44',
    summary: 'თქვენი გადახდა წარმატებით შესრულდა',
    authorName: 'Billing Team',
    authorEmail: 'noreply@bank.ge'
  };

  assert.equal(isVipEmail(entry, 'urgent, invoice'), true);
  assert.equal(isVipEmail(entry, 'გადახდა'), true);
  assert.equal(isVipEmail(entry, 'BILLING'), true);
  assert.equal(isVipEmail(entry, ['bank.ge']), true);
  assert.equal(isVipEmail(entry, 'newsletter, promo'), false);
  assert.equal(isVipEmail(entry, ''), false);
  assert.equal(isVipEmail(null, 'urgent'), false);
});
