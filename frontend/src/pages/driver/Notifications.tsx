import React, { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Bell, AlertTriangle, Truck, Navigation, Fuel, Info, Calendar } from 'lucide-react';

interface AlertNotification {
  id: string;
  title: string;
  desc: string;
  type: 'Operations' | 'Alerts' | 'System';
  time: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
}

export const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Operations' | 'Alerts' | 'System'>('All');

  const notifications: AlertNotification[] = [
    {
      id: 'N-01',
      title: 'New Trip Assigned',
      desc: 'Consignment TRP-2026-8801 linked successfully. Route: Pune Hub to Mumbai Gate 4 DC.',
      type: 'Operations',
      time: '15 mins ago',
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-50/60'
    },
    {
      id: 'N-02',
      title: 'Route Diversion Alert',
      desc: 'GPS advice: Avoid Pune Bypass toll bridge due to standard maintenance halts. Diversion mapped.',
      type: 'System',
      time: '1 hr ago',
      icon: Navigation,
      color: 'text-[#006A6A]',
      bg: 'bg-[#006A6A]/10'
    },
    {
      id: 'N-03',
      title: 'Distress Weather Block Warning',
      desc: 'Severe wind and rain warning advisory issued for Mumbai-Pune highway coordinates.',
      type: 'Alerts',
      time: '4 hrs ago',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50/60'
    },
    {
      id: 'N-04',
      title: 'Diesel Fuel Yard Warning',
      desc: 'Assigned truck MH-12 diesel tank level has dropped below 25%. Log refuels immediately.',
      type: 'Alerts',
      time: '1 day ago',
      icon: Fuel,
      color: 'text-rose-600',
      bg: 'bg-rose-50/60'
    },
    {
      id: 'N-05',
      title: 'Commercial Insurance Policy Approved',
      desc: 'Fleet insurance for container MH-12 has been successfully renewed and verified by administrators.',
      type: 'System',
      time: '2 days ago',
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50/60'
    },
    {
      id: 'N-06',
      title: 'Trip Details Updated',
      desc: 'Dispatch manager modified gate entry schedules. Mumbai drop-off is now set to Gate 4.',
      type: 'Operations',
      time: '3 days ago',
      icon: Info,
      color: 'text-[#6D7A79]',
      bg: 'bg-slate-100/60'
    }
  ];

  const filteredList = notifications.filter(n => filter === 'All' || n.type === filter);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 text-left animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E5E7EB] dark:border-[#334155] pb-5">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#111827] dark:text-[#F8FAFC] tracking-tight leading-none">Dispatch & Safety Notifications</h2>
          <p className="text-[13px] text-[#4B5563] dark:text-[#94A3B8] mt-1.5 font-medium">Review active consignment updates, route deviations, and fleet reminders.</p>
        </div>
        <div className="flex gap-1.5 bg-[#F9FAFB] dark:bg-[#0F172A] border border-[#E5E7EB] dark:border-[#334155] p-1 rounded-xl text-xs self-start sm:self-auto shadow-sm font-bold">
          {(['All', 'Operations', 'Alerts', 'System'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === tab 
                  ? 'bg-white dark:bg-[#1E293B] text-[#006A6A] dark:text-white shadow-sm font-bold' 
                  : 'text-[#6B7280] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 border border-[#E5E7EB] dark:border-[#334155] shadow-sm text-center text-[#6B7280] dark:text-slate-400 text-xs italic font-semibold">
            No active notification logs under category "{filter}".
          </div>
        ) : (
          filteredList.map(notif => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5E7EB] dark:border-[#334155] shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow relative overflow-hidden text-left"
              >
                <div className={`p-3.5 rounded-xl shrink-0 ${notif.bg} ${notif.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5 pr-12">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-[#111827] dark:text-[#F8FAFC]">{notif.title}</h4>
                    <Badge variant={notif.type === 'Operations' ? 'info' : notif.type === 'Alerts' ? 'warning' : 'neutral'}>
                      {notif.type}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-[#4B5563] dark:text-[#94A3B8] leading-relaxed font-semibold">{notif.desc}</p>
                </div>
                <span className="absolute top-5 right-5 text-[10px] text-[#6B7280] dark:text-slate-400 font-mono font-bold uppercase">{notif.time}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

