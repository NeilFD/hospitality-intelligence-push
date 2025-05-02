
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
} from 'react-router-dom';
import RootLayout from '@/components/RootLayout';
import { Skeleton } from '@/components/ui/skeleton';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import HomeDashboard from './pages/home/Dashboard';
import ControlCentre from './pages/ControlCentre';
import HiQRotas from './pages/hiq/Rotas';
import RotaScheduling from './pages/hiq/RotaScheduling';
import HiQDashboard from './pages/hiq/Dashboard';
import MasterDashboard from './pages/master/Dashboard';
import WeeklyInput from './pages/master/WeeklyInput';
import MonthSummary from './pages/master/MonthSummary';
import PLDashboard from './pages/pl/Dashboard';
import WagesDashboard from './pages/wages/Dashboard';
import FoodDashboard from './pages/food/Dashboard';
import BeverageDashboard from './pages/beverage/Dashboard';
import TeamDashboard from './pages/team/Dashboard';
import TeamChat from './pages/team/Chat';
import TeamNoticeboard from './pages/team/Noticeboard';
import TeamKnowledge from './pages/team/Knowledge';
import FoodMonthSummary from './pages/food/MonthSummary';
import FoodAnnualSummary from './pages/food/AnnualSummary';
import BeverageMonthSummary from './pages/beverage/MonthSummary';
import BeverageAnnualSummary from './pages/beverage/AnnualSummary';
import Dashboard from './pages/Dashboard';
import WeeklyForecast from './pages/pl/WeeklyForecast';
import FoodBeverageForecast from './pages/pl/FoodBeverageForecast';
import FoodWeeklyTracker from './pages/food/WeeklyTracker';
import BeverageWeeklyTracker from './pages/beverage/WeeklyTracker';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/not-found" element={<NotFound />} />

      <Route element={<RootLayout />}>
        <Route path="/home" element={<Navigate to="home/dashboard" replace />} />
        <Route path="/home/dashboard" element={<HomeDashboard />} />
        
        {/* Profile Routes - Add support for both current user and specific user profiles */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        
        <Route path="/control-centre" element={<ControlCentre />} />

        {/* Master/Daily Info Routes */}
        <Route path="/master" element={<Navigate to="/master/dashboard" replace />} />
        <Route path="/master/dashboard" element={<MasterDashboard />} />
        <Route path="/master/weekly-input/:year/:month/:week" element={<WeeklyInput />} />
        <Route path="/master/month-summary" element={<MonthSummary />} />
        <Route path="/master/week/:year/:month/:week" element={<WeeklyInput />} />

        {/* P&L Routes */}
        <Route path="/pl" element={<Navigate to="/pl/dashboard" replace />} />
        <Route path="/pl/dashboard" element={<PLDashboard />} />
        <Route path="/pl/weekly-forecast" element={<WeeklyForecast />} />
        <Route path="/pl/food-beverage-forecast" element={<FoodBeverageForecast />} />

        {/* Wages Routes */}
        <Route path="/wages" element={<Navigate to="/wages/dashboard" replace />} />
        <Route path="/wages/dashboard" element={<WagesDashboard />} />

        {/* Food Hub Routes */}
        <Route path="/food" element={<Navigate to="/food/dashboard" replace />} />
        <Route path="/food/dashboard" element={<FoodDashboard />} />
        <Route path="/food/month/:year/:month" element={<FoodMonthSummary />} />
        <Route path="/food/annual-summary" element={<FoodAnnualSummary />} />
        <Route path="/food/weekly-tracker" element={<FoodWeeklyTracker />} />
        <Route path="/food/week/:year/:month/:week" element={<FoodWeeklyTracker />} />

        {/* Beverage Hub Routes */}
        <Route path="/beverage" element={<Navigate to="/beverage/dashboard" replace />} />
        <Route path="/beverage/dashboard" element={<BeverageDashboard />} />
        <Route path="/beverage/month/:year/:month" element={<BeverageMonthSummary />} />
        <Route path="/beverage/annual-summary" element={<BeverageAnnualSummary />} />
        <Route path="/beverage/weekly-tracker" element={<BeverageWeeklyTracker />} />
        <Route path="/beverage/week/:year/:month/:week" element={<BeverageWeeklyTracker />} />

        {/* Team Routes */}
        <Route path="/team" element={<Navigate to="/team/dashboard" replace />} />
        <Route path="/team/dashboard" element={<TeamDashboard />} />
        <Route path="/team/chat" element={<TeamChat />} />
        <Route path="/team/noticeboard" element={<TeamNoticeboard />} />
        <Route path="/team/knowledge" element={<TeamKnowledge />} />

        <Route path="/hiq" element={<Navigate to="/hiq/dashboard" replace />} />
        <Route path="/hiq/dashboard" element={<React.Suspense fallback={<Skeleton />}><HiQDashboard /></React.Suspense>} />
        <Route path="/hiq/rotas" element={<HiQRotas />}>
          <Route index element={<Navigate to="weekly" replace />} />
          <Route path="weekly" element={<HiQRotas />} />
        </Route>
        <Route path="/hiq/rota-scheduling" element={<RotaScheduling />} />

        {/* Generic dashboard handler - keep at the end */}
        <Route path="/:module/dashboard" element={<Dashboard />} />
        
        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Route>
    </>
  )
);
