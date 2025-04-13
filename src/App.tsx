import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { UserProvider } from './contexts/UserContext';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProfilePage from './pages/ProfilePage';
import KitchenLedger from './pages/kitchen-ledger/KitchenLedger';
import SuppliersPage from './pages/kitchen-ledger/SuppliersPage';
import MonthlySettingsPage from './pages/kitchen-ledger/MonthlySettingsPage';
import AnnualSummaryPage from './pages/kitchen-ledger/AnnualSummaryPage';
import InputSettingsPage from './pages/kitchen-ledger/InputSettingsPage';
import PlDashboard from './pages/pl/PlDashboard';
import WagesDashboard from './pages/wages/WagesDashboard';
import PerformanceDashboard from './pages/performance/PerformanceDashboard';
import TeamDashboard from './pages/team/TeamDashboard';
import Noticeboard from './pages/team/Noticeboard';
import TeamChat from './pages/team/TeamChat';
import KnowledgeBase from './pages/team/KnowledgeBase';
import { Toaster } from "@/components/ui/toaster"
import ControlCentre from "./pages/ControlCentre";
import RequireAuth from "./components/auth/RequireAuth";

function App() {
  return (
    <Router>
      <UserProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Routes>
            <Route path="/" element={<Layout><Outlet /></Layout>}>
              <Route index element={<KitchenLedger />} />
              <Route path="profile" element={<ProfilePage />} />
              
              {/* Food Hub Routes */}
              <Route path="food/dashboard" element={<KitchenLedger moduleType="food" />} />
              <Route path="food/input-settings" element={<InputSettingsPage moduleType="food" />} />
              <Route path="food/suppliers" element={<SuppliersPage moduleType="food" />} />
              <Route path="food/month/:year/:month" element={<MonthlySettingsPage moduleType="food" />} />
              <Route path="food/annual-summary" element={<AnnualSummaryPage moduleType="food" />} />
              <Route path="food/bible" element={<></>} />
              
              {/* Beverage Hub Routes */}
              <Route path="beverage/dashboard" element={<KitchenLedger moduleType="beverage" />} />
              <Route path="beverage/input-settings" element={<InputSettingsPage moduleType="beverage" />} />
              <Route path="beverage/suppliers" element={<SuppliersPage moduleType="beverage" />} />
              <Route path="beverage/month/:year/:month" element={<MonthlySettingsPage moduleType="beverage" />} />
              <Route path="beverage/annual-summary" element={<AnnualSummaryPage moduleType="beverage" />} />
              <Route path="beverage/bible" element={<></>} />
              
              {/* P&L Tracker Routes */}
              <Route path="pl/dashboard" element={<PlDashboard />} />
              
              {/* Wages Tracker Routes */}
              <Route path="wages/dashboard" element={<WagesDashboard />} />
              
              {/* Performance Tracker Routes */}
              <Route path="performance/dashboard" element={<PerformanceDashboard />} />
              
              {/* Team Routes */}
              <Route path="team/dashboard" element={<TeamDashboard />} />
              <Route path="team/noticeboard" element={<Noticeboard />} />
              <Route path="team/chat" element={<TeamChat />} />
              <Route path="team/knowledge" element={<KnowledgeBase />} />
              
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
    </Router>
  );
}

export default App;
