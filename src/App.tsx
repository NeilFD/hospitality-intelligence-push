
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
              
              {/* App Routes - All wrapped with Layout */}
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
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
              <Route path="/beverage/annual-summary" element={<Layout><Dashboard /></Layout>} />
              <Route path="/beverage/bible" element={<Layout><Dashboard /></Layout>} />
              
              {/* Master Module Routes */}
              <Route path="/master/dashboard" element={<Layout><Dashboard /></Layout>} />
              
              {/* P&L Module Routes */}
              <Route path="/pl/dashboard" element={<Layout><Dashboard /></Layout>} />
              
              {/* Wages Module Routes */}
              <Route path="/wages/dashboard" element={<Layout><WagesDashboard /></Layout>} />
              
              {/* Performance Module Routes */}
              <Route path="/performance/dashboard" element={<Layout><Dashboard /></Layout>} />
              
              {/* Team Module Routes */}
              <Route path="/team/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/team/noticeboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/team/chat" element={<Layout><Dashboard /></Layout>} />
              <Route path="/team/knowledge" element={<Layout><Dashboard /></Layout>} />
              
              {/* Not Found Route */}
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
