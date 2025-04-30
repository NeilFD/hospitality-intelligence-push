
import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="w-full max-w-md p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
