import React from 'react';
import { Outlet } from 'react-router-dom';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="w-full h-full transition-all">
      <Outlet />
    </div>
  );
};
