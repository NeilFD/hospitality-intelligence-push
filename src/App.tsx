
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequireAuth from "./components/RequireAuth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import FoodDashboard from "@/pages/food/Dashboard";
import FoodInputSettings from "@/pages/food/InputSettings";
import FoodMonthSummary from "@/pages/food/MonthSummary";
import FoodAnnualSummary from "@/pages/food/AnnualSummary";
import FoodWeeklyTracker from "@/pages/food/WeeklyTracker";
import BeverageDashboard from "@/pages/beverage/Dashboard";
import BeverageInputSettings from "@/pages/beverage/InputSettings";
import BeverageMonthSummary from "@/pages/beverage/MonthSummary";
import BeverageAnnualSummary from "@/pages/beverage/AnnualSummary";
import BeverageWeeklyTracker from "@/pages/beverage/WeeklyTracker";
import PLDashboard from "@/pages/pl/Dashboard";
import WagesDashboard from "@/pages/wages/WagesDashboard";
import PerformanceDashboard from "@/pages/performance/Dashboard";
import WageOptimization from "@/pages/performance/WageOptimization";
import TeamDashboard from "./pages/team/Dashboard";
import Noticeboard from "./pages/team/Noticeboard";
import Chat from "./pages/team/Chat";
import Knowledge from "./pages/team/Knowledge";
import MasterDashboard from "./pages/master/Dashboard";
import WeeklyInput from "./pages/master/WeeklyInput";
import MonthSummary from "./pages/master/MonthSummary";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<RequireAuth><Layout><FoodDashboard /></Layout></RequireAuth>} />
            
            <Route path="/profile" element={<RequireAuth><Layout><Profile /></Layout></RequireAuth>} />
            <Route path="/profile/:userId" element={<RequireAuth><Layout><Profile /></Layout></RequireAuth>} />
            
            {/* Food Routes */}
            <Route path="/food/dashboard" element={<RequireAuth><Layout><FoodDashboard /></Layout></RequireAuth>} />
            <Route path="/food/input-settings" element={<RequireAuth><Layout><FoodInputSettings /></Layout></RequireAuth>} />
            <Route path="/food/month/:year/:month" element={<RequireAuth><Layout><FoodMonthSummary /></Layout></RequireAuth>} />
            <Route path="/food/annual-summary" element={<RequireAuth><Layout><FoodAnnualSummary /></Layout></RequireAuth>} />
            <Route path="/food/week/:year/:month/:week" element={<RequireAuth><Layout><FoodWeeklyTracker /></Layout></RequireAuth>} />
            
            {/* Beverage Routes */}
            <Route path="/beverage/dashboard" element={<RequireAuth><Layout><BeverageDashboard /></Layout></RequireAuth>} />
            <Route path="/beverage/input-settings" element={<RequireAuth><Layout><BeverageInputSettings /></Layout></RequireAuth>} />
            <Route path="/beverage/month/:year/:month" element={<RequireAuth><Layout><BeverageMonthSummary /></Layout></RequireAuth>} />
            <Route path="/beverage/annual-summary" element={<RequireAuth><Layout><BeverageAnnualSummary /></Layout></RequireAuth>} />
            <Route path="/beverage/week/:year/:month/:week" element={<RequireAuth><Layout><BeverageWeeklyTracker /></Layout></RequireAuth>} />
            
            {/* P&L Routes */}
            <Route path="/pl/dashboard" element={<RequireAuth><Layout><PLDashboard /></Layout></RequireAuth>} />
            
            {/* Wages Routes */}
            <Route path="/wages/dashboard" element={<RequireAuth><Layout><WagesDashboard /></Layout></RequireAuth>} />
            
            {/* Performance Routes */}
            <Route path="/performance/dashboard" element={<RequireAuth><Layout><PerformanceDashboard /></Layout></RequireAuth>} />
            <Route path="/performance/wage-optimization" element={<RequireAuth><Layout><WageOptimization /></Layout></RequireAuth>} />
            
            {/* Master Routes */}
            <Route path="/master/dashboard" element={<RequireAuth><Layout><MasterDashboard /></Layout></RequireAuth>} />
            <Route path="/master/week/:year/:month/:week" element={<RequireAuth><Layout><WeeklyInput /></Layout></RequireAuth>} />
            <Route path="/master/month/:year/:month" element={<RequireAuth><Layout><MonthSummary /></Layout></RequireAuth>} />
            
            {/* Team Routes */}
            <Route path="/team/dashboard" element={<RequireAuth><Layout><TeamDashboard /></Layout></RequireAuth>} />
            <Route path="/team/noticeboard" element={<RequireAuth><Layout><Noticeboard /></Layout></RequireAuth>} />
            <Route path="/team/chat" element={<RequireAuth><Layout><Chat /></Layout></RequireAuth>} />
            <Route path="/team/knowledge" element={<RequireAuth><Layout><Knowledge /></Layout></RequireAuth>} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
