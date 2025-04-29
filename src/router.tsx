
import {
  createBrowserRouter,
} from "react-router-dom";
import RootLayout from "@/components/RootLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RequireAuth from "@/components/RequireAuth";
import Profile from "@/pages/Profile";
// Fix the import syntax for EditProfile - using proper import alias syntax
import { default as EditProfile } from "@/pages/Profile";
import TeamDashboard from "@/pages/team/Dashboard";
import Noticeboard from "@/pages/team/Noticeboard";
import Knowledge from "@/pages/team/Knowledge";
import Chat from "@/pages/team/Chat";
import ControlCentre from "@/pages/ControlCentre";
import MonthSummary from "@/pages/MonthSummary";
import WeeklyTracker from "@/pages/WeeklyTracker";
import PLDashboard from "@/pages/pl/Dashboard";
import PLBudget from "@/pages/pl/BudgetInput";
import PLForecast from "@/pages/pl/FoodBeverageForecast";
import WagesDashboard from "@/pages/wages/Dashboard";
import WagesEmployees from "@/pages/wages/Employees";
import WagesShifts from "@/pages/wages/Shifts";
import MasterDashboard from "@/pages/master/Dashboard";
import MasterMonthly from "@/pages/master/MonthSummary";
import MasterWeekly from "@/pages/master/WeeklyInput";
import MasterDaily from "@/pages/master/Dashboard";
import HiQDashboard from "@/pages/hiq/Dashboard";
import HiQPerformance from "@/pages/hiq/Performance";
import HomeDashboard from "@/pages/home/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "/profile/:userId",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "/edit-profile",
        element: (
          <RequireAuth>
            <EditProfile />
          </RequireAuth>
        ),
      },
      {
        path: "/home/dashboard",
        element: (
          <RequireAuth>
            <HomeDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/team/dashboard",
        element: (
          <RequireAuth>
            <TeamDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/team/noticeboard",
        element: (
          <RequireAuth>
            <Noticeboard />
          </RequireAuth>
        ),
      },
      {
        path: "/team/knowledge",
        element: (
          <RequireAuth>
            <Knowledge />
          </RequireAuth>
        ),
      },
      {
        path: "/team/chat",
        element: (
          <RequireAuth>
            <Chat />
          </RequireAuth>
        ),
      },
      {
        path: "/control-centre",
        element: (
          <RequireAuth requiredRole="Super User">
            <ControlCentre />
          </RequireAuth>
        ),
      },
      {
        path: "/food/dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/food/month/:year/:month",
        element: (
          <RequireAuth>
            <MonthSummary moduleType="food" modulePrefix="Food" />
          </RequireAuth>
        ),
      },
      {
        path: "/food/week/:year/:month/:week",
        element: (
          <RequireAuth>
            <WeeklyTracker moduleType="food" modulePrefix="Food" />
          </RequireAuth>
        ),
      },
      {
        path: "/beverage/dashboard",
        element: (
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/beverage/month/:year/:month",
        element: (
          <RequireAuth>
            <MonthSummary moduleType="beverage" modulePrefix="Beverage" />
          </RequireAuth>
        ),
      },
      {
        path: "/beverage/week/:year/:month/:week",
        element: (
          <RequireAuth>
            <WeeklyTracker moduleType="beverage" modulePrefix="Beverage" />
          </RequireAuth>
        ),
      },
      {
        path: "/pl/dashboard",
        element: (
          <RequireAuth>
            <PLDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/pl/budget",
        element: (
          <RequireAuth>
            <PLBudget />
          </RequireAuth>
        ),
      },
      {
        path: "/pl/forecast",
        element: (
          <RequireAuth>
            <PLForecast />
          </RequireAuth>
        ),
      },
      {
        path: "/wages/dashboard",
        element: (
          <RequireAuth>
            <WagesDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/wages/employees",
        element: (
          <RequireAuth>
            <WagesEmployees />
          </RequireAuth>
        ),
      },
      {
        path: "/wages/shifts",
        element: (
          <RequireAuth>
            <WagesShifts />
          </RequireAuth>
        ),
      },
      {
        path: "/master/dashboard",
        element: (
          <RequireAuth>
            <MasterDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/master/daily/:year/:month/:day",
        element: (
          <RequireAuth>
            <MasterDaily />
          </RequireAuth>
        ),
      },
      {
        path: "/master/weekly/:year/:month/:week",
        element: (
          <RequireAuth>
            <MasterWeekly />
          </RequireAuth>
        ),
      },
      {
        path: "/master/monthly/:year/:month",
        element: (
          <RequireAuth>
            <MasterMonthly />
          </RequireAuth>
        ),
      },
      {
        path: "/hiq/dashboard",
        element: (
          <RequireAuth>
            <HiQDashboard />
          </RequireAuth>
        ),
      },
      {
        path: "/hiq/performance",
        element: (
          <RequireAuth>
            <HiQPerformance />
          </RequireAuth>
        ),
      },
      {
        path: "/master/weekly-input",
        element: (
          <RequireAuth>
            <MasterWeekly />
          </RequireAuth>
        ),
      }
    ],
  },
]);
