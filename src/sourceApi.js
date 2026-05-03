import { fetchJson } from './apiConfig';

const MANGADEX_PREFIX = 'mangadex:';

export function isMangaDexSeries(seriesId) {
  return typeof seriesId === 'string' && seriesId.startsWith(MANGADEX_PREFIX);
}

export function getMangaDexId(seriesId) {
  return isMangaDexSeries(seriesId) ? seriesId.slice(MANGADEX_PREFIX.length) : seriesId;
}

export async function fetchLocalSeries() {
  return fetchJson('/library/series');
}

export async function fetchMangaDexSeries(query = '', limit = 24, filters = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query.trim()) {
    params.set('query', query.trim());
  }
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.contentRating) {
    params.set('contentRating', filters.contentRating);
  }
  if (filters.order) {
    params.set('order', filters.order);
  }

  return fetchJson(`/sources/mangadex/series?${params.toString()}`);
}

export async function fetchSeriesDetails(seriesId) {
  if (isMangaDexSeries(seriesId)) {
    const mangaId = encodeURIComponent(getMangaDexId(seriesId));
    return fetchJson(`/sources/mangadex/series/${mangaId}`);
  }

  return fetchJson(`/library/series/${encodeURIComponent(seriesId)}`);
}

export async function fetchChapters(seriesId) {
  if (isMangaDexSeries(seriesId)) {
    const mangaId = encodeURIComponent(getMangaDexId(seriesId));
    return fetchJson(`/sources/mangadex/series/${mangaId}/chapters`);
  }

  return fetchJson(`/library/series/${encodeURIComponent(seriesId)}/chapters`);
}

export async function fetchChapterPages(seriesId, chapterId) {
  if (isMangaDexSeries(seriesId)) {
    const mangaId = encodeURIComponent(getMangaDexId(seriesId));
    const encodedChapterId = encodeURIComponent(chapterId);
    return fetchJson(`/sources/mangadex/series/${mangaId}/chapters/${encodedChapterId}/pages`);
  }

  return fetchJson(`/reader/series/${encodeURIComponent(seriesId)}/chapters/${encodeURIComponent(chapterId)}/pages`);
}

export async function fetchChapterNavigation(seriesId, chapterId) {
  if (isMangaDexSeries(seriesId)) {
    const mangaId = encodeURIComponent(getMangaDexId(seriesId));
    const encodedChapterId = encodeURIComponent(chapterId);
    return fetchJson(`/sources/mangadex/series/${mangaId}/chapters/${encodedChapterId}/navigation`);
  }

  return fetchJson(`/reader/series/${encodeURIComponent(seriesId)}/chapters/${encodeURIComponent(chapterId)}/navigation`);
}
