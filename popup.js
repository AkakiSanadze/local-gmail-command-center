/**
 * Local Gmail Command Center - Frontend Logic (popup.js)
 * Dual-Mode: Popup (380px) & Side Panel (100% fluid)
 * Manifest V3, Pure Vanilla ES2024+, Zero-Dependency.
 */

// State
let appSettings = null;
let currentTab = 'all'; // 'all' or numeric account index string ('0', '1', '2')
let cachedFeedData = {};
let allEmails = [];
let searchQuery = '';

// DOM Elements
const bodyEl = document.body;
const statusDotEl = document.getElementById('statusDot');
const lastSyncTimeEl = document.getElementById('lastSyncTime');
const btnRefreshEl = document.getElementById('btnRefresh');
const btnSoundToggleEl = document.getElementById('btnSoundToggle');
const iconSoundOnEl = document.getElementById('iconSoundOn');
const iconSoundOffEl = document.getElementById('iconSoundOff');
const btnThemeToggleEl = document.getElementById('btnThemeToggle');
const iconSunEl = document.getElementById('iconSun');
const iconMoonEl = document.getElementById('iconMoon');
const btnSidePanelEl = document.getElementById('btnSidePanel');
const btnSettingsEl = document.getElementById('btnSettings');
const accountTabsEl = document.getElementById('accountTabs');
const btnComposeEl = document.getElementById('btnCompose');
const filterInputEl = document.getElementById('filterInput');
const btnClearFilterEl = document.getElementById('btnClearFilter');
const emailListEl = document.getElementById('emailList');
const authBannerEl = document.getElementById('authBanner');
const authAccountMsgEl = document.getElementById('authAccountMsg');
const toastContainerEl = document.getElementById('toastContainer');

// Dialog Elements
const settingsDialogEl = document.getElementById('settingsDialog');
const btnCloseSettingsEl = document.getElementById('btnCloseSettings');
const settingsFormEl = document.getElementById('settingsForm');
const accountsSettingsListEl = document.getElementById('accountsSettingsList');
const btnAddAccountRowEl = document.getElementById('btnAddAccountRow');
const pollIntervalInputEl = document.getElementById('pollIntervalInput');
const focusModeToggleEl = document.getElementById('focusModeToggle');
const vipOnlyToggleEl = document.getElementById('vipOnlyToggle');
const vipKeywordsInputEl = document.getElementById('vipKeywordsInput');
const btnTestSoundEl = document.getElementById('btnTestSound');
const aiEndpointInputEl = document.getElementById('aiEndpointInput');
const aiModelInputEl = document.getElementById('aiModelInput');

/**
 * Toast Notification Helper
 */
function showToast(message, durationMs = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainerEl.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 150ms ease';
    setTimeout(() => toast.remove(), 160);
  }, durationMs);
}

/**
 * Format relative time (e.g. "5 წთ წინ", "14:20", "გუშინ")
 */
function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'ახლახან';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} წთ წინ`;
  if (diffSec < 86400) {
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Theme & Color-Scheme Management
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem('local-gmail-theme', theme);
  updateThemeIcons(theme);
}

function initTheme() {
  let savedTheme = localStorage.getItem('local-gmail-theme');
  if (!savedTheme) {
    savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  applyTheme(savedTheme);

  btnThemeToggleEl.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(nextTheme === 'dark' ? '🌙 მუქი თემა' : '☀️ ნათელი თემა');
  });
}

function updateThemeIcons(theme) {
  if (theme === 'dark') {
    iconSunEl.classList.remove('hidden');
    iconMoonEl.classList.add('hidden');
    btnThemeToggleEl.title = 'თემა: მუქი (დააჭირეთ ნათელზე გადასართავად)';
  } else {
    iconSunEl.classList.add('hidden');
    iconMoonEl.classList.remove('hidden');
    btnThemeToggleEl.title = 'თემა: ნათელი (დააჭირეთ მუქზე გადასართავად)';
  }
}

/**
 * Dual View Setup (Popup vs Side Panel)
 */
function updateViewportLayout() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSidePanel =
    document.body.dataset.view === 'sidepanel' ||
    document.body.classList.contains('is-sidepanel') ||
    window.location.pathname.includes('sidepanel') ||
    urlParams.get('view') === 'sidepanel' ||
    window.innerWidth > 390;

  if (isSidePanel) {
    document.documentElement.dataset.view = 'sidepanel';
    document.body.dataset.view = 'sidepanel';
    document.body.classList.add('is-sidepanel');
    btnSidePanelEl.classList.add('hidden');
  } else {
    document.documentElement.dataset.view = 'popup';
    document.body.dataset.view = 'popup';
    document.body.classList.remove('is-sidepanel');
    btnSidePanelEl.classList.remove('hidden');
  }
}

function initViewMode() {
  updateViewportLayout();
  window.addEventListener('resize', updateViewportLayout);

  btnSidePanelEl.addEventListener('click', async () => {
    try {
      btnSidePanelEl.disabled = true;
      const win = await chrome.windows.getLastFocused();
      const winId = win?.id;

      let opened = false;
      // 1. Direct call if available in popup
      if (chrome.sidePanel && typeof chrome.sidePanel.open === 'function' && winId) {
        try {
          await chrome.sidePanel.open({ windowId: winId });
          opened = true;
        } catch (err) {
          console.warn('Direct popup sidePanel.open failed, trying background:', err);
        }
      }

      // 2. Fallback via background Service Worker
      if (!opened) {
        const res = await chrome.runtime.sendMessage({
          action: 'OPEN_SIDE_PANEL',
          windowId: winId
        });
        if (!res?.success) {
          throw new Error(res?.error || 'Could not open side panel');
        }
      }

      showToast('📌 Side Panel იხსნება...');
      setTimeout(() => {
        window.close();
      }, 200);
    } catch (err) {
      console.error('Failed to open side panel:', err);
      showToast('Side Panel ვერ გაიხსნა: ' + err.message);
      btnSidePanelEl.disabled = false;
    }
  });
}

/**
 * Loads extension settings & cached feed state from storage
 */
async function loadState() {
  const data = await chrome.storage.local.get({
    accounts: [
      { index: 0, name: 'Personal', enabled: true },
      { index: 1, name: 'Work', enabled: true },
      { index: 2, name: 'Account 3', enabled: true },
      { index: 3, name: 'Account 4', enabled: true },
      { index: 4, name: 'Account 5', enabled: true }
    ],
    pollInterval: 1,
    soundEnabled: true,
    focusMode: false,
    vipOnly: false,
    vipKeywords: 'urgent, invoice, სასწრაფო, კოდი, verification, გადახდა, security, auth',
    aiEndpoint: 'http://localhost:1234/v1/chat/completions',
    aiModel: 'local-model',
    locallyReadIds: [],
    cachedFeeds: {},
    lastGlobalCheck: null
  });

  appSettings = data;
  cachedFeedData = data.cachedFeeds || {};

  updateSoundButtonUI();
  updateLastSyncTimeUI(data.lastGlobalCheck);
  processCachedEmails();
  renderAccountTabs();
  renderEmailList();
}

/**
 * Updates Sound Toggle UI
 */
function updateSoundButtonUI() {
  if (!appSettings) return;
  if (appSettings.soundEnabled && !appSettings.focusMode) {
    iconSoundOnEl.classList.remove('hidden');
    iconSoundOffEl.classList.add('hidden');
    btnSoundToggleEl.title = 'ხმა: ჩართულია (დააჭირეთ გასაჩუმებლად)';
  } else {
    iconSoundOnEl.classList.add('hidden');
    iconSoundOffEl.classList.remove('hidden');
    btnSoundToggleEl.title = appSettings.focusMode ? 'Focus Mode (DND) ჩართულია' : 'ხმა: გამორთულია';
  }
}

/**
 * Updates last checked timestamp UI
 */
function updateLastSyncTimeUI(isoString) {
  if (!isoString) {
    lastSyncTimeEl.textContent = 'არ შემოწმებულა';
    return;
  }
  const date = new Date(isoString);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  lastSyncTimeEl.textContent = `განახლდა ${timeStr}`;
}

/**
 * Aggregates emails across all enabled accounts into a unified list
 */
function processCachedEmails() {
  allEmails = [];
  const accounts = appSettings.accounts || [];
  const locallyReadIds = new Set(appSettings.locallyReadIds || []);
  let anyAuthorizedAccount = false;

  // Scan all feeds in cachedFeedData
  const feedIndices = Object.keys(cachedFeedData).map(Number).sort((a, b) => a - b);

  for (const idx of feedIndices) {
    const feed = cachedFeedData[idx];
    if (!feed) continue;

    const accConfig = accounts.find(a => a.index === idx);
    // If user explicitly disabled this account in settings, skip
    if (accConfig && accConfig.enabled === false && accConfig.manuallyDisabled) {
      continue;
    }

    if (!feed.unauthorized) {
      anyAuthorizedAccount = true;
      if (Array.isArray(feed.entries)) {
        for (const entry of feed.entries) {
          if (locallyReadIds.has(entry.id) || (entry.messageId && locallyReadIds.has(entry.messageId))) {
            continue; // Skip locally read emails
          }
          allEmails.push({
            ...entry,
            accountIndex: idx,
            accountName: accConfig?.name || (feed.accountEmail ? feed.accountEmail.split('@')[0] : `u/${idx}`),
            accountEmail: feed.accountEmail || accConfig?.email || ''
          });
        }
      }
    }
  }

  // Sort unified emails by issued date descending
  allEmails.sort((a, b) => new Date(b.issued || 0) - new Date(a.issued || 0));

  // Only show Auth Warning Banner if NO account is logged in
  if (!anyAuthorizedAccount && feedIndices.length > 0) {
    authAccountMsgEl.textContent = 'არცერთ ექაუნთში არ ხართ შესული. გთხოვთ გაიაროთ ავტორიზაცია Gmail-ში.';
    authBannerEl.classList.remove('hidden');
  } else {
    authBannerEl.classList.add('hidden');
  }
}

/**
 * Renders Account Navigation Tabs
 */
function renderAccountTabs() {
  accountTabsEl.innerHTML = '';

  const accounts = appSettings.accounts || [];
  const enabledAccounts = accounts.filter(a => a.enabled !== false && !a.manuallyDisabled);

  // Gather all accounts to display: enabled in settings + active in cache
  const indicesSet = new Set();
  enabledAccounts.forEach(a => indicesSet.add(a.index));
  Object.keys(cachedFeedData).forEach(k => {
    const idx = Number(k);
    const feed = cachedFeedData[idx];
    if (feed && !feed.unauthorized) {
      indicesSet.add(idx);
    }
  });

  const indicesToShow = Array.from(indicesSet).sort((a, b) => a - b);
  if (indicesToShow.length === 0) indicesToShow.push(0);

  // 'All' Tab
  const allCount = allEmails.length;
  const allTabBtn = document.createElement('button');
  allTabBtn.type = 'button';
  allTabBtn.className = `tab-pill ${currentTab === 'all' ? 'active' : ''}`;
  allTabBtn.innerHTML = `
    <span>ყველა</span>
    <span class="tab-badge ${allCount > 0 ? 'has-unread' : ''}">${allCount}</span>
  `;
  allTabBtn.addEventListener('click', () => {
    currentTab = 'all';
    renderAccountTabs();
    renderEmailList();
  });
  accountTabsEl.appendChild(allTabBtn);

  // Individual Account Tabs
  const locallyReadIds = new Set(appSettings.locallyReadIds || []);
  for (const idx of indicesToShow) {
    const accConfig = accounts.find(a => a.index === idx);
    const feed = cachedFeedData[idx];
    const isUnauthorized = feed ? feed.unauthorized : false;
    const unreadEntries = (feed?.entries || []).filter(e => !locallyReadIds.has(e.id) && !(e.messageId && locallyReadIds.has(e.messageId)));
    const count = feed && !isUnauthorized ? unreadEntries.length : 0;
    const emailStr = accConfig?.email || feed?.accountEmail || '';
    const displayName = accConfig?.name || (emailStr ? emailStr.split('@')[0] : `u/${idx}`);

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `tab-pill ${currentTab === String(idx) ? 'active' : ''} ${isUnauthorized ? 'tab-unauth' : ''}`;
    tabBtn.title = isUnauthorized
      ? `${emailStr || displayName} (საჭიროა Gmail-ის გახსნა)`
      : `${emailStr ? `${emailStr} (u/${idx})` : `Account ${idx}`}`;
    tabBtn.innerHTML = `
      <span>u/${idx} ${escapeHtml(displayName)}</span>
      <span class="tab-badge ${isUnauthorized ? 'is-warning' : (count > 0 ? 'has-unread' : '')}">${isUnauthorized ? '🔑' : count}</span>
    `;
    tabBtn.addEventListener('click', () => {
      currentTab = String(idx);
      renderAccountTabs();
      renderEmailList();
    });
    accountTabsEl.appendChild(tabBtn);
  }
}

/**
 * Renders Email Cards based on current active tab and search query
 */
function renderEmailList() {
  emailListEl.innerHTML = '';

  // If viewing a specific account tab that is unauthorized, show helpful session activation card
  if (currentTab !== 'all') {
    const targetIdx = Number(currentTab);
    const feed = cachedFeedData[targetIdx];
    const accConfig = (appSettings.accounts || []).find(a => a.index === targetIdx);
    const emailOrName = accConfig?.email || accConfig?.name || `Account u/${targetIdx}`;
    const loginTarget = accConfig?.email || targetIdx;
    const loginUrl = `https://mail.google.com/mail/u/${encodeURIComponent(loginTarget)}/#inbox`;

    if (feed && feed.unauthorized) {
      const authCard = document.createElement('div');
      authCard.className = 'empty-state auth-needed-card';
      authCard.innerHTML = `
        <div style="font-size:38px; line-height:1; margin-bottom:4px;">🔑</div>
        <div class="empty-title">საჭიროა Gmail-ის სესიის გააქტიურება</div>
        <div class="empty-subtitle"><strong>${escapeHtml(emailOrName)}</strong>-ის სესია არ არის აქტიური Gmail-ში. გახსენით ბრაუზერში ერთხელ სესიის გასააქტიურებლად:</div>
        <button type="button" class="btn-primary" style="margin-top:12px; width:auto; padding:8px 16px; cursor:pointer;" id="btnActivateTabSession">
          Gmail-ში შესვლა / სესიის გახსნა
        </button>
      `;
      authCard.querySelector('#btnActivateTabSession').addEventListener('click', () => {
        chrome.tabs.create({ url: loginUrl });
      });
      emailListEl.appendChild(authCard);
      return;
    }
  }

  let filtered = allEmails;

  // Filter by Account Tab
  if (currentTab !== 'all') {
    const targetIdx = Number(currentTab);
    filtered = filtered.filter(e => e.accountIndex === targetIdx);
  }

  // Filter by Search Query
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(e => {
      const titleMatch = (e.title || '').toLowerCase().includes(q);
      const summaryMatch = (e.summary || '').toLowerCase().includes(q);
      const authorMatch = (e.authorName || '').toLowerCase().includes(q) || (e.authorEmail || '').toLowerCase().includes(q);
      const otpMatch = (e.otpCode || '').toLowerCase().includes(q);
      return titleMatch || summaryMatch || authorMatch || otpMatch;
    });
  }

  // Empty State
  if (filtered.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9"></path>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        <path d="m16 19 2 2 4-4"></path>
      </svg>
      <div class="empty-title">წაუკითხავი წერილები არ არის</div>
      <div class="empty-subtitle">${searchQuery ? 'ძიების შედეგი ცარიელია' : 'თქვენი შემოსული წერილების ყუთი სუფთაა!'}</div>
    `;
    emailListEl.appendChild(emptyState);
    return;
  }

  // Render Cards
  const vipKeywords = (appSettings.vipKeywords || '')
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(Boolean);

  for (const entry of filtered) {
    const isVip = isVipEmail(entry, vipKeywords);
    const card = createEmailCard(entry, isVip);
    emailListEl.appendChild(card);
  }
}

/**
 * Checks if entry matches VIP keywords
 */
function isVipEmail(entry, keywords) {
  if (!keywords || keywords.length === 0) return false;
  const content = `${entry.title || ''} ${entry.summary || ''} ${entry.authorName || ''} ${entry.authorEmail || ''}`.toLowerCase();
  return keywords.some(k => content.includes(k));
}

/**
 * Builds Bento Card DOM element for an email
 */
function createEmailCard(entry, isVip) {
  const card = document.createElement('div');
  card.className = 'email-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');

  // Open email link on click
  card.addEventListener('click', () => {
    chrome.tabs.create({ url: entry.link });
    handleMarkAsRead(entry, card, false);
  });

  // Top Meta
  const topMeta = document.createElement('div');
  topMeta.className = 'card-top';

  const tagsGroup = document.createElement('div');
  tagsGroup.className = 'tags-group';

  const accountTag = document.createElement('span');
  accountTag.className = 'account-tag';
  accountTag.textContent = `u/${entry.accountIndex} ${entry.accountName}`;
  tagsGroup.appendChild(accountTag);

  if (isVip) {
    const vipTag = document.createElement('span');
    vipTag.className = 'vip-tag';
    vipTag.innerHTML = `<span>★</span><span>VIP</span>`;
    tagsGroup.appendChild(vipTag);
  }

  const metaRightGroup = document.createElement('div');
  metaRightGroup.className = 'meta-right-group';

  const timeEl = document.createElement('span');
  timeEl.className = 'card-time';
  timeEl.textContent = formatRelativeTime(entry.issued);
  metaRightGroup.appendChild(timeEl);

  // Quick checkmark read button in top right of card
  const btnQuickRead = document.createElement('button');
  btnQuickRead.type = 'button';
  btnQuickRead.className = 'btn-quick-read';
  btnQuickRead.title = 'წაკითხულად მონიშვნა (Mark as read)';
  btnQuickRead.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  btnQuickRead.addEventListener('click', (e) => {
    e.stopPropagation();
    handleMarkAsRead(entry, card, true);
  });
  metaRightGroup.appendChild(btnQuickRead);

  // Quick delete button in top right of card
  const btnQuickDelete = document.createElement('button');
  btnQuickDelete.type = 'button';
  btnQuickDelete.className = 'btn-quick-delete';
  btnQuickDelete.title = 'წაშლა (Move to Trash)';
  btnQuickDelete.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;
  btnQuickDelete.addEventListener('click', (e) => {
    e.stopPropagation();
    handleDeleteEmail(entry, card, true);
  });
  metaRightGroup.appendChild(btnQuickDelete);

  topMeta.appendChild(tagsGroup);
  topMeta.appendChild(metaRightGroup);
  card.appendChild(topMeta);

  // Sender Row
  const senderRow = document.createElement('div');
  senderRow.className = 'card-sender';

  const avatar = document.createElement('div');
  avatar.className = 'sender-avatar';
  const initial = (entry.authorName || entry.authorEmail || 'G').charAt(0).toUpperCase();
  avatar.textContent = initial;

  const senderInfo = document.createElement('div');
  senderInfo.className = 'sender-info';

  const senderName = document.createElement('span');
  senderName.className = 'sender-name';
  senderName.textContent = entry.authorName || 'უცნობი გამომგზავნი';

  const senderEmail = document.createElement('span');
  senderEmail.className = 'sender-email';
  senderEmail.textContent = entry.authorEmail || '';

  senderInfo.appendChild(senderName);
  senderInfo.appendChild(senderEmail);

  senderRow.appendChild(avatar);
  senderRow.appendChild(senderInfo);
  card.appendChild(senderRow);

  // Subject
  const titleEl = document.createElement('div');
  titleEl.className = 'card-title';
  titleEl.textContent = entry.title || '(უსათაურო)';
  card.appendChild(titleEl);

  // Snippet
  if (entry.summary) {
    const snippetEl = document.createElement('div');
    snippetEl.className = 'card-snippet';
    snippetEl.textContent = entry.summary;
    card.appendChild(snippetEl);
  }

  // Card Action Row (Smart OTP + AI Summary + Mark Read + Delete)
  const actionRow = document.createElement('div');
  actionRow.className = 'card-actions';

  // Smart OTP Copy Button
  if (entry.otpCode) {
    const otpBtn = document.createElement('button');
    otpBtn.type = 'button';
    otpBtn.className = 'btn-otp-copy';
    otpBtn.innerHTML = `<span>📋 კოდი: <strong>${escapeHtml(entry.otpCode)}</strong></span>`;
    otpBtn.title = 'დააჭირეთ კოდის დასაკოპირებლად';

    otpBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Don't trigger card navigation
      try {
        await navigator.clipboard.writeText(entry.otpCode);
        otpBtn.classList.add('copied');
        otpBtn.innerHTML = `<span>✅ დაკოპირდა: <strong>${escapeHtml(entry.otpCode)}</strong></span>`;
        showToast(`კოდი ${entry.otpCode} დაკოპირდა!`);
        setTimeout(() => {
          otpBtn.classList.remove('copied');
          otpBtn.innerHTML = `<span>📋 კოდი: <strong>${escapeHtml(entry.otpCode)}</strong></span>`;
        }, 2200);
      } catch (err) {
        showToast('კოპირება ვერ მოხერხდა');
      }
    });

    actionRow.appendChild(otpBtn);
  }

  // Local AI Summary Button
  const aiBtn = document.createElement('button');
  aiBtn.type = 'button';
  aiBtn.className = 'btn-ai-summary';
  aiBtn.innerHTML = `<span>✨ AI Summary</span>`;
  aiBtn.title = 'შეაჯამე წერილი 1 წინადადებით';

  aiBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await generateEmailSummary(entry, card, aiBtn);
  });
  actionRow.appendChild(aiBtn);

  // Mark as Read Button in Actions
  const markReadBtn = document.createElement('button');
  markReadBtn.type = 'button';
  markReadBtn.className = 'btn-mark-read';
  markReadBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>წაკითხულია</span>
  `;
  markReadBtn.title = 'მონიშნე წაკითხულად (Mark as read)';
  markReadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleMarkAsRead(entry, card, true);
  });
  actionRow.appendChild(markReadBtn);

  // Delete / Trash Button in Actions
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn-delete-email';
  deleteBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
    <span>წაშლა</span>
  `;
  deleteBtn.title = 'წაშლა / სანაგვეში გადატანა (Trash)';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleDeleteEmail(entry, card, true);
  });
  actionRow.appendChild(deleteBtn);

  card.appendChild(actionRow);

  return card;
}

/**
 * Marks an individual email as read both locally and in background
 */
async function handleMarkAsRead(entry, cardEl, showNotification = true) {
  cardEl.classList.add('fade-out-read');

  let serverSynced = false;
  let needsPreauth = false;

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'MARK_EMAIL_READ',
      id: entry.id,
      messageId: entry.messageId,
      link: entry.link,
      accountIndex: entry.accountIndex
    });
    if (res) {
      serverSynced = !!res.serverSynced;
      needsPreauth = !!res.needsPreauth;
    }
  } catch (err) {
    console.warn('Mark read message warning:', err);
  }

  if (serverSynced) {
    if (!appSettings.locallyReadIds) {
      appSettings.locallyReadIds = [];
    }
    if (!appSettings.locallyReadIds.includes(entry.id)) {
      appSettings.locallyReadIds.push(entry.id);
    }
    if (entry.messageId && !appSettings.locallyReadIds.includes(entry.messageId)) {
      appSettings.locallyReadIds.push(entry.messageId);
    }

    setTimeout(() => {
      cardEl.remove();
      processCachedEmails();
      renderAccountTabs();

      const remainingCards = emailListEl.querySelectorAll('.email-card');
      if (remainingCards.length === 0) {
        renderEmailList();
      }
    }, 220);

    if (showNotification) {
      showToast('✓ წერილი მონიშნულია წაკითხულად');
    }
  } else {
    cardEl.classList.remove('fade-out-read');
    if (showNotification) {
      if (needsPreauth) {
        showToast('⚠️ Gmail-ის სესია დასადასტურებელია გახსნილ ტაბში');
      } else {
        showToast('⚠️ Gmail სესია გასაახლებელია (სცადეთ თავიდან)');
      }
    }
  }
}

/**
 * Deletes an individual email (moves to Trash) in real Gmail and hides locally
 */
async function handleDeleteEmail(entry, cardEl, showNotification = true) {
  cardEl.classList.add('fade-out-read');

  let serverSynced = false;
  let needsPreauth = false;

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'DELETE_EMAIL',
      id: entry.id,
      messageId: entry.messageId,
      link: entry.link,
      accountIndex: entry.accountIndex
    });
    if (res) {
      serverSynced = !!res.serverSynced;
      needsPreauth = !!res.needsPreauth;
    }
  } catch (err) {
    console.warn('Delete email message warning:', err);
  }

  if (serverSynced) {
    if (!appSettings.locallyReadIds) {
      appSettings.locallyReadIds = [];
    }
    if (!appSettings.locallyReadIds.includes(entry.id)) {
      appSettings.locallyReadIds.push(entry.id);
    }
    if (entry.messageId && !appSettings.locallyReadIds.includes(entry.messageId)) {
      appSettings.locallyReadIds.push(entry.messageId);
    }

    setTimeout(() => {
      cardEl.remove();
      processCachedEmails();
      renderAccountTabs();

      const remainingCards = emailListEl.querySelectorAll('.email-card');
      if (remainingCards.length === 0) {
        renderEmailList();
      }
    }, 220);

    if (showNotification) {
      showToast('🗑️ წერილი გადატანილია სანაგვეში');
    }
  } else {
    cardEl.classList.remove('fade-out-read');
    if (showNotification) {
      if (needsPreauth) {
        showToast('⚠️ Gmail-ის სესია დასადასტურებელია გახსნილ ტაბში');
      } else {
        showToast('⚠️ Gmail-იდან წაშლა ვერ მოხერხდა (სცადეთ თავიდან)');
      }
    }
  }
}

/**
 * Deletes an individual email (moves to Trash) in real Gmail and hides locally
 */
async function handleDeleteEmail(entry, cardEl, showNotification = true) {
  cardEl.classList.add('fade-out-read');

  if (!appSettings.locallyReadIds) {
    appSettings.locallyReadIds = [];
  }
  if (!appSettings.locallyReadIds.includes(entry.id)) {
    appSettings.locallyReadIds.push(entry.id);
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'DELETE_EMAIL',
      id: entry.id,
      messageId: entry.messageId,
      link: entry.link,
      accountIndex: entry.accountIndex
    });
  } catch (err) {
    console.warn('Delete email message warning:', err);
  }

  setTimeout(() => {
    cardEl.remove();
    processCachedEmails();
    renderAccountTabs();

    const remainingCards = emailListEl.querySelectorAll('.email-card');
    if (remainingCards.length === 0) {
      renderEmailList();
    }
  }, 220);

  if (showNotification) {
    showToast('🗑️ წერილი გადატანილია სანაგვეში');
  }
}

/**
 * Bulk Mark All as Read button handler
 */
function initMarkAllReadButton() {
  const btn = document.getElementById('btnMarkAllRead');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    let emailsToMark = [];
    if (currentTab === 'all') {
      emailsToMark = allEmails;
    } else {
      const targetIdx = Number(currentTab);
      emailsToMark = allEmails.filter(e => e.accountIndex === targetIdx);
    }

    if (emailsToMark.length === 0) {
      showToast('წასაკითხი წერილები არ არის');
      return;
    }

    const ids = emailsToMark.map(e => e.id);
    const count = ids.length;
    const items = emailsToMark.map(e => ({
      id: e.id,
      messageId: e.messageId,
      link: e.link,
      accountIndex: e.accountIndex
    }));

    // Visual animation for all cards
    const cards = emailListEl.querySelectorAll('.email-card');
    cards.forEach(c => c.classList.add('fade-out-read'));

    let serverSynced = false;
    let needsPreauth = false;

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'MARK_ALL_READ',
        ids: ids,
        items: items
      });
      if (res) {
        serverSynced = !!res.serverSynced;
        needsPreauth = !!res.needsPreauth;
      }
    } catch (err) {
      console.warn('Mark all read notice:', err);
    }

    if (serverSynced) {
      if (!appSettings.locallyReadIds) {
        appSettings.locallyReadIds = [];
      }
      ids.forEach(id => {
        if (!appSettings.locallyReadIds.includes(id)) {
          appSettings.locallyReadIds.push(id);
        }
      });
      items.forEach(it => {
        if (it.messageId && !appSettings.locallyReadIds.includes(it.messageId)) {
          appSettings.locallyReadIds.push(it.messageId);
        }
      });

      setTimeout(() => {
        processCachedEmails();
        renderAccountTabs();
        renderEmailList();
      }, 220);

      showToast(`✓ ყველა წერილი (${count}) მონიშნულია წაკითხულად`);
    } else {
      cards.forEach(c => c.classList.remove('fade-out-read'));
      if (needsPreauth) {
        showToast('⚠️ Gmail-ის სესია დასადასტურებელია გახსნილ ტაბში');
      } else {
        showToast('⚠️ Gmail სესია გასაახლებელია (სცადეთ თავიდან)');
      }
    }
  });
}

/**
 * Bulk Delete All emails button handler (moves all displayed emails to Trash in real Gmail)
 */
function initDeleteAllButton() {
  const btn = document.getElementById('btnDeleteAll');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    let emailsToDelete = [];
    if (currentTab === 'all') {
      emailsToDelete = allEmails;
    } else {
      const targetIdx = Number(currentTab);
      emailsToDelete = allEmails.filter(e => e.accountIndex === targetIdx);
    }

    if (emailsToDelete.length === 0) {
      showToast('წასაშლელი წერილები არ არის');
      return;
    }

    const count = emailsToDelete.length;
    const ids = emailsToDelete.map(e => e.id);
    const items = emailsToDelete.map(e => ({
      id: e.id,
      messageId: e.messageId,
      link: e.link,
      accountIndex: e.accountIndex
    }));

    // Visual animation for all cards
    const cards = emailListEl.querySelectorAll('.email-card');
    cards.forEach(c => c.classList.add('fade-out-read'));

    let serverSynced = false;
    let needsPreauth = false;

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'DELETE_ALL_EMAILS',
        ids: ids,
        items: items
      });
      if (res) {
        serverSynced = !!res.serverSynced;
        needsPreauth = !!res.needsPreauth;
      }
    } catch (err) {
      console.warn('Delete all emails notice:', err);
    }

    if (serverSynced) {
      if (!appSettings.locallyReadIds) {
        appSettings.locallyReadIds = [];
      }
      ids.forEach(id => {
        if (!appSettings.locallyReadIds.includes(id)) {
          appSettings.locallyReadIds.push(id);
        }
      });
      items.forEach(it => {
        if (it.messageId && !appSettings.locallyReadIds.includes(it.messageId)) {
          appSettings.locallyReadIds.push(it.messageId);
        }
      });

      setTimeout(() => {
        processCachedEmails();
        renderAccountTabs();
        renderEmailList();
      }, 220);

      showToast(`🗑️ ყველა წერილი (${count}) გადატანილია სანაგვეში`);
    } else {
      cards.forEach(c => c.classList.remove('fade-out-read'));
      if (needsPreauth) {
        showToast('⚠️ Gmail-ის სესია დასადასტურებელია გახსნილ ტაბში');
      } else {
        showToast('⚠️ Gmail-იდან წაშლა ვერ მოხერხდა (სცადეთ თავიდან)');
      }
    }
  });
}

/**
 * Bulk Delete All emails button handler (moves all displayed emails to Trash in real Gmail)
 */
function initDeleteAllButton() {
  const btn = document.getElementById('btnDeleteAll');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    let emailsToDelete = [];
    if (currentTab === 'all') {
      emailsToDelete = allEmails;
    } else {
      const targetIdx = Number(currentTab);
      emailsToDelete = allEmails.filter(e => e.accountIndex === targetIdx);
    }

    if (emailsToDelete.length === 0) {
      showToast('წასაშლელი წერილები არ არის');
      return;
    }

    const count = emailsToDelete.length;
    const ids = emailsToDelete.map(e => e.id);
    const items = emailsToDelete.map(e => ({
      id: e.id,
      messageId: e.messageId,
      link: e.link,
      accountIndex: e.accountIndex
    }));

    // Visual animation for all cards
    const cards = emailListEl.querySelectorAll('.email-card');
    cards.forEach(c => c.classList.add('fade-out-read'));

    if (!appSettings.locallyReadIds) {
      appSettings.locallyReadIds = [];
    }
    ids.forEach(id => {
      if (!appSettings.locallyReadIds.includes(id)) {
        appSettings.locallyReadIds.push(id);
      }
    });

    try {
      await chrome.runtime.sendMessage({
        action: 'DELETE_ALL_EMAILS',
        ids: ids,
        items: items
      });
    } catch (err) {
      console.warn('Delete all emails notice:', err);
    }

    setTimeout(() => {
      processCachedEmails();
      renderAccountTabs();
      renderEmailList();
    }, 220);

    showToast(`🗑️ ყველა წერილი (${count}) გადატანილია სანაგვეში`);
  });
}

/**
 * AI Summary Generation: Prompt API (Gemini Nano) -> Localhost LLM Fallback
 */
async function generateEmailSummary(entry, cardEl, aiBtn) {
  // If already summarized in this card, don't re-run
  if (cardEl.querySelector('.ai-summary-box')) {
    return;
  }

  aiBtn.classList.add('loading');
  aiBtn.textContent = '✨ მუშავდება...';

  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'ai-summary-box';
  summaryContainer.innerHTML = `
    <div class="ai-summary-header">✨ AI შეჯამება</div>
    <div class="ai-summary-text">გენერირდება...</div>
  `;
  cardEl.appendChild(summaryContainer);
  const textEl = summaryContainer.querySelector('.ai-summary-text');

  const emailText = `Subject: ${entry.title || ''}\nSender: ${entry.authorName || ''} <${entry.authorEmail || ''}>\nBody: ${entry.summary || ''}`;
  const systemPrompt = 'You are a concise email assistant. Summarize the key point of this email in 1 clear, helpful sentence. If in Georgian, reply in Georgian; otherwise in English.';

  try {
    // 1. Try Chrome Built-in Prompt API (LanguageModel or window.ai)
    if (typeof globalThis.LanguageModel !== 'undefined') {
      const availability = await globalThis.LanguageModel.availability();
      if (availability !== 'unavailable') {
        const session = await globalThis.LanguageModel.create({
          initialPrompts: [{ role: 'system', content: systemPrompt }]
        });
        const result = await session.prompt(emailText);
        session.destroy();
        textEl.textContent = result.trim();
        aiBtn.remove();
        return;
      }
    } else if (window.ai?.languageModel) {
      const session = await window.ai.languageModel.create({
        systemPrompt: systemPrompt
      });
      const result = await session.prompt(emailText);
      session.destroy?.();
      textEl.textContent = result.trim();
      aiBtn.remove();
      return;
    }

    // 2. Fallback to Localhost Endpoint (LM Studio / Ollama / LocalAI)
    const endpoint = appSettings.aiEndpoint || 'http://localhost:1234/v1/chat/completions';
    const model = appSettings.aiModel || 'local-model';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: emailText }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      throw new Error(`Localhost HTTP ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (summary) {
      textEl.textContent = summary;
      aiBtn.remove();
    } else {
      throw new Error('ცარიელი პასუხი');
    }
  } catch (err) {
    textEl.textContent = `AI შეჯამება ვერ მოხერხდა (${err.message}). დარწმუნდით, რომ Localhost AI გაშვებულია (${appSettings.aiEndpoint}) ან ბრაუზერს აქვს Prompt API მხარდაჭერა.`;
    aiBtn.classList.remove('loading');
    aiBtn.textContent = '✨ ხელახლა';
  }
}

/**
 * Settings Modal Logic
 */
function initSettingsModal() {
  btnSettingsEl.addEventListener('click', () => {
    populateSettingsForm();
    settingsDialogEl.showModal();
  });

  btnCloseSettingsEl.addEventListener('click', () => {
    settingsDialogEl.close();
  });

  // Fallback for backdrop click in browsers without native closedby support
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    settingsDialogEl.addEventListener('click', (event) => {
      if (event.target !== settingsDialogEl) return;
      const rect = settingsDialogEl.getBoundingClientRect();
      const inDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!inDialog) settingsDialogEl.close();
    });
  }

  // Save Settings
  settingsFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    const accounts = [];
    const rows = accountsSettingsListEl.querySelectorAll('.account-setting-row');
    const existingAccounts = appSettings.accounts || [];
    rows.forEach(row => {
      const idx = Number(row.dataset.index);
      const enabledCheckbox = row.querySelector('.account-enabled-checkbox');
      const nameInput = row.querySelector('.account-setting-input');
      const existing = existingAccounts.find(a => a.index === idx) || {};

      const inputVal = nameInput.value.trim();
      const isEmail = inputVal.includes('@');

      accounts.push({
        ...existing,
        index: idx,
        email: isEmail ? inputVal : (existing.email || ''),
        name: isEmail ? inputVal.split('@')[0] : (inputVal || existing.name || `Account ${idx + 1}`),
        enabled: enabledCheckbox.checked,
        manuallyDisabled: !enabledCheckbox.checked
      });
    });

    const newSettings = {
      ...appSettings,
      accounts,
      pollInterval: Number(pollIntervalInputEl.value) || 1,
      focusMode: focusModeToggleEl.checked,
      vipOnly: vipOnlyToggleEl.checked,
      vipKeywords: vipKeywordsInputEl.value.trim(),
      aiEndpoint: aiEndpointInputEl.value.trim() || 'http://localhost:1234/v1/chat/completions',
      aiModel: aiModelInputEl.value.trim() || 'local-model'
    };

    appSettings = newSettings;
    await chrome.storage.local.set(newSettings);
    await chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' });

    settingsDialogEl.close();
    showToast('პარამეტრები შენახულია');

    updateSoundButtonUI();
    processCachedEmails();
    renderAccountTabs();
    renderEmailList();

    // Trigger immediate background sync
    triggerRefresh();
  });

  // Add Account Row Button inside Settings
  if (btnAddAccountRowEl) {
    btnAddAccountRowEl.addEventListener('click', () => {
      const rows = accountsSettingsListEl.querySelectorAll('.account-setting-row');
      let maxIdx = -1;
      rows.forEach(r => {
        const i = Number(r.dataset.index);
        if (i > maxIdx) maxIdx = i;
      });
      const nextIdx = maxIdx + 1;
      const row = createAccountSettingRow({
        index: nextIdx,
        name: `Account ${nextIdx + 1}`,
        email: '',
        enabled: true
      });
      accountsSettingsListEl.appendChild(row);
      const input = row.querySelector('.account-setting-input');
      input.focus();
    });
  }

  // Test Sound Button inside Settings
  btnTestSoundEl.addEventListener('click', async () => {
    btnTestSoundEl.disabled = true;
    try {
      await chrome.runtime.sendMessage({ action: 'TEST_SOUND' });
      showToast('🔊 Chime ხმა გაშვებულია');
    } catch (err) {
      showToast('ხმის გაშვება ვერ მოხერხდა: ' + err.message);
    } finally {
      setTimeout(() => { btnTestSoundEl.disabled = false; }, 800);
    }
  });
}

function createAccountSettingRow(acc) {
  const idx = acc.index;
  const feed = cachedFeedData[idx];
  const isEnabled = acc.enabled !== false;
  const emailDisplay = acc.email || feed?.accountEmail || '';
  const isUnauth = feed ? feed.unauthorized : false;
  const targetLogin = emailDisplay || idx;
  const loginUrl = `https://mail.google.com/mail/u/${encodeURIComponent(targetLogin)}/#inbox`;

  const statusBadge = isUnauth
    ? `<a href="${loginUrl}" target="_blank" class="badge-status-auth" title="დააჭირეთ Gmail-ში გასახსნელად">🔑 შესვლა</a>`
    : (feed && !feed.unauthorized ? `<span class="badge-status-ok" title="სინქრონიზებულია">✓ აქტიური</span>` : '');

  const row = document.createElement('div');
  row.className = 'account-setting-row';
  row.dataset.index = String(idx);
  row.innerHTML = `
    <label class="switch" title="ჩართვა/გამორთვა">
      <input type="checkbox" class="account-enabled-checkbox" ${isEnabled ? 'checked' : ''}>
      <span class="slider"></span>
    </label>
    <div style="display:flex; flex-direction:column; min-width:54px;">
      <span class="account-setting-title">u/${idx}</span>
      ${statusBadge}
    </div>
    <input type="text" class="account-setting-input" value="${escapeHtml(acc.email || acc.name || '')}" placeholder="ელფოსტა ან სახელი (მაგ: user@gmail.com)" title="შეიყვანეთ ელფოსტა ან სახელი">
  `;

  // Auto-enable checkbox if user types into input
  const inputEl = row.querySelector('.account-setting-input');
  const chkEl = row.querySelector('.account-enabled-checkbox');
  inputEl.addEventListener('input', () => {
    if (inputEl.value.trim().length > 0) {
      chkEl.checked = true;
    }
  });

  return row;
}

function populateSettingsForm() {
  if (!appSettings) return;

  accountsSettingsListEl.innerHTML = '';
  const currentAccounts = appSettings.accounts || [];

  // Filter out duplicate redirect slots (where non-zero slot has same email as slot 0)
  const slot0Feed = cachedFeedData[0];
  const slot0Email = slot0Feed && !slot0Feed.unauthorized ? slot0Feed.accountEmail : null;

  // Build clean list of accounts:
  // 1. Any account in currentAccounts
  // 2. Default slots 0..3 (min 4 accounts for multi-account)
  const indicesSet = new Set([0, 1, 2, 3]);
  currentAccounts.forEach(a => indicesSet.add(a.index));

  // Only add feeds from cachedFeedData if they are not phantom duplicates
  Object.keys(cachedFeedData).forEach(k => {
    const idx = Number(k);
    const feed = cachedFeedData[idx];
    if (feed && !feed.unauthorized && feed.accountEmail && (feed.accountEmail !== slot0Email || idx === 0)) {
      indicesSet.add(idx);
    }
  });

  const sortedIndices = Array.from(indicesSet).sort((a, b) => a - b);

  for (const idx of sortedIndices) {
    const feed = cachedFeedData[idx];
    const existing = currentAccounts.find(a => a.index === idx) || {
      index: idx,
      name: feed?.accountEmail ? feed.accountEmail.split('@')[0] : `Account ${idx + 1}`,
      email: feed?.accountEmail || '',
      enabled: true
    };

    const row = createAccountSettingRow(existing);
    accountsSettingsListEl.appendChild(row);
  }

  pollIntervalInputEl.value = String(appSettings.pollInterval || 1);
  focusModeToggleEl.checked = Boolean(appSettings.focusMode);
  vipOnlyToggleEl.checked = Boolean(appSettings.vipOnly);
  vipKeywordsInputEl.value = appSettings.vipKeywords || '';
  aiEndpointInputEl.value = appSettings.aiEndpoint || 'http://localhost:1234/v1/chat/completions';
  aiModelInputEl.value = appSettings.aiModel || 'local-model';
}

/**
 * Compose Button: opens compose window in active account
 */
function initComposeButton() {
  btnComposeEl.addEventListener('click', () => {
    let accountIdx = 0;
    if (currentTab !== 'all') {
      accountIdx = Number(currentTab) || 0;
    }
    const composeUrl = `https://mail.google.com/mail/u/${accountIdx}/#inbox?compose=new`;
    chrome.tabs.create({ url: composeUrl });
  });
}

/**
 * Sound Mute / Unmute Quick Toggle in Header
 */
function initSoundQuickToggle() {
  btnSoundToggleEl.addEventListener('click', async () => {
    if (!appSettings) return;
    const nextSoundState = !appSettings.soundEnabled;
    appSettings.soundEnabled = nextSoundState;
    await chrome.storage.local.set({ soundEnabled: nextSoundState });
    updateSoundButtonUI();
    showToast(nextSoundState ? '🔔 ხმა ჩაირთო' : '🔕 ხმა გაითიშა');
  });
}

/**
 * Filter / Search Input Handlers
 */
function initFilter() {
  filterInputEl.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery) {
      btnClearFilterEl.classList.remove('hidden');
    } else {
      btnClearFilterEl.classList.add('hidden');
    }
    renderEmailList();
  });

  btnClearFilterEl.addEventListener('click', () => {
    filterInputEl.value = '';
    searchQuery = '';
    btnClearFilterEl.classList.add('hidden');
    renderEmailList();
  });
}

/**
 * Manual Refresh Trigger
 */
function initRefresh() {
  btnRefreshEl.addEventListener('click', triggerRefresh);
}

async function triggerRefresh() {
  btnRefreshEl.classList.add('spinning');
  statusDotEl.classList.add('fetching');
  statusDotEl.title = 'მოწმდება...';

  try {
    const res = await chrome.runtime.sendMessage({ action: 'REFRESH_NOW' });
    if (res && res.success) {
      await loadState();
      showToast('განახლებულია!');
    }
  } catch (err) {
    showToast('განახლების შეცდომა');
  } finally {
    btnRefreshEl.classList.remove('spinning');
    statusDotEl.classList.remove('fetching');
    statusDotEl.title = 'სინქრონიზებულია';
  }
}

/**
 * Utility: HTML Escape
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Listen for storage updates while popup is open
 */
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.cachedFeeds || changes.lastGlobalCheck || changes.accounts) {
      loadState();
    }
  }
});

// App Entry Point
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initViewMode();
  initComposeButton();
  initSoundQuickToggle();
  initFilter();
  initMarkAllReadButton();
  initDeleteAllButton();
  initRefresh();
  initSettingsModal();

  await loadState();
});
