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
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import KitchenLedger from '@/pages/kitchen-ledger/KitchenLedger';
import Suppliers from '@/pages/kitchen-ledger/Suppliers';
import MonthlySettings from '@/pages/kitchen-ledger/MonthlySettings';
import Budget from '@/pages/budget/Budget';
import BudgetSettings from '@/pages/budget/BudgetSettings';
import AnnualSummary from '@/pages/AnnualSummary';
import MonthDetails from '@/pages/MonthDetails';
import PerformanceDashboard from '@/pages/performance/Dashboard';
import ConversationHistory from '@/pages/performance/ConversationHistory';
import PlAnalysis from '@/pages/performance/PlAnalysis';
import WageOptimization from '@/pages/performance/WageOptimization';
import FbAnalysis from '@/pages/performance/FbAnalysis';
import DataExplorer from '@/pages/performance/DataExplorer';
import WagesDashboard from '@/pages/wages/WagesDashboard';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? (children) : <Navigate to="/login" />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RequireAuth><RootLayout /></RequireAuth>,
    children: [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "/settings",
        element: <Settings />
      },
      {
        path: "/profile",
        element: <Profile />
      },
      {
        path: "/kitchen-ledger",
        element: <KitchenLedger />
      },
      {
        path: "/kitchen-ledger/suppliers",
        element: <Suppliers />
      },
      {
        path: "/kitchen-ledger/monthly-settings",
        element: <MonthlySettings />
      },
      {
        path: "/budget",
        element: <Budget />
      },
      {
        path: "/budget/settings",
        element: <BudgetSettings />
      },
      {
        path: "/annual-summary",
        element: <AnnualSummary />
      },
      {
        path: "/month/:year/:month",
        element: <MonthDetails />
      },
       {
        path: "/performance/dashboard",
        element: <PerformanceDashboard />
      },
      {
        path: "/performance/pl-analysis",
        element: <PlAnalysis />
      },
      {
        path: "/performance/wage-optimization",
        element: <WageOptimization />
      },
      {
        path: "/performance/fb-analysis",
        element: <FbAnalysis />
      },
      {
        path: "/performance/data-explorer",
        element: <DataExplorer />
      },
      {
        path: "/wages/dashboard",
        element: <WagesDashboard />
      },
      {
        path: "/performance/conversation-history",
        element: <RequireAuth><ConversationHistory /></RequireAuth>
      },
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

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
