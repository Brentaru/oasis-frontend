const STORAGE_KEYS = ['localStorage', 'sessionStorage'];

export function getStoredAuth() {
  for (const key of STORAGE_KEYS) {
    const storage = getStorage(key);
    if (!storage) {
      continue;
    }

    const token = storage.getItem('token');
    const userId = storage.getItem('userId') || getUserId(storage.getItem('user'));

    if (token || userId) {
      return { storage, token, userId };
    }
  }

  return { storage: null, token: '', userId: '' };
}

export function isAuthenticated() {
  const { token } = getStoredAuth();
  return Boolean(token);
}

export function clearAuthSession() {
  for (const key of STORAGE_KEYS) {
    const storage = getStorage(key);
    if (!storage) {
      continue;
    }

    storage.removeItem('user');
    storage.removeItem('token');
    storage.removeItem('userId');
  }
}

function getStorage(key) {
  if (typeof window === 'undefined') {
    return null;
  }

  return key === 'localStorage' ? window.localStorage : window.sessionStorage;
}

function getUserId(rawUser) {
  if (!rawUser) {
    return '';
  }

  try {
    const user = JSON.parse(rawUser);
    return user?.id || user?.userId || user?.user_id || '';
  } catch {
    return '';
  }
}
