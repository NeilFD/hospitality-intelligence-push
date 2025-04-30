
import React from 'react';
import { Outlet } from 'react-router-dom';

export const RotasLayout = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default RotasLayout;
