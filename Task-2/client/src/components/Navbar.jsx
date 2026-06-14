import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MemberAvatar from './MemberAvatar';

export const NAVBAR_HEIGHT = 'pt-14';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-[#E5E2DC] z-40">
      <div className="flex items-center justify-between px-6 h-14">
        {/* LEFT: Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <span className="text-base font-semibold tracking-tight text-[#1A1917]">TaskFlow</span>
        </button>

        {/* CENTER: Nav links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm transition-colors ${
                isActive ? 'text-[#1A1917] font-medium' : 'text-[#8A8680] font-medium hover:text-[#1A1917]'
              }`
            }
          >
            Dashboard
          </NavLink>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects/new')}
            className="hidden sm:flex border border-[#1A1917] text-[#1A1917] text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-[#1A1917] hover:text-white transition-all duration-150 items-center gap-1"
          >
            <span>+</span> New Project
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <MemberAvatar user={user} size="md" />
              <span className="hidden sm:block text-sm text-[#4B4845]">{user.name}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Logout"
            className="text-[#8A8680] hover:text-[#1A1917] transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
