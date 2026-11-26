/**
 * Local Gmail Command Center - Dual-Mode UI Controller (popup.js)
 * Works identically in Chrome Popup/Side Panel and Firefox Popup/Sidebar.
 */

import {
  checkGmailHostPermission,
  getExtensionApi,
  hasChromeSidePanel,
  hasFirefoxSidebar,
  requestGmailHostPermission
} from './shared/browser-api.js';
import {
  DEFAULT_AI_ENDPOINT,
  DEFAULT_AI_MODEL,
  DEFAULT_SETTINGS
} from './shared/config.js';
import {
  aggregateEmails,
  computeAccountDisplayCounts,
  createTwoStepConfirm,
  escapeHtml,
  filterVisibleEmails,
  formatRelativeTime,
  normalizeAccountRows,
  resolveActiveAccountIndex
} from './shared/ui-logic.js';
import { isVipEmail, parseVipKeywords } from './shared/vip.js';

const api = getExtensionApi();

// State
let appSettings = null;
let currentTab = 'all';
let cachedFeedData = {};
let allEmails = [];
let searchQuery = '';
let hasGmailPermission = true;

// DOM Elements
const statusDotEl = document.getElementById('statusDot');
const lastSyncTimeEl = document.getElementById('lastSyncTime');
const brandHeaderEl = document.getElementById('brandHeader');
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
const btnOpenInboxEl = document.getElementById('btnOpenInbox');
const btnComposeEl = document.getElementById('btnCompose');
const filterInputEl = document.getElementById('filterInput');
const btnClearFilterEl = document.getElementById('btnClearFilter');
const btnMarkAllReadEl = document.getElementById('btnMarkAllRead');
const btnDeleteAllEl = document.getElementById('btnDeleteAll');
const btnDeleteAllLabelEl = document.getElementById('btnDeleteAllLabel');
const emailListEl = document.getElementById('emailList');
const authBannerEl = document.getElementById('authBanner');
const authBannerTitleEl = document.getElementById('authBannerTitle');
const authAccountMsgEl = document.getElementById('authAccountMsg');
const btnLoginGmailEl = document.getElementById('btnLoginGmail');
const btnGrantPermissionEl = document.getElementById('btnGrantPermission');
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
const lmStudioStatusTextEl = document.getElementById('lmStudioStatusText');
const btnTestLmStudioEl = document.getElementById('btnTestLmStudio');

const deleteAllConfirm = createTwoStepConfirm(4000, () => {
  resetDeleteAllButtonUI();
});

function resetDeleteAllButtonUI() {
  if (btnDeleteAllEl) {
    btnDeleteAllEl.classList.remove('confirming');
  }
  if (btnDeleteAllLabelEl) {
    btnDeleteAllLabelEl.textContent = 'წაშლა';
  }
}

function clearDeleteAllConfirmation() {
  if (deleteAllConfirm.isArmed()) {
    deleteAllConfirm.reset();
    resetDeleteAllButtonUI();
  }
}

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
 * Theme & Color-Scheme Management (synced across Popup & Side Panel via storage.local)
 */
function applyTheme(theme) {
  const effectiveTheme =
    theme === 'dark' || theme === 'light'
      ? theme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

  document.documentElement.setAttribute('data-theme', effectiveTheme);
  document.documentElement.style.colorScheme = effectiveTheme;
  localStorage.setItem('local-gmail-theme', effectiveTheme);
  updateThemeIcons(effectiveTheme);
}

function initTheme() {
  const bootTheme =
    localStorage.getItem('local-gmail-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(bootTheme);

  btnThemeToggleEl.addEventListener('click', async () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    if (appSettings) appSettings.theme = nextTheme;
    await api.storage.local.set({ theme: nextTheme });
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
 * Dual View Setup (Popup vs Side Panel / Firefox Sidebar)
 * Determined strictly from view path/dataset/query param — never window.innerWidth.
 */
function initViewMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const isSidePanel =
    document.body.dataset.view === 'sidepanel' ||
    window.location.pathname.includes('sidepanel') ||
    urlParams.get('view') === 'sidepanel';

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

  btnSidePanelEl.addEventListener('click', async () => {
    try {
      btnSidePanelEl.disabled = true;

      // Firefox requires sidebarAction.open() synchronously inside the user-input event handler
      if (hasFirefoxSidebar(api)) {
        const openPromise = api.sidebarAction.open();
        showToast('📌 Sidebar იხსნება...');
        await openPromise;
        setTimeout(() => window.close(), 150);
        return;
      }

      const win = await api.windows.getLastFocused();
      const winId = win?.id;

      let opened = false;
      if (hasChromeSidePanel(api) && winId) {
        try {
          await api.sidePanel.open({ windowId: winId });
          opened = true;
        } catch (err) {
          console.warn('Direct popup sidePanel.open failed, trying background:', err);
        }
      }

      if (!opened) {
        const res = await api.runtime.sendMessage({
          action: 'OPEN_SIDE_PANEL',
          windowId: winId
        });
        if (!res?.success) {
          throw new Error(res?.error || 'Could not open side panel');
        }
      }

      showToast('📌 Side Panel იხსნება...');
      setTimeout(() => window.close(), 200);
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
  hasGmailPermission = await checkGmailHostPermission(api);
  const data = await api.storage.local.get(DEFAULT_SETTINGS);

  appSettings = { ...DEFAULT_SETTINGS, ...data };
  cachedFeedData = appSettings.cachedFeeds || {};

  if (appSettings.theme === 'dark' || appSettings.theme === 'light') {
    applyTheme(appSettings.theme);
  }

  updateSoundButtonUI();
  updateLastSyncTimeUI(appSettings.lastGlobalCheck);
  processCachedEmails();
  renderAccountTabs();
  renderEmailList();
}

function updateSoundButtonUI() {
  if (!appSettings) return;
  if (appSettings.soundEnabled && !appSettings.focusMode) {
    iconSoundOnEl.classList.remove('hidden');
    iconSoundOffEl.classList.add('hidden');
    btnSoundToggleEl.title = 'ხმა: ჩართულია (დააჭირეთ გასაჩუმებლად)';
  } else {
    iconSoundOnEl.classList.add('hidden');
    iconSoundOffEl.classList.remove('hidden');
    btnSoundToggleEl.title = appSettings.focusMode
      ? 'Focus Mode (DND) ჩართულია'
      : 'ხმა: გამორთულია';
  }
}

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
 * Aggregates emails across enabled accounts and updates auth/permission banner
 */
function processCachedEmails() {
  const { allEmails: aggregated, anyAuthorizedAccount, feedIndices } = aggregateEmails(
    cachedFeedData,
    appSettings.accounts || [],
    appSettings.locallyReadIds || []
  );
  allEmails = aggregated;

  if (!hasGmailPermission) {
    authBannerTitleEl.textContent = 'საჭიროა Gmail-ის წვდომის ნებართვა:';
    authAccountMsgEl.textContent = 'დააჭირეთ „ნებართვა“-ს, რომ Firefox-მა წაიკითხოს Gmail feed.';
    btnLoginGmailEl.classList.add('hidden');
    btnGrantPermissionEl.classList.remove('hidden');
    authBannerEl.classList.remove('hidden');
  } else if (!anyAuthorizedAccount && feedIndices.length > 0) {
    authBannerTitleEl.textContent = 'ავტორიზაცია საჭიროა:';
    authAccountMsgEl.textContent =
      'არცერთ ექაუნთში არ ხართ შესული. გთხოვთ გაიაროთ ავტორიზაცია Gmail-ში.';
    btnGrantPermissionEl.classList.add('hidden');
    btnLoginGmailEl.classList.remove('hidden');
    authBannerEl.classList.remove('hidden');
  } else {
    authBannerEl.classList.add('hidden');
  }
}

/**
 * Renders Account Navigation Tabs using consistent fullcount badges
 */
function renderAccountTabs() {
  accountTabsEl.innerHTML = '';

  const accounts = appSettings.accounts || [];
  const counts = computeAccountDisplayCounts(
    cachedFeedData,
    accounts,
    appSettings.locallyReadIds || []
  );

  // 'All' Tab
  const allCount = counts.allFullcount;
  const allTabBtn = document.createElement('button');
  allTabBtn.type = 'button';
  allTabBtn.className = `tab-pill ${currentTab === 'all' ? 'active' : ''}`;
  allTabBtn.innerHTML = `
    <span>ყველა</span>
    <span class="tab-badge ${allCount > 0 ? 'has-unread' : ''}">${allCount}</span>
  `;
  allTabBtn.addEventListener('click', () => {
    currentTab = 'all';
    clearDeleteAllConfirmation();
    renderAccountTabs();
    renderEmailList();
  });
  allTabBtn.addEventListener('dblclick', () => openGmailInbox('all'));
  accountTabsEl.appendChild(allTabBtn);

  // Individual Account Tabs
  for (const idx of counts.indicesToShow) {
    const accConfig = accounts.find(a => a.index === idx);
    const feed = cachedFeedData[idx];
    const stat = counts.perAccount.get(idx) || { fullcount: 0, unauthorized: false };
    const isUnauthorized = stat.unauthorized;
    const count = stat.fullcount;
    const emailStr = accConfig?.email || feed?.accountEmail || '';
    const displayName = accConfig?.name || (emailStr ? emailStr.split('@')[0] : `u/${idx}`);

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `tab-pill ${currentTab === String(idx) ? 'active' : ''} ${
      isUnauthorized ? 'tab-unauth' : ''
    }`;
    tabBtn.title = isUnauthorized
      ? `${emailStr || displayName} (საჭიროა Gmail-ის გახსნა)`
      : `${emailStr ? `${emailStr} (u/${idx})` : `Account ${idx}`} (ორმაგი კლიკით ინბოქსში გადასვლა)`;
    tabBtn.innerHTML = `
      <span>u/${idx} ${escapeHtml(displayName)}</span>
      <span class="tab-badge ${isUnauthorized ? 'is-warning' : count > 0 ? 'has-unread' : ''}">${
        isUnauthorized ? '🔑' : count
      }</span>
    `;
    tabBtn.addEventListener('click', () => {
      currentTab = String(idx);
      clearDeleteAllConfirmation();
      renderAccountTabs();
      renderEmailList();
    });
    tabBtn.addEventListener('dblclick', () => openGmailInbox(idx));
    accountTabsEl.appendChild(tabBtn);
  }

  // Dynamic tooltips on Quick Action buttons
  const resolvedIdx = resolveActiveAccountIndex(currentTab, accounts);
  if (btnOpenInboxEl) {
    btnOpenInboxEl.title =
      currentTab === 'all'
        ? 'Gmail ინბოქსის გახსნა (I ან G)'
        : `Gmail u/${currentTab} ინბოქსის გახსნა (I ან G)`;
  }
  if (btnComposeEl) {
    btnComposeEl.title =
      currentTab === 'all'
        ? `ახალი წერილის დაწერა u/${resolvedIdx}-დან (C)`
        : `ახალი წერილის დაწერა u/${currentTab}-დან (C)`;
  }
  if (brandHeaderEl) {
    brandHeaderEl.title =
      currentTab === 'all'
        ? 'Gmail ინბოქსის გახსნა (Open Inbox)'
        : `Gmail u/${currentTab} ინბოქსის გახსნა (Open Inbox)`;
  }
}

/**
 * Renders Email Cards based on current active tab and search query
 */
function renderEmailList() {
  emailListEl.innerHTML = '';

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
        api.tabs.create({ url: loginUrl });
      });
      emailListEl.appendChild(authCard);
      return;
    }
  }

  const filtered = filterVisibleEmails(allEmails, currentTab, searchQuery);

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
      <button type="button" class="btn-empty-inbox" id="btnEmptyStateInbox" title="Gmail ინბოქსის გახსნა (I ან G)">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
        </svg>
        <span>Gmail ინბოქსის გახსნა</span>
      </button>
    `;
    const btnEmpty = emptyState.querySelector('#btnEmptyStateInbox');
    if (btnEmpty) {
      btnEmpty.addEventListener('click', e => {
        const forceNew = e.ctrlKey || e.metaKey || e.shiftKey;
        openGmailInbox(currentTab, forceNew);
      });
    }
    emailListEl.appendChild(emptyState);
    return;
  }

  const vipKeywords = parseVipKeywords(appSettings.vipKeywords);

  for (const entry of filtered) {
    const isVip = isVipEmail(entry, vipKeywords);
    const card = createEmailCard(entry, isVip);
    emailListEl.appendChild(card);
  }

  // Show overflow hint when Gmail fullcount exceeds the 20-entry Atom feed window
  if (!searchQuery.trim()) {
    const counts = computeAccountDisplayCounts(
      cachedFeedData,
      appSettings.accounts || [],
      appSettings.locallyReadIds || []
    );
    let overflowCount = 0;
    let totalCount = 0;
    if (currentTab === 'all') {
      overflowCount = counts.allHiddenOverflowCount;
      totalCount = counts.allFullcount;
    } else {
      const stat = counts.perAccount.get(Number(currentTab));
      overflowCount = stat?.hiddenOverflowCount || 0;
      totalCount = stat?.fullcount || 0;
    }

    if (overflowCount > 0) {
      const hintBtn = document.createElement('button');
      hintBtn.type = 'button';
      hintBtn.className = 'overflow-footer-hint';
      hintBtn.textContent = `ნაჩვენებია ბოლო ${filtered.length} წერილი (სულ ${totalCount}) — გახსენი Inbox →`;
      hintBtn.addEventListener('click', e => {
        const forceNew = e.ctrlKey || e.metaKey || e.shiftKey;
        openGmailInbox(currentTab, forceNew);
      });
      emailListEl.appendChild(hintBtn);
    }
  }
}

/**
 * Opens an email in a new tab via background so popup closing never aborts server mark-read.
 */
async function openAndMarkEmail(entry, cardEl) {
  cardEl.classList.add('fade-out-read');
  try {
    const res = await api.runtime.sendMessage({
      action: 'OPEN_AND_MARK_READ',
      id: entry.id,
      messageId: entry.messageId,
      link: entry.link,
      accountIndex: entry.accountIndex
    });
    if (res?.serverSynced) {
      recordLocalRemoval([entry.id], entry.messageId ? [entry.messageId] : []);
      setTimeout(() => {
        cardEl.remove();
        processCachedEmails();
        renderAccountTabs();
        if (emailListEl.querySelectorAll('.email-card').length === 0) {
          renderEmailList();
        }
      }, 220);
    } else {
      cardEl.classList.remove('fade-out-read');
    }
  } catch (err) {
    cardEl.classList.remove('fade-out-read');
    api.tabs.create({ url: entry.link });
  }
}

/**
 * Builds Bento Card DOM element for an email
 */
function createEmailCard(entry, isVip) {
  const card = document.createElement('div');
  card.className = 'email-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');

  card.addEventListener('click', () => {
    openAndMarkEmail(entry, card);
  });

  card.addEventListener('keydown', e => {
    if (e.target !== card) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAndMarkEmail(entry, card);
    }
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
    vipTag.innerHTML = '<span>★</span><span>VIP</span>';
    tagsGroup.appendChild(vipTag);
  }

  const metaRightGroup = document.createElement('div');
  metaRightGroup.className = 'meta-right-group';

  const timeEl = document.createElement('span');
  timeEl.className = 'card-time';
  timeEl.textContent = formatRelativeTime(entry.issued);
  metaRightGroup.appendChild(timeEl);

  const btnQuickRead = document.createElement('button');
  btnQuickRead.type = 'button';
  btnQuickRead.className = 'btn-quick-read';
  btnQuickRead.title = 'წაკითხულად მონიშვნა (Mark as read)';
  btnQuickRead.setAttribute('aria-label', 'წაკითხულად მონიშვნა');
  btnQuickRead.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  `;
  btnQuickRead.addEventListener('click', e => {
    e.stopPropagation();
    handleSingleEmailAction(entry, card, 'read', true);
  });
  metaRightGroup.appendChild(btnQuickRead);

  const btnQuickDelete = document.createElement('button');
  btnQuickDelete.type = 'button';
  btnQuickDelete.className = 'btn-quick-delete';
  btnQuickDelete.title = 'წაშლა (Move to Trash)';
  btnQuickDelete.setAttribute('aria-label', 'წაშლა');
  btnQuickDelete.innerHTML = `
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;
  btnQuickDelete.addEventListener('click', e => {
    e.stopPropagation();
    handleSingleEmailAction(entry, card, 'delete', true);
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
  avatar.textContent = (entry.authorName || entry.authorEmail || 'G').charAt(0).toUpperCase();

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

  // Cached AI Summary
  const existingSummary = appSettings?.aiSummaries?.[entry.id];
  if (existingSummary) {
    const summaryBox = document.createElement('div');
    summaryBox.className = 'ai-summary-box';
    summaryBox.innerHTML = `
      <div class="ai-summary-header">✨ LM Studio შეჯამება</div>
      <div class="ai-summary-text">${escapeHtml(existingSummary)}</div>
    `;
    card.appendChild(summaryBox);
  }

  // Card Action Row (only rendered when OTP or AI Summary action applies)
  if (entry.otpCode || !existingSummary) {
    const actionRow = document.createElement('div');
    actionRow.className = 'card-actions';

    if (entry.otpCode) {
      const otpBtn = document.createElement('button');
      otpBtn.type = 'button';
      otpBtn.className = 'btn-otp-copy';
      otpBtn.innerHTML = `<span>📋 კოდი: <strong>${escapeHtml(entry.otpCode)}</strong></span>`;
      otpBtn.title = 'დააჭირეთ კოდის დასაკოპირებლად';

      otpBtn.addEventListener('click', async e => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(entry.otpCode);
          otpBtn.classList.add('copied');
          otpBtn.innerHTML = `<span>✅ დაკოპირდა: <strong>${escapeHtml(entry.otpCode)}</strong></span>`;
          showToast(`კოდი ${entry.otpCode} დაკოპირდა!`);
          setTimeout(() => {
            otpBtn.classList.remove('copied');
            otpBtn.innerHTML = `<span>📋 კოდი: <strong>${escapeHtml(entry.otpCode)}</strong></span>`;
          }, 2200);
        } catch (_) {
          showToast('კოპირება ვერ მოხერხდა');
        }
      });

      actionRow.appendChild(otpBtn);
    }

    if (!existingSummary) {
      const aiBtn = document.createElement('button');
      aiBtn.type = 'button';
      aiBtn.className = 'btn-ai-summary';
      aiBtn.innerHTML = '<span>✨ AI Summary</span>';
      aiBtn.title = 'შეაჯამე წერილი LM Studio-ს მეშვეობით';

      aiBtn.addEventListener('click', async e => {
        e.stopPropagation();
        await generateEmailSummary(entry, card, aiBtn);
      });
      actionRow.appendChild(aiBtn);
    }

    card.appendChild(actionRow);
  }

  return card;
}

function recordLocalRemoval(ids = [], messageIds = []) {
  if (!appSettings) return;
  if (!Array.isArray(appSettings.locallyReadIds)) {
    appSettings.locallyReadIds = [];
  }
  const set = new Set(appSettings.locallyReadIds);
  for (const id of ids) {
    if (id) set.add(id);
  }
  for (const msgId of messageIds) {
    if (msgId) set.add(msgId);
  }
  appSettings.locallyReadIds = Array.from(set);
}

/**
 * Unified single-email server action ('read' | 'delete')
 */
async function handleSingleEmailAction(entry, cardEl, mode, showNotification = true) {
  const action = mode === 'delete' ? 'DELETE_EMAIL' : 'MARK_EMAIL_READ';
  cardEl.classList.add('fade-out-read');

  let serverSynced = false;
  let needsPreauth = false;

  try {
    const res = await api.runtime.sendMessage({
      action,
      id: entry.id,
      messageId: entry.messageId,
      link: entry.link,
      accountIndex: entry.accountIndex
    });
    if (res) {
      serverSynced = Boolean(res.serverSynced);
      needsPreauth = Boolean(res.needsPreauth);
    }
  } catch (err) {
    console.warn(`${action} message warning:`, err);
  }

  if (serverSynced) {
    recordLocalRemoval([entry.id], entry.messageId ? [entry.messageId] : []);

    setTimeout(() => {
      cardEl.remove();
      processCachedEmails();
      renderAccountTabs();
      if (emailListEl.querySelectorAll('.email-card').length === 0) {
        renderEmailList();
      }
    }, 220);

    if (showNotification) {
      showToast(
        mode === 'delete' ? '🗑️ წერილი გადატანილია სანაგვეში' : '✓ წერილი მონიშნულია წაკითხულად'
      );
    }
  } else {
    cardEl.classList.remove('fade-out-read');
    if (showNotification) {
      if (needsPreauth) {
        showToast('⚠️ Gmail-ის სესია დასადასტურებელია გახსნილ ტაბში');
      } else {
        showToast(
          mode === 'delete'
            ? '⚠️ Gmail-იდან წაშლა ვერ მოხერხდა (სცადეთ თავიდან)'
            : '⚠️ Gmail სესია გასაახლებელია (სცადეთ თავიდან)'
        );
      }
    }
  }
}

/**
 * Executes bulk action ('read' | 'delete') on currently visible (filtered) emails.
 */
async function handleBulkAction(mode) {
  const targetEmails = filterVisibleEmails(allEmails, currentTab, searchQuery);
  if (targetEmails.length === 0) {
    showToast(mode === 'delete' ? 'წასაშლელი წერილები არ არის' : 'წასაკითხი წერილები არ არის');
    return;
  }

  const action = mode === 'delete' ? 'DELETE_ALL_EMAILS' : 'MARK_ALL_READ';
  const ids = targetEmails.map(e => e.id);
  const items = targetEmails.map(e => ({
    id: e.id,
    messageId: e.messageId,
    link: e.link,
    accountIndex: e.accountIndex
  }));

  const cards = emailListEl.querySelectorAll('.email-card');
  cards.forEach(c => c.classList.add('fade-out-read'));

  let res = null;
  try {
    res = await api.runtime.sendMessage({ action, ids, items });
  } catch (err) {
    console.warn(`${action} notice:`, err);
  }

  if (res && (res.serverSynced || res.partialSync)) {
    const syncedIds = Array.isArray(res.syncedIds) ? res.syncedIds : ids;
    const syncedMsgIds = Array.isArray(res.syncedMessageIds)
      ? res.syncedMessageIds
      : items.map(i => i.messageId).filter(Boolean);
    recordLocalRemoval(syncedIds, syncedMsgIds);

    setTimeout(() => {
      processCachedEmails();
      renderAccountTabs();
      renderEmailList();
    }, 220);

    if (res.partialSync) {
      showToast(`⚠️ ნაწილობრივ შესრულდა (${res.syncedCount} წერილი)`);
    } else {
      showToast(
        mode === 'delete'
          ? `🗑️ წერილი (${targetEmails.length}) გადატანილია სანაგვეში`
          : `✓ წერილი (${targetEmails.length}) მონიშნულია წაკითხულად`
      );
    }
  } else {
    cards.forEach(c => c.classList.remove('fade-out-read'));
    if (res?.needsPreauth) {
      showToast('⚠️ Gmail-ის სესია დასადასტურებელია გახსნილ ტაბში');
    } else {
      showToast(
        mode === 'delete'
          ? '⚠️ Gmail-იდან წაშლა ვერ მოხერხდა (სცადეთ თავიდან)'
          : '⚠️ Gmail სესია გასაახლებელია (სცადეთ თავიდან)'
      );
    }
  }
}

function initBulkActionButtons() {
  if (btnMarkAllReadEl) {
    btnMarkAllReadEl.addEventListener('click', () => {
      clearDeleteAllConfirmation();
      handleBulkAction('read');
    });
  }

  if (btnDeleteAllEl) {
    btnDeleteAllEl.addEventListener('click', () => {
      const visible = filterVisibleEmails(allEmails, currentTab, searchQuery);
      if (visible.length === 0) {
        clearDeleteAllConfirmation();
        showToast('წასაშლელი წერილები არ არის');
        return;
      }

      if (!deleteAllConfirm.isArmed()) {
        const count = deleteAllConfirm.arm(visible.length);
        btnDeleteAllEl.classList.add('confirming');
        if (btnDeleteAllLabelEl) {
          btnDeleteAllLabelEl.textContent = `დადასტურება? (${count})`;
        }
        return;
      }

      deleteAllConfirm.confirm();
      resetDeleteAllButtonUI();
      handleBulkAction('delete');
    });
  }
}

/**
 * AI Summary Generation via LM Studio
 */
async function generateEmailSummary(entry, cardEl, aiBtn) {
  aiBtn.classList.add('loading');
  aiBtn.textContent = '🧠 მუშავდება...';

  let summaryContainer = cardEl.querySelector('.ai-summary-box');
  if (!summaryContainer) {
    summaryContainer = document.createElement('div');
    summaryContainer.className = 'ai-summary-box';
    cardEl.appendChild(summaryContainer);
  }

  summaryContainer.innerHTML = `
    <div class="ai-summary-header">✨ LM Studio შეჯამება</div>
    <div class="ai-summary-text loading-pulse">🧠 LM Studio ამუშავებს შეჯამებას... (გთხოვთ დაელოდოთ)</div>
  `;
  const textEl = summaryContainer.querySelector('.ai-summary-text');

  const emailText = `Subject: ${entry.title || ''}\nSender: ${entry.authorName || ''} <${
    entry.authorEmail || ''
  }>\nBody: ${entry.summary || ''}`;

  try {
    const res = await api.runtime.sendMessage({
      action: 'GENERATE_AI_SUMMARY',
      entryId: entry.id,
      emailText
    });

    if (res && res.success && res.summary) {
      textEl.classList.remove('loading-pulse');
      textEl.textContent = res.summary;
      if (!appSettings.aiSummaries) appSettings.aiSummaries = {};
      appSettings.aiSummaries[entry.id] = res.summary;
      aiBtn.remove();
      showToast('✨ შეჯამება მზადაა!');
    } else {
      throw new Error(res?.error || 'უცნობი შეცდომა');
    }
  } catch (err) {
    console.error('LM Studio summary error:', err);
    textEl.classList.remove('loading-pulse');
    const endpoint = appSettings?.aiEndpoint || DEFAULT_AI_ENDPOINT;
    textEl.textContent = `LM Studio შეჯამება ვერ მოხერხდა: ${err.message}. დარწმუნდით, რომ LM Studio-ში Local Server ჩართულია (${endpoint}).`;
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

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    settingsDialogEl.addEventListener('click', event => {
      if (event.target !== settingsDialogEl) return;
      const rect = settingsDialogEl.getBoundingClientRect();
      const inDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inDialog) settingsDialogEl.close();
    });
  }

  // Save ONLY user-editable settings keys so background cachedFeeds/aiSummaries are never overwritten
  settingsFormEl.addEventListener('submit', async e => {
    e.preventDefault();

    const rawRows = Array.from(
      accountsSettingsListEl.querySelectorAll('.account-setting-row')
    ).map(row => ({
      index: Number(row.dataset.index),
      enabled: row.querySelector('.account-enabled-checkbox').checked,
      inputValue: row.querySelector('.account-setting-input').value
    }));

    const accounts = normalizeAccountRows(rawRows, appSettings.accounts || []);
    const editableUpdate = {
      accounts,
      pollInterval: Number(pollIntervalInputEl.value) || 1,
      focusMode: focusModeToggleEl.checked,
      vipOnly: vipOnlyToggleEl.checked,
      vipKeywords: vipKeywordsInputEl.value.trim(),
      aiEndpoint: aiEndpointInputEl.value.trim() || DEFAULT_AI_ENDPOINT,
      aiModel: aiModelInputEl.value.trim() || DEFAULT_AI_MODEL
    };

    appSettings = { ...appSettings, ...editableUpdate };
    await api.storage.local.set(editableUpdate);
    await api.runtime.sendMessage({ action: 'SETTINGS_UPDATED' });

    settingsDialogEl.close();
    showToast('პარამეტრები შენახულია');

    updateSoundButtonUI();
    processCachedEmails();
    renderAccountTabs();
    renderEmailList();
    triggerRefresh();
  });

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
      row.querySelector('.account-setting-input').focus();
    });
  }

  btnTestSoundEl.addEventListener('click', async () => {
    btnTestSoundEl.disabled = true;
    try {
      await api.runtime.sendMessage({ action: 'TEST_SOUND' });
      showToast('🔊 Chime ხმა გაშვებულია');
    } catch (err) {
      showToast('ხმის გაშვება ვერ მოხერხდა: ' + err.message);
    } finally {
      setTimeout(() => {
        btnTestSoundEl.disabled = false;
      }, 800);
    }
  });

  if (btnTestLmStudioEl) {
    btnTestLmStudioEl.addEventListener('click', async () => {
      btnTestLmStudioEl.disabled = true;
      if (lmStudioStatusTextEl) {
        lmStudioStatusTextEl.textContent = 'მოწმდება კავშირი...';
        lmStudioStatusTextEl.style.color = 'var(--text-muted)';
      }
      try {
        const endpoint = aiEndpointInputEl?.value?.trim() || DEFAULT_AI_ENDPOINT;
        const res = await api.runtime.sendMessage({
          action: 'TEST_LM_STUDIO_CONNECTION',
          endpoint
        });
        if (res && res.success) {
          const modelList = res.models?.length ? res.models.join(', ') : 'მოდელი ჩატვირთულია';
          if (lmStudioStatusTextEl) {
            lmStudioStatusTextEl.textContent = `✅ დაკავშირებულია! (${modelList})`;
            lmStudioStatusTextEl.style.color = 'var(--accent-green, #10b981)';
          }
          showToast('✅ LM Studio-სთან კავშირი დამყარდა!');
        } else {
          throw new Error(res?.error || 'კავშირი ვერ დამყარდა');
        }
      } catch (err) {
        if (lmStudioStatusTextEl) {
          lmStudioStatusTextEl.textContent = `❌ შეცდომა: ${err.message}`;
          lmStudioStatusTextEl.style.color = 'var(--accent-red, #d93025)';
        }
        showToast('❌ LM Studio მიუწვდომელია');
      } finally {
        setTimeout(() => {
          btnTestLmStudioEl.disabled = false;
        }, 600);
      }
    });
  }
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
    ? `<a href="${loginUrl}" target="_blank" rel="noopener noreferrer" class="badge-status-auth" title="დააჭირეთ Gmail-ში გასახსნელად">🔑 შესვლა</a>`
    : feed && !feed.unauthorized
      ? '<span class="badge-status-ok" title="სინქრონიზებულია">✓ აქტიური</span>'
      : '';

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
  const slot0Feed = cachedFeedData[0];
  const slot0Email = slot0Feed && !slot0Feed.unauthorized ? slot0Feed.accountEmail : null;

  const indicesSet = new Set([0, 1, 2, 3]);
  currentAccounts.forEach(a => indicesSet.add(a.index));

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
    accountsSettingsListEl.appendChild(createAccountSettingRow(existing));
  }

  pollIntervalInputEl.value = String(appSettings.pollInterval || 1);
  focusModeToggleEl.checked = Boolean(appSettings.focusMode);
  vipOnlyToggleEl.checked = Boolean(appSettings.vipOnly);
  vipKeywordsInputEl.value = appSettings.vipKeywords || '';
  aiEndpointInputEl.value = appSettings.aiEndpoint || DEFAULT_AI_ENDPOINT;
  aiModelInputEl.value = appSettings.aiModel || DEFAULT_AI_MODEL;
  if (lmStudioStatusTextEl) {
    lmStudioStatusTextEl.textContent = 'კავშირი: შეუმოწმებელი';
    lmStudioStatusTextEl.style.color = 'var(--text-muted)';
  }
}

/**
 * Smart Gmail Navigation (switches to open Gmail tab or creates new tab)
 */
async function openGmailInbox(accountParam = currentTab, forceNewTab = false) {
  const targetIdx = resolveActiveAccountIndex(accountParam, appSettings?.accounts || []);
  const accConfig = (appSettings?.accounts || []).find(a => a.index === targetIdx);
  const targetEmail = accConfig?.email || '';
  const targetUrl = `https://mail.google.com/mail/u/${targetIdx}/#inbox`;

  try {
    if (!forceNewTab && api.tabs?.query) {
      const tabs = await api.tabs.query({});
      let matchedTab = tabs.find(t => {
        if (!t.url || !t.url.includes('mail.google.com')) return false;
        if (t.url.includes(`/mail/u/${targetIdx}/`) || t.url.endsWith(`/mail/u/${targetIdx}`)) {
          return true;
        }
        if (
          targetEmail &&
          (t.url.includes(`authuser=${encodeURIComponent(targetEmail)}`) ||
            t.url.includes(`/u/${encodeURIComponent(targetEmail)}/`))
        ) {
          return true;
        }
        return false;
      });

      if (!matchedTab && targetIdx === 0) {
        matchedTab = tabs.find(
          t => t.url && t.url.includes('mail.google.com') && !t.url.match(/\/mail\/u\/[1-9]/)
        );
      }

      if (matchedTab && matchedTab.id) {
        await api.tabs.update(matchedTab.id, { active: true });
        if (matchedTab.windowId) {
          await api.windows.update(matchedTab.windowId, { focused: true });
        }
        showToast(`✨ Gmail u/${targetIdx} ტაბი გააქტიურდა`);
        return;
      }
    }

    await api.tabs.create({ url: targetUrl });
    showToast('🚀 Gmail გაიხსნა ახალ ტაბში');
  } catch (err) {
    console.warn('Tab query/focus failed, falling back to tabs.create:', err);
    api.tabs.create({ url: targetUrl });
  }
}

function initInboxNavigation() {
  if (btnOpenInboxEl) {
    btnOpenInboxEl.addEventListener('click', e => {
      const forceNewTab = e.ctrlKey || e.metaKey || e.shiftKey;
      openGmailInbox(currentTab, forceNewTab);
    });
  }

  if (brandHeaderEl) {
    brandHeaderEl.addEventListener('click', e => {
      const forceNewTab = e.ctrlKey || e.metaKey || e.shiftKey;
      openGmailInbox(currentTab, forceNewTab);
    });
    brandHeaderEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openGmailInbox(currentTab);
      }
    });
  }

  if (btnGrantPermissionEl) {
    btnGrantPermissionEl.addEventListener('click', async () => {
      try {
        const granted = await requestGmailHostPermission(api);
        hasGmailPermission = granted;
        if (granted) {
          showToast('✅ Gmail წვდომა დაშვებულია');
          await triggerRefresh();
        } else {
          showToast('⚠️ წვდომა არ იქნა დაშვებული');
        }
      } catch (err) {
        showToast('ნებართვის მოთხოვნა ვერ მოხერხდა');
      }
    });
  }
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', e => {
    const target = e.target;
    const isTyping =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable);

    if (settingsDialogEl && settingsDialogEl.open) {
      return;
    }

    if (isTyping) {
      if (e.key === 'Escape' && filterInputEl && document.activeElement === filterInputEl) {
        filterInputEl.value = '';
        searchQuery = '';
        btnClearFilterEl?.classList.add('hidden');
        clearDeleteAllConfirmation();
        renderEmailList();
        filterInputEl.blur();
      }
      return;
    }

    if (e.key === 'i' || e.key === 'I' || e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      const forceNew = e.ctrlKey || e.metaKey || e.shiftKey;
      openGmailInbox(currentTab, forceNew);
      return;
    }

    if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      btnComposeEl?.click();
      return;
    }

    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      btnRefreshEl?.click();
      return;
    }

    if (e.key === '/') {
      e.preventDefault();
      filterInputEl?.focus();
      filterInputEl?.select();
    }
  });
}

function initComposeButton() {
  btnComposeEl.addEventListener('click', () => {
    const accountIdx = resolveActiveAccountIndex(currentTab, appSettings?.accounts || []);
    const composeUrl = `https://mail.google.com/mail/u/${accountIdx}/#inbox?compose=new`;
    api.tabs.create({ url: composeUrl });
  });
}

function initSoundQuickToggle() {
  btnSoundToggleEl.addEventListener('click', async () => {
    if (!appSettings) return;
    const nextSoundState = !appSettings.soundEnabled;
    appSettings.soundEnabled = nextSoundState;
    await api.storage.local.set({ soundEnabled: nextSoundState });
    updateSoundButtonUI();
    showToast(nextSoundState ? '🔔 ხმა ჩაირთო' : '🔕 ხმა გაითიშა');
  });
}

function initFilter() {
  filterInputEl.addEventListener('input', e => {
    searchQuery = e.target.value;
    clearDeleteAllConfirmation();
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
    clearDeleteAllConfirmation();
    renderEmailList();
  });
}

function initRefresh() {
  btnRefreshEl.addEventListener('click', triggerRefresh);
}

async function triggerRefresh() {
  btnRefreshEl.classList.add('spinning');
  statusDotEl.classList.add('fetching');
  statusDotEl.title = 'მოწმდება...';

  try {
    const res = await api.runtime.sendMessage({ action: 'REFRESH_NOW' });
    if (res && res.success) {
      await loadState();
      showToast('განახლებულია!');
    }
  } catch (_) {
    showToast('განახლების შეცდომა');
  } finally {
    btnRefreshEl.classList.remove('spinning');
    statusDotEl.classList.remove('fetching');
    statusDotEl.title = 'სინქრონიზებულია';
  }
}

/**
 * Live-sync storage updates between Background, Popup, and Side Panel
 */
api.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  const relevantKeys = [
    'cachedFeeds',
    'lastGlobalCheck',
    'accounts',
    'locallyReadIds',
    'soundEnabled',
    'focusMode',
    'aiSummaries',
    'theme'
  ];

  if (relevantKeys.some(key => key in changes)) {
    loadState();
  }
});

// App Entry Point
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initViewMode();
  initInboxNavigation();
  initComposeButton();
  initKeyboardShortcuts();
  initSoundQuickToggle();
  initFilter();
  initBulkActionButtons();
  initRefresh();
  initSettingsModal();

  await loadState();
});
