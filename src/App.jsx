import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Gear from '@/pages/Gear';
import About from '@/pages/About';
import Settings from '@/pages/Settings';
import Catches from '@/pages/Catches';
import CatchDetail from '@/pages/CatchDetail';
import Moon from '@/pages/Moon';
import Weather from '@/pages/Weather';
import MapView from '@/pages/MapView';
// Add page imports here
import { initAlarmService } from '@/lib/alarmService';
import PushNotificationManager from '@/components/PushNotificationManager';

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
        <Route path="/gear" element={<Navigate to="/gear/lines" replace />} />
        <Route path="/gear/:tab" element={<Gear />} />
        <Route path="/lines" element={<Navigate to="/gear/lines" replace />} />
        <Route path="/reels" element={<Navigate to="/gear/reels" replace />} />
        <Route path="/rods" element={<Navigate to="/gear/rods" replace />} />
        <Route path="/lures" element={<Navigate to="/gear/lures" replace />} />
        <Route path="/misc" element={<Navigate to="/gear/misc" replace />} />
        <Route path="/catches" element={<Catches />} />
        <Route path="/catches/:id" element={<CatchDetail />} />
        <Route path="/moon" element={<Moon />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  useEffect(() => {
    initAlarmService();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <PushNotificationManager />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App