import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/services/auth-service';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ThemeProviderExtended } from "@/components/ui/theme-provider-extended";
import { AuthProvider } from "@/contexts/AuthContext";

// Simplified routing for available pages
import Dashboard from '@/pages/Dashboard';
import FoodDashboard from '@/pages/food/Dashboard';
import BeverageDashboard from '@/pages/beverage/Dashboard';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AnnualSummary from '@/pages/food/AnnualSummary';
import ControlCentre from '@/pages/ControlCentre';
import WagesDashboard from '@/pages/wages/WagesDashboard';
import Index from '@/pages/Index';
import ProfilePage from '@/pages/ProfilePage';

// Import Home dashboard
import HomeDashboard from '@/pages/home/Dashboard';

// Import PL dashboard component
import PLDashboard from '@/pages/pl/Dashboard';
import WeeklyForecast from '@/pages/pl/WeeklyForecast';

// Import Performance and Team components
import PerformanceDashboard from '@/pages/performance/Dashboard';
import TeamDashboard from '@/pages/team/Dashboard';
import TeamNoticeboard from '@/pages/team/Noticeboard';
import TeamChat from '@/pages/team/Chat';
import TeamKnowledge from '@/pages/team/Knowledge';
import Hospitality from '@/pages/team/Hospitality';
import HospitalityBible from '@/pages/team/HospitalityBible';
import WageOptimization from '@/pages/performance/WageOptimization';

// Import Food and Beverage specific routes
import FoodInputSettings from '@/pages/food/InputSettings';
import BeverageInputSettings from '@/pages/beverage/InputSettings';
import FoodMonthSummary from '@/pages/food/MonthSummary';
import BeverageMonthSummary from '@/pages/beverage/MonthSummary';
import FoodBible from '@/pages/food/FoodBible';
import BeverageBible from '@/pages/beverage/BeverageBible';
import FoodWeeklyTracker from '@/pages/food/WeeklyTracker';
import BeverageWeeklyTracker from '@/pages/beverage/WeeklyTracker';
import WeeklyTracker from '@/pages/WeeklyTracker';

// Import Master components
import MasterDashboard from '@/pages/master/Dashboard';
import MasterMonthSummary from '@/pages/master/MonthSummary';
import MasterWeeklyInput from '@/pages/master/WeeklyInput';

// Import Food & Beverage Forecast page
import FoodBeverageForecast from '@/pages/pl/FoodBeverageForecast';

const queryClient = new QueryClient();

function App() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Load user data when the app initializes
    loadUser();
    
    // Delay the rendering of the Auth component to avoid hydration issues
    const timer = setTimeout(() => {
      setShowAuth(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [loadUser]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <span className="loading loading-ring loading-lg"></span>
    </div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <ThemeProviderExtended>
              <Routes>
                {/* Root route with redirect */}
                <Route path="/" element={<Index />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home/dashboard" />} />
                <Route path="/register" element={<Register />} />
                
                {/* Profile Routes */}
                <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
                <Route path="/profile/:id" element={<Layout><ProfilePage /></Layout>} />
                
                {/* Home Module Route */}
                <Route path="/home/dashboard" element={<Layout><HomeDashboard /></Layout>} />
                
                {/* App Routes - All wrapped with Layout */}
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                
                {/* Control Centre Route - Make sure this doesn't redirect */}
                <Route path="/control-centre" element={<Layout><ControlCentre /></Layout>} />
                
                {/* Food Module Routes - Each route points to its specific component */}
                <Route path="/food/dashboard" element={<Layout><FoodDashboard /></Layout>} />
                <Route path="/food/input-settings" element={<Layout><FoodInputSettings /></Layout>} />
                <Route path="/food/month/:year/:month" element={<Layout><FoodMonthSummary /></Layout>} />
                <Route path="/food/annual-summary" element={<Layout><AnnualSummary /></Layout>} />
                <Route path="/food/bible" element={<Layout><FoodBible /></Layout>} />
                <Route path="/food/weekly-tracker" element={<Layout><FoodWeeklyTracker /></Layout>} />
                {/* Add new routes for food week */}
                <Route path="/food/week/:year/:month/:week" element={<Layout><WeeklyTracker modulePrefix="Food" moduleType="food" /></Layout>} />
                
                {/* Beverage Module Routes - Each route points to its specific component */}
                <Route path="/beverage/dashboard" element={<Layout><BeverageDashboard /></Layout>} />
                <Route path="/beverage/input-settings" element={<Layout><BeverageInputSettings /></Layout>} />
                <Route path="/beverage/month/:year/:month" element={<Layout><BeverageMonthSummary /></Layout>} />
                <Route path="/beverage/annual-summary" element={<Layout><AnnualSummary /></Layout>} />
                <Route path="/beverage/bible" element={<Layout><BeverageBible /></Layout>} />
                <Route path="/beverage/weekly-tracker" element={<Layout><BeverageWeeklyTracker /></Layout>} />
                {/* Add new routes for beverage week */}
                <Route path="/beverage/week/:year/:month/:week" element={<Layout><WeeklyTracker modulePrefix="Beverage" moduleType="beverage" /></Layout>} />
                
                {/* Master Module Routes */}
                <Route path="/master/dashboard" element={<Layout><MasterDashboard /></Layout>} />
                <Route path="/master/month-summary" element={<Layout><MasterMonthSummary /></Layout>} />
                <Route path="/master/weekly-input" element={<Layout><MasterWeeklyInput /></Layout>} />
                <Route path="/master/weekly-input/:year/:month/:week" element={<Layout><MasterWeeklyInput /></Layout>} />
                
                {/* P&L Module Routes */}
                <Route path="/pl/dashboard" element={<Layout><PLDashboard /></Layout>} />
                <Route path="/pl/food-beverage-forecast" element={<Layout><FoodBeverageForecast /></Layout>} />
                <Route path="/pl/weekly-forecast" element={<Layout><WeeklyForecast /></Layout>} />
                
                {/* Wages Module Routes */}
                <Route path="/wages/dashboard" element={<Layout><WagesDashboard /></Layout>} />
                
                {/* Performance Module Routes */}
                <Route path="/performance/dashboard" element={<Layout><PerformanceDashboard /></Layout>} />
                <Route path="/performance/wage-optimization" element={<Layout><WageOptimization /></Layout>} />
                
                {/* Team Module Routes */}
                <Route path="/team/dashboard" element={<Layout><TeamDashboard /></Layout>} />
                <Route path="/team/noticeboard" element={<Layout><TeamNoticeboard /></Layout>} />
                <Route path="/team/chat" element={<Layout><TeamChat /></Layout>} />
                <Route path="/team/knowledge" element={<Layout><TeamKnowledge /></Layout>} />
                <Route path="/team/hospitality" element={<Layout><Hospitality /></Layout>} />
                <Route path="/team/hospitality-bible" element={<Layout><HospitalityBible /></Layout>} />
                
                {/* Not Found Route - Must be last */}
                <Route path="*" element={<Layout><NotFound /></Layout>} />
              </Routes>
              <Toaster richColors />
            </ThemeProviderExtended>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
