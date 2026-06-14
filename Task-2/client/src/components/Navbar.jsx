import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MemberAvatar from './MemberAvatar';

export const NAVBAR_HEIGHT = 'pt-16';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between px-6 h-16">
        {/* LEFT: Logo */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-bold text-xl text-gray-900 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          TaskFlow
        </button>

        {/* CENTER: Nav links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm font-medium transition ${
                isActive ? 'text-indigo-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
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
            className="hidden sm:flex bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition items-center gap-1"
          >
            <span>+</span> New Project
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <MemberAvatar user={user} size="md" />
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Logout"
            className="text-gray-400 hover:text-red-500 transition p-1"
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
