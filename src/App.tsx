import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/services/auth-service';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeProviderExtended } from "@/components/ui/theme-provider-extended";

// Simplified routing for available pages
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AnnualSummary from '@/pages/food/AnnualSummary';
import ControlCentre from '@/pages/ControlCentre';
import WagesDashboard from '@/pages/wages/WagesDashboard';
import Index from '@/pages/Index';
import ProfilePage from '@/pages/ProfilePage';

// Import PL dashboard component
import PLDashboard from '@/pages/pl/Dashboard';

// Import Performance and Team components
import PerformanceDashboard from '@/pages/performance/Dashboard';
import TeamDashboard from '@/pages/team/Dashboard';
import TeamNoticeboard from '@/pages/team/Noticeboard';
import TeamChat from '@/pages/team/Chat';
import TeamKnowledge from '@/pages/team/Knowledge';
import Hospitality from '@/pages/team/Hospitality';

const queryClient = new QueryClient();

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Delay the rendering of the Auth component to avoid hydration issues
    const timer = setTimeout(() => {
      setShowAuth(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <span className="loading loading-ring loading-lg"></span>
    </div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Router>
          <ThemeProviderExtended>
            <Routes>
              {/* Root route with redirect */}
              <Route path="/" element={<Index />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
              
              {/* Profile Route */}
              <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
              
              {/* App Routes - All wrapped with Layout */}
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              
              {/* Control Centre Route - Ensuring it's directly under Layout */}
              <Route path="/control-centre" element={<Layout><ControlCentre /></Layout>} />
              
              {/* Food Module Routes */}
              <Route path="/food/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/food/input-settings" element={<Layout><Dashboard /></Layout>} />
              <Route path="/food/month/:year/:month" element={<Layout><Dashboard /></Layout>} />
              <Route path="/food/annual-summary" element={<Layout><AnnualSummary /></Layout>} />
              <Route path="/food/bible" element={<Layout><Dashboard /></Layout>} />
              
              {/* Beverage Module Routes */}
              <Route path="/beverage/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/beverage/input-settings" element={<Layout><Dashboard /></Layout>} />
              <Route path="/beverage/month/:year/:month" element={<Layout><Dashboard /></Layout>} />
              <Route path="/beverage/annual-summary" element={<Layout><AnnualSummary /></Layout>} />
              <Route path="/beverage/bible" element={<Layout><Dashboard /></Layout>} />
              
              {/* Master Module Routes */}
              <Route path="/master/dashboard" element={<Layout><Dashboard /></Layout>} />
              
              {/* P&L Module Routes - Ensure we're using the correct component */}
              <Route path="/pl/dashboard" element={<Layout><PLDashboard /></Layout>} />
              
              {/* Wages Module Routes */}
              <Route path="/wages/dashboard" element={<Layout><WagesDashboard /></Layout>} />
              
              {/* Performance Module Routes - Fix to use proper component */}
              <Route path="/performance/dashboard" element={<Layout><PerformanceDashboard /></Layout>} />
              
              {/* Team Module Routes - Fix to use proper components */}
              <Route path="/team/dashboard" element={<Layout><TeamDashboard /></Layout>} />
              <Route path="/team/noticeboard" element={<Layout><TeamNoticeboard /></Layout>} />
              <Route path="/team/chat" element={<Layout><TeamChat /></Layout>} />
              <Route path="/team/knowledge" element={<Layout><TeamKnowledge /></Layout>} />
              <Route path="/team/hospitality" element={<Layout><Hospitality /></Layout>} />
              
              {/* Not Found Route - Must be last */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
            <Toaster richColors />
          </ThemeProviderExtended>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
