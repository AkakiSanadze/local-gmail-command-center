/**
 * Gmail thread/message ID normalization and link utilities.
 */

/**
 * Normalizes any Gmail ID format (64-bit decimal integer, prefixed tag, or hex)
 * into a standard lowercase hexadecimal thread/message ID.
 */
export function toHexThreadId(val) {
  if (!val) return null;
  const str = String(val).trim();

  // 1. Standard 14-16 hex chars (Gmail hex IDs are 15-16 chars; 64-bit decimal IDs are 17-20 digits)
  if (/^[0-9a-fA-F]{14,16}$/.test(str)) {
    return str.toLowerCase();
  }

  // 2. Prefixed like tag:gmail.google.com,2004:1827491048192847291 or msg-f:1827491048192847291
  const tagMatch = str.match(/(?:tag:gmail\.google\.com,2004:|msg-f:|thread-f:)(\d+)/i);
  if (tagMatch && tagMatch[1]) {
    try {
      return BigInt(tagMatch[1]).toString(16).toLowerCase();
    } catch (_) {
      return null;
    }
  }

  // 3. Raw 64-bit decimal integer (17-20 digits)
  if (/^\d{17,20}$/.test(str)) {
    try {
      return BigInt(str).toString(16).toLowerCase();
    } catch (_) {
      return null;
    }
  }

  return null;
}

/**
 * Extracts the hexadecimal Gmail message/thread ID from the Atom entry link or tag ID.
 */
export function extractHexMessageId(rawLink, atomId) {
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
 * Resolves hex message ID from entry properties or link.
 */
export function resolveHexMessageId(entry) {
  if (!entry) return null;
  const fromLinkOrId = extractHexMessageId(entry.link, entry.id);
  if (fromLinkOrId) return fromLinkOrId;
  if (entry.messageId) {
    const hex = toHexThreadId(entry.messageId);
    if (hex) return hex;
  }
  return null;
}

/**
 * Normalizes Gmail atom links so they always target the correct account index.
 */
export function normalizeGmailLink(rawLink, accountIndex, messageId = null) {
  if (!rawLink) {
    return messageId
      ? `https://mail.google.com/mail/u/${accountIndex}/#inbox/${messageId}`
      : `https://mail.google.com/mail/u/${accountIndex}/#inbox`;
  }
  const link = rawLink.trim().replace(/^http:\/\//i, 'https://');
  if (link.includes('/mail/u/')) {
    return link.replace(/\/mail\/u\/\d+/, `/mail/u/${accountIndex}`);
  }
  if (link.startsWith('https://mail.google.com/mail')) {
    return link.replace(
      'https://mail.google.com/mail',
      `https://mail.google.com/mail/u/${accountIndex}`
    );
  }
  return link;
}
