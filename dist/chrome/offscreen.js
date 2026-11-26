/**
 * Local Gmail Command Center - Chrome Offscreen Document
 * Delegates XML Atom parsing and Web Audio chime synthesis to shared ES modules.
 */

import { parseGmailAtom } from './shared/atom-parser.js';
import { playChime } from './shared/audio.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'PARSE_GMAIL_ATOM') {
    const result = parseGmailAtom(message.xmlText, message.accountIndex ?? 0);
    sendResponse(result);
    return false;
  }

  if (message?.action === 'PLAY_NOTIFICATION_SOUND') {
    playChime()
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  return false;
});
