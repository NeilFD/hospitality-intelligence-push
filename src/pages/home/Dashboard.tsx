import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentModule } from '@/lib/store';
import FoodDashboard from '@/pages/food/Dashboard';
import BeverageDashboard from '@/pages/beverage/Dashboard';
import HomeDashboard from '@/pages/home/Dashboard';
import { format } from 'date-fns';

// Add the day of week to the date in the header
// This is a simple modification to show the day of week in the date format
// For example: "Wednesday, 16 Apr 2025" instead of just "16 Apr 2025"

// The date component is likely contained in another component, so we'll need to track that down
// For now, let's add a helper function that can format dates with the day of week included

export function formatDateWithDayOfWeek(date: Date): string {
  return format(date, "EEEE, dd MMM yyyy");
}

export default function Dashboard() {
  const currentModule = useCurrentModule();
  const location = useLocation();
  
  // Determine which dashboard to display based on the URL
  const path = location.pathname;
  
  useEffect(() => {
    console.log(`Dashboard: Current path is ${path}, module is ${currentModule}`);
  }, [path, currentModule]);
  
  // Route to the specific dashboard component based on the path
  if (path.includes('/home/dashboard')) {
    return <HomeDashboard />;
  } else if (path.includes('/beverage/dashboard')) {
    return <BeverageDashboard />;
  } else if (path.includes('/food/dashboard')) {
    return <FoodDashboard />;
  }
  
  // If we're on the generic dashboard, redirect to the appropriate one
  return <Navigate to={`/${currentModule}/dashboard`} replace />;
}
