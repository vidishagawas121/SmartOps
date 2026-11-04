import React from 'react';
import { useOperations } from '../../store/OperationsContext';
import { OperationsChart } from '../../components/charts/Charts';
import { Badge } from '../../components/ui/Badge';
import { Settings, UserCheck, Wrench, Shield } from 'lucide-react';

export const Operations: React.FC = () => {
  const { inventory } = useOperations();

  const totalInventoryUnits = inventory.reduce((sum, i) => sum + i.quantity, 0);

  const productionLineData = [
    { name: 'Shift A', line1: Math.round(totalInventoryUnits * 0.4), line2: Math.round(totalInventoryUnits * 0.3), line3: 0 },
    { name: 'Shift B', line1: Math.round(totalInventoryUnits * 0.2), line2: Math.round(totalInventoryUnits * 0.1), line3: 0 },
    { name: 'Shift C', line1: 0, line2: 0, line3: 0 },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">Manufacturing & Operations Console</h2>
        <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">Operational performance metrics, assembly line telemetry, and staging schedules.</p>
      </div>

      {/* Assembly Lines Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-[#006A6A]/10 text-[#006A6A]">
            <Settings className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Assembly Line 1</span>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white leading-tight">
              {totalInventoryUnits > 0 ? `Active (${totalInventoryUnits} units)` : 'Idle (0 units)'}
            </h4>
            <Badge variant={totalInventoryUnits > 0 ? 'success' : 'neutral'}>
              {totalInventoryUnits > 0 ? 'Normal Load' : 'Standby'}
            </Badge>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-[#10B981]/10 text-[#10B981]">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Assembly Line 2</span>
            <h4 className="text-lg font-bold text-[#0B1C30] dark:text-white leading-tight">Idle (0 units)</h4>
            <Badge variant="neutral">Standby</Badge>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-start gap-4">
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Shield className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Assembly Line 3</span>
            <h4 className="text-lg font-bold text-slate-600 dark:text-slate-400 leading-tight">Offline (0 units)</h4>
            <Badge variant="neutral">Inactive</Badge>
          </div>
        </div>
      </div>

      {/* Line Output Chart */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm">
        <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] mb-5 uppercase tracking-wide">Production Output by Shift & Assembly Line</h3>
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
    </div>
  );
};


