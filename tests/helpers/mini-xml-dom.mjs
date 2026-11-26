/**
 * Zero-dependency lightweight XML DOMParser shim for Node.js tests.
 * Supports Gmail Atom XML feeds, attributes, CDATA, entity decoding,
 * parsererror detection, and CSS selectors used by atom-parser.js.
 */

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

class XmlElement {
  constructor(tagName, attrs = {}, parent = null) {
    this.tagName = tagName;
    this.attrs = attrs;
    this.parent = parent;
    this.children = [];
    this._text = '';
  }

  get textContent() {
    if (this.children.length === 0) return this._text;
    return this._text + this.children.map(c => c.textContent).join('');
  }

  set textContent(val) {
    this._text = String(val ?? '');
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attrs, name)
      ? this.attrs[name]
      : null;
  }

  matchesSingleSelector(sel) {
    const attrMatch = sel.match(/^([a-zA-Z0-9_:-]+)\[([a-zA-Z0-9_:-]+)=["']([^"']+)["']\]$/);
    if (attrMatch) {
      const [, tag, attrName, attrVal] = attrMatch;
      return this.tagName === tag && this.getAttribute(attrName) === attrVal;
    }
    return this.tagName === sel;
  }

  matchesSelector(selectorPart) {
    const trimmed = selectorPart.trim();
    if (trimmed.includes('>')) {
      const parts = trimmed.split('>').map(p => p.trim()).filter(Boolean);
      if (parts.length !== 2) return false;
      return (
        this.matchesSingleSelector(parts[1]) &&
        this.parent !== null &&
        this.parent.matchesSingleSelector(parts[0])
      );
    }
    return this.matchesSingleSelector(trimmed);
  }

  querySelectorAll(selector) {
    const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);
    const results = [];

    const walk = node => {
      for (const child of node.children) {
        if (selectors.some(sel => child.matchesSelector(sel))) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  querySelector(selector) {
    const selectors = selector.split(',').map(s => s.trim()).filter(Boolean);
    for (const sel of selectors) {
      const all = this.querySelectorAll(sel);
      if (all.length > 0) return all[0];
    }
    return null;
  }
}

function parseAttributes(attrString) {
  const attrs = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = attrRegex.exec(attrString)) !== null) {
    attrs[m[1]] = decodeEntities(m[2] ?? m[3] ?? '');
  }
  return attrs;
}

function makeErrorDocument(reason) {
  const root = new XmlElement('document');
  const errEl = new XmlElement('parsererror', {}, root);
  errEl.textContent = reason;
  root.children.push(errEl);
  return root;
}

export class MiniXmlDOMParser {
  parseFromString(xmlText, mimeType = 'text/xml') {
    if (mimeType !== 'text/xml' && mimeType !== 'application/xml') {
      return makeErrorDocument(`Unsupported mimeType: ${mimeType}`);
    }
    if (!xmlText || typeof xmlText !== 'string') {
      return makeErrorDocument('Empty XML input');
    }

    // Strip BOM, XML declaration, and comments while preserving CDATA
    let input = xmlText
      .replace(/^\uFEFF/, '')
      .replace(/<\?xml[\s\S]*?\?>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();

    if (!input.startsWith('<')) {
      return makeErrorDocument('Document does not start with XML tag');
    }

    const root = new XmlElement('document');
    const stack = [root];
    const tokenRegex = /<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([a-zA-Z0-9_:-]+)([^>]*)>|([^<]+)/g;
    let match;
    let lastIndex = 0;

    while ((match = tokenRegex.exec(input)) !== null) {
      if (match.index !== lastIndex) {
        return makeErrorDocument('Malformed XML syntax');
      }
      lastIndex = tokenRegex.lastIndex;

      const current = stack[stack.length - 1];

      if (match[1] !== undefined) {
        current._text += match[1];
        continue;
      }

      if (match[3] !== undefined) {
        const isClosing = match[2] === '/';
        const tagName = match[3];
        const rawAttrs = match[4] || '';
        const isSelfClosing = rawAttrs.trim().endsWith('/');

        if (isClosing) {
          if (stack.length <= 1 || current.tagName !== tagName) {
            return makeErrorDocument(`Mismatched closing tag </${tagName}>`);
          }
          stack.pop();
        } else {
          const cleanAttrs = isSelfClosing
            ? rawAttrs.slice(0, rawAttrs.lastIndexOf('/'))
            : rawAttrs;
          const el = new XmlElement(tagName, parseAttributes(cleanAttrs), current);
          current.children.push(el);
          if (!isSelfClosing) {
            stack.push(el);
          }
        }
        continue;
      }

      if (match[5] !== undefined) {
        current._text += decodeEntities(match[5]);
      }
    }

    if (lastIndex !== input.length || stack.length !== 1 || root.children.length === 0) {
      return makeErrorDocument('Unclosed or incomplete XML element');
    }

    return root;
  }
}
