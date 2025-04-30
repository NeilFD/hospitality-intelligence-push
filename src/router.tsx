
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom';
import RootLayout from '@/components/RootLayout';
import { Skeleton } from '@/components/ui/skeleton'; // Fixed import using named import
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import HomeDashboard from './pages/home/Dashboard';
import ControlCentre from './pages/ControlCentre';
import HiQRotas from './pages/hiq/Rotas';
import RotaScheduling from './pages/hiq/RotaScheduling';
import HiQDashboard from './pages/hiq/Dashboard';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RootLayout />}>
        <Route path="/home" element={<Navigate to="home/dashboard" replace />} />
        <Route path="/home/dashboard" element={<HomeDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/control-centre" element={<ControlCentre />} />

        <Route path="/hiq" element={<Navigate to="/hiq/dashboard" replace />} />
        <Route path="/hiq/dashboard" element={<React.Suspense fallback={<Skeleton />}><HiQDashboard /></React.Suspense>} />
        <Route path="/hiq/rotas" element={<HiQRotas />}>
          <Route index element={<Navigate to="weekly" replace />} />
          <Route path="weekly" element={<HiQRotas />} />
        </Route>
        <Route path="/hiq/rota-scheduling" element={<RotaScheduling />} />
      </Route>
    </>
  )
);
