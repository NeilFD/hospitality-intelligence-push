
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import InputSettings from "./pages/InputSettings";
import MonthSummary from "./pages/MonthSummary";
import WeeklyTracker from "./pages/WeeklyTracker";
import AnnualSummary from "./pages/AnnualSummary";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";
import { useAuthStore } from "./services/auth-service";
import Index from "./pages/Index";

// Import module-specific pages
import FoodDashboard from "./pages/food/Dashboard";
import FoodInputSettings from "./pages/food/InputSettings";
import FoodMonthSummary from "./pages/food/MonthSummary";
import FoodAnnualSummary from "./pages/food/AnnualSummary";

import BeverageDashboard from "./pages/beverage/Dashboard";
import BeverageInputSettings from "./pages/beverage/InputSettings";
import BeverageMonthSummary from "./pages/beverage/MonthSummary";
import BeverageAnnualSummary from "./pages/beverage/AnnualSummary";

import PLDashboard from "./pages/pl/Dashboard";
import WagesDashboard from "./pages/wages/Dashboard";
import PerformanceDashboard from "./pages/performance/Dashboard";

const queryClient = new QueryClient();

const App = () => {
  const { loadUser } = useAuthStore();
  
  // Load user when app starts up
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Index redirects to current default module */}
              <Route index element={<RequireAuth><Index /></RequireAuth>} />
              
              {/* Legacy routes - will be redirected or removed */}
              <Route path="/input-settings" element={<RequireAuth><Navigate to="/food/input-settings" replace /></RequireAuth>} />
              <Route path="/month/:year/:month" element={<RequireAuth><Navigate to={(params) => `/food/month/${params.year}/${params.month}`} replace /></RequireAuth>} />
              <Route path="/week/:year/:month/:week" element={<RequireAuth><WeeklyTracker /></RequireAuth>} />
              <Route path="/annual-summary" element={<RequireAuth><Navigate to="/food/annual-summary" replace /></RequireAuth>} />

              {/* P&L Tracker Module */}
              <Route path="/pl/dashboard" element={<RequireAuth><PLDashboard /></RequireAuth>} />
              
              {/* Wages Tracker Module */}
              <Route path="/wages/dashboard" element={<RequireAuth><WagesDashboard /></RequireAuth>} />
              
              {/* Food Tracker Module */}
              <Route path="/food/dashboard" element={<RequireAuth><FoodDashboard /></RequireAuth>} />
              <Route path="/food/input-settings" element={<RequireAuth><FoodInputSettings /></RequireAuth>} />
              <Route path="/food/month/:year/:month" element={<RequireAuth><FoodMonthSummary /></RequireAuth>} />
              <Route path="/food/week/:year/:month/:week" element={<RequireAuth><WeeklyTracker /></RequireAuth>} />
              <Route path="/food/annual-summary" element={<RequireAuth><FoodAnnualSummary /></RequireAuth>} />
              
              {/* Beverage Tracker Module */}
              <Route path="/beverage/dashboard" element={<RequireAuth><BeverageDashboard /></RequireAuth>} />
              <Route path="/beverage/input-settings" element={<RequireAuth><BeverageInputSettings /></RequireAuth>} />
              <Route path="/beverage/month/:year/:month" element={<RequireAuth><BeverageMonthSummary /></RequireAuth>} />
              <Route path="/beverage/week/:year/:month/:week" element={<RequireAuth><WeeklyTracker /></RequireAuth>} />
              <Route path="/beverage/annual-summary" element={<RequireAuth><BeverageAnnualSummary /></RequireAuth>} />
              
              {/* Performance and Analysis Module */}
              <Route path="/performance/dashboard" element={<RequireAuth><PerformanceDashboard /></RequireAuth>} />
              
              {/* Profile and Auth routes */}
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Error routes */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
