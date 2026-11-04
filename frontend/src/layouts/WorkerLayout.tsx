import React, { useState, createContext, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useOperations } from '../store/OperationsContext';
import { ToastContainer } from '../components/Toast';
import AttendancePopup from '../components/AttendancePopup';

export const WorkerContext = createContext<any>({});
export const useWorker = () => useContext(WorkerContext);

export const WorkerPage: React.FC<{ Component: any; [key: string]: any }> = ({ Component, ...extraProps }) => {
  const ctx = useWorker();
  return <Component {...ctx} {...extraProps} />;
};

export const WorkerLayout: React.FC = () => {
  const { user, logout } = useOperations();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const contextValue = {
    user,
    showToast,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <WorkerContext.Provider value={contextValue}>
      <div className="flex bg-bg min-h-screen text-slate-800 dark:text-slate-100 transition-all duration-300">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-[1600px] w-full mx-auto pb-16">
            <Outlet context={contextValue} />
          </main>
        </div>

        {/* Worker Attendance Popup */}
        <AttendancePopup
          user={user}
          onLoginSuccess={() => triggerRefresh()}
          showToast={showToast}
          onLogout={() => logout()}
        />

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </WorkerContext.Provider>
  );
};
