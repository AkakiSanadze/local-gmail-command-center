/**
 * Complete WebExtension API mock supporting both Chrome MV3 (offscreen, sidePanel)
 * and Firefox MV3 (no offscreen, sidebarAction, permissions).
 */

function deepClone(obj) {
  return obj === undefined ? undefined : JSON.parse(JSON.stringify(obj));
}

function createStorageArea(initialData = {}, areaName, onChangedListeners) {
  const store = { ...deepClone(initialData) };

  return {
    _data: store,
    async get(keys) {
      if (keys === null || keys === undefined) {
        return deepClone(store);
      }
      if (typeof keys === 'string') {
        return keys in store ? { [keys]: deepClone(store[keys]) } : {};
      }
      if (Array.isArray(keys)) {
        const out = {};
        for (const k of keys) {
          if (k in store) out[k] = deepClone(store[k]);
        }
        return out;
      }
      const out = {};
      for (const [k, defVal] of Object.entries(keys)) {
        out[k] = k in store ? deepClone(store[k]) : deepClone(defVal);
      }
      return out;
    },
    async set(items) {
      const changes = {};
      for (const [k, v] of Object.entries(items || {})) {
        const oldValue = k in store ? deepClone(store[k]) : undefined;
        store[k] = deepClone(v);
        changes[k] = { oldValue, newValue: deepClone(v) };
      }
      for (const fn of onChangedListeners) {
        fn(changes, areaName);
      }
    },
    async remove(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      const changes = {};
      for (const k of list) {
        if (k in store) {
          changes[k] = { oldValue: deepClone(store[k]), newValue: undefined };
          delete store[k];
        }
      }
      if (Object.keys(changes).length > 0) {
        for (const fn of onChangedListeners) {
          fn(changes, areaName);
        }
      }
    },
    async clear() {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    }
  };
}

export class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = { kind: 'destination' };
    this.oscillators = [];
    this.gains = [];
  }

  async resume() {
    this.state = 'running';
  }

  createGain() {
    const g = {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {}
    };
    this.gains.push(g);
    return g;
  }

  createOscillator() {
    const o = {
      type: 'sine',
      frequency: { setValueAtTime: () => {} },
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
    this.oscillators.push(o);
    return o;
  }
}

export function createMockExtensionApi({
  mode = 'chrome',
  initialLocal = {},
  initialSession = {},
  cookies = [],
  hostPermissionsGranted = true,
  offscreenHandler = null
} = {}) {
  const onChangedListeners = [];
  const alarmListeners = [];
  const installedListeners = [];
  const startupListeners = [];
  const notificationClickListeners = [];
  const messageListeners = [];

  const localArea = createStorageArea(initialLocal, 'local', onChangedListeners);
  const sessionArea = createStorageArea(initialSession, 'session', onChangedListeners);

  const state = {
    mode,
    alarms: new Map(),
    badge: { text: '', backgroundColor: null, textColor: null, history: [] },
    notifications: new Map(),
    tabs: [],
    nextTabId: 1,
    offscreenDocuments: [],
    sidePanelOptions: null,
    sidePanelOpenCalls: [],
    sidebarOpenCalls: [],
    runtimeMessages: [],
    cookieStore: deepClone(cookies),
    hostPermissionsGranted
  };

  const api = {
    _state: state,
    storage: {
      local: localArea,
      session: sessionArea,
      onChanged: {
        addListener(fn) {
          onChangedListeners.push(fn);
        }
      }
    },
    alarms: {
      async clear(name) {
        return state.alarms.delete(name);
      },
      async create(name, alarmInfo) {
        const entry = { name, ...alarmInfo };
        state.alarms.set(name, entry);
        return entry;
      },
      onAlarm: {
        addListener(fn) {
          alarmListeners.push(fn);
        }
      },
      async _trigger(name) {
        for (const fn of alarmListeners) {
          await fn({ name });
        }
      }
    },
    action: {
      async setBadgeText({ text }) {
        state.badge.text = text;
        state.badge.history.push({ type: 'text', value: text });
      },
      async setBadgeBackgroundColor({ color }) {
        state.badge.backgroundColor = color;
        state.badge.history.push({ type: 'bg', value: color });
      },
      async setBadgeTextColor({ color }) {
        state.badge.textColor = color;
        state.badge.history.push({ type: 'fg', value: color });
      }
    },
    notifications: {
      async create(id, options) {
        state.notifications.set(id, options);
        return id;
      },
      onClicked: {
        addListener(fn) {
          notificationClickListeners.push(fn);
        }
      },
      async _triggerClick(id) {
        for (const fn of notificationClickListeners) {
          await fn(id);
        }
      }
    },
    tabs: {
      async create(props) {
        const tab = {
          id: state.nextTabId++,
          url: props.url,
          active: props.active !== false,
          status: 'complete',
          windowId: 1
        };
        state.tabs.push(tab);
        return deepClone(tab);
      },
      async get(tabId) {
        const t = state.tabs.find(tab => tab.id === tabId);
        if (!t) throw new Error(`Tab ${tabId} not found`);
        return deepClone(t);
      },
      async update(tabId, props) {
        const t = state.tabs.find(tab => tab.id === tabId);
        if (!t) throw new Error(`Tab ${tabId} not found`);
        Object.assign(t, props);
        return deepClone(t);
      },
      async remove(tabId) {
        const idx = state.tabs.findIndex(tab => tab.id === tabId);
        if (idx >= 0) state.tabs.splice(idx, 1);
      },
      async query(queryInfo = {}) {
        return deepClone(
          state.tabs.filter(t => {
            if (queryInfo.url && !t.url.includes(queryInfo.url)) return false;
            return true;
          })
        );
      }
    },
    windows: {
      async getLastFocused() {
        return { id: 1, focused: true };
      },
      async update(windowId, props) {
        return { id: windowId, ...props };
      }
    },
    cookies: {
      async get({ name, url }) {
        const parsed = new URL(url);
        const match = state.cookieStore.find(c => {
          if (c.name !== name) return false;
          if (c.domain && !parsed.hostname.endsWith(c.domain.replace(/^\./, ''))) return false;
          return parsed.pathname === c.path || parsed.pathname === `${c.path}/`;
        });
        return match ? deepClone(match) : null;
      },
      async getAll({ name }) {
        return deepClone(state.cookieStore.filter(c => c.name === name));
      }
    },
    permissions: {
      async contains() {
        return state.hostPermissionsGranted;
      },
      async request() {
        state.hostPermissionsGranted = true;
        return true;
      }
    },
    runtime: {
      getURL(p) {
        return `chrome-extension://mock-id/${p}`;
      },
      async getContexts({ documentUrls } = {}) {
        return state.offscreenDocuments.filter(
          doc => !documentUrls || documentUrls.includes(doc.url)
        );
      },
      onInstalled: {
        addListener(fn) {
          installedListeners.push(fn);
        },
        async _trigger(details = { reason: 'install' }) {
          for (const fn of installedListeners) {
            await fn(details);
          }
        }
      },
      onStartup: {
        addListener(fn) {
          startupListeners.push(fn);
        },
        async _trigger() {
          for (const fn of startupListeners) {
            await fn();
          }
        }
      },
      onMessage: {
        addListener(fn) {
          messageListeners.push(fn);
        }
      },
      async sendMessage(message) {
        state.runtimeMessages.push(message);
        if (offscreenHandler && (message.action === 'PARSE_GMAIL_ATOM' || message.action === 'PLAY_NOTIFICATION_SOUND')) {
          return await offscreenHandler(message);
        }
        return await new Promise(resolve => {
          let handled = false;
          for (const fn of messageListeners) {
            const ret = fn(message, {}, res => {
              handled = true;
              resolve(res);
            });
            if (ret === true) return;
          }
          if (!handled) resolve(undefined);
        });
      }
    }
  };

  if (mode === 'chrome') {
    api.offscreen = {
      async createDocument(opts) {
        state.offscreenDocuments.push({
          url: api.runtime.getURL(opts.url),
          reasons: opts.reasons
        });
      }
    };
    api.sidePanel = {
      async setOptions(opts) {
        state.sidePanelOptions = opts;
      },
      async open(opts) {
        state.sidePanelOpenCalls.push(opts);
      }
    };
  }

  if (mode === 'firefox') {
    api.sidebarAction = {
      async open() {
        state.sidebarOpenCalls.push({ at: Date.now() });
      }
    };
  }

  return api;
}
