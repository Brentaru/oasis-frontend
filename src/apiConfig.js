const DEFAULT_RENDER_BACKEND = 'https://oasis-backend-zfr5.onrender.com/api';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : DEFAULT_RENDER_BACKEND)
).replace(/\/$/, '');

export async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
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
