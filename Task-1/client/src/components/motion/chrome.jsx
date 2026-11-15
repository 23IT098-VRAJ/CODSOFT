// App-wide motion "chrome": pieces that live outside any single page.
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, m, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { ArrowUp, Heart, Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { DUR, EASE_IN_OUT, POP, PRESS, SPRING_LAYOUT, markVisited } from '../../lib/motion';

// Scroll progress bar: fills as the page is scrolled. The spring smooths out
// wheel steps (scroll skill, recipe 1).
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  return <m.div aria-hidden="true" style={{ scaleX }} className="fixed top-0 inset-x-0 h-[3px] z-[70] origin-left bg-gradient-to-r from-vividGold via-amber-300 to-vividGold" />;
}

// Page changes cross-fade — opacity only, 150ms each way. App chrome never
// slides or scales, and `initial={false}` means the first page simply appears.
// `render` receives the location the page was mounted with, so a page that is
// fading out keeps showing its own route.
export function PageTransition({ render }) {
  const location = useLocation();

  // Remember each page once it has been left, so its scroll reveals do not
  // replay on the way back (see Reveal).
  useEffect(() => () => markVisited(location.pathname), [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DUR.page, ease: EASE_IN_OUT }}
      >
        {render(location)}
      </m.div>
    </AnimatePresence>
  );
}

// A floating "back to top" button that appears after scrolling down a screen.
export function BackToTop() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setVisible(y > 700));

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          {...POP}
          whileTap={PRESS}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed right-5 bottom-24 md:bottom-6 z-40 w-11 h-11 rounded-full bg-midnight text-vividGold shadow-lg flex items-center justify-center"
        >
          <ArrowUp className="w-5 h-5" />
        </m.button>
      )}
    </AnimatePresence>
  );
}

// Phone-only bottom navigation: a floating glass bar whose highlight glides
// between tabs (a shared layoutId on the layout spring).
export function MobileDock() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin')) return null; // the admin panel has its own tab bar

  const items = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/products', label: 'Shop', icon: LayoutGrid },
    { to: '/wishlist', label: 'Saved', icon: Heart },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { to: user ? '/profile' : '/login', label: user ? 'Me' : 'Log in', icon: User },
  ];

  return (
    <nav aria-label="Quick navigation" className="md:hidden fixed bottom-3 inset-x-3 z-50 rounded-2xl bg-midnight/90 backdrop-blur-lg shadow-2xl border border-white/10 px-2 py-1.5 flex justify-between">
      {items.map(({ to, label, icon: Icon, end, badge }) => (
        <NavLink key={label} to={to} end={end} className="relative flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold">
          {({ isActive }) => (
            <>
              {isActive && <m.span layoutId="dock-active" className="absolute inset-0 rounded-xl bg-white/10" transition={SPRING_LAYOUT} />}
              <m.span whileTap={PRESS} className={`relative ${isActive ? 'text-vividGold' : 'text-gray-300'}`}>
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-vividGold text-midnight rounded-full text-[9px] min-w-[1rem] h-4 px-1 flex items-center justify-center font-bold">{badge}</span>
                )}
              </m.span>
              <span className={`relative ${isActive ? 'text-vividGold' : 'text-gray-400'}`}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
