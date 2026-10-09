import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Landing from './pages/Landing.jsx';
import { Login, Register, Forgot, Reset } from './pages/AuthPages.jsx';
import Home from './pages/Home.jsx';
import StoryOverview from './pages/StoryOverview.jsx';
import Profile from './pages/Profile.jsx';

const CharacterCreation = lazy(() => import('./pages/CharacterCreation.jsx'));
const Play = lazy(() => import('./pages/Play.jsx'));
const AdminHome = lazy(() => import('./pages/admin/AdminHome.jsx'));
const StoryEditor = lazy(() => import('./pages/admin/StoryEditor.jsx'));
const EpisodeEditor = lazy(() => import('./pages/admin/EpisodeEditor.jsx'));

const Splash = () => <div className="splash"><div className="spinner" /></div>;

function Protected({ children }) {
  const { user, profile, loading, expired } = useAuth();
  const loc = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ expired }} />;
  if (!profile?.onboarded && loc.pathname !== '/create') return <Navigate to="/create" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/home" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight * 0.01;
      const vw = window.innerWidth * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--vw', `${vw}px`);
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
      document.documentElement.style.setProperty('--app-width', `${window.innerWidth}px`);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions, { passive: true });
    window.addEventListener('orientationchange', updateDimensions, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateDimensions, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateDimensions);
      }
    };
  }, []);

  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={!loading && user ? <Navigate to="/home" replace /> : <Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/create" element={<Protected><CharacterCreation /></Protected>} />
        <Route path="/home" element={<Protected><Home /></Protected>} />
        <Route path="/story/:storyId" element={<Protected><StoryOverview /></Protected>} />
        <Route path="/play/:storyId/:episodeId" element={<Protected><Play /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/settings" element={<Protected><Profile /></Protected>} />
        <Route path="/admin" element={<Protected><AdminOnly><AdminHome /></AdminOnly></Protected>} />
        <Route path="/admin/story/:storyId" element={<Protected><AdminOnly><StoryEditor /></AdminOnly></Protected>} />
        <Route path="/admin/story/:storyId/episode/:episodeId" element={<Protected><AdminOnly><EpisodeEditor /></AdminOnly></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
