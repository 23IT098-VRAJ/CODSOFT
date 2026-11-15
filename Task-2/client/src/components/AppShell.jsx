import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'motion/react';
import { ChevronDown, LogOut, Plus, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { POP, SPRING_LAYOUT, T_STATE } from '../lib/motion';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-tasks', label: 'My tasks' },
];

// The frame around every signed-in page: a fixed top bar, then the page.
export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // The bar gains a shadow once the page has scrolled under it. State only
  // changes when the answer does, so scrolling does not re-render the app.
  const { scrollY } = useScroll();
  const [raised, setRaised] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setRaised(y > 4));

  useEffect(() => setMenuOpen(false), [location]);
  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className={`fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur border-b border-line transition-shadow ${raised ? 'shadow-card' : ''}`}>
        <div className="flex items-center gap-6 px-4 sm:px-6 h-14">
          <Link to="/dashboard" className="text-base font-semibold tracking-tight text-ink">TaskFlow</Link>

          <nav className="flex items-center gap-1" aria-label="Main">
            {LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className="relative px-3 py-1.5 text-sm font-medium">
                {({ isActive }) => (
                  <>
                    {/* the highlight glides between links */}
                    {isActive && <m.span layoutId="nav-pill" transition={SPRING_LAYOUT} className="absolute inset-0 bg-sunken rounded-lg" />}
                    <span className={`relative ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`}>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/projects/new" className="btn-outline !py-1.5 hidden sm:inline-flex"><Plus className="w-4 h-4" /> New project</Link>

            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-sunken">
                <Avatar user={user} />
                <span className="hidden sm:block text-sm text-ink-soft max-w-[9rem] truncate">{user?.name}</span>
                <m.span animate={{ rotate: menuOpen ? 180 : 0 }} transition={T_STATE}><ChevronDown className="w-4 h-4 text-muted" /></m.span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  // grows from the corner under its trigger, not from its own centre
                  <m.div role="menu" {...POP} className="absolute right-0 mt-2 w-52 card shadow-lift py-1.5 text-sm origin-top-right">
                    <p className="px-3 py-2 text-xs text-muted truncate border-b border-line mb-1">{user?.email}</p>
                    <Link role="menuitem" to="/profile" className="flex items-center gap-2.5 px-3 py-2 hover:bg-sunken"><UserRound className="w-4 h-4" /> Profile</Link>
                    <Link role="menuitem" to="/projects/new" className="flex sm:hidden items-center gap-2.5 px-3 py-2 hover:bg-sunken"><Plus className="w-4 h-4" /> New project</Link>
                    <button role="menuitem" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-danger hover:bg-danger-soft"><LogOut className="w-4 h-4" /> Log out</button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-14">{children}</main>
    </div>
  );
}
