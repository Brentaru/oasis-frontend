import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchBookmarks, fetchHistory } from '../readingStore';
import { API_BASE_URL } from '../apiConfig';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    profilePhoto: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);
  const [preferences, setPreferences] = useState({
    readingMode: localStorage.getItem('oasis.readingMode') || 'vertical',
    startPage: localStorage.getItem('oasis.startPage') || 'home'
  });

  const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
  let user = {};
  try {
    user = JSON.parse(userRaw);
  } catch {
    user = {};
  }

  const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  const userId = storedUserId || user.userId || user.id || user._id;
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchProfile();
    loadAccountStats();
  }, [userId]);

  const loadAccountStats = async () => {
    try {
      const [savedTitles, recentHistory] = await Promise.all([
        fetchBookmarks(),
        fetchHistory()
      ]);
      setBookmarks(savedTitles);
      setHistory(recentHistory);
    } catch (error) {
      console.error('Unable to load profile stats:', error);
    }
  };

  const getProfilePhotoSrc = (data) => {
    const rawPhoto = data?.profilePhoto || data?.data?.profilePhoto || '';
    if (typeof rawPhoto !== 'string') {
      return '';
    }
    return rawPhoto.trim();
  };

  const parseResponse = async (response) => {
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return data;
  };

  const fetchProfile = async () => {
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}`, { headers });
      const data = await parseResponse(response);

      if (!response.ok) {
        const errorMsg = typeof data === 'string' ? data : (data?.message || 'Failed to fetch profile');
        throw new Error(errorMsg);
      }

      const profilePhoto = getProfilePhotoSrc(data);

      setProfile({
        fullName: data?.fullName || '',
        email: data.email || '',
        profilePhoto
      });
      syncStoredUser({
        fullName: data?.fullName || '',
        email: data.email || '',
        profilePhoto
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = () => {
    if (!profile.fullName.trim()) {
      setMessage({ type: 'error', text: 'Full name is required' });
      return false;
    }

    if (!profile.email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return false;
    }

    if (!profile.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email' });
      return false;
    }

    return true;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfile()) return;

    setSavingProfile(true);
    setMessage({ type: '', text: '' });

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          fullName: profile.fullName.trim(),
          email: profile.email.trim(),
          phone: '',
          bio: ''
        })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        const errorMsg = typeof data === 'string' ? data : (data?.message || 'Failed to update profile');
        throw new Error(errorMsg);
      }

      await fetchProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match' });
      return;
    }

    setSavingPassword(true);
    setMessage({ type: '', text: '' });

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}/password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword
        })
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        const errorMsg = typeof data === 'string' ? data : (data?.message || 'Failed to change password');
        throw new Error(errorMsg);
      }

      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Please choose an image file' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setMessage({ type: '', text: '' });

    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}/photo`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        const errorMsg = typeof data === 'string' ? data : (data?.message || 'Failed to upload photo');
        throw new Error(errorMsg);
      }

      const uploadedPhoto = (typeof data?.fileReference === 'string' ? data.fileReference.trim() : '');
      if (uploadedPhoto) {
        setProfile((prev) => ({ ...prev, profilePhoto: uploadedPhoto }));
        syncStoredUser({ fullName: profile.fullName, email: profile.email, profilePhoto: uploadedPhoto });
      }

      await fetchProfile();
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      e.target.value = '';
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setMessage({ type: 'error', text: 'Cannot connect to the Oasis backend. Please check the deployed backend URL.' });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  const displayName = profile.fullName?.trim()
    || profile.email?.trim()?.split('@')[0]
    || 'User';
  const handlePreferenceChange = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    localStorage.setItem(`oasis.${key}`, value);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your Oasis account? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setMessage({ type: '', text: '' });

    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        method: 'DELETE',
        headers
      });
      const data = await parseResponse(response);

      if (!response.ok) {
        const errorMsg = typeof data === 'string' ? data : (data?.message || 'Failed to delete account');
        throw new Error(errorMsg);
      }

      localStorage.clear();
      sessionStorage.clear();
      navigate('/login', { replace: true });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="profile-page">
      <Navbar />

      <main className="profile-container">
        <p className="profile-kicker">Reader Account</p>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Tune your Oasis reading space and account access.</p>

        {message.text && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="profile-grid">
          <aside className="profile-left">
            <div className="profile-card avatar-card">
              <div className="avatar-wrap">
                <div className="profile-avatar">
                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt="Profile"
                      onError={() => setProfile((prev) => ({ ...prev, profilePhoto: '' }))}
                    />
                  ) : (
                    <span>{initials(displayName)}</span>
                  )}
                </div>
                <label className="avatar-edit" title="Change photo">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    hidden
                  />
                </label>
              </div>
              <h2 className="profile-name">{displayName}</h2>
              <p className="profile-email">{profile.email}</p>

              <div className="stats-grid">
                <div>
                  <span>{bookmarks.length}</span>
                  <p>Saved</p>
                </div>
                <div>
                  <span>{history.length}</span>
                  <p>Reading</p>
                </div>
                <div>
                  <span>{preferences.readingMode === 'single' ? 'Page' : 'Vertical'}</span>
                  <p>Mode</p>
                </div>
              </div>
            </div>

            <div className="profile-card reading-card">
              <h3>Reading Setup</h3>
              <div className="field-group">
                <label>Reader Mode</label>
                <div className="segmented-control">
                  <button className={preferences.readingMode === 'vertical' ? 'active' : ''} onClick={() => handlePreferenceChange('readingMode', 'vertical')}>Vertical</button>
                  <button className={preferences.readingMode === 'single' ? 'active' : ''} onClick={() => handlePreferenceChange('readingMode', 'single')}>Page</button>
                </div>
              </div>
              <div className="field-group">
                <label>Start Page</label>
                <select
                  value={preferences.startPage}
                  onChange={(e) => handlePreferenceChange('startPage', e.target.value)}
                >
                  <option value="home">Home</option>
                  <option value="library">Library</option>
                  <option value="browse">Browse</option>
                </select>
              </div>
            </div>
          </aside>

          <section className="profile-right">
            <div className="profile-card account-card">
              <h3>Account Details</h3>
              <div className="two-field-grid">
                <div className="field-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="field-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="button-row">
                <button className="btn btn-ghost" onClick={fetchProfile}>Discard</button>
                <button className="btn btn-primary" onClick={handleUpdateProfile} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>

            <div className="profile-card security-card">
              <h3>Security</h3>
              <div className="two-field-grid">
                <div className="field-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="field-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div className="field-group half-width">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
              </div>
              <div className="button-row">
                <button className="btn btn-primary" onClick={handleChangePassword} disabled={savingPassword}>
                  {savingPassword ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </div>

            <div className="profile-card danger-card">
              <h3>Danger Zone</h3>
              <p>Deleting your account will remove access to your saved profile data.</p>
              <div className="button-row">
                <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deletingAccount}>
                  {deletingAccount ? 'Deleting...' : 'Delete account'}
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
}

function syncStoredUser(updates) {
  const keys = ['localStorage', 'sessionStorage'];
  for (const key of keys) {
    const storage = key === 'localStorage' ? localStorage : sessionStorage;
    const raw = storage.getItem('user');
    if (!raw) {
      continue;
    }

    try {
      const current = JSON.parse(raw) || {};
      storage.setItem('user', JSON.stringify({ ...current, ...updates }));
    } catch {
      storage.setItem('user', JSON.stringify(updates));
    }
  }

  window.dispatchEvent(new Event('oasis:user-updated'));
}

export default Profile;
