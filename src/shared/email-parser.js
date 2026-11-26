/**
 * Email body extraction, HTML sanitization, and List-Unsubscribe header parsing.
 * Pure ES module compatible with Chrome/Firefox MV3 Service Workers, Popups, and Node.js tests.
 */

const UNSAFE_HTML_TAGS =
  'script, style, iframe, object, embed, applet, form, input, button, textarea, select, meta, link, base, noscript, svg, math, head, title';

const STRIPPED_ATTRS = new Set([
  'style',
  'class',
  'id',
  'bgcolor',
  'color',
  'width',
  'height',
  'align',
  'valign',
  'border',
  'cellpadding',
  'cellspacing',
  'srcdoc',
  'formaction',
  'target',
  'srcset'
]);

const UNSUBSCRIBE_LINK_PATTERN =
  /\b(unsubscribe|opt[\s-]?out|manage\s+preferences|email\s+preferences)\b|გამოწერის\s+გაუქმება/i;

/**
 * Decodes basic HTML entities commonly found inside Gmail's view=om <pre> wrapper.
 */
export function decodeBasicHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&#x0*27;/gi, "'")
    .replace(/&amp;/gi, '&');
}

/**
 * Validates that a URL uses an allowed http/https protocol.
 */
export function isSafeHttpUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch (_) {
    return false;
  }
}

/**
 * Validates whether a URI is safe for an anchor href (http, https, or mailto).
 */
function isSafeAnchorHref(href) {
  if (!href || typeof href !== 'string') return false;
  if (isSafeHttpUrl(href)) return true;
  try {
    const parsed = new URL(href.trim());
    return parsed.protocol === 'mailto:';
  } catch (_) {
    return false;
  }
}

/**
 * Parses List-Unsubscribe and List-Unsubscribe-Post headers from Gmail view=om output.
 * Returns { type: 'one-click' | 'url' | 'mailto', url, mailtoUrl, source: 'header' } or null.
 */
export function parseUnsubscribeHeaders(rawSource) {
  if (!rawSource || typeof rawSource !== 'string') return null;

  let text = rawSource;
  if (/<pre\b/i.test(text)) {
    const preMatch =
      text.match(/<pre\b[^>]*id=["']raw_message_text["'][^>]*>([\s\S]*?)<\/pre>/i) ||
      text.match(/<pre\b[^>]*>([\s\S]*?)<\/pre>/i);
    if (preMatch && preMatch[1]) {
      text = decodeBasicHtmlEntities(preMatch[1]);
    }
  }

  // Only inspect RFC 2822 headers (before the first blank line) to avoid matching quoted body text
  const headerSplit = text.split(/\r?\n\r?\n/);
  const headerBlock = (headerSplit[0] || text).slice(0, 32768);
  const unfolded = headerBlock.replace(/\r?\n[ \t]+/g, ' ');

  const unsubMatch = unfolded.match(/^List-Unsubscribe:\s*(.+)$/im);
  if (!unsubMatch || !unsubMatch[1]) return null;

  const rawHeaderVal = unsubMatch[1].trim();
  const uris = [];
  const bracketRegex = /<([^>]+)>/g;
  let m;
  while ((m = bracketRegex.exec(rawHeaderVal)) !== null) {
    if (m[1]) uris.push(m[1].trim());
  }

  if (uris.length === 0) {
    const fallbackMatches = rawHeaderVal.match(/(?:https?:\/\/|mailto:)[^\s,<>]+/gi) || [];
    for (const candidate of fallbackMatches) {
      uris.push(candidate.trim());
    }
  }

  let httpsUrl = null;
  let httpFallbackUrl = null;
  let mailtoUrl = null;

  for (const uri of uris) {
    if (!mailtoUrl && /^mailto:/i.test(uri)) {
      mailtoUrl = uri;
      continue;
    }
    if (isSafeHttpUrl(uri)) {
      if (uri.toLowerCase().startsWith('https://')) {
        if (!httpsUrl) httpsUrl = uri;
      } else if (!httpFallbackUrl) {
        httpFallbackUrl = uri;
      }
    }
  }

  const bestHttpUrl = httpsUrl || httpFallbackUrl;
  const postMatch = unfolded.match(/^List-Unsubscribe-Post:\s*(.+)$/im);
  const isOneClick =
    Boolean(postMatch && /List-Unsubscribe\s*=\s*One-Click/i.test(postMatch[1])) &&
    Boolean(httpsUrl);

  if (isOneClick) {
    return { type: 'one-click', url: httpsUrl, mailtoUrl, source: 'header' };
  }
  if (bestHttpUrl) {
    return { type: 'url', url: bestHttpUrl, mailtoUrl, source: 'header' };
  }
  if (mailtoUrl) {
    return { type: 'mailto', url: null, mailtoUrl, source: 'header' };
  }
  return null;
}

/**
 * Converts a mailto: URI into a Gmail Web Compose URL for the specified account index.
 */
export function buildGmailComposeFromMailto(mailtoUri, accountIndex = 0) {
  if (!mailtoUri || typeof mailtoUri !== 'string') return null;
  const trimmed = mailtoUri.trim();
  if (!/^mailto:/i.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    const to = decodeURIComponent(parsed.pathname || '').trim();
    if (!to || !to.includes('@')) return null;

    let subject = '';
    let body = '';
    for (const [key, val] of parsed.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (lower === 'subject' && !subject) subject = val;
      if (lower === 'body' && !body) body = val;
    }

    const idx = Number(accountIndex) || 0;
    let url = `https://mail.google.com/mail/u/${idx}/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
    if (subject) url += `&su=${encodeURIComponent(subject)}`;
    if (body) url += `&body=${encodeURIComponent(body)}`;
    return url;
  } catch (_) {
    return null;
  }
}

/**
 * Scans email body anchors from bottom to top for a fallback unsubscribe link.
 */
export function extractBodyUnsubscribeLink(doc) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return null;
  const anchors = Array.from(doc.querySelectorAll('a[href]'));
  for (let i = anchors.length - 1; i >= 0; i--) {
    const anchor = anchors[i];
    const href = (anchor.getAttribute('href') || '').trim();
    const text = (anchor.textContent || '').trim();
    if (!isSafeHttpUrl(href)) continue;
    if (UNSUBSCRIBE_LINK_PATTERN.test(text) || UNSUBSCRIBE_LINK_PATTERN.test(href)) {
      return { type: 'url', url: href, mailtoUrl: null, source: 'body' };
    }
  }
  return null;
}

/**
 * Checks if an <img> dimension attribute represents a 1x1 or 2x2 tracking pixel.
 */
function isTrackingPixelDimension(val) {
  if (val === null || val === undefined) return false;
  const trimmed = String(val).trim();
  return /^\d+$/.test(trimmed) && Number(trimmed) <= 2;
}

/**
 * Extracts message body content from Gmail Print View (view=pt) HTML,
 * sanitizes all markup/attributes for safe rendering in Dark/Light themes,
 * and detects any fallback unsubscribe link inside the body.
 */
export function extractAndSanitizeEmailHtml(rawHtml, DOMParserCtor = globalThis.DOMParser) {
  if (!rawHtml || typeof rawHtml !== 'string' || typeof DOMParserCtor !== 'function') {
    return { html: '', plainText: '', bodyUnsubscribe: null };
  }

  const doc = new DOMParserCtor().parseFromString(rawHtml, 'text/html');
  const container = doc.createElement('div');

  const messageTables = Array.from(doc.querySelectorAll('table.message'));
  if (messageTables.length > 0) {
    messageTables.forEach((msgTable, idx) => {
      if (idx > 0) {
        container.appendChild(doc.createElement('hr'));
      }
      const directRows = Array.from(msgTable.children || []).flatMap(child => {
        const tag = (child.tagName || '').toUpperCase();
        if (tag === 'TR') return [child];
        if (tag === 'TBODY' || tag === 'THEAD' || tag === 'TFOOT') {
          return Array.from(child.children || []).filter(
            c => (c.tagName || '').toUpperCase() === 'TR'
          );
        }
        return [];
      });
      let sourceNode = msgTable;
      if (directRows.length > 1) {
        const lastRow = directRows[directRows.length - 1];
        const directCells = Array.from(lastRow.children || []).filter(c => {
          const tag = (c.tagName || '').toUpperCase();
          return tag === 'TD' || tag === 'TH';
        });
        sourceNode =
          directCells.find(c => c.getAttribute('colspan') === '2') ||
          directCells[0] ||
          lastRow;
      }
      const clone = sourceNode.cloneNode(true);
      const sourceTag = (sourceNode.tagName || '').toUpperCase();
      if (sourceTag === 'TD' || sourceTag === 'TH') {
        while (clone.firstChild) {
          container.appendChild(clone.firstChild);
        }
      } else {
        container.appendChild(clone);
      }
    });
  } else {
    const bodyRoot = doc.querySelector('.bodycontainer') || doc.body;
    if (bodyRoot) {
      const clone = bodyRoot.cloneNode(true);
      while (clone.firstChild) {
        container.appendChild(clone.firstChild);
      }
    }
  }

  // Capture unsubscribe link from body before stripping/transforming elements
  const bodyUnsubscribe = extractBodyUnsubscribeLink(container);

  // Remove dangerous or non-content tags
  for (const el of Array.from(container.querySelectorAll(UNSAFE_HTML_TAGS))) {
    el.remove();
  }

  // Sanitize remaining elements and attributes
  for (const el of Array.from(container.querySelectorAll('*'))) {
    const tag = (el.tagName || '').toUpperCase();

    if (tag === 'IMG') {
      const src = (el.getAttribute('src') || '').trim();
      const widthAttr = el.getAttribute('width');
      const heightAttr = el.getAttribute('height');
      if (
        !isSafeHttpUrl(src) ||
        isTrackingPixelDimension(widthAttr) ||
        isTrackingPixelDimension(heightAttr)
      ) {
        el.remove();
        continue;
      }
    }

    const preservedHref = tag === 'A' ? (el.getAttribute('href') || '').trim() : '';

    for (const attr of Array.from(el.attributes || [])) {
      const attrName = attr.name.toLowerCase();
      if (
        attrName.startsWith('on') ||
        STRIPPED_ATTRS.has(attrName) ||
        (attrName === 'src' && tag !== 'IMG')
      ) {
        el.removeAttribute(attr.name);
      }
    }

    if (tag === 'A') {
      if (isSafeAnchorHref(preservedHref)) {
        el.setAttribute('href', preservedHref);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else {
        el.removeAttribute('href');
      }
    } else if (tag === 'IMG') {
      el.setAttribute('loading', 'lazy');
      el.setAttribute('referrerpolicy', 'no-referrer');
    }
  }

  const plainText = (container.textContent || '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return {
    html: container.innerHTML.trim(),
    plainText,
    bodyUnsubscribe
  };
}
