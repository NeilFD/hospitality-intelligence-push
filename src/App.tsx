import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from '@/services/auth-service';
import { Layout } from '@/components/layout/Layout';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/ui/theme-provider"
import { ThemeProviderExtended } from "@/components/ui/theme-provider-extended";

// Public Pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import PricingPage from '@/pages/PricingPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Auth Pages
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';

// App Pages
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import ControlCentre from '@/pages/ControlCentre';

// Kitchen Pages
import FoodDashboard from '@/pages/food/FoodDashboard';
import FoodInputSettings from '@/pages/food/FoodInputSettings';
import FoodMonthSummary from '@/pages/food/FoodMonthSummary';
import FoodAnnualSummary from '@/pages/food/FoodAnnualSummary';
import FoodBible from '@/pages/food/FoodBible';

// Beverage Pages
import BeverageDashboard from '@/pages/beverage/BeverageDashboard';
import BeverageInputSettings from '@/pages/beverage/BeverageInputSettings';
import BeverageMonthSummary from '@/pages/beverage/BeverageMonthSummary';
import BeverageAnnualSummary from '@/pages/beverage/BeverageAnnualSummary';
import BeverageBible from '@/pages/beverage/BeverageBible';

// P&L Pages
import PLDashboard from '@/pages/pl/PLDashboard';

// Wages Pages
import WagesDashboard from '@/pages/wages/WagesDashboard';

// Performance Pages
import PerformanceDashboard from '@/pages/performance/PerformanceDashboard';

// Team Pages
import TeamDashboard from '@/pages/team/TeamDashboard';
import TeamNoticeboard from '@/pages/team/TeamNoticeboard';
import TeamChat from '@/pages/team/TeamChat';
import TeamKnowledge from '@/pages/team/TeamKnowledge';

const queryClient = new QueryClient();

function App() {
  const { isLoggedIn, isLoading } = useAuthStore();
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
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* Auth Routes */}
                <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!isLoggedIn ? <RegisterPage /> : <Navigate to="/dashboard" />} />
                <Route path="/forgot-password" element={!isLoggedIn ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
                <Route path="/reset-password" element={!isLoggedIn ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />
                <Route path="/verify-email" element={!isLoggedIn ? <VerifyEmailPage /> : <Navigate to="/dashboard" />} />

                {/* App Routes - Protected */}
                <Route path="/dashboard" element={isLoggedIn ? <DashboardPage /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" />} />
                <Route path="/settings" element={isLoggedIn ? <SettingsPage /> : <Navigate to="/login" />} />
                <Route path="/control-centre" element={isLoggedIn ? <ControlCentre /> : <Navigate to="/login" />} />

                {/* Kitchen Routes - Protected */}
                <Route path="/food/dashboard" element={isLoggedIn ? <FoodDashboard /> : <Navigate to="/login" />} />
                <Route path="/food/input-settings" element={isLoggedIn ? <FoodInputSettings /> : <Navigate to="/login" />} />
                <Route path="/food/month/:year/:month" element={isLoggedIn ? <FoodMonthSummary /> : <Navigate to="/login" />} />
                <Route path="/food/annual-summary" element={isLoggedIn ? <FoodAnnualSummary /> : <Navigate to="/login" />} />
                <Route path="/food/bible" element={isLoggedIn ? <FoodBible /> : <Navigate to="/login" />} />

                {/* Beverage Routes - Protected */}
                <Route path="/beverage/dashboard" element={isLoggedIn ? <BeverageDashboard /> : <Navigate to="/login" />} />
                <Route path="/beverage/input-settings" element={isLoggedIn ? <BeverageInputSettings /> : <Navigate to="/login" />} />
                <Route path="/beverage/month/:year/:month" element={isLoggedIn ? <BeverageMonthSummary /> : <Navigate to="/login" />} />
                <Route path="/beverage/annual-summary" element={isLoggedIn ? <BeverageAnnualSummary /> : <Navigate to="/login" />} />
                <Route path="/beverage/bible" element={isLoggedIn ? <BeverageBible /> : <Navigate to="/login" />} />

                {/* P&L Routes - Protected */}
                <Route path="/pl/dashboard" element={isLoggedIn ? <PLDashboard /> : <Navigate to="/login" />} />

                {/* Wages Routes - Protected */}
                <Route path="/wages/dashboard" element={isLoggedIn ? <WagesDashboard /> : <Navigate to="/login" />} />

                {/* Performance Routes - Protected */}
                <Route path="/performance/dashboard" element={isLoggedIn ? <PerformanceDashboard /> : <Navigate to="/login" />} />

                {/* Team Routes - Protected */}
                <Route path="/team/dashboard" element={isLoggedIn ? <TeamDashboard /> : <Navigate to="/login" />} />
                <Route path="/team/noticeboard" element={isLoggedIn ? <TeamNoticeboard /> : <Navigate to="/login" />} />
                <Route path="/team/chat" element={isLoggedIn ? <TeamChat /> : <Navigate to="/login" />} />
                <Route path="/team/knowledge" element={isLoggedIn ? <TeamKnowledge /> : <Navigate to="/login" />} />

                {/* Not Found Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Layout>
          </Router>
        </ThemeProviderExtended>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
