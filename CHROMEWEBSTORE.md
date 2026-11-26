# Store Listing & Permissions — Local Gmail Command Center

> Version: `2.1.0` | Targets: Chrome Web Store (MV3) & Firefox Add-ons / AMO (MV3)

## Store Listing

**Extension Name** [REQUIRED]
Local Gmail Command Center

**Short Description** [REQUIRED]
Monitor multiple Gmail accounts locally, copy OTP codes in one click, manage unread messages, and summarize emails with local AI.

**Detailed Description** [REQUIRED]
Local Gmail Command Center is a fast, privacy-first, zero-dependency multi-account Gmail assistant for Chrome and Firefox.

KEY FEATURES

• Multi-Account Inbox Monitoring: Monitor multiple signed-in Gmail accounts (`u/0`, `u/1`, `u/2`...) simultaneously with accurate unread badges and per-account tabs.

• Zero-Tab Quick Actions: Mark individual emails or filtered batches as read or move them to Trash in the background without leaving your current tab.

• Smart OTP / 2FA Code Detector: Automatically detects 4–8 digit and `G-XXXXXX` verification codes in English and Georgian messages and lets you copy them to your clipboard in one click.

• Native Web Audio Chime: Synthesizes a clean two-tone acoustic chime (D5 → A5) directly via the Web Audio API with zero external audio files.

• VIP Keyword Filter & Focus Mode (DND): Receive desktop notifications and audio chimes only for priority keywords, or mute alerts temporarily with Focus Mode.

• Optional Local AI Summary (LM Studio): Summarize individual email snippets in one sentence using your own local LM Studio server (`http://127.0.0.1:1234` or `localhost`) with zero cloud data sharing.

• Dual UI Mode (Popup + Side Panel / Firefox Sidebar): Works seamlessly as a compact toolbar popup or an expandable browser side panel / sidebar with synced Light & Dark themes.

PRIVACY & SECURITY

- Zero telemetry, zero analytics, and zero third-party cloud servers.
- Communicates directly with Google's official mail endpoints (`https://mail.google.com/*` and `https://accounts.google.com/*`) using your active browser session.
- Optional AI summarization connects only to the local loopback address configured by you (`http://127.0.0.1/*` or `http://localhost/*`).

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Monitors multiple signed-in Gmail inboxes locally, extracts verification codes, and provides quick inbox management actions.

---

## Permissions Justification (Chrome & Firefox MV3)

| Permission | Target | Justification |
|------------|--------|---------------|
| `alarms` | Chrome, Firefox | Schedules periodic background Gmail Atom feed checks at the user's configured interval. |
| `storage` | Chrome, Firefox | Saves user preferences, account labels, cached feed state, and temporary notification link mappings locally. |
| `notifications` | Chrome, Firefox | Displays native desktop alerts when new unread or VIP emails arrive. |
| `offscreen` | Chrome only | Provides DOMParser (for Gmail Atom XML parsing) and Web Audio API playback outside the MV3 service worker. |
| `sidePanel` | Chrome only | Opens the persistent widescreen Side Panel view from the popup button. |
| `clipboardWrite` | Chrome, Firefox | Copies detected 2FA/OTP verification codes to the clipboard on button click. |
| `cookies` | Chrome, Firefox | Reads account-scoped `GMAIL_AT` anti-CSRF cookies so background mark-read and trash actions are authenticated per account. |
| `tabs` | Chrome, Firefox | Opens emails/compose windows, focuses existing Gmail tabs to avoid duplicates, and completes Gmail `/spreauth` handshakes when required. |
| `https://mail.google.com/*` | Chrome, Firefox | Fetches Gmail Atom unread feeds and executes user-triggered mark-read / trash actions. |
| `https://accounts.google.com/*` | Chrome, Firefox | Allows detecting and completing Google session authentication / `/spreauth` redirects cleanly. |
| `http://localhost/*`, `http://127.0.0.1/*` | Chrome, Firefox | Connects to the user's local LM Studio / OpenAI-compatible server when the user clicks "AI Summary" or "Test Connection". |

---

## Firefox Add-ons (AMO) Submission Notes

- **Manifest & ID:** Uses `manifests/firefox.json` with `browser_specific_settings.gecko.id = "local-gmail-command-center@akakisanadze.dev"` and `strict_min_version = "121.0"`.
- **Sidebar Integration:** Uses `sidebar_action` (`sidepanel.html`) and synchronous `browser.sidebarAction.open()` inside the user click handler.
- **No Obfuscation / No Build-Step Minification:** The extension uses pure, unminified ES modules (`src/` copied cleanly into `dist/firefox/` via `scripts/build.mjs`), requiring no source-code compilation notice for AMO reviewers.
- **Reproducible Packaging:** Run `npm run pack` to generate `dist/local-gmail-command-center-chrome.zip` and `dist/local-gmail-command-center-firefox.xpi`.
