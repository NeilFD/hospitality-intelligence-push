import React, { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { RotasLayout } from '@/layouts/RotasLayout';
import Loading from '@/components/ui/loading';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import HomeDashboard from './pages/home/Dashboard';
import ControlCentre from './pages/ControlCentre';
import HiQKitchenLedger from './pages/hiq/KitchenLedger';
import HiQRotas from './pages/hiq/Rotas';
import RotaScheduling from './pages/hiq/RotaScheduling';

// Lazy load components for Kitchen Ledger
const KitchenLedgerDashboard = lazy(() => import('./pages/kitchen-ledger/Dashboard'));
const KitchenLedgerSuppliers = lazy(() => import('./pages/kitchen-ledger/Suppliers'));
const KitchenLedgerPurchases = lazy(() => import('./pages/kitchen-ledger/Purchases'));
const KitchenLedgerCreditNotes = lazy(() => import('./pages/kitchen-ledger/CreditNotes'));
const KitchenLedgerSettings = lazy(() => import('./pages/kitchen-ledger/Settings'));
const KitchenLedgerBudgeting = lazy(() => import('./pages/kitchen-ledger/Budgeting'));

// Lazy load components for Settings
const SettingsProfile = lazy(() => import('./pages/settings/Profile'));
const SettingsAccount = lazy(() => import('./pages/settings/Account'));
const SettingsAppearance = lazy(() => import('./pages/settings/Appearance'));
const SettingsNotifications = lazy(() => import('./pages/settings/Notifications'));
const SettingsDisplay = lazy(() => import('./pages/settings/Display'));

// Lazy load components for HiQ
const HiQDashboard = lazy(() => import('./pages/hiq/Dashboard'));
const HiQBudgets = lazy(() => import('./pages/hiq/Budgets'));
const HiQReports = lazy(() => import('./pages/hiq/Reports'));

// Lazy load components for Team
const TeamDashboard = lazy(() => import('./pages/team/Dashboard'));
const TeamRoster = lazy(() => import('./pages/team/Roster'));
const TeamAvailability = lazy(() => import('./pages/team/Availability'));
const TeamTraining = lazy(() => import('./pages/team/Training'));
const TeamPerformance = lazy(() => import('./pages/team/Performance'));

// Lazy load components for Kitchen Ledger Module
const KitchenLedgerModule = lazy(() => import('./pages/modules/KitchenLedgerModule'));
const HiQModule = lazy(() => import('./pages/modules/HiQModule'));
const TeamModule = lazy(() => import('./pages/modules/TeamModule'));

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<MainLayout />}>
        <Route path="/home" element={<Navigate to="home/dashboard" replace />} />
        <Route path="/home/dashboard" element={<HomeDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/control-centre" element={<ControlCentre />} />

        <Route path="/settings" element={<Navigate to="settings/profile" replace />} />
        <Route path="/settings/profile" element={<Suspense fallback={<Loading />}><SettingsProfile /></Suspense>} />
        <Route path="/settings/account" element={<Suspense fallback={<Loading />}><SettingsAccount /></Suspense>} />
        <Route path="/settings/appearance" element={<Suspense fallback={<Loading />}><SettingsAppearance /></Suspense>} />
        <Route path="/settings/notifications" element={<Suspense fallback={<Loading />}><SettingsNotifications /></Suspense>} />
        <Route path="/settings/display" element={<Suspense fallback={<Loading />}><SettingsDisplay /></Suspense>} />

        <Route path="/kitchen-ledger" element={<KitchenLedgerModule />} />
        <Route path="/kitchen-ledger/dashboard" element={<Suspense fallback={<Loading />}><KitchenLedgerDashboard /></Suspense>} />
        <Route path="/kitchen-ledger/suppliers" element={<Suspense fallback={<Loading />}><KitchenLedgerSuppliers /></Suspense>} />
        <Route path="/kitchen-ledger/purchases" element={<Suspense fallback={<Loading />}><KitchenLedgerPurchases /></Suspense>} />
        <Route path="/kitchen-ledger/credit-notes" element={<Suspense fallback={<Loading />}><KitchenLedgerCreditNotes /></Suspense>} />
        <Route path="/kitchen-ledger/budgeting" element={<Suspense fallback={<Loading />}><KitchenLedgerBudgeting /></Suspense>} />
        <Route path="/kitchen-ledger/settings" element={<Suspense fallback={<Loading />}><KitchenLedgerSettings /></Suspense>} />

        <Route path="/team" element={<TeamModule />} />
        <Route path="/team/dashboard" element={<Suspense fallback={<Loading />}><TeamDashboard /></Suspense>} />
        <Route path="/team/roster" element={<Suspense fallback={<Loading />}><TeamRoster /></Suspense>} />
        <Route path="/team/availability" element={<Suspense fallback={<Loading />}><TeamAvailability /></Suspense>} />
        <Route path="/team/training" element={<Suspense fallback={<Loading />}><TeamTraining /></Suspense>} />
        <Route path="/team/performance" element={<Suspense fallback={<Loading />}><TeamPerformance /></Suspense>} />

        <Route path="/hiq" element={<HiQModule />} />
        <Route path="/hiq/dashboard" element={<Suspense fallback={<Loading />}><HiQDashboard /></Suspense>} />
        <Route path="/hiq/kitchen-ledger" element={<HiQKitchenLedger />} />
        <Route path="/hiq/budgets" element={<Suspense fallback={<Loading />}><HiQBudgets /></Suspense>} />
        <Route path="/hiq/reports" element={<Suspense fallback={<Loading />}><HiQReports /></Suspense>} />
        <Route path="/hiq/rotas" element={<RotasLayout />}>
          <Route index element={<Navigate to="weekly" replace />} />
          <Route path="weekly" element={<HiQRotas />} />
        </Route>
        <Route path="/hiq/rota-scheduling" element={<RotasLayout />}>
          <Route index element={<RotaScheduling />} />
        </Route>
      </Route>
    </>
  )
);
