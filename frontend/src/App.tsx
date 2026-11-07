import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OperationsProvider, useOperations } from './store/OperationsContext';
import { ThemeProvider } from './store/ThemeContext';

// Loading Spinner Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin" />
      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing System Nodes...</span>
    </div>
  </div>
);

// Layout Wrappers
import { OwnerLayout } from './layouts/OwnerLayout';
import { DriverLayout } from './layouts/DriverLayout';
import { SupervisorLayout, SupervisorPage } from './layouts/SupervisorLayout';
import { WorkerLayout, WorkerPage } from './layouts/WorkerLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword').then(m => ({ default: m.ResetPassword })));

// Owner Pages (Lazy Loaded)
const OwnerDashboard = lazy(() => import('./pages/owner/Dashboard').then(m => ({ default: m.Dashboard })));
const OwnerOperations = lazy(() => import('./pages/owner/Operations').then(m => ({ default: m.Operations })));
const OwnerFactoryFloor = lazy(() => import('./pages/owner/FactoryFloor').then(m => ({ default: m.FactoryFloor })));
const OwnerInventory = lazy(() => import('./pages/owner/Inventory').then(m => ({ default: m.Inventory })));
const OwnerAttendance = lazy(() => import('./pages/owner/Attendance').then(m => ({ default: m.Attendance })));
const OwnerFleet = lazy(() => import('./pages/owner/Fleet').then(m => ({ default: m.Fleet })));
const OwnerPayroll = lazy(() => import('./pages/owner/Payroll').then(m => ({ default: m.Payroll })));
const OwnerReports = lazy(() => import('./pages/owner/Reports').then(m => ({ default: m.Reports })));
const OwnerSettings = lazy(() => import('./pages/owner/Settings').then(m => ({ default: m.Settings })));
const OwnerWorkers = lazy(() => import('./pages/owner/Workers').then(m => ({ default: m.Workers })));
const OwnerProfile = lazy(() => import('./pages/owner/Profile').then(m => ({ default: m.Profile })));
const OwnerPOD = lazy(() => import('./pages/owner/POD').then(m => ({ default: m.POD })));
const OwnerTrips = lazy(() => import('./pages/owner/Trips').then(m => ({ default: m.OwnerTrips })));

// Driver Pages (Lazy Loaded)
const DriverDashboard = lazy(() => import('./pages/driver/Dashboard').then(m => ({ default: m.Home })));
const DriverAttendance = lazy(() => import('./pages/driver/Attendance').then(m => ({ default: m.GPS })));
const DriverTrips = lazy(() => import('./pages/driver/Trips').then(m => ({ default: m.Trips })));
const DriverActiveTrip = lazy(() => import('./pages/driver/ActiveTrip').then(m => ({ default: m.ActiveTrip })));
const DriverPOD = lazy(() => import('./pages/driver/POD').then(m => ({ default: m.POD })));
const DriverVehicle = lazy(() => import('./pages/driver/Vehicle').then(m => ({ default: m.VehicleInfo })));
const DriverNotifications = lazy(() => import('./pages/driver/Notifications').then(m => ({ default: m.Notifications })));
const DriverProfile = lazy(() => import('./pages/driver/Profile').then(m => ({ default: m.Profile })));
const DriverSettings = lazy(() => import('./pages/driver/Settings').then(m => ({ default: m.Settings })));

// Supervisor Pages (Lazy Loaded)
const SupervisorDashboard = lazy(() => import('./pages/supervisor/Dashboard'));
const SupervisorInventory = lazy(() => import('./pages/supervisor/Inventory'));
const SupervisorTasks = lazy(() => import('./pages/supervisor/Tasks'));
const SupervisorAttendance = lazy(() => import('./pages/supervisor/Attendance'));
const SupervisorWorkers = lazy(() => import('./pages/supervisor/WorkerOverview'));
const SupervisorRegistrationRequests = lazy(() => import('./pages/supervisor/WorkerRegistrationRequests'));
const SupervisorSalary = lazy(() => import('./pages/supervisor/Salary'));
const SupervisorLeaveRequests = lazy(() => import('./pages/supervisor/LeaveRequests'));
const SupervisorAlerts = lazy(() => import('./pages/supervisor/Alerts'));
const SupervisorReports = lazy(() => import('./pages/supervisor/Reports'));
const SupervisorPerformance = lazy(() => import('./pages/supervisor/PerformanceReports'));
const SupervisorScan = lazy(() => import('./pages/supervisor/ScanItemQR'));
const SupervisorSettings = lazy(() => import('./pages/supervisor/Settings'));

// Worker Pages (Lazy Loaded)
const WorkerDashboard = lazy(() => import('./pages/worker/WorkerDashboard'));
const WorkerTasks = lazy(() => import('./pages/worker/WorkerTasks'));
const WorkerProgress = lazy(() => import('./pages/worker/WorkerProgress'));
const WorkerCompletion = lazy(() => import('./pages/worker/WorkerCompletionNotes'));
const WorkerAttendance = lazy(() => import('./pages/worker/WorkerAttendance'));
const WorkerLeave = lazy(() => import('./pages/worker/WorkerLeaveRequests'));
const WorkerSalary = lazy(() => import('./pages/worker/WorkerSalary'));
const WorkerProfile = lazy(() => import('./pages/worker/WorkerProfile'));
const WorkerSettings = lazy(() => import('./pages/worker/WorkerSettings'));

// Error Boundaries (Lazy Loaded)
const NotFound = lazy(() => import('./pages/errors/NotFound').then(m => ({ default: m.NotFound })));
const Unauthorized = lazy(() => import('./pages/errors/Unauthorized').then(m => ({ default: m.Unauthorized })));
const ServerError = lazy(() => import('./pages/errors/ServerError').then(m => ({ default: m.ServerError })));

import { ErrorBoundary } from './components/common/ErrorBoundary';

// Root Redirect component based on current user role
const RootRedirect: React.FC = () => {
  const { user } = useOperations();
  if (!user) return <Navigate to="/login" replace />;
  const role = (user.role || '').toLowerCase();
  if (role === 'driver') return <Navigate to="/driver" replace />;
  if (role === 'supervisor') return <Navigate to="/supervisor" replace />;
  if (role === 'worker') return <Navigate to="/worker" replace />;
  return <Navigate to="/owner" replace />;
};

const App: React.FC = () => {
  React.useEffect(() => {
    const handleWheel = () => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.tagName === 'INPUT' && (activeEl as HTMLInputElement).type === 'number') {
        (activeEl as HTMLInputElement).blur();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OperationsProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Auth Layout Wrapper */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* 1. Owner Portal (Executive Dashboard) */}
                <Route path="/owner" element={<OwnerLayout />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<OwnerDashboard />} />
                    <Route path="operations" element={<OwnerOperations />} />
                    <Route path="factory" element={<OwnerFactoryFloor />} />
                    <Route path="factory-floor" element={<OwnerFactoryFloor />} />
                    <Route path="trips" element={<OwnerTrips />} />
                    <Route path="inventory" element={<OwnerInventory />} />
                    <Route path="attendance" element={<OwnerAttendance />} />
                    <Route path="fleet" element={<OwnerFleet />} />
                    <Route path="payroll" element={<OwnerPayroll />} />
                    <Route path="reports" element={<OwnerReports />} />
                    <Route path="settings" element={<OwnerSettings />} />
                    <Route path="workers" element={<OwnerWorkers />} />
                    <Route path="profile" element={<OwnerProfile />} />
                    <Route path="pod" element={<OwnerPOD />} />
                  </Route>
                </Route>

                {/* 2. Supervisor Portal (Factory Floor Dashboard) */}
                <Route path="/supervisor" element={<SupervisorLayout />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<SupervisorPage Component={SupervisorDashboard} />} />
                    <Route path="inventory" element={<SupervisorPage Component={SupervisorInventory} />} />
                    <Route path="tasks" element={<SupervisorPage Component={SupervisorTasks} />} />
                    <Route path="attendance" element={<SupervisorPage Component={SupervisorAttendance} />} />
                    <Route path="workers" element={<SupervisorPage Component={SupervisorWorkers} />} />
                    <Route path="registration-requests" element={<SupervisorPage Component={SupervisorRegistrationRequests} />} />
                    <Route path="salary" element={<SupervisorPage Component={SupervisorSalary} />} />
                    <Route path="leave-requests" element={<SupervisorPage Component={SupervisorLeaveRequests} />} />
                    <Route path="alerts" element={<SupervisorPage Component={SupervisorAlerts} />} />
                    <Route path="reports" element={<SupervisorPage Component={SupervisorReports} />} />
                    <Route path="performance" element={<SupervisorPage Component={SupervisorPerformance} />} />
                    <Route path="scan" element={<SupervisorPage Component={SupervisorScan} />} />
                    <Route path="settings" element={<SupervisorPage Component={SupervisorSettings} />} />
                  </Route>
                </Route>

                {/* 3. Driver Portal (Logistics Dashboard) */}
                <Route path="/driver" element={<DriverLayout />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<DriverDashboard />} />
                    <Route path="attendance" element={<DriverAttendance />} />
                    <Route path="trips" element={<DriverTrips />} />
                    <Route path="active-trip" element={<DriverActiveTrip />} />
                    <Route path="gps" element={<Navigate to="/driver/active-trip" replace />} />
                    <Route path="pod" element={<DriverPOD />} />
                    <Route path="fleet" element={<DriverVehicle />} />
                    <Route path="notifications" element={<DriverNotifications />} />
                    <Route path="profile" element={<DriverProfile />} />
                    <Route path="settings" element={<DriverSettings />} />
                  </Route>
                </Route>

                {/* 4. Worker Portal (Shopfloor Worker Dashboard) */}
                <Route path="/worker" element={<WorkerLayout />}>
                  <Route element={<DashboardLayout />}>
                    <Route index element={<WorkerPage Component={WorkerDashboard} />} />
                    <Route path="tasks" element={<WorkerPage Component={WorkerTasks} />} />
                    <Route path="progress" element={<WorkerPage Component={WorkerProgress} />} />
                    <Route path="completion" element={<WorkerPage Component={WorkerCompletion} />} />
                    <Route path="attendance" element={<WorkerPage Component={WorkerAttendance} />} />
                    <Route path="leave" element={<WorkerPage Component={WorkerLeave} />} />
                    <Route path="salary" element={<WorkerPage Component={WorkerSalary} />} />
                    <Route path="profile" element={<WorkerPage Component={WorkerProfile} />} />
                    <Route path="settings" element={<WorkerPage Component={WorkerSettings} />} />
                  </Route>
                </Route>

                {/* Error Boundaries */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/server-error" element={<ServerError />} />
                <Route path="/404" element={<NotFound />} />

                {/* Dynamic Fallback: Redirect to active dashboard based on session */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </OperationsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
