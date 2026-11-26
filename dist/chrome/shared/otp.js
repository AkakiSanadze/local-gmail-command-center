/**
 * Smart OTP / 2FA verification code detector (Georgian & English).
 */

/**
 * Checks whether a 4-digit numeric string looks like a calendar year.
 */
export function isLikelyYear(candidate, nowYear = new Date().getFullYear()) {
  if (!candidate || !/^\d{4}$/.test(String(candidate))) {
    return false;
  }
  const num = Number(candidate);
  return num >= 1990 && num <= nowYear + 5;
}

/**
 * Extracts a 4-8 digit or Google-prefixed (G-123456) verification code when OTP context keywords exist.
 */
export function extractOtpCode(text, nowYear = new Date().getFullYear()) {
  if (!text || typeof text !== 'string') return null;

  const keywordRegex =
    /(?:code|კოდი|otp|verification|ვერიფიკაცი|pin|პაროლი|passcode|2fa|უსაფრთხოების|security|auth)/i;
  if (!keywordRegex.test(text)) {
    return null;
  }

  // 1. Common Google format: G-123456
  const googleMatch = text.match(/\b(G-\d{6})\b/i);
  if (googleMatch) return googleMatch[1].toUpperCase();

  // 2. Keyword followed closely by 4-8 digits
  const specificMatch = text.match(
    /(?:code|კოდი|otp|verification|ვერიფიკაციის|pin|პაროლი|passcode|2fa|უსაფრთხოების|security|auth)[^\d\n\r]{0,25}?[:#\-—\s]\s*([0-9]{4,8})\b/i
  );
  if (specificMatch && specificMatch[1]) {
    const candidate = specificMatch[1];
    if (!isLikelyYear(candidate, nowYear)) {
      return candidate;
    }
  }

  // 3. Preceding digits before keyword (e.g. "482910 is your security code")
  const precedingMatch = text.match(
    /\b([0-9]{4,8})\b\s+(?:is\s+your|არის\s+თქვენი|არის\s+ერთჯერადი)/i
  );
  if (precedingMatch && precedingMatch[1]) {
    const candidate = precedingMatch[1];
    if (!isLikelyYear(candidate, nowYear)) {
      return candidate;
    }
  }

  // 4. Bracketed or quoted codes: [123456] or "123456"
  const bracketMatch = text.match(/[\["'*]([0-9]{4,8})[\]"'*]/);
  if (bracketMatch && bracketMatch[1]) {
    const candidate = bracketMatch[1];
    if (!isLikelyYear(candidate, nowYear)) {
      return candidate;
    }
  }

  // 5. Fallback: any standalone 5-7 digit sequence if OTP keyword was confirmed in text
  const standaloneMatch = text.match(/\b([0-9]{5,7})\b/);
  if (standaloneMatch && standaloneMatch[1]) {
    return standaloneMatch[1];
  }

  return null;
}
