import React from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Badge } from '../../components/ui/Badge';
import { MapPin, Navigation, Compass, AlertTriangle, Clock, Map, Target } from 'lucide-react';

export const GPS: React.FC = () => {
  const { trips, vehicles } = useOperations();
  const activeTrip = trips.find(t => t.driverId === 'd1' && t.status !== 'Completed') || trips[0];
  const driverVehicle = vehicles[0] || { vehicleNumber: 'MH-12-QW-9874' };

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="text-[26px] font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight leading-none">Live GPS Navigation Map</h2>
        <p className="text-[13px] text-[#4B5563] dark:text-[#94A3B8] mt-1.5 font-medium">Real-time truck tracking coordinates, highway milestones, and traffic diagnostics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Info Bar */}
        <div className="bg-[#0B1C30] dark:bg-[#1E293B] text-white rounded-2xl p-6 flex items-center gap-4 shadow-md lg:col-span-4 border border-slate-800 dark:border-[#334155]">
          <div className="p-3 bg-[#006A6A] rounded-xl animate-pulse shrink-0">
            <Navigation className="h-5 w-5 rotate-45 text-white" />
          </div>
          <div className="space-y-1.5 flex-1 text-left">
            <h4 className="text-[15px] font-bold text-white tracking-tight">In 800m, keep left towards Mumbai-Pune Expressway exit</h4>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> ETA: {activeTrip?.eta || '16:45 PM'}</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Remaining: {activeTrip?.distanceRemaining || 48} km</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span className="text-[#14B8A6] font-bold">Consignment: {activeTrip?.tripNumber}</span>
            </div>
          </div>
        </div>

        {/* Fullscreen Map container (75%) */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl p-6 shadow-sm lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-[#334155] pb-2.5">
            <h4 className="text-[13px] font-extrabold text-[#111827] dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
              <Map className="h-4 w-4 text-[#006A6A]" /> Route Vector Visualization
            </h4>
            <Badge variant="info">Active Tracker</Badge>
          </div>

          <div className="h-140 bg-[#0B1C30] rounded-xl relative overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] opacity-25" />

            {/* Top Floating details */}
            <div className="relative z-10 flex justify-between items-center">
              <Badge variant="info" className="bg-slate-900/90 text-white border border-slate-800/80 px-3.5 py-1.5 font-mono text-xs">
                Speed Indicator: 64 km/h
              </Badge>
              <div className="w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md flex items-center justify-center text-slate-400 border border-slate-800">
                <Compass className="h-4 w-4 animate-spin-slow" />
              </div>
            </div>

            {/* Simulated Route Vector */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 650 480">
              <path
                d="M 80,420 L 160,350 L 260,250 L 380,200 L 480,110 L 580,50"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 80,420 L 160,350 L 260,250"
                fill="none"
                stroke="#006A6A"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="80" cy="420" r="5" fill="#667085" />
              <circle cx="160" cy="350" r="5" fill="#006A6A" />
              <circle cx="260" cy="250" r="6" fill="#EF4444" />
              <circle cx="380" cy="200" r="5" fill="#64748B" />
              <circle cx="480" cy="110" r="5" fill="#64748B" />
              <circle cx="580" cy="50" r="7" fill="#10B981" />
            </svg>

            {/* Pune Label */}
            <div className="absolute bottom-18 left-20 text-[10px] text-slate-400 font-bold">Pune Whse Yard A</div>
            
            {/* Mumbai Label */}
            <div className="absolute top-16 right-20 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Mumbai terminal DC
            </div>

            {/* Truck Pointer */}
            <div className="absolute top-52 left-64 flex flex-col items-center">
              <span className="bg-slate-900 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded shadow border border-slate-700">
                {driverVehicle?.vehicleNumber || 'MH-12-QW-9874'}
              </span>
              <div className="w-6 h-6 rounded-full bg-[#006A6A] text-white flex items-center justify-center border-2 border-white shadow-lg animate-bounce mt-1">
                <Navigation className="h-3.5 w-3.5 rotate-45" />
              </div>
            </div>

            {/* Bottom Details Overlay */}
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 text-white border border-slate-800 flex items-center justify-between text-left shadow">
              <div className="text-xs space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Destination</p>
                <p className="font-bold">{activeTrip?.dropLocation || 'Distribution Center'}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">ETA Clock</p>
                <p className="font-bold font-mono text-[#14B8A6]">{activeTrip?.eta || '16:45 PM'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoint sidebar (25%) */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <h4 className="text-[13px] font-extrabold text-[#111827] dark:text-slate-100 border-b border-[#E5E7EB] dark:border-[#334155] pb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <Target className="h-4 w-4 text-[#006A6A]" /> Route Milestones
            </h4>

            <div className="space-y-4">
              {[
                { name: 'Pune Warehouse', status: 'Passed', active: true },
                { name: 'Khed Shivapur Toll', status: 'Passed', active: true },
                { name: 'Lonavala Ghats', status: 'Current', active: true, isCurrent: true },
                { name: 'Panvel Crossing', status: 'Pending', active: false },
                { name: 'Mumbai terminal DC', status: 'Pending', active: false },
              ].map((checkpoint, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 border-2 ${
                    checkpoint.isCurrent 
                      ? 'bg-[#006A6A] border-[#006A6A] animate-pulse shadow-sm' 
                      : checkpoint.active 
                      ? 'bg-[#10B981] border-[#10B981]' 
                      : 'bg-white dark:bg-[#0F172A] border-slate-300 dark:border-slate-800'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${checkpoint.isCurrent ? 'text-[#111827] dark:text-[#F8FAFC]' : 'text-[#6B7280] dark:text-[#94A3B8]'}`}>{checkpoint.name}</p>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#94A3B8] mt-0.5 font-bold uppercase">{checkpoint.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-[#EF4444]/10 border border-red-200 dark:border-red-900/30 rounded-xl text-xs space-y-2 shadow-sm">
            <h5 className="font-bold text-[#EF4444] dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-500 animate-bounce" /> Delay Incidents
            </h5>
            <p className="text-[11px] text-red-700 dark:text-red-300 leading-normal font-semibold">
              Any traffic blockages or servicing delays must be logged using the "Incident Halt" button in My Trips.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



