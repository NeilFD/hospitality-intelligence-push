
import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <SideNav />
      <main className="flex-1 overflow-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
