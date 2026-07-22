import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useState, useEffect } from 'react';
import { initAlarmService } from '@/lib/alarmService';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { UnitsProvider } from '@/lib/unitsContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Lines from '@/pages/Lines';
import Reels from '@/pages/Reels';
import Rods from '@/pages/Rods';
import About from '@/pages/About';
import Settings from '@/pages/Settings';
import Catches from '@/pages/Catches';
import Lures from '@/pages/Lures';
import Misc from '@/pages/Misc';
import Moon from '@/pages/Moon';
import Weather from '@/pages/Weather';
import Gear from '@/pages/Gear';
import MapView from '@/pages/MapView';
import RiverConditions from '@/pages/RiverConditions';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [didInitialRedirect, setDidInitialRedirect] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings && !authError && !didInitialRedirect) {
      setDidInitialRedirect(true);
      navigate("/", { replace: true });
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError, didInitialRedirect, navigate]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/lines" element={<Lines />} />
        <Route path="/reels" element={<Reels />} />
        <Route path="/rods" element={<Rods />} />
        <Route path="/catches" element={<Catches />} />
        <Route path="/lures" element={<Lures />} />
        <Route path="/misc" element={<Misc />} />
        <Route path="/moon" element={<Moon />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/river" element={<RiverConditions />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/gear" element={<Navigate to="/gear/lines" replace />} />
        <Route path="/gear/:tab" element={<Gear />} />
      </Route>
      {/* MapView renders its own full-screen layout (including its own BottomTabBar), so it sits outside the shared <Layout> shell. */}
      <Route path="/map" element={<MapView />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    // Client-side immediate alarm fallback (sound + Notification while this
    // tab is open) — complements the server-side checkAlarms push pipeline,
    // which covers the case where no tab is open.
    initAlarmService();
  }, []);

  return (
    <AuthProvider>
      <UnitsProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </UnitsProvider>
    </AuthProvider>
  )
}

export default App