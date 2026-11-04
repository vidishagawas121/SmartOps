import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useOperations } from '../store/OperationsContext';

export const OwnerLayout: React.FC = () => {
  const { user } = useOperations();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Route protection
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();

  if (userRole === 'driver') {
    return <Navigate to="/driver" replace />;
  }

  return (
    <div className="flex bg-bg min-h-screen text-slate-800 dark:text-slate-100 transition-all duration-300">
      {/* Collapsible Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1600px] w-full mx-auto pb-16">
          <Outlet />
        </main>
        
        {/* Footer status bar */}
        <footer className="h-10 bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-900 px-6 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
              API Gate: <span className="font-semibold text-slate-600 dark:text-slate-400">Online (0.2ms latency)</span>
            </span>
            <span className="w-[1px] h-3 bg-gray-200 dark:bg-slate-800" />
            <span className="flex items-center gap-1">
              Database Cluster: <span className="font-semibold text-slate-600 dark:text-slate-400">Healthy (Replica: Syncing)</span>
            </span>
          </div>
          <div>
            System Version: <span className="font-semibold text-slate-600 dark:text-slate-400">v4.1.2-Enterprise</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
