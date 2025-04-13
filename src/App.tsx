
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import { ThemeProvider } from "@/components/ui/theme-provider";
import { UserProvider } from './contexts/UserContext';
import Layout from './components/Layout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProfilePage from './pages/ProfilePage';
import { Toaster } from "@/components/ui/toaster";
import ControlCentre from "./pages/ControlCentre";
import RequireAuth from "./components/auth/RequireAuth";

// Stub components for the routes that we don't have yet
// These will be replaced when the actual components are developed
const KitchenLedger = ({ moduleType = 'food' }: { moduleType?: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Kitchen Ledger - {moduleType}</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const SuppliersPage = ({ moduleType = 'food' }: { moduleType?: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Suppliers - {moduleType}</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const MonthlySettingsPage = ({ moduleType = 'food' }: { moduleType?: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Monthly Settings - {moduleType}</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const AnnualSummaryPage = ({ moduleType = 'food' }: { moduleType?: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Annual Summary - {moduleType}</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const InputSettingsPage = ({ moduleType = 'food' }: { moduleType?: string }) => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Input Settings - {moduleType}</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const PlDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">P&L Dashboard</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const WagesDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Wages Dashboard</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const PerformanceDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Performance Dashboard</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const TeamDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Team Dashboard</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const Noticeboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Noticeboard</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const TeamChat = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Team Chat</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

const KnowledgeBase = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>
    <p>This module will be implemented soon.</p>
  </div>
);

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
