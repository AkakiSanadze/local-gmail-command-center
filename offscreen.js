/**
 * Local Gmail Command Center - Offscreen Document
 * Responsibilities:
 * 1. Native XML DOMParser for Gmail Atom Feed
 * 2. Smart OTP / 2FA Code Extraction (Georgian & English)
 * 3. Pure Web Audio API Chime Synthesizer (Zero external audio files)
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Synthesizes a clean, pleasant two-tone Chime (D5 587.33Hz -> A5 880Hz)
 * with gentle harmonics and exponential decay.
 */
async function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const now = ctx.currentTime;

  // Master output limiter
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.85, now);
  masterGain.connect(ctx.destination);

  // Tone 1: 587.33 Hz (D5) - Bell Ding
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now);

  // Subtle harmonic overtone for acoustic warmth
  const osc1Overtone = ctx.createOscillator();
  const gain1Overtone = ctx.createGain();
  osc1Overtone.type = 'triangle';
  osc1Overtone.frequency.setValueAtTime(587.33 * 2, now);

  gain1.gain.setValueAtTime(0.0001, now);
  gain1.gain.exponentialRampToValueAtTime(0.40, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  gain1Overtone.gain.setValueAtTime(0.0001, now);
  gain1Overtone.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain1Overtone.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1Overtone.connect(gain1Overtone);
  gain1Overtone.connect(masterGain);

  osc1.start(now);
  osc1.stop(now + 0.5);
  osc1Overtone.start(now);
  osc1Overtone.stop(now + 0.4);

  // Tone 2: 880.00 Hz (A5) - Bell Dong (enters after 110ms)
  const tone2Start = now + 0.11;
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880.00, tone2Start);

  const osc2Overtone = ctx.createOscillator();
  const gain2Overtone = ctx.createGain();
  osc2Overtone.type = 'triangle';
  osc2Overtone.frequency.setValueAtTime(880.00 * 2, tone2Start);

  gain2.gain.setValueAtTime(0.0001, tone2Start);
  gain2.gain.exponentialRampToValueAtTime(0.45, tone2Start + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.0001, tone2Start + 0.85);

  gain2Overtone.gain.setValueAtTime(0.0001, tone2Start);
  gain2Overtone.gain.exponentialRampToValueAtTime(0.07, tone2Start + 0.02);
  gain2Overtone.gain.exponentialRampToValueAtTime(0.0001, tone2Start + 0.60);

  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2Overtone.connect(gain2Overtone);
  gain2Overtone.connect(masterGain);

  osc2.start(tone2Start);
  osc2.stop(tone2Start + 0.9);
  osc2Overtone.start(tone2Start);
  osc2Overtone.stop(tone2Start + 0.7);
}

/**
 * Smart OTP / 2FA verification code detector.
 * Supports Georgian & English keywords and formats (e.g. 123456, G-123456, 482910).
 */
function extractOtpCode(text) {
  if (!text || typeof text !== 'string') return null;

  const keywordRegex = /(?:code|კოდი|otp|verification|ვერიფიკაცი|pin|პაროლი|passcode|2fa|უსაფრთხოების|security|auth)/i;
  if (!keywordRegex.test(text)) {
    return null;
  }

  // Common Google format: G-123456
  const googleMatch = text.match(/\b(G-\d{6})\b/i);
  if (googleMatch) return googleMatch[1].toUpperCase();

  // Keyword followed closely by 4-8 digits
  const specificMatch = text.match(/(?:code|კოდი|otp|verification|ვერიფიკაციის|pin|პაროლი|passcode|2fa|უსაფრთხოების)[^\d\n\r]{0,25}?[:#\-—\s]\s*([0-9]{4,8})\b/i);
  if (specificMatch && specificMatch[1]) {
    const candidate = specificMatch[1];
    // Filter out common current years if likely dates
    if (!['2024', '2025', '2026', '2027'].includes(candidate)) {
      return candidate;
    }
  }

  // Preceding digits before keyword (e.g. "482910 is your security code")
  const precedingMatch = text.match(/\b([0-9]{4,8})\b\s+(?:is\s+your|არის\s+თქვენი|არის\s+ერთჯერადი)/i);
  if (precedingMatch && precedingMatch[1]) {
    return precedingMatch[1];
  }

  // Bracketed or quoted codes: [123456] or "123456"
  const bracketMatch = text.match(/[\["'\*]([0-9]{4,8})[\]"'\*]/);
  if (bracketMatch && bracketMatch[1]) {
    return bracketMatch[1];
  }

  // Fallback: any standalone 5-7 digit sequence if OTP keyword was confirmed in text
  const standaloneMatch = text.match(/\b([0-9]{5,7})\b/);
  if (standaloneMatch && standaloneMatch[1]) {
    const candidate = standaloneMatch[1];
    if (!['2024', '2025', '2026', '2027'].includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Normalizes any Gmail ID format (64-bit decimal integer, prefixed tag, or hex)
 * into a standard 16-character lowercase hexadecimal thread/message ID.
 */
function toHexThreadId(val) {
  if (!val) return null;
  const str = String(val).trim();

  // 1. Standard 14-16 hex chars (Gmail hex IDs are 15-16 chars; 64-bit decimal IDs are 18-20 digits)
  if (/^[0-9a-fA-F]{14,16}$/.test(str)) {
    return str.toLowerCase();
  }

  // 2. If prefixed like tag:gmail.google.com,2004:1827491048192847291 or msg-f:1827491048192847291
  const tagMatch = str.match(/(?:tag:gmail\.google\.com,2004:|msg-f:|thread-f:)(\d+)/i);
  if (tagMatch && tagMatch[1]) {
    try {
      return BigInt(tagMatch[1]).toString(16).toLowerCase();
    } catch (_) {}
  }

  // 3. If it is a 64-bit decimal integer (17-20 digits)
  if (/^\d{17,20}$/.test(str)) {
    try {
      return BigInt(str).toString(16).toLowerCase();
    } catch (_) {}
  }

  return null;
}

/**
 * Normalizes Gmail atom links so they always target the correct account index:
 * e.g. https://mail.google.com/mail/u/{accountIndex}?account_id=...&message_id=...
 */
function normalizeGmailLink(rawLink, accountIndex, messageId = null) {
  if (!rawLink) {
    return messageId
      ? `https://mail.google.com/mail/u/${accountIndex}/#inbox/${messageId}`
      : `https://mail.google.com/mail/u/${accountIndex}/#inbox`;
  }
  let link = rawLink.trim().replace(/^http:\/\//i, 'https://');
  if (link.includes('/mail/u/')) {
    return link.replace(/\/mail\/u\/\d+/, `/mail/u/${accountIndex}`);
  }
  if (link.startsWith('https://mail.google.com/mail')) {
    return link.replace('https://mail.google.com/mail', `https://mail.google.com/mail/u/${accountIndex}`);
  }
  return link;
}

/**
 * Extracts the 16-char hexadecimal Gmail message/thread ID from the Atom entry link or tag ID.
 */
function extractHexMessageId(rawLink, atomId) {
  if (rawLink) {
    const msgIdMatch = rawLink.match(/[?&](?:message_id|th|id)=([a-fA-F0-9]+)/i);
    if (msgIdMatch && msgIdMatch[1]) {
      const hex = toHexThreadId(msgIdMatch[1]);
      if (hex) return hex;
    }
    const hashMatch = rawLink.match(/#(?:[a-zA-Z0-9_-]+)\/([a-fA-F0-9]{14,16})/i);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1].toLowerCase();
    }
  }

  if (atomId) {
    const hex = toHexThreadId(atomId);
    if (hex) return hex;
    const decMatch = atomId.match(/\b(\d{17,20})\b/);
    if (decMatch && decMatch[1]) {
      const h = toHexThreadId(decMatch[1]);
      if (h) return h;
    }
  }

  return null;
}

/**
 * Native XML DOMParser for Gmail Atom Feed.
 */
function parseGmailAtom(xmlText, accountIndex = 0) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for XML parse errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      return {
        success: false,
        error: 'XML parse error: ' + parserError.textContent,
        fullcount: 0,
        accountEmail: '',
        entries: []
      };
    }

    // Unread count: <fullcount>
    const fullcountEl = xmlDoc.querySelector('fullcount');
    const fullcount = fullcountEl ? parseInt(fullcountEl.textContent, 10) || 0 : 0;

    // Feed Title / Account Email: <title>Gmail - Inbox for user@example.com</title>
    const titleEl = xmlDoc.querySelector('feed > title, title');
    let accountEmail = '';
    if (titleEl && titleEl.textContent) {
      const titleText = titleEl.textContent;
      const emailMatch = titleText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        accountEmail = emailMatch[1];
      } else {
        accountEmail = titleText.replace(/^Gmail\s*-\s*Inbox for\s*/i, '').trim();
      }
    }

    // Extract entries
    const entryEls = xmlDoc.querySelectorAll('entry');
    const entries = [];

    for (const el of entryEls) {
      const idEl = el.querySelector('id');
      const entryTitleEl = el.querySelector('title');
      const summaryEl = el.querySelector('summary');
      const authorNameEl = el.querySelector('author > name');
      const authorEmailEl = el.querySelector('author > email');
      const linkEl = el.querySelector('link[rel="alternate"]') || el.querySelector('link');
      const issuedEl = el.querySelector('issued') || el.querySelector('modified');

      const title = entryTitleEl ? entryTitleEl.textContent.trim() : '(No Subject)';
      const summary = summaryEl ? summaryEl.textContent.trim() : '';
      const authorName = authorNameEl ? authorNameEl.textContent.trim() : '';
      const authorEmail = authorEmailEl ? authorEmailEl.textContent.trim() : '';
      const rawLink = linkEl ? linkEl.getAttribute('href') : '';
      const id = idEl ? idEl.textContent.trim() : `${accountIndex}-${title}-${issuedEl ? issuedEl.textContent : Date.now()}`;
      const issued = issuedEl ? issuedEl.textContent.trim() : new Date().toISOString();
      const messageId = extractHexMessageId(rawLink, id);
      const link = normalizeGmailLink(rawLink, accountIndex, messageId);

      // Detect OTP code in combined subject and summary
      const otpCode = extractOtpCode(`${title} ${summary}`);

      entries.push({
        id,
        messageId,
        title,
        summary,
        authorName: authorName || (authorEmail.split('@')[0] || 'Unknown'),
        authorEmail,
        link,
        issued,
        accountIndex,
        otpCode
      });
    }

    return {
      success: true,
      fullcount,
      accountEmail,
      entries
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      fullcount: 0,
      accountEmail: '',
      entries: []
    };
  }
}

// Runtime message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PARSE_GMAIL_ATOM') {
    const result = parseGmailAtom(message.xmlText, message.accountIndex ?? 0);
    sendResponse(result);
    return false; // Synchronous response
  }

  if (message.action === 'PLAY_NOTIFICATION_SOUND') {
    playChime()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async chime resolution
  }

  return false;
});
