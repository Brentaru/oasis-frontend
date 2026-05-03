import { fetchJson, proxyMangaDexImageUrl } from './apiConfig';

const BOOKMARKS_KEY = 'oasis.bookmarks';
const HISTORY_KEY = 'oasis.history';

function currentUserId() {
  try {
    const localUserId = localStorage.getItem('userId') || getUserId(localStorage.getItem('user'));
    const sessionUserId = sessionStorage.getItem('userId') || getUserId(sessionStorage.getItem('user'));
    return localUserId || sessionUserId || '';
  } catch {
    return '';
  }
}

function getUserId(rawUser) {
  if (!rawUser) return '';
  try {
    const user = JSON.parse(rawUser);
    return user?.id || user?.userId || user?.user_id || '';
  } catch {
    return '';
  }
}

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeList(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function getBookmarks() {
  return readList(BOOKMARKS_KEY).map(normalizeStoredImages);
}

export async function fetchBookmarks() {
  const userId = currentUserId();
  if (!userId) {
    return getBookmarks();
  }

  const items = (await fetchJson(`/account-library/${encodeURIComponent(userId)}/saved`)).map(normalizeStoredImages);
  writeList(BOOKMARKS_KEY, items);
  return items;
}

export function isBookmarked(seriesId) {
  return getBookmarks().some((item) => item.seriesId === seriesId);
}

export function saveBookmark(series) {
  const current = getBookmarks().filter((item) => item.seriesId !== series.seriesId);
  const next = [{ ...series, savedAt: new Date().toISOString() }, ...current];
  writeList(BOOKMARKS_KEY, next);
  return next;
}

export async function saveBookmarkRemote(series) {
  const userId = currentUserId();
  const local = saveBookmark(series);
  if (!userId) {
    return local;
  }

  await fetchJson(`/account-library/${encodeURIComponent(userId)}/saved`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(series)
  });
  return fetchBookmarks();
}

export function removeBookmark(seriesId) {
  const next = getBookmarks().filter((item) => item.seriesId !== seriesId);
  writeList(BOOKMARKS_KEY, next);
  return next;
}

export async function removeBookmarkRemote(seriesId) {
  const userId = currentUserId();
  const local = removeBookmark(seriesId);
  if (!userId) {
    return local;
  }

  await fetchJson(`/account-library/${encodeURIComponent(userId)}/saved/${encodeURIComponent(seriesId)}`, {
    method: 'DELETE'
  });
  return fetchBookmarks();
}

export function toggleBookmark(series) {
  if (isBookmarked(series.seriesId)) {
    return { saved: false, items: removeBookmark(series.seriesId) };
  }

  return { saved: true, items: saveBookmark(series) };
}

export async function toggleBookmarkRemote(series) {
  if (isBookmarked(series.seriesId)) {
    return { saved: false, items: await removeBookmarkRemote(series.seriesId) };
  }

  return { saved: true, items: await saveBookmarkRemote(series) };
}

export function getHistory() {
  const rows = readList(HISTORY_KEY);
  const bySeries = new Map();

  for (const item of rows) {
    if (!item?.seriesId) {
      continue;
    }

    const existing = bySeries.get(item.seriesId);
    const existingTime = existing?.readAt ? new Date(existing.readAt).getTime() : 0;
    const itemTime = item?.readAt ? new Date(item.readAt).getTime() : 0;

    if (!existing || itemTime >= existingTime) {
      bySeries.set(item.seriesId, item);
    }
  }

  return [...bySeries.values()].sort((a, b) => {
    return new Date(b.readAt || 0).getTime() - new Date(a.readAt || 0).getTime();
  });
}

export async function fetchHistory() {
  const userId = currentUserId();
  if (!userId) {
    return getHistory();
  }

  const items = (await fetchJson(`/account-library/${encodeURIComponent(userId)}/history`)).map((item) => normalizeStoredImages({
    ...item,
    readAt: item.updatedAt,
    lastReadPage: item.lastReadPage || 1
  }));
  writeList(HISTORY_KEY, items);
  return getHistory();
}

export function saveHistory(entry) {
  const current = getHistory().filter((item) => item.seriesId !== entry.seriesId);

  const next = [{ ...entry, readAt: new Date().toISOString() }, ...current].slice(0, 30);
  writeList(HISTORY_KEY, next);
  return next;
}

export async function saveHistoryRemote(entry) {
  const userId = currentUserId();
  const local = saveHistory(entry);
  if (!userId) {
    return local;
  }

  await fetchJson(`/account-library/${encodeURIComponent(userId)}/history`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...entry,
      lastReadPage: entry.lastReadPage || 1
    })
  });
  return fetchHistory();
}

export function getLatestHistoryItem() {
  return getHistory()[0] || null;
}

function normalizeStoredImages(item) {
  return {
    ...item,
    coverImage: proxyMangaDexImageUrl(item.coverImage)
  };
}
