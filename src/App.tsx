
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

// Import Food and Beverage specific routes
import FoodInputSettings from '@/pages/food/InputSettings';
import BeverageInputSettings from '@/pages/beverage/InputSettings';
import FoodMonthSummary from '@/pages/food/MonthSummary';
import BeverageMonthSummary from '@/pages/beverage/MonthSummary';
import FoodBible from '@/pages/food/FoodBible';
import BeverageBible from '@/pages/beverage/BeverageBible';
import FoodWeeklyTracker from '@/pages/food/WeeklyTracker';
import BeverageWeeklyTracker from '@/pages/beverage/WeeklyTracker';

// Import Master components
import MasterDashboard from '@/pages/master/Dashboard';
import MasterMonthSummary from '@/pages/master/MonthSummary';
import MasterWeeklyInput from '@/pages/master/WeeklyInput';

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
              
              {/* Control Centre Route */}
              <Route path="/control-centre" element={<Layout><ControlCentre /></Layout>} />
              
              {/* Food Module Routes - Fix all food routes to point to correct components */}
              <Route path="/food/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/food/input-settings" element={<Layout><FoodInputSettings /></Layout>} />
              <Route path="/food/month/:year/:month" element={<Layout><FoodMonthSummary /></Layout>} />
              <Route path="/food/annual-summary" element={<Layout><AnnualSummary /></Layout>} />
              <Route path="/food/bible" element={<Layout><FoodBible /></Layout>} />
              <Route path="/food/weekly-tracker" element={<Layout><FoodWeeklyTracker /></Layout>} />
              
              {/* Beverage Module Routes - Fix all beverage routes to point to correct components */}
              <Route path="/beverage/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/beverage/input-settings" element={<Layout><BeverageInputSettings /></Layout>} />
              <Route path="/beverage/month/:year/:month" element={<Layout><BeverageMonthSummary /></Layout>} />
              <Route path="/beverage/annual-summary" element={<Layout><AnnualSummary /></Layout>} />
              <Route path="/beverage/bible" element={<Layout><BeverageBible /></Layout>} />
              <Route path="/beverage/weekly-tracker" element={<Layout><BeverageWeeklyTracker /></Layout>} />
              
              {/* Master Module Routes - Fix daily info routes */}
              <Route path="/master/dashboard" element={<Layout><MasterDashboard /></Layout>} />
              <Route path="/master/month-summary" element={<Layout><MasterMonthSummary /></Layout>} />
              <Route path="/master/weekly-input" element={<Layout><MasterWeeklyInput /></Layout>} />
              
              {/* P&L Module Routes */}
              <Route path="/pl/dashboard" element={<Layout><PLDashboard /></Layout>} />
              
              {/* Wages Module Routes */}
              <Route path="/wages/dashboard" element={<Layout><WagesDashboard /></Layout>} />
              
              {/* Performance Module Routes */}
              <Route path="/performance/dashboard" element={<Layout><PerformanceDashboard /></Layout>} />
              
              {/* Team Module Routes */}
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
