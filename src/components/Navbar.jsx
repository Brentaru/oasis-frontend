import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-logo">
          <img src="/oasis-mark.svg" alt="" />
          <span>Oasis</span>
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">Home</Link>
          <Link to="/library" className="nav-link">Library</Link>
          <Link to="/browse" className="nav-link">Browse</Link>
        </div>
      </div>

      <div className="navbar-right">
        <ProfileMenu />
      </div>
    </nav>
  );
}

export default Navbar;
