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
function initTheme() {
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]') || document.createElement('meta');
  metaColorScheme.name = 'color-scheme';
  if (!metaColorScheme.parentElement) document.head.appendChild(metaColorScheme);

  const savedTheme = localStorage.getItem('color-scheme') || 'light dark';
  metaColorScheme.content = savedTheme;
  updateThemeIcons(savedTheme);

  btnThemeToggleEl.addEventListener('click', () => {
    const current = metaColorScheme.content;
    let next = 'light';
    if (current === 'light') {
      next = 'dark';
    } else if (current === 'dark') {
      next = 'light dark';
    } else {
      next = 'dark';
    }
    metaColorScheme.content = next;
    localStorage.setItem('color-scheme', next);
    updateThemeIcons(next);
  });
}

function updateThemeIcons(theme) {
  if (theme === 'dark') {
    iconSunEl.classList.remove('hidden');
    iconMoonEl.classList.add('hidden');
  } else if (theme === 'light') {
    iconSunEl.classList.add('hidden');
    iconMoonEl.classList.remove('hidden');
  } else {
    // system
    iconSunEl.classList.remove('hidden');
    iconMoonEl.classList.add('hidden');
  }
}

/**
 * Dual View Setup (Popup vs Side Panel)
 */
function initViewMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSidePanel = urlParams.get('view') === 'sidepanel' || window.innerWidth > 420;

  if (isSidePanel) {
    bodyEl.dataset.view = 'sidepanel';
    btnSidePanelEl.title = 'Side Panel რეჟიმი აქტიურია';
    btnSidePanelEl.style.opacity = '0.5';
    btnSidePanelEl.disabled = true;
  } else {
    btnSidePanelEl.addEventListener('click', async () => {
      try {
        await chrome.runtime.sendMessage({ action: 'OPEN_SIDE_PANEL' });
        window.close();
      } catch (err) {
        console.warn('Could not open side panel:', err);
      }
    });
  }
}

/**
 * Loads extension settings & cached feed state from storage
 */
async function loadState() {
  const data = await chrome.storage.local.get({
    accounts: [
      { index: 0, name: 'Personal', enabled: true },
      { index: 1, name: 'Work', enabled: false },
      { index: 2, name: 'Secondary', enabled: false }
    ],
    pollInterval: 1,
    soundEnabled: true,
    focusMode: false,
    vipOnly: false,
    vipKeywords: 'urgent, invoice, სასწრაფო, კოდი, verification, გადახდა, security, auth',
    aiEndpoint: 'http://localhost:1234/v1/chat/completions',
    aiModel: 'local-model',
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
  const enabledAccounts = appSettings.accounts.filter(a => a.enabled);
  let hasUnauthorizedAccount = false;
  let unauthorizedMsg = [];

  for (const acc of enabledAccounts) {
    const feed = cachedFeedData[acc.index];
    if (!feed) continue;

    if (feed.unauthorized) {
      hasUnauthorizedAccount = true;
      unauthorizedMsg.push(`u/${acc.index} (${acc.name})`);
    } else if (Array.isArray(feed.entries)) {
      for (const entry of feed.entries) {
        allEmails.push({
          ...entry,
          accountIndex: acc.index,
          accountName: acc.name
        });
      }
    }
  }

  // Sort unified emails by issued date descending
  allEmails.sort((a, b) => new Date(b.issued || 0) - new Date(a.issued || 0));

  // Handle Auth Banner
  if (hasUnauthorizedAccount) {
    authAccountMsgEl.textContent = `გაიარეთ ავტორიზაცია Gmail-ში: ${unauthorizedMsg.join(', ')}`;
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

  const enabledAccounts = appSettings.accounts.filter(a => a.enabled);

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
  for (const acc of enabledAccounts) {
    const feed = cachedFeedData[acc.index];
    const count = feed && !feed.unauthorized ? (feed.fullcount || 0) : 0;
    const isUnauth = feed && feed.unauthorized;

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `tab-pill ${currentTab === String(acc.index) ? 'active' : ''}`;
    tabBtn.innerHTML = `
      <span>u/${acc.index} ${escapeHtml(acc.name)}</span>
      <span class="tab-badge ${count > 0 ? 'has-unread' : ''}">${isUnauth ? '?' : count}</span>
    `;
    tabBtn.addEventListener('click', () => {
      currentTab = String(acc.index);
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

  const timeEl = document.createElement('span');
  timeEl.className = 'card-time';
  timeEl.textContent = formatRelativeTime(entry.issued);

  topMeta.appendChild(tagsGroup);
  topMeta.appendChild(timeEl);
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

  // Card Action Row (Smart OTP + AI Summary)
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
  card.appendChild(actionRow);

  return card;
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
    rows.forEach(row => {
      const idx = Number(row.dataset.index);
      const enabledCheckbox = row.querySelector('.account-enabled-checkbox');
      const nameInput = row.querySelector('.account-setting-input');
      accounts.push({
        index: idx,
        name: nameInput.value.trim() || `Account ${idx}`,
        enabled: enabledCheckbox.checked
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

function populateSettingsForm() {
  if (!appSettings) return;

  // Accounts List
  accountsSettingsListEl.innerHTML = '';
  const currentAccounts = appSettings.accounts || [];

  for (let i = 0; i < 3; i++) {
    const existing = currentAccounts.find(a => a.index === i) || {
      index: i,
      name: i === 0 ? 'Personal' : (i === 1 ? 'Work' : 'Secondary'),
      enabled: i === 0
    };

    const row = document.createElement('div');
    row.className = 'account-setting-row';
    row.dataset.index = String(i);
    row.innerHTML = `
      <label class="switch" title="ჩართვა/გამორთვა">
        <input type="checkbox" class="account-enabled-checkbox" ${existing.enabled ? 'checked' : ''}>
        <span class="slider"></span>
      </label>
      <span class="account-setting-title">u/${i}</span>
      <input type="text" class="account-setting-input" value="${escapeHtml(existing.name)}" placeholder="სახელი (მაგ: Work)">
    `;
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
  initRefresh();
  initSettingsModal();

  await loadState();
});
