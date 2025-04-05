
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
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";
import { useAuthStore } from "./services/auth-service";

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
              {/* Protected routes */}
              <Route element={<RequireAuth><Dashboard /></RequireAuth>} index />
              <Route path="/input-settings" element={<RequireAuth><InputSettings /></RequireAuth>} />
              <Route path="/month/:year/:month" element={<RequireAuth><MonthSummary /></RequireAuth>} />
              <Route path="/week/:year/:month/:week" element={<RequireAuth><WeeklyTracker /></RequireAuth>} />
              <Route path="/annual-summary" element={<RequireAuth><AnnualSummary /></RequireAuth>} />
              
              {/* Auth routes */}
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
