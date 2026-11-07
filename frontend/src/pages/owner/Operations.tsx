import React, { useState } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { OperationsChart } from '../../components/charts/Charts';
import { Badge } from '../../components/ui/Badge';
import { Settings, UserCheck, Shield, Activity, Search, Filter, ArrowRight, Factory, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Operations: React.FC = () => {
  const { inventory, activities } = useOperations();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'all' | 'telemetry' | 'logs'>('all');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const totalInventoryUnits = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const productionLineData = [
    { name: 'Shift A', line1: Math.round(totalInventoryUnits * 0.4) || 160, line2: Math.round(totalInventoryUnits * 0.3) || 120, line3: 30 },
    { name: 'Shift B', line1: Math.round(totalInventoryUnits * 0.2) || 80, line2: Math.round(totalInventoryUnits * 0.1) || 40, line3: 15 },
    { name: 'Shift C', line1: 25, line2: 10, line3: 0 },
  ];

  // Filter activities for the Operations Log
  const safeActivities = activities || [];
  const filteredActivities = safeActivities.filter(a => {
    const matchesCategory = logFilter === 'all' || (a.category || '').toLowerCase() === logFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      (a.action || '').toLowerCase().includes(query) || 
      (a.details || '').toLowerCase().includes(query) || 
      (a.user || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header with Switcher to Factory Floor Console */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5EEFF] dark:border-[#334155] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-[#006A6A]/10 text-[#006A6A] dark:text-teal-400">
              <Activity className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006A6A] dark:text-teal-400">
              Operations & Event Logs
            </span>
          </div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">
            Manufacturing & Operations Log
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            Live operations audit trail, event timelines, and assembly line telemetry logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/owner/factory')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#006A6A] hover:bg-[#005252] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Factory className="h-4 w-4" />
            Open Factory Floor Console <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Assembly Lines Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-teal-400">
            <Settings className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Assembly Line 1
            </span>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white leading-tight">
              {totalInventoryUnits > 0 ? `Active (${totalInventoryUnits} units)` : 'Active (Normal Load)'}
            </h4>
            <Badge variant="success">Normal Load</Badge>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-[#10B981]/10 text-[#10B981]">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Assembly Line 2
            </span>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white leading-tight">Standby</h4>
            <Badge variant="neutral">Standby</Badge>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Assembly Line 3
            </span>
            <h4 className="text-lg font-bold text-slate-600 dark:text-slate-400 leading-tight">Scheduled Maintenance</h4>
            <Badge variant="neutral">Inactive</Badge>
          </div>
        </div>
      </div>

      {/* Production Output Chart */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm">
        <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] mb-5 uppercase tracking-wide">
          Production Output by Shift & Assembly Line
        </h3>
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

      {/* Operations Event Audit Logs */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5EEFF] dark:border-[#334155] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E5EEFF] dark:border-[#334155] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0B1C30] dark:text-white">
                Operations Audit Log & Activity Stream
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#006A6A]/10 text-[#006A6A] dark:text-teal-400 font-bold">
                {filteredActivities.length} Events Logged
              </span>
            </div>
            <p className="text-xs text-[#6D7A79] dark:text-slate-400 mt-1">
              Immutable operational audit trail recorded for compliance, safety, and dispatch oversight (BR-10 & BR-30).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-[#E5EEFF] dark:border-[#334155] rounded-xl outline-none focus:border-[#006A6A] w-48 text-[#0B1C30] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(['all', 'fleet', 'inventory', 'payroll', 'attendance', 'system'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setLogFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    logFilter === cat
                      ? 'bg-[#006A6A] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#E5EEFF] dark:divide-[#334155]">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-[#6D7A79] dark:text-slate-400">
              <Activity className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No operations events recorded matching filter.
            </div>
          ) : (
            filteredActivities.map((act, index) => {
              const cat = (act.category || 'System').toLowerCase();
              return (
                <div key={act.id || index} className="p-4 md:px-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    cat === 'fleet' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    cat === 'inventory' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                    cat === 'payroll' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    cat === 'attendance' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Activity className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0B1C30] dark:text-white">
                          {act.action || 'Operations Event'}
                        </span>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 tracking-wider">
                          {act.category || 'General'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#6D7A79] dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Just now'}
                      </div>
                    </div>
                    <p className="text-xs text-[#545F73] dark:text-slate-300 mt-1">
                      {act.details || 'Operational record updated by authenticated node.'}
                    </p>
                    <div className="text-[11px] text-[#6D7A79] dark:text-slate-500 mt-1 flex items-center gap-1">
                      <span>Logged by:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{act.user || 'System Node'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
