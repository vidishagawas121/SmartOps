import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  Warehouse,
  Truck,
  Users,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  Factory,
  ClipboardList,
  CheckSquare,
  QrCode,
  AlertTriangle,
  TrendingUp,
  HardHat,
  CalendarCheck,
  FileCheck
} from 'lucide-react';
import { useOperations } from '../../store/OperationsContext';
import { LogoIcon } from '../common/LogoIcon';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { logout, user } = useOperations();

  // Determine active view mode from pathname or user role
  const isSupervisorView = location.pathname.startsWith('/supervisor');
  const isWorkerView = location.pathname.startsWith('/worker');
  const isDriverView = location.pathname.startsWith('/driver') || (!isSupervisorView && !isWorkerView && user?.role === 'Driver');

  let sections;

  if (isWorkerView) {
    sections = [
      {
        title: 'Floor Work',
        items: [
          { name: 'Dashboard', path: '/worker', icon: LayoutDashboard },
          { name: 'Assigned Tasks', path: '/worker/tasks', icon: ClipboardList },
          { name: 'Task Progress', path: '/worker/progress', icon: Activity },
          { name: 'Completion Notes', path: '/worker/completion', icon: CheckSquare },
        ],
      },
      {
        title: 'My Records',
        items: [
          { name: 'My Attendance', path: '/worker/attendance', icon: CalendarCheck },
          { name: 'Leave Requests', path: '/worker/leave', icon: FileCheck },
          { name: 'Salary & Earnings', path: '/worker/salary', icon: CreditCard },
          { name: 'My Profile', path: '/worker/profile', icon: User },
          { name: 'Settings', path: '/worker/settings', icon: Settings },
        ],
      },
    ];
  } else if (isSupervisorView) {
    sections = [
      {
        title: 'Factory Operations',
        items: [
          { name: 'Supervisor Cockpit', path: '/supervisor', icon: LayoutDashboard },
          { name: 'Inventory Catalog', path: '/supervisor/inventory', icon: Warehouse },
          { name: 'Task Allocation', path: '/supervisor/tasks', icon: ClipboardList },
          { name: 'Attendance Registry', path: '/supervisor/attendance', icon: Users },
          { name: 'Staff Directory', path: '/supervisor/workers', icon: HardHat },
          { name: 'Worker Approvals', path: '/supervisor/registration-requests', icon: FileCheck },
        ],
      },
      {
        title: 'Shopfloor Controls',
        items: [
          { name: 'Scan Item QR', path: '/supervisor/scan', icon: QrCode },
          { name: 'Low Stock Alerts', path: '/supervisor/alerts', icon: AlertTriangle },
          { name: 'Salary & Payroll', path: '/supervisor/salary', icon: CreditCard },
          { name: 'Leave Approvals', path: '/supervisor/leave-requests', icon: FileText },
          { name: 'Performance Reports', path: '/supervisor/performance', icon: TrendingUp },
          { name: 'Analytics & Audit', path: '/supervisor/reports', icon: Activity },
          { name: 'Settings', path: '/supervisor/settings', icon: Settings },
        ],
      },
    ];
  } else if (isDriverView) {
    sections = [
      {
        title: 'Operations',
        items: [
          { name: 'Dashboard', path: '/driver', icon: LayoutDashboard },
          { name: 'My Trips', path: '/driver/trips', icon: Truck },
          { name: 'Active Trip', path: '/driver/active-trip', icon: Activity },
          { name: 'Proof of Delivery', path: '/driver/pod', icon: FileText },
        ],
      },
      {
        title: 'Console & Settings',
        items: [
          { name: 'Vehicle Info', path: '/driver/fleet', icon: Warehouse },
          { name: 'Notifications', path: '/driver/notifications', icon: Bell },
          { name: 'Profile', path: '/driver/profile', icon: Users },
          { name: 'Settings', path: '/driver/settings', icon: Settings },
        ],
      },
    ];
  } else {
    // Owner View
    sections = [
      {
        title: 'Operations',
        items: [
          { name: 'Executive Cockpit', path: '/owner', icon: LayoutDashboard },
          { name: 'Trips & Dispatch', path: '/owner/trips', icon: Truck },
          { name: 'Operations Log', path: '/owner/operations', icon: Activity },
          { name: 'Fleet Tracker', path: '/owner/fleet', icon: Truck },
          { name: 'Attendance Status', path: '/owner/attendance', icon: Users },
          { name: 'Workers Directory', path: '/owner/workers', icon: Users },
          { name: 'Proof of Delivery', path: '/owner/pod', icon: FileText },
        ],
      },
      {
        title: 'Management & Reports',
        items: [
          { name: 'Inventory Logs', path: '/owner/inventory', icon: Warehouse },
          { name: 'Payroll & Salary', path: '/owner/payroll', icon: CreditCard },
          { name: 'Reports Desk', path: '/owner/reports', icon: FileText },
          { name: 'Factory Floor Console', path: '/supervisor', icon: Factory },
        ],
      },
      {
        title: 'Account Settings',
        items: [
          { name: 'Profile Settings', path: '/owner/profile', icon: User },
          { name: 'System Settings', path: '/owner/settings', icon: Settings },
        ],
      },
    ];
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 272 }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-[#1E293B] text-[#94A3B8] border-r border-[#334155]/60 z-20 overflow-hidden shrink-0 shadow-lg transition-colors duration-200"
    >
      {/* Brand Header */}
      <div className={`flex items-center h-16 shrink-0 border-b border-[#334155]/60 transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <LogoIcon size={40} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm text-white tracking-tight truncate leading-tight">SmartOps</span>
                <span className="text-[10px] text-[#7DF5F5] font-semibold tracking-wider uppercase truncate">
                  {isSupervisorView ? 'Supervisor Portal' : isWorkerView ? 'Worker Portal' : isDriverView ? 'Driver Portal' : 'Owner Portal'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg hover:bg-[#334155]/80 text-[#94A3B8] hover:text-white transition-colors cursor-pointer shrink-0 ml-1"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-[#334155]/80 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            title="Expand Sidebar"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-3 text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                {section.title}
              </h4>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                    isActive
                      ? 'bg-[#006A6A] text-white shadow-md shadow-[#006A6A]/20'
                      : 'text-[#94A3B8] hover:bg-[#334155]/60 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-white' : 'text-[#64748B] group-hover:text-white group-hover:scale-105'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info / Logout */}
      <div className="p-3 border-t border-[#334155]/60 shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 hover:text-[#DC2626] transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Sign Out"
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
};
