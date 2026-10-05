/**
 * Tiny, total wrapper around `localStorage`.
 *
 * Every call is guarded: Safari private mode throws on `setItem`, some embedded
 * webviews disable storage entirely, and a corrupted value must never take the
 * app down. A failure degrades to "nothing persisted", never to a crash.
 */

function safeStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__pf_roi_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function readString(key: string): string | null {
  const store = safeStorage();
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): boolean {
  const store = safeStorage();
  if (!store) return false;
  try {
    store.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  const store = safeStorage();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Read + JSON.parse with a fallback. Never throws. */
export function readJSON<T>(key: string, fallback: T): T {
  const raw = readString(key);
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** JSON.stringify + write. Returns `false` when persistence is unavailable. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    return writeString(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
