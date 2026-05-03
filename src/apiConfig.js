const DEFAULT_RENDER_BACKEND = 'https://oasis-backend-zfr5.onrender.com/api';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : DEFAULT_RENDER_BACKEND)
).replace(/\/$/, '');

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function apiAssetUrl(path) {
  if (ABSOLUTE_URL_PATTERN.test(API_BASE_URL)) {
    return apiUrl(path);
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${apiUrl(path)}`;
  }

  return apiUrl(path);
}

export function proxyMangaDexImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    const host = url.hostname.toLowerCase();
    const isMangaDexImage = host === 'uploads.mangadex.org' || host.endsWith('.mangadex.network');
    if (!isMangaDexImage) {
      return imageUrl;
    }

    return apiAssetUrl(`/sources/mangadex/image?url=${encodeURIComponent(imageUrl)}`);
  } catch {
    return imageUrl;
  }
}

export async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data?.message;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return data;
}
