import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'motion/react';
import { ChevronDown, Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingCart, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { DUR, EASE_IN_OUT, POP, PRESS, SPRING_LAYOUT, T_STATE } from '../lib/motion';

// A nav link whose gold underline slides to the active item (shared layoutId).
function NavItem({ to, children }) {
  return (
    <NavLink to={to} className="relative py-1 text-sm font-medium">
      {({ isActive }) => (
        <>
          <span className={`transition ${isActive ? 'text-vividGold' : 'text-gray-300 hover:text-vividGold'}`}>{children}</span>
          {isActive && <m.span layoutId="nav-underline" className="absolute -bottom-0.5 inset-x-0 h-0.5 rounded-full bg-vividGold" transition={SPRING_LAYOUT} />}
        </>
      )}
    </NavLink>
  );
}

// A count bubble that pops every time its number changes.
function Counter({ value }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {value > 0 && (
        <m.span
          key={value}
          {...POP}
          className="absolute -top-0.5 -right-0.5 bg-vividGold text-midnight rounded-full text-[10px] min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center font-bold"
        >
          {value}
        </m.span>
      )}
    </AnimatePresence>
  );
}

function SearchBox({ className = '', onDone }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [term, setTerm] = useState(params.get('q') || '');

  // Keep the box in sync when the URL changes (back button, cleared filters).
  useEffect(() => {
    setTerm(location.pathname === '/products' ? params.get('q') || '' : '');
  }, [location.pathname, params]);

  const submit = (e) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    onDone?.();
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search products, brands…"
        aria-label="Search products"
        className="w-full bg-white/10 text-pureWhite placeholder:text-gray-400 rounded-full pl-10 pr-4 py-2 text-sm outline-none border border-transparent focus:border-vividGold focus:bg-white/15 transition"
      />
    </form>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount, clearCart } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  // Scroll behaviour: the bar slides away while reading down the page and
  // returns the moment the user scrolls up; once off the top it turns to
  // frosted glass.
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    setHidden(y > previous && y > 160);
  });
  const tucked = hidden && !menuOpen && !accountOpen;

  // Close menus on navigation and when clicking outside the account menu.
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location]);

  useEffect(() => {
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    clearCart();
    navigate('/');
  };

  const iconBtn = 'relative p-2 text-gray-300 hover:text-vividGold transition';
  const mobileLink = ({ isActive }) => `text-sm font-medium ${isActive ? 'text-vividGold' : 'text-gray-300'}`;

  return (
    <m.header
      animate={{ y: tucked ? '-100%' : '0%' }}
      transition={{ duration: DUR.state, ease: EASE_IN_OUT }}
      className={`sticky top-0 z-50 ${scrolled ? 'bg-midnight/85 backdrop-blur-lg shadow-lg' : 'bg-midnight'}`}
    >
      <div className="container-page h-16 flex items-center gap-4">
        <Link to="/" className="text-vividGold font-extrabold text-xl tracking-tight shrink-0">
          <m.span className="inline-block" whileTap={PRESS}>ShopIndi</m.span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-4" aria-label="Main">
          <NavItem to="/products">Products</NavItem>
          {user && <NavItem to="/orders">Orders</NavItem>}
          {isAdmin && <NavItem to="/admin">Admin</NavItem>}
        </nav>

        <SearchBox className="hidden md:block flex-1 max-w-md mx-auto" />

        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <Link to="/wishlist" className={iconBtn} aria-label={`Wishlist, ${wishlist.count} items`}>
            <Heart className="w-5 h-5" />
            <Counter value={wishlist.count} />
          </Link>
          <Link to="/cart" className={iconBtn} aria-label={`Cart, ${cartCount} items`}>
            <ShoppingCart className="w-5 h-5" />
            <Counter value={cartCount} />
          </Link>

          {user ? (
            <div className="relative hidden md:block ml-2" ref={accountRef}>
              <button onClick={() => setAccountOpen((o) => !o)} aria-expanded={accountOpen} aria-haspopup="menu"
                className="flex items-center gap-2 text-sm text-gray-200 hover:text-vividGold transition">
                <span className="w-8 h-8 rounded-full bg-vividGold text-midnight font-bold flex items-center justify-center">
                  {user.name?.[0]?.toUpperCase()}
                </span>
                <span className="max-w-[7rem] truncate font-medium">{user.name}</span>
                <m.span animate={{ rotate: accountOpen ? 180 : 0 }} transition={T_STATE}><ChevronDown className="w-4 h-4" /></m.span>
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <m.div role="menu"
                    {...POP}
                    className="absolute right-0 mt-3 w-52 card py-1.5 text-sm shadow-lg origin-top-right">
                    <p className="px-4 py-2 text-xs text-smoke truncate border-b border-parchment mb-1">{user.email}</p>
                    <Link role="menuitem" to="/profile" className="flex items-center gap-2.5 px-4 py-2 hover:bg-warmIvory"><User className="w-4 h-4" /> My profile</Link>
                    <Link role="menuitem" to="/orders" className="flex items-center gap-2.5 px-4 py-2 hover:bg-warmIvory"><Package className="w-4 h-4" /> My orders</Link>
                    {isAdmin && <Link role="menuitem" to="/admin" className="flex items-center gap-2.5 px-4 py-2 hover:bg-warmIvory"><LayoutDashboard className="w-4 h-4" /> Admin panel</Link>}
                    <button role="menuitem" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Log out</button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="btn-primary hidden md:inline-flex ml-2 !py-2">Log in</Link>
          )}

          <button onClick={() => setMenuOpen((o) => !o)} className={`${iconBtn} md:hidden`} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — height animates open and closed */}
      <AnimatePresence initial={false}>
        {menuOpen && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR.state, ease: EASE_IN_OUT }}
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              <SearchBox onDone={() => setMenuOpen(false)} />
              <nav className="flex flex-col gap-3" aria-label="Mobile">
                <NavLink to="/products" className={mobileLink}>Products</NavLink>
                {user && <NavLink to="/orders" className={mobileLink}>My orders</NavLink>}
                {user && <NavLink to="/profile" className={mobileLink}>My profile</NavLink>}
                {isAdmin && <NavLink to="/admin" className={mobileLink}>Admin panel</NavLink>}
                {user ? (
                  <button onClick={handleLogout} className="text-left text-sm font-medium text-red-400">Log out</button>
                ) : (
                  <Link to="/login" className="btn-primary w-full">Log in</Link>
                )}
              </nav>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  );
}
