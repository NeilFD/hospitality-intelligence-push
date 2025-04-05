
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import InputSettings from "./pages/InputSettings";
import MonthSummary from "./pages/MonthSummary";
import WeeklyTracker from "./pages/WeeklyTracker";
import AnnualSummary from "./pages/AnnualSummary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="/input-settings" element={<InputSettings />} />
            <Route path="/month/:year/:month" element={<MonthSummary />} />
            <Route path="/week/:year/:month/:week" element={<WeeklyTracker />} />
            <Route path="/annual-summary" element={<AnnualSummary />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
