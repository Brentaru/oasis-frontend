import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../authSession';
import './ProfileMenu.css';

function ProfileMenu({ compact = false }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userVersion, setUserVersion] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const refreshUser = () => setUserVersion((version) => version + 1);

    window.addEventListener('storage', refreshUser);
    window.addEventListener('oasis:user-updated', refreshUser);
    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('oasis:user-updated', refreshUser);
    };
  }, []);

  const user = readStoredUser();
  void userVersion;
  const displayName = user.fullName || user.displayName || user.email || 'User';
  const photo = user.profilePhoto || user.profile_photo || '';

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`profile-menu ${compact ? 'compact' : ''}`} ref={dropdownRef}>
      <button
        className="profile-menu-btn"
        onClick={() => setShowDropdown((open) => !open)}
        title="Account"
      >
        {photo ? (
          <img src={photo} alt="" />
        ) : (
          <span>{initials(displayName)}</span>
        )}
      </button>

      {showDropdown && (
        <div className="profile-menu-dropdown">
          <button
            onClick={() => {
              setShowDropdown(false);
              navigate('/profile');
            }}
          >
            Profile
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

function readStoredUser() {
  const raw = localStorage.getItem('user') || sessionStorage.getItem('user') || '{}';
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
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

export default ProfileMenu;
