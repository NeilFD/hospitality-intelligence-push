
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
        path: "/profile",
        element: <Profile />
      },
      {
        path: "/performance/dashboard",
        element: <PerformanceDashboard />
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
