import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, Factory, Truck, HardHat, ChevronDown, Check } from 'lucide-react';
import { useOperations } from '../../store/OperationsContext';

export interface DashboardOption {
  id: string;
  name: string;
  role: 'Owner' | 'Supervisor' | 'Driver' | 'Worker';
  path: string;
  badge: string;
  description: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  bgLight: string;
}

export const DASHBOARDS: DashboardOption[] = [
  {
    id: 'owner',
    name: 'Owner Console',
    role: 'Owner',
    path: '/owner',
    badge: 'Executive',
    description: 'Fleet, Revenue, KPIs & Telemetry',
    icon: Crown,
    color: 'text-amber-500',
    bgLight: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'supervisor',
    name: 'Supervisor Console',
    role: 'Supervisor',
    path: '/supervisor',
    badge: 'Factory Floor',
    description: 'Tasks, Approvals, QR & Inventory',
    icon: Factory,
    color: 'text-teal-500',
    bgLight: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400',
  },
  {
    id: 'driver',
    name: 'Driver Console',
    role: 'Driver',
    path: '/driver',
    badge: 'Logistics',
    description: 'Trips, GPS Clock-in & POD Upload',
    icon: Truck,
    color: 'text-blue-500',
    bgLight: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'worker',
    name: 'Worker Console',
    role: 'Worker',
    path: '/worker',
    badge: 'Shopfloor',
    description: 'Assigned Tasks, Attendance & Payslips',
    icon: HardHat,
    color: 'text-emerald-500',
    bgLight: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  },
];

export const RoleSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useOperations();
  const [isOpen, setIsOpen] = useState(false);

  // Detect current dashboard from path
  const currentDashboard = DASHBOARDS.find((d) => location.pathname.startsWith(d.path)) || DASHBOARDS[0];
  const CurrentIcon = currentDashboard.icon;

  const handleSelect = (option: DashboardOption) => {
    setIsOpen(false);
    navigate(option.path);
  };

  return (
    <div className="relative inline-block text-left z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
        title="Switch Dashboard"
      >
        <span className={`p-1 rounded-lg ${currentDashboard.bgLight}`}>
          <CurrentIcon size={14} className={currentDashboard.color} />
        </span>
        <div className="flex flex-col text-left">
          <span className="leading-none text-[11px] font-bold text-slate-800 dark:text-slate-100">
            {currentDashboard.name}
          </span>
          <span className="text-[9px] text-slate-500 font-normal">
            {currentDashboard.badge}
          </span>
        </div>
        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
              <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                Connected Dashboards (4)
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch real-time workspace perspective
              </p>
            </div>

            <div className="space-y-1">
              {DASHBOARDS.map((dash) => {
                const Icon = dash.icon;
                const isSelected = currentDashboard.id === dash.id;

                return (
                  <button
                    key={dash.id}
                    onClick={() => handleSelect(dash)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-lg ${dash.bgLight}`}>
                        <Icon size={16} className={dash.color} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {dash.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {dash.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {dash.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} className="text-teal-600 dark:text-teal-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

