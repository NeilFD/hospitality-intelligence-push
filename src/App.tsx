
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from "@/components/ui/toaster";
import ControlCentre from "./pages/ControlCentre";
import RequireAuth from "./components/auth/RequireAuth";
import Index from './pages/Index';

// Import actual components
import Dashboard from './pages/Dashboard';
import TeamDashboard from './pages/team/Dashboard';
import AnnualSummaryPage from './pages/AnnualSummary';
import MonthSummary from './pages/MonthSummary';
import InputSettings from './pages/InputSettings';

// Import food-specific pages
import FoodDashboard from './pages/food/Dashboard';
import FoodInputSettings from './pages/food/InputSettings';
import FoodMonthSummary from './pages/food/MonthSummary'; 
import FoodAnnualSummary from './pages/food/AnnualSummary';
import FoodBible from './pages/food/FoodBible';

// Import beverage-specific pages
import BeverageDashboard from './pages/beverage/Dashboard';
import BeverageInputSettings from './pages/beverage/InputSettings';
import BeverageMonthSummary from './pages/beverage/MonthSummary';
import BeverageAnnualSummary from './pages/beverage/AnnualSummary';
import BeverageBible from './pages/beverage/BeverageBible';

// Import performance pages
import PerformanceDashboard from './pages/performance/Dashboard';

// Import P&L pages
import PLDashboard from './pages/pl/Dashboard';

// Import wages pages
import WagesDashboard from './pages/wages/WagesDashboard';

// Import Master pages
import MasterDashboard from './pages/master/Dashboard';
import MasterMonthSummary from './pages/master/MonthSummary';
import MasterWeeklyInput from './pages/master/WeeklyInput';

// Import team pages
import TeamChat from './pages/team/Chat';
import TeamNoticeboard from './pages/team/Noticeboard';
import TeamKnowledge from './pages/team/Knowledge';

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <Routes>
              <Route path="/" element={<Layout><Outlet /></Layout>}>
                <Route index element={<Index />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* Master Records Routes */}
                <Route path="master/dashboard" element={<MasterDashboard />} />
                <Route path="master/month/:year/:month" element={<MasterMonthSummary />} />
                <Route path="master/weekly-input" element={<MasterWeeklyInput />} />
                
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
                <Route path="control-centre" element={
                  <RequireAuth requiredRole="Super User">
                    <ControlCentre />
                  </RequireAuth>
                } />
                
              </Route>
              
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
            </Routes>
            <Toaster />
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
