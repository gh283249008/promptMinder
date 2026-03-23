const NOTIFICATION_UNREAD_COUNT_EVENT = 'notifications:unread-count-updated';
const NOTIFICATION_CACHE_KEY = 'promptminder:notifications:unread-count';

function readUnreadCountCache() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.count !== 'number' || typeof parsed.ts !== 'number') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isUnreadCountCacheFresh(maxAgeMs) {
  const cached = readUnreadCountCache();
  if (!cached) return false;

  return Date.now() - cached.ts < maxAgeMs;
}

function writeUnreadCountCache(count, options = {}) {
  if (typeof window === 'undefined') return;

  const { emitEvent = true } = options;
  const nextCount = Number.isFinite(Number(count)) ? Number(count) : 0;

  try {
    window.localStorage.setItem(
      NOTIFICATION_CACHE_KEY,
      JSON.stringify({
        count: nextCount,
        ts: Date.now(),
      })
    );
  } catch {
    // Ignore storage errors (privacy mode, quota, etc.)
  }

  if (emitEvent) {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_UNREAD_COUNT_EVENT, {
        detail: { count: nextCount },
      })
    );
  }
}

export {
  NOTIFICATION_CACHE_KEY,
  NOTIFICATION_UNREAD_COUNT_EVENT,
  isUnreadCountCacheFresh,
  readUnreadCountCache,
  writeUnreadCountCache,
};
