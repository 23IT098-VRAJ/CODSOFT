import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AppShell from './components/AppShell';
import { PageTransition } from './components/motion';
import { PageLoader } from './components/ui';

// Each page is its own chunk, downloaded when first visited.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const ProjectForm = lazy(() => import('./pages/ProjectForm'));
const ProjectBoard = lazy(() => import('./pages/ProjectBoard'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// The animation engine is fetched as its own chunk after first paint. Every
// component uses the light `m` element; `strict` makes an accidental import
// of the full `motion` element throw during development.
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

// Signed-in pages: redirect visitors to the login page (remembering where
// they were going) and wrap the page in the app shell.
function Private({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function Home() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function PageRoutes({ location }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<ProjectBoard />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Everything else lives inside the shell, which stays put while
            the page inside it cross-fades. */}
        <Route
          path="*"
          element={
            <Private>
              <AppShell>
                <PageTransition render={(location) => <PageRoutes location={location} />} />
              </AppShell>
            </Private>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LazyMotion features={loadMotionFeatures} strict>
        {/* reducedMotion="user": people who ask their system for less motion
            get fades only — movement animations are switched off. */}
        <MotionConfig reducedMotion="user">
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ToastProvider>
        </MotionConfig>
      </LazyMotion>
    </BrowserRouter>
  );
}
