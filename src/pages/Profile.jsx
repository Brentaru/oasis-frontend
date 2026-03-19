import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Profile.css';

const API_BASE_URL = '/api';

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
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
  }, [userId]);

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
        phone: data?.phone || '',
        bio: data?.bio || '',
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
          phone: profile.phone.trim(),
          bio: profile.bio.trim()
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
      }

      await fetchProfile();
      setMessage({ type: 'success', text: 'Photo uploaded successfully!' });
      e.target.value = '';
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setMessage({ type: 'error', text: 'Cannot connect to server. Make sure backend is running on localhost:8080' });
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

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <h1 className="page-title">Profile</h1>

        {message.text && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt="Profile"
                onError={() => setProfile((prev) => ({ ...prev, profilePhoto: '' }))}
              />
            ) : (
              <div className="avatar-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{displayName}</h2>
            <p className="profile-email">{profile.email}</p>
            <p className="profile-status">{profile.phone || 'No phone added'}</p>
          </div>
          <div className="profile-actions">
            <label className="btn btn-primary">
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                hidden
              />
            </label>
          </div>
        </div>

        <h2 className="section-heading">Account Settings</h2>

        <div className="preferences-grid">
          <div className="preference-card">
            <h3 className="card-title">Edit Profile</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                readOnly
                placeholder="Enter email"
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                rows="3"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Write a short bio"
              />
            </div>
            <button className="btn btn-primary" onClick={handleUpdateProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          <div className="preference-card">
            <h3 className="card-title">Change Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
            <button className="btn btn-primary" onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
