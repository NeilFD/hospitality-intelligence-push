import React, { useEffect } from 'react';
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
import { useAuthStore } from './services/auth-service';

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    console.log("App initializing: Loading default GOD user");
    loadUser();
  }, [loadUser]);

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
                
                {/* Control Centre route - no longer requires special auth since we're in dev mode */}
                <Route path="control-centre" element={<ControlCentre />} />
                
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
