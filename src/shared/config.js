/**
 * Shared constants and default settings for Local Gmail Command Center.
 */

export const ALARM_NAME = 'GMAIL_CHECK_ALARM';
export const DEFAULT_POLL_INTERVAL = 1; // 1 minute
export const MAX_NOTIFIED_IDS = 500;
export const MAX_LOCALLY_READ_IDS = 1000;
export const MAX_AI_SUMMARIES = 100;
export const MAX_NOTIFICATION_LINKS = 100;
export const LOCALLY_READ_GRACE_MS = 5 * 60 * 1000;
export const AI_SUMMARY_TIMEOUT_MS = 45_000;
export const AI_TEST_TIMEOUT_MS = 5_000;

export const DEFAULT_AI_PROVIDER = 'lmstudio';
export const DEFAULT_AI_ENDPOINT = 'http://127.0.0.1:1234/v1/chat/completions';
export const DEFAULT_AI_MODEL = 'local-model';
export const VENICE_API_ENDPOINT = 'https://api.venice.ai/api/v1/chat/completions';
export const VENICE_MODELS_ENDPOINT = 'https://api.venice.ai/api/v1/models';
export const DEFAULT_VENICE_MODEL = 'llama-3.3-70b';
export const DEFAULT_VIP_KEYWORDS =
  'urgent, invoice, სასწრაფო, კოდი, verification, გადახდა, security, auth';

export const DEFAULT_ACCOUNTS = [
  { index: 0, name: 'Personal', enabled: true },
  { index: 1, name: 'Work', enabled: true },
  { index: 2, name: 'Account 3', enabled: true },
  { index: 3, name: 'Account 4', enabled: true }
];

export const DEFAULT_SETTINGS = {
  accounts: DEFAULT_ACCOUNTS.map(acc => ({ ...acc })),
  pollInterval: DEFAULT_POLL_INTERVAL,
  soundEnabled: true,
  focusMode: false,
  vipOnly: false,
  vipKeywords: DEFAULT_VIP_KEYWORDS,
  aiProvider: DEFAULT_AI_PROVIDER,
  aiEndpoint: DEFAULT_AI_ENDPOINT,
  aiModel: DEFAULT_AI_MODEL,
  veniceApiKey: '',
  veniceModel: DEFAULT_VENICE_MODEL,
  theme: 'system',
  aiSummaries: {},
  notifiedIds: [],
  locallyReadIds: [],
  locallyReadMap: {},
  cachedFeeds: {},
  lastGlobalCheck: null
};

export const EDITABLE_SETTING_KEYS = [
  'accounts',
  'pollInterval',
  'focusMode',
  'vipOnly',
  'vipKeywords',
  'aiProvider',
  'aiEndpoint',
  'aiModel',
  'veniceApiKey',
  'veniceModel'
];
