
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/services/auth-service';
import Layout from '@/components/Layout';  // Changed from { Layout } to default import
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
        <ThemeProviderExtended>
          <Router>
            <Layout>
              <Toaster richColors />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Dashboard />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
                
                {/* App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/control-centre" element={<ControlCentre />} />
                
                {/* Food Module Routes */}
                <Route path="/food/dashboard" element={<Dashboard />} />
                <Route path="/food/input-settings" element={<Dashboard />} />
                <Route path="/food/month/:year/:month" element={<Dashboard />} />
                <Route path="/food/annual-summary" element={<AnnualSummary />} />
                <Route path="/food/bible" element={<Dashboard />} />
                
                {/* Not Found Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </ThemeProviderExtended>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
