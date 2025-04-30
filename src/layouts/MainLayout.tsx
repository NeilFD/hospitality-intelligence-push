
import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from '@/components/SideNav';

export const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
