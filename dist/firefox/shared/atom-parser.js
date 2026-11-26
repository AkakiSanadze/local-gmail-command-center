import { extractHexMessageId, normalizeGmailLink } from './gmail-ids.js';
import { extractOtpCode } from './otp.js';

/**
 * Native XML DOMParser for Gmail Atom Feed.
 * Accepts an optional ParserCtor so Node.js tests can inject a lightweight XML DOMParser.
 */
export function parseGmailAtom(xmlText, accountIndex = 0, ParserCtor = globalThis.DOMParser) {
  try {
    if (!ParserCtor) {
      throw new Error('DOMParser is not available in this context');
    }
    const parser = new ParserCtor();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

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

    const fullcountEl = xmlDoc.querySelector('fullcount');
    const fullcount = fullcountEl ? parseInt(fullcountEl.textContent, 10) || 0 : 0;

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
      const id = idEl
        ? idEl.textContent.trim()
        : `${accountIndex}-${title}-${issuedEl ? issuedEl.textContent : Date.now()}`;
      const issued = issuedEl ? issuedEl.textContent.trim() : new Date().toISOString();
      const messageId = extractHexMessageId(rawLink, id);
      const link = normalizeGmailLink(rawLink, accountIndex, messageId);
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
