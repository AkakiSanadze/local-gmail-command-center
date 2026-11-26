/**
 * Unified VIP keyword parsing and matching helper.
 */

/**
 * Parses comma-separated keyword string or array into normalized lowercase tokens.
 */
export function parseVipKeywords(keywordsInput) {
  if (!keywordsInput) return [];
  const rawList = Array.isArray(keywordsInput)
    ? keywordsInput
    : String(keywordsInput).split(',');

  return rawList
    .map(k => String(k).trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks whether an email entry matches any VIP keyword in subject, summary, or sender.
 */
export function isVipEmail(entry, keywordsInput) {
  if (!entry) return false;
  const keywords = parseVipKeywords(keywordsInput);
  if (keywords.length === 0) return false;

  const content = `${entry.title || ''} ${entry.summary || ''} ${entry.authorName || ''} ${entry.authorEmail || ''}`.toLowerCase();
  return keywords.some(keyword => content.includes(keyword));
}
