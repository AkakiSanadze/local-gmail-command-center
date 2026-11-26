import assert from 'node:assert/strict';
import test from 'node:test';
import { extractOtpCode, isLikelyYear } from '../src/shared/otp.js';

test('extractOtpCode extracts English verification codes accurately', () => {
  assert.equal(extractOtpCode('Your verification code is 482910'), '482910');
  assert.equal(extractOtpCode('Google code: G-992104 for login'), 'G-992104');
  assert.equal(extractOtpCode('123456 is your security code'), '123456');
  assert.equal(extractOtpCode('Use OTP [654321] to continue'), '654321');
  assert.equal(extractOtpCode('Passcode # 98765432'), '98765432');
});

test('extractOtpCode extracts Georgian verification codes accurately', () => {
  assert.equal(extractOtpCode('თქვენი ვერიფიკაციის კოდი: 739102'), '739102');
  assert.equal(extractOtpCode('482910 არის თქვენი ერთჯერადი კოდი'), '482910');
  assert.equal(extractOtpCode('უსაფრთხოების კოდი - 551029'), '551029');
});

test('extractOtpCode avoids false positives and filters dynamic calendar years', () => {
  assert.equal(extractOtpCode('Your order total is 482910 USD'), null);
  assert.equal(extractOtpCode('Meeting scheduled for 2026'), null);
  assert.equal(extractOtpCode(null), null);
  assert.equal(extractOtpCode(''), null);

  // Calendar years must NOT be treated as 4-digit OTP codes
  assert.equal(isLikelyYear('2026', 2026), true);
  assert.equal(isLikelyYear('2028', 2026), true);
  assert.equal(isLikelyYear('2035', 2026), false);
  assert.equal(isLikelyYear('4829', 2026), false);

  assert.equal(extractOtpCode('Security notice code: 2026', 2026), null);
  assert.equal(extractOtpCode('Verification code: 2028', 2026), null);
  assert.equal(extractOtpCode('2027 is your verification code', 2026), null);
  assert.equal(extractOtpCode('Security code: 4829', 2026), '4829');
});
