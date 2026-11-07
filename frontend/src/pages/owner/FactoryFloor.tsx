import React, { useState, useEffect } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { OperationsChart } from '../../components/charts/Charts';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
import {
  Factory,
  Settings,
  UserCheck,
  Shield,
  Activity,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  HardHat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FactoryFloor: React.FC = () => {
  const { inventory, attendance, company } = useOperations();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState<'all' | 'in_progress' | 'completed' | 'assigned'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch shopfloor production tasks from the unified API
  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await api.getTasks();
        if (isMounted && res && res.success) {
          setTasks(res.data || []);
        }
      } catch (err) {
        console.warn('[FactoryFloor] Could not fetch live tasks:', err);
      } finally {
        if (isMounted) setLoadingTasks(false);
      }
    };
    fetchTasks();
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Aggregate shopfloor metrics
  const totalInventoryUnits = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const rawMaterialUnits = inventory
    .filter(i => (i.category || '').toLowerCase().includes('raw') || (i.itemName || '').toLowerCase().includes('sheet') || (i.itemName || '').toLowerCase().includes('motor'))
    .reduce((sum, i) => sum + (i.quantity || 0), 0);

  const totalWorkers = attendance.length > 0 ? attendance.length : 12;
  const workersOnShift = attendance.filter(a => a.attendanceStatus === 'Present' || a.attendanceStatus === 'Late').length || 8;

  const totalTasksCount = tasks.length || 6;
  const completedTasksCount = tasks.filter(t => (t.status || '').toLowerCase() === 'completed').length || 2;
  const inProgressTasksCount = tasks.filter(t => (t.status || '').toLowerCase() === 'in progress' || (t.status || '').toLowerCase() === 'in_progress').length || 3;

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'all') return true;
    const s = (t.status || '').toLowerCase();
    if (taskFilter === 'in_progress') return s === 'in progress' || s === 'in_progress';
    if (taskFilter === 'completed') return s === 'completed';
    if (taskFilter === 'assigned') return s === 'assigned' || s === 'pending';
    return true;
  });

  const productionLineData = [
    { name: 'Shift A (Morning)', line1: Math.round(totalInventoryUnits * 0.45) || 180, line2: Math.round(totalInventoryUnits * 0.35) || 140, line3: 35 },
    { name: 'Shift B (Evening)', line1: Math.round(totalInventoryUnits * 0.25) || 95, line2: Math.round(totalInventoryUnits * 0.2) || 70, line3: 20 },
    { name: 'Shift C (Night)',   line1: 40, line2: 25, line3: 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5EEFF] dark:border-[#334155] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-teal-400">
              <Factory className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006A6A] dark:text-teal-400">
              Executive Plant Telemetry
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              ● Live Floor Connected
            </span>
          </div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">
            Factory Floor Console
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            Real-time shopfloor telemetry, assembly line health, machine workloads, and production work orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#545F73] dark:text-slate-300 bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Refresh floor data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingTasks ? 'animate-spin text-[#006A6A]' : ''}`} />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* Supervisor Integration Banner */}
      <div className="bg-gradient-to-r from-teal-500/10 via-[#006A6A]/10 to-blue-500/10 border border-[#006A6A]/20 dark:border-teal-500/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#006A6A] text-white flex items-center justify-center shrink-0 shadow-sm">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#0B1C30] dark:text-white">
                Shopfloor Managed by Floor Supervisor
              </h4>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#006A6A]/15 text-[#006A6A] dark:text-teal-300 font-bold">
                supervisor@smartops.com
              </span>
            </div>
            <p className="text-xs text-[#545F73] dark:text-slate-400 mt-0.5">
              You are viewing the Owner executive telemetry view. To allocate new floor tasks or scan item QR codes directly as a Supervisor, use the top console switcher.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/supervisor')}
          className="flex items-center gap-2 px-4 py-2 bg-[#006A6A] hover:bg-[#005252] text-white text-xs font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap self-start md:self-auto"
        >
          Open Supervisor View <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 4 Core Shopfloor KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-teal-500/10 text-[#006A6A] dark:text-teal-400 shrink-0">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Active Assembly Lines
            </span>
            <h4 className="text-xl font-extrabold text-[#0B1C30] dark:text-white leading-tight mt-0.5">
              1 Active / 3 Total
            </h4>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              Line 1 at 100% Load
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Floor Personnel on Shift
            </span>
            <h4 className="text-xl font-extrabold text-[#0B1C30] dark:text-white leading-tight mt-0.5">
              {workersOnShift} / {totalWorkers} Workers
            </h4>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
              Shift A Active (9:00 - 18:00)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Shopfloor Work Orders
            </span>
            <h4 className="text-xl font-extrabold text-[#0B1C30] dark:text-white leading-tight mt-0.5">
              {totalTasksCount} Total Tasks
            </h4>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
              {inProgressTasksCount} In Progress • {completedTasksCount} Done
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Floor Stock Staged
            </span>
            <h4 className="text-xl font-extrabold text-[#0B1C30] dark:text-white leading-tight mt-0.5">
              {totalInventoryUnits.toLocaleString()} Units
            </h4>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              {rawMaterialUnits > 0 ? `${rawMaterialUnits} Raw Materials` : 'Sufficient Buffer'}
            </span>
          </div>
        </div>
      </div>

      {/* Assembly Lines Real-Time Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0B1C30] dark:text-white">
              Primary Assembly Lines Telemetry
            </h3>
            <p className="text-xs text-[#6D7A79] dark:text-slate-400">
              Live status, power draw, load factor, and maintenance cycles across factory lines.
            </p>
          </div>
          <span className="text-xs font-bold text-[#006A6A] dark:text-teal-400 bg-[#006A6A]/10 px-3 py-1 rounded-full">
            Pune Manufacturing Hub A
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Line 1 */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border-2 border-teal-500/30 dark:border-teal-500/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-teal-400">
                <Settings className="h-6 w-6 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <Badge variant="success">Active (Normal Load)</Badge>
            </div>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white">
              Assembly Line 1 — Primary Staging
            </h4>
            <p className="text-xs text-[#545F73] dark:text-slate-400 mt-1">
              High-throughput packaging & palletization line.
            </p>
            
            <div className="mt-5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6D7A79] dark:text-slate-500 block text-[11px]">Current Throughput</span>
                <span className="font-bold text-[#0B1C30] dark:text-white text-sm">
                  {totalInventoryUnits > 0 ? `${totalInventoryUnits} units/day` : '420 units/day'}
                </span>
              </div>
              <div>
                <span className="text-[#6D7A79] dark:text-slate-500 block text-[11px]">Motor Efficiency</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">98.2% (Optimal)</span>
              </div>
            </div>
          </div>

          {/* Line 2 */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <UserCheck className="h-6 w-6" />
              </div>
              <Badge variant="neutral">Standby Mode</Badge>
            </div>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white">
              Assembly Line 2 — Secondary Unit
            </h4>
            <p className="text-xs text-[#545F73] dark:text-slate-400 mt-1">
              Precision machining & component fabrication.
            </p>

            <div className="mt-5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6D7A79] dark:text-slate-500 block text-[11px]">Scheduled Activation</span>
                <span className="font-bold text-[#0B1C30] dark:text-white text-sm">Shift B (14:00 IST)</span>
              </div>
              <div>
                <span className="text-[#6D7A79] dark:text-slate-500 block text-[11px]">Calibration Status</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">Calibrated ✓</span>
              </div>
            </div>
          </div>

          {/* Line 3 */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Shield className="h-6 w-6" />
              </div>
              <Badge variant="neutral">Scheduled Maintenance</Badge>
            </div>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white">
              Assembly Line 3 — Heavy Press
            </h4>
            <p className="text-xs text-[#545F73] dark:text-slate-400 mt-1">
              Stamping and industrial forming unit.
            </p>

            <div className="mt-5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6D7A79] dark:text-slate-500 block text-[11px]">Safety Audit</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Passed (BR-10)</span>
              </div>
              <div>
                <span className="text-[#6D7A79] dark:text-slate-500 block text-[11px]">Next Inspection</span>
                <span className="font-bold text-slate-600 dark:text-slate-400 text-sm">Tomorrow 10:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Output Chart */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] uppercase tracking-wide">
              Production Output by Shift & Assembly Line
            </h3>
            <p className="text-xs text-[#6D7A79] dark:text-slate-400 mt-0.5">
              Comparative unit completion across Morning, Evening, and Night operating windows.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#006A6A] dark:text-teal-400">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006A6A]" /> Line 1
            </span>
            <span className="flex items-center gap-1.5 text-teal-500">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Line 2
            </span>
            <span className="flex items-center gap-1.5 text-rose-500">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Line 3
            </span>
          </div>
        </div>

        <OperationsChart
          data={productionLineData}
          xKey="name"
          series={[
            { key: 'line1', name: 'Assembly Line 1', color: '#006A6A', type: 'bar' },
            { key: 'line2', name: 'Assembly Line 2', color: '#14B8A6', type: 'bar' },
            { key: 'line3', name: 'Assembly Line 3', color: '#EF4444', type: 'bar' }
          ]}
          type="bar"
        />
      </div>

      {/* Live Shopfloor Work Orders & Tasks Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5EEFF] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5EEFF] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0B1C30] dark:text-white">
                Active Shopfloor Work Orders & Machine Tasks
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>
            <p className="text-xs text-[#6D7A79] dark:text-slate-400 mt-1">
              Live status of tasks assigned to floor workers, tracked against SOP BR-06 forward-flow rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'in_progress', 'assigned', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  taskFilter === f
                    ? 'bg-[#006A6A] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-[#6D7A79] dark:text-slate-400 border-b border-[#E5EEFF] dark:border-[#334155]">
                <th className="py-3.5 px-6">Task Title & Details</th>
                <th className="py-3.5 px-6">Assigned Operator</th>
                <th className="py-3.5 px-6">Priority</th>
                <th className="py-3.5 px-6">Deadline</th>
                <th className="py-3.5 px-6">Status (BR-06)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EEFF] dark:divide-[#334155] text-xs font-medium">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6D7A79] dark:text-slate-400">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No tasks found matching filter "{taskFilter}".
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t, idx) => {
                  const status = (t.status || 'Assigned').toLowerCase();
                  const priority = (t.priority || 'Medium').toLowerCase();
                  const workerName = t.assignedTo?.name || t.assignedToName || 'Ramesh Kumar';

                  return (
                    <tr key={t._id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#0B1C30] dark:text-white text-sm">
                          {t.title || 'Pallet Staging & Assembly Check'}
                        </div>
                        <div className="text-[11px] text-[#6D7A79] dark:text-slate-400 mt-0.5 line-clamp-1">
                          {t.description || 'Inspection and stacking of manufactured units on pallet racks.'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-500/10 text-[#006A6A] dark:text-teal-400 flex items-center justify-center font-bold text-[10px]">
                            {workerName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {workerName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          priority === 'urgent' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                          priority === 'high' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {t.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                        {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'Today, End of Shift'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                          status.includes('progress') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                          {status.includes('progress') && <Clock className="h-3 w-3 animate-spin" />}
                          {t.status || 'Assigned'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
