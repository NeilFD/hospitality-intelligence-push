import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Navigate
} from "react-router-dom";
import { useAuthStore } from '@/services/auth-service';
import RootLayout from '@/components/RootLayout';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import PerformanceDashboard from '@/pages/performance/Dashboard';
import ConversationHistory from '@/pages/performance/ConversationHistory';
import ConversationDebug from '@/pages/performance/ConversationDebug';
import WagesDashboard from '@/pages/wages/WagesDashboard';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import RequireAuth from '@/components/auth/RequireAuth';

// Food pages
import FoodDashboard from '@/pages/food/Dashboard';
import FoodMonthSummary from '@/pages/food/MonthSummary';
import FoodAnnualSummary from '@/pages/food/AnnualSummary';
import FoodInputSettings from '@/pages/food/InputSettings';
import FoodWeeklyTracker from '@/pages/food/WeeklyTracker';

// Beverage pages
import BeverageDashboard from '@/pages/beverage/Dashboard';
import BeverageMonthSummary from '@/pages/beverage/MonthSummary';
import BeverageAnnualSummary from '@/pages/beverage/AnnualSummary';
import BeverageInputSettings from '@/pages/beverage/InputSettings';
import BeverageWeeklyTracker from '@/pages/beverage/WeeklyTracker';

// P&L pages
import PLDashboard from '@/pages/pl/Dashboard';

// Master Records pages
import MasterDashboard from '@/pages/master/Dashboard';
import MasterMonthSummary from '@/pages/master/MonthSummary';
import MasterWeeklyInput from '@/pages/master/WeeklyInput';

// Import React Query dependencies
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RequireAuth><RootLayout /></RequireAuth>,
    errorElement: <NotFound />,
    children: [
      {
        path: "/",
        element: <Index />
      },
      {
        path: "/profile",
        element: <Profile />
      },
      // Food module routes
      {
        path: "/food/dashboard",
        element: <FoodDashboard />
      },
      {
        path: "/food/month/:year/:month",
        element: <FoodMonthSummary />
      },
      {
        path: "/food/week/:year/:month/:week",
        element: <FoodWeeklyTracker />
      },
      {
        path: "/food/annual-summary",
        element: <FoodAnnualSummary />
      },
      {
        path: "/food/input-settings",
        element: <FoodInputSettings />
      },
      // Beverage module routes
      {
        path: "/beverage/dashboard",
        element: <BeverageDashboard />
      },
      {
        path: "/beverage/month/:year/:month",
        element: <BeverageMonthSummary />
      },
      {
        path: "/beverage/week/:year/:month/:week",
        element: <BeverageWeeklyTracker />
      },
      {
        path: "/beverage/annual-summary",
        element: <BeverageAnnualSummary />
      },
      {
        path: "/beverage/input-settings",
        element: <BeverageInputSettings />
      },
      // P&L module routes
      {
        path: "/pl/dashboard",
        element: <PLDashboard />
      },
      // Master Records module routes
      {
        path: "/master/dashboard",
        element: <MasterDashboard />
      },
      {
        path: "/master/month/:year/:month",
        element: <MasterMonthSummary />
      },
      {
        path: "/master/week/:year/:month/:week",
        element: <MasterWeeklyInput />
      },
      // Performance module routes
      {
        path: "/performance/dashboard",
        element: <PerformanceDashboard />
      },
      {
        path: "/performance/conversation-history",
        element: <ConversationHistory />
      },
      {
        path: "/performance/debug",
        element: <ConversationDebug />
      },
      // Wages module routes
      {
        path: "/wages/dashboard",
        element: <WagesDashboard />
      },
      {
        path: "*",
        element: <NotFound />
      }
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
]);

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
