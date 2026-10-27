# Chrome Web Store Listing — Local Gmail Command Center

> Last Updated: 2026-10-25

## Store Listing

**Extension Name** [REQUIRED]
Local Gmail Command Center

**Short Description** [REQUIRED]
Monitor multiple Gmail accounts, read emails in-app, copy OTP codes instantly, and take actions without opening new tabs.

**Detailed Description** [REQUIRED]
Local Gmail Command Center is an ultra-fast, privacy-first multi-account Gmail assistant that lets you stay on top of your inboxes without interrupting your workflow.

KEY FEATURES

• Multi-Account Inbox Monitoring: Effortlessly monitor multiple signed-in Gmail accounts at the same time with instant unread badges.

• In-App Slide-Over Reader: Click any email card to preview and read full email threads directly inside the popup or side panel without opening a new tab.

• Zero-Tab Quick Actions: Mark emails as read, archive, star, or delete messages instantly with single-click background execution.

• Smart Verification (OTP) Detector: Automatically detects 2FA and OTP codes from incoming emails, highlights them on your screen, and copies them to your clipboard with one click.

• Context-Aware Interactive Notifications: Get notified of new messages with actionable buttons—instantly copy verification codes or archive emails directly from the desktop alert.

• Customizable Acoustic Sound Alerts: Choose between 4 built-in alert tone presets (Chime, Crystal, Pop, Zen) or enable voice announcement of the sender and subject.

• Quick Reply & AI Draft Assistant: Pick from convenient pre-written response chips or generate smart replies locally, then open a pre-filled Gmail compose window in one click.

• VIP Sender & Focus Mode: Filter notifications so you are only alerted to high-priority messages, or activate Do Not Disturb mode when you need deep focus.

• Dual UI Layout: Use it as a lightweight toolbar popup or open it in Chrome's dedicated Side Panel for a persistent widescreen view.

HOW TO USE IT

1. Click "Add to Chrome" to install the extension.
2. Sign in to your Gmail accounts in Google Chrome as you normally do.
3. Click the extension icon in your toolbar to see your unread messages across all accounts.
4. Click any email to read it in the slide-over drawer, or hover over a card to mark as read, star, archive, or delete.
5. When a verification code arrives, click the copy button on the notification or email card to paste it anywhere.

PRIVACY & SECURITY

Your privacy is completely protected:
- Zero telemetry and zero analytics tracking.
- No third-party servers: all requests travel directly between your browser and Google's official mail endpoints.
- No external OAuth credentials or cloud keys needed. Everything runs locally on your machine.

SUPPORT & FEEDBACK

For feature suggestions or bug reports, please submit an issue on our GitHub repository or contact our support team.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Monitors multiple Gmail inboxes and provides quick in-app reading, action management, and instant verification code copying.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | 🟡 Needs capture | `screenshots/screenshot-popup-feed.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | 🟡 Needs capture | `screenshots/screenshot-reader-drawer.png` |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | 🟡 Needs capture | `screenshots/screenshot-otp-notification.png` |
| Screenshot 4 | 1280×800 or 640×400 | 🟡 Needs capture | `screenshots/screenshot-sidepanel.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `promo/small-promo-440x280.png` |
| Marquee Promo Tile | 1400×560 | ⬜ Not created | `promo/marquee-promo-1400x560.png` |

### Screenshot Notes
- **Screenshot 1:** Multi-account inbox feed showing unread badges, email cards, and quick hover actions.
- **Screenshot 2:** In-app Slide-Over Reader view displaying a full sanitized email body, OTP callout bar, and Quick Reply chips.
- **Screenshot 3:** Interactive desktop notification highlighting the "Copy OTP" and "Mark Read" action buttons.
- **Screenshot 4:** Dual UI view running inside Chrome Side Panel alongside an active webpage.

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `alarms` | permissions | Schedules background inbox checks at the user's chosen interval (e.g., every 15, 30, or 60 seconds). |
| `storage` | permissions | Saves user preferences locally, including sound presets, check frequency, VIP keyword filters, and dark mode theme. |
| `notifications` | permissions | Displays desktop notifications when new emails or two-factor verification codes arrive. |
| `offscreen` | permissions | Houses the background document needed for feed parsing, audio tone synthesis, email content sanitization, and clipboard copying. |
| `sidePanel` | permissions | Allows opening the inbox assistant inside Google Chrome's native Side Panel for widescreen multitasking. |
| `cookies` | permissions | Retrieves the Gmail session security token from mail.google.com to execute in-app actions (mark as read, star, archive, delete) without opening background tabs. |
| `tts` | permissions | Announces the sender and subject aloud when a new message arrives, if the user enables voice notifications. |
| `https://mail.google.com/*` | host_permissions | Communicates directly with Gmail to fetch inbox feed summaries, retrieve email thread bodies for in-app reading, and perform user-requested mail actions. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The extension communicates exclusively with Google's official endpoints (`https://mail.google.com/*`) using the user's active browser cookies. No personal data, email content, or metadata is ever collected, tracked, or transmitted to any third-party or developer-controlled server.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | No | No | N/A | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
`https://github.com/akakisanadze/local-gmail-command-center/blob/main/PRIVACY.md`

*(Note: Prior to submission, ensure the link is live and matches the privacy declarations above).*

---

## Distribution

**Visibility**: Public  
**Regions**: All regions  

---

## Developer Info

**Publisher Name** [REQUIRED]
Local Gmail Command Center Team

**Contact Email** [REQUIRED]
support@localgmailcommandcenter.com

**Support URL / Email** [RECOMMENDED]
`https://github.com/akakisanadze/local-gmail-command-center/issues`

**Homepage URL** [RECOMMENDED]
`https://github.com/akakisanadze/local-gmail-command-center`

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 3.0.0 | 2026-10-25 | Major upgrade: Zero-tab Gmail action engine, Slide-over in-app email reader, Quick & AI Smart Reply, context-aware interactive notifications with OTP auto-copy, 4 Web Audio synth presets, and parallel sync optimization. | Draft |
| 2.0.0 | 2026-10-25 | Added Side Panel support, Local AI Summary bridge, and OTP detection. | Archived |
| 1.0.0 | 2026-10-24 | Initial release: Multi-account Atom feed monitoring, Web Audio chime, and Bento UI. | Archived |

---

## Review Notes

### Known Issues / Limitations
- Multi-account feed reading requires that user profiles are signed into Gmail in the current Chrome profile session.
- Users who sign out of Gmail will see a "?" badge indicating an unauthenticated session until they log back in.
