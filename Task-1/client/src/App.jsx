import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { PageLoader, ScrollToTop } from './components/ui';
import { BackToTop, MobileDock, PageTransition, ScrollProgress } from './components/motion/chrome';

// Each page is its own chunk, downloaded only when first visited.
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));

const authed = (page) => <ProtectedRoute>{page}</ProtectedRoute>;
const admin = (page) => <ProtectedRoute adminOnly>{page}</ProtectedRoute>;

// The animation engine is fetched as its own chunk after first paint. Every
// component uses the tiny `m` element; `strict` makes an accidental import of
// the full `motion` element throw in development instead of silently adding
// ~30 kB back to the bundle.
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

function AppRoutes({ location }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/checkout" element={authed(<Checkout />)} />
        <Route path="/orders" element={authed(<Orders />)} />
        <Route path="/orders/:id" element={authed(<OrderDetail />)} />
        <Route path="/wishlist" element={authed(<Wishlist />)} />
        <Route path="/profile" element={authed(<Profile />)} />

        <Route path="/admin" element={admin(<AdminDashboard />)} />
        <Route path="/admin/products" element={admin(<AdminProducts />)} />
        <Route path="/admin/orders" element={admin(<AdminOrders />)} />
        <Route path="/admin/users" element={admin(<AdminUsers />)} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LazyMotion features={loadMotionFeatures} strict>
        {/* reducedMotion="user": anyone whose system asks for less motion gets
            fades only — every movement animation in the app is switched off. */}
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ScrollToTop />
                  <ScrollProgress />
                  <div className="min-h-screen flex flex-col pb-20 md:pb-0">
                    <Navbar />
                    <main className="flex-1">
                      <PageTransition render={(location) => <AppRoutes location={location} />} />
                    </main>
                    <Footer />
                  </div>
                  <BackToTop />
                  <MobileDock />
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </MotionConfig>
      </LazyMotion>
    </ErrorBoundary>
  );
}
