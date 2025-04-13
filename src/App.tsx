
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import RegisterForm from './components/auth/RegisterForm';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import ControlCentre from "./pages/ControlCentre";
import RequireAuth from "./components/auth/RequireAuth";
import Index from './pages/Index';
import { useAuthStore } from './services/auth-service';

// Import Master pages
import MasterDashboard from './pages/master/Dashboard';
import MasterMonthSummary from './pages/master/MonthSummary';
import MasterWeeklyInput from './pages/master/WeeklyInput';

// Import Food Hub pages
import FoodDashboard from './pages/food/Dashboard';
import FoodInputSettings from './pages/food/InputSettings';
import FoodMonthSummary from './pages/food/MonthSummary';
import FoodAnnualSummary from './pages/food/AnnualSummary';
import FoodBible from './pages/food/FoodBible';

// Import Beverage Hub pages
import BeverageDashboard from './pages/beverage/Dashboard';
import BeverageInputSettings from './pages/beverage/InputSettings';
import BeverageMonthSummary from './pages/beverage/MonthSummary';
import BeverageAnnualSummary from './pages/beverage/AnnualSummary';
import BeverageBible from './pages/beverage/BeverageBible';

// Import P&L Tracker pages
import PLDashboard from './pages/pl/Dashboard';

// Import Wages Tracker pages
import WagesDashboard from './pages/wages/Dashboard';

// Import Performance Tracker pages
import PerformanceDashboard from './pages/performance/Dashboard';

// Import Team pages
import TeamDashboard from './pages/team/Dashboard';
import TeamNoticeboard from './pages/team/Noticeboard';
import TeamChat from './pages/team/Chat';
import TeamKnowledge from './pages/team/Knowledge';

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    console.log("App initializing: Loading user");
    loadUser();
  }, [loadUser]);

  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterForm />} />
              
              <Route path="/" element={
                <RequireAuth>
                  <Layout><Outlet /></Layout>
                </RequireAuth>
              }>
                <Route index element={<Index />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* Master Records Routes */}
                <Route path="master/dashboard" element={<MasterDashboard />} />
                <Route path="master/month/:year/:month" element={<MasterMonthSummary />} />
                <Route path="master/week/:year/:month/:week" element={<MasterWeeklyInput />} />
                
                {/* Food Hub Routes */}
                <Route path="food/dashboard" element={<FoodDashboard />} />
                <Route path="food/input-settings" element={<FoodInputSettings />} />
                <Route path="food/month/:year/:month" element={<FoodMonthSummary />} />
                <Route path="food/annual-summary" element={<FoodAnnualSummary />} />
                <Route path="food/bible" element={<FoodBible />} />
                
                {/* Beverage Hub Routes */}
                <Route path="beverage/dashboard" element={<BeverageDashboard />} />
                <Route path="beverage/input-settings" element={<BeverageInputSettings />} />
                <Route path="beverage/month/:year/:month" element={<BeverageMonthSummary />} />
                <Route path="beverage/annual-summary" element={<BeverageAnnualSummary />} />
                <Route path="beverage/bible" element={<BeverageBible />} />
                
                {/* P&L Tracker Routes */}
                <Route path="pl/dashboard" element={<PLDashboard />} />
                
                {/* Wages Tracker Routes */}
                <Route path="wages/dashboard" element={<WagesDashboard />} />
                
                {/* Performance Tracker Routes */}
                <Route path="performance/dashboard" element={<PerformanceDashboard />} />
                
                {/* Team Routes */}
                <Route path="team/dashboard" element={<TeamDashboard />} />
                <Route path="team/noticeboard" element={<TeamNoticeboard />} />
                <Route path="team/chat" element={<TeamChat />} />
                <Route path="team/knowledge" element={<TeamKnowledge />} />
                
                {/* Control Centre route */}
                <Route path="control-centre" element={<ControlCentre />} />
              </Route>
            </Routes>
            <Toaster />
            <SonnerToaster position="top-right" />
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
