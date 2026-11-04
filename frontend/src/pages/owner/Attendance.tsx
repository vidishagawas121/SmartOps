import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useOperations } from '../../store/OperationsContext';
import { downloadReport } from '../../utils/downloadReport';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/tables/Table';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserX, UserMinus, Clock, AlertTriangle, Truck, TrendingUp,
  Navigation, Activity, DollarSign, MapPin, Calendar, Award,
  FileText, Eye, LogOut, ExternalLink, Bell, SlidersHorizontal, ArrowUpRight,
  ArrowDownRight, Search, Download, CheckCircle2, AlertOctagon, HelpCircle, Info
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { AttendanceRecord, Trip, Vehicle, PayrollRecord } from '../../types';

// Circular Progress Ring Component
const ProgressRing: React.FC<{
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}> = ({ progress, color, size = 38, strokeWidth = 3.5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  const isClassColor = color.startsWith('text-');

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800/80 fill-none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`fill-none transition-all duration-500 ease-out ${
            isClassColor ? color : ''
          }`}
          stroke={isClassColor ? undefined : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {/* Percentage label in the center - uses matching dynamic color */}
      <span 
        className={`absolute text-[8px] font-extrabold ${isClassColor ? color : ''}`}
        style={{ color: isClassColor ? undefined : color }}
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
};

// Helper component for KPI Cards with circular progress rings
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<any>;
  progress: number;
  color: string;
  bgColor: string;
}> = ({ title, value, change, isPositive, icon: Icon, progress, color, bgColor }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex flex-col justify-between items-stretch gap-4 group transition-all duration-300 min-h-[160px] w-full overflow-hidden text-left"
    >
      {/* Top Row: Title & Icon */}
      <div className="flex justify-between items-start gap-2 min-w-0">
        <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase whitespace-normal break-words leading-tight flex-1">
          {title}
        </span>
        <div className={`p-2 rounded-lg transition-all duration-300 shrink-0 ${bgColor} ${color}`}>
          <Icon className="h-4.5 w-4.5 group-hover:scale-105 transition-transform duration-200" />
        </div>
      </div>

      {/* Middle Row: Value */}
      <div className="min-w-0 py-0.5">
        <h4 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight truncate w-full" title={String(value)}>
          {value}
        </h4>
      </div>

      {/* Bottom Row: Trend & Progress Ring */}
      <div className="flex items-end justify-between gap-2 pt-1 mt-auto">
        <div className="flex items-center gap-1 min-w-0">
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span className={`text-[12px] font-bold truncate ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {change}
          </span>
        </div>
        <div className="shrink-0 pl-1">
          <ProgressRing progress={progress} color={color} size={38} strokeWidth={3.5} />
        </div>
      </div>
    </motion.div>
  );
};

export const Attendance: React.FC = () => {
  const { attendance, vehicles, trips, payroll, notifications, triggerNotification, drivers } = useOperations();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // 1. DYNAMIC ACCURATE KPI CALCULATION
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLocal = new Date().toLocaleDateString('en-CA');

  // Total drivers in pool: use registered drivers list or unique attendance/vehicles count
  const totalDriversCount = useMemo(() => {
    if (drivers && drivers.length > 0) return drivers.length;
    const uniqueDrivers = new Set<string>();
    attendance.forEach(a => { if (a?.driverId || a?.employeeName) uniqueDrivers.add(a.driverId || a.employeeName); });
    vehicles.forEach(v => { if (v?.driver) uniqueDrivers.add(v.driver); });
    return uniqueDrivers.size > 0 ? uniqueDrivers.size : 1;
  }, [drivers, attendance, vehicles]);

  // Today's attendance records
  const todayAttendance = useMemo(() => {
    return attendance.filter(a => {
      if (!a) return false;
      return a.date === todayStr || a.date === todayLocal || (a.checkIn && a.checkIn.includes(todayStr));
    });
  }, [attendance, todayStr, todayLocal]);

  // Drivers currently present / on duty
  const presentDriversCount = useMemo(() => {
    const presentDriverIds = new Set<string>();
    
    // Checked in today with Present or Late status
    todayAttendance.forEach(a => {
      if (a.attendanceStatus === 'Present' || a.attendanceStatus === 'Late' || a.status === 'Present' || a.status === 'Late') {
        presentDriverIds.add(a.driverId || a.employeeName);
      }
    });

    // Currently active on duty status across attendance records
    attendance.forEach(a => {
      if (a.currentStatus === 'On Duty' || a.currentStatus === 'On Trip' || a.currentStatus === 'On Break') {
        presentDriverIds.add(a.driverId || a.employeeName);
      }
    });

    return presentDriverIds.size;
  }, [todayAttendance, attendance]);

  const lateCheckInCount = useMemo(() => {
    const lateDriverIds = new Set<string>();
    todayAttendance.forEach(a => {
      if (a.attendanceStatus === 'Late' || a.status === 'Late') {
        lateDriverIds.add(a.driverId || a.employeeName);
      }
    });
    return lateDriverIds.size;
  }, [todayAttendance]);

  const checkedOutDriversCount = useMemo(() => {
    const checkedOutDriverIds = new Set<string>();
    todayAttendance.forEach(a => {
      if (a.checkOut || a.checkOutTime || a.currentStatus === 'Off Duty') {
        checkedOutDriverIds.add(a.driverId || a.employeeName);
      }
    });
    return checkedOutDriverIds.size;
  }, [todayAttendance]);

  const absentDriversCount = Math.max(0, totalDriversCount - presentDriversCount);

  const totalOvertimeHours = useMemo(() => {
    return attendance.reduce((sum, a) => sum + (a.overtime || 0), 0);
  }, [attendance]);

  const overtimeCount = useMemo(() => {
    return attendance.filter(a => (a.overtime || 0) > 0).length;
  }, [attendance]);

  const activeTripsCount = useMemo(() => {
    return trips.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  }, [trips]);

  const completedTripsCount = useMemo(() => {
    return trips.filter(t => t.status === 'Completed' || t.status === 'Delivered').length;
  }, [trips]);

  // Dynamic progress ring percentages
  const presentDriversProgress = useMemo(() => {
    return totalDriversCount > 0 ? Math.min(100, Math.round((presentDriversCount / totalDriversCount) * 100)) : 0;
  }, [presentDriversCount, totalDriversCount]);

  const absentDriversProgress = useMemo(() => {
    return totalDriversCount > 0 ? Math.min(100, Math.round((absentDriversCount / totalDriversCount) * 100)) : 0;
  }, [absentDriversCount, totalDriversCount]);

  const lateDriversProgress = useMemo(() => {
    return presentDriversCount > 0
      ? Math.min(100, Math.round((lateCheckInCount / presentDriversCount) * 100))
      : (totalDriversCount > 0 ? Math.min(100, Math.round((lateCheckInCount / totalDriversCount) * 100)) : 0);
  }, [lateCheckInCount, presentDriversCount, totalDriversCount]);

  const checkedOutDriversProgress = useMemo(() => {
    return presentDriversCount > 0
      ? Math.min(100, Math.round((checkedOutDriversCount / presentDriversCount) * 100))
      : (totalDriversCount > 0 ? Math.min(100, Math.round((checkedOutDriversCount / totalDriversCount) * 100)) : 0);
  }, [checkedOutDriversCount, presentDriversCount, totalDriversCount]);

  const overtimeProgress = useMemo(() => {
    return totalDriversCount > 0 ? Math.min(100, Math.round((overtimeCount / totalDriversCount) * 100)) : 0;
  }, [overtimeCount, totalDriversCount]);

  const activeTransitProgress = useMemo(() => {
    return totalDriversCount > 0 ? Math.min(100, Math.round((activeTripsCount / totalDriversCount) * 100)) : 0;
  }, [activeTripsCount, totalDriversCount]);

  const completedDeliveryProgress = useMemo(() => {
    const totalRuns = activeTripsCount + completedTripsCount;
    return totalRuns > 0 ? Math.min(100, Math.round((completedTripsCount / totalRuns) * 100)) : 0;
  }, [activeTripsCount, completedTripsCount]);




  // 2. TABLE FILTERING LOGIC
  const filteredAttendance = useMemo(() => {
    return attendance.filter(row => {
      if (!row) return false;
      // Search
      const matchesSearch = (row.employeeName && row.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (row.driverId && row.driverId.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status
      const matchesStatus = statusFilter === 'All' || row.currentStatus === statusFilter;
      
      // Attendance
      const matchesAttendance = attendanceFilter === 'All' || row.attendanceStatus === attendanceFilter;

      // Date
      const matchesDate = !dateFilter || row.date === dateFilter;

      return matchesSearch && matchesStatus && matchesAttendance && matchesDate;
    });
  }, [attendance, searchQuery, statusFilter, attendanceFilter, dateFilter]);

  // Export functions simulation
  const triggerCSVExport = () => {
    if (filteredAttendance.length === 0) {
      triggerNotification('System Alert', 'No Data to Export', 'No attendance logs match the current filters.', 'Warning');
      return;
    }
    const headers = ['Employee Name', 'Role', 'Check-In', 'Check-Out', 'Working Hours', 'Break Duration', 'Status', 'Date'];
    const rows = filteredAttendance.map(a => [
      a.employeeName,
      a.role || 'Driver',
      a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '--',
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '--',
      a.workingHours || 0,
      a.breakDuration || 0,
      a.attendanceStatus || a.status,
      a.date
    ]);
    downloadReport({
      fileName: 'shift_duty_attendance_ledger',
      title: 'Staging Area Check-Ins & Attendance Log',
      format: 'CSV',
      headers,
      rows,
      summary: 'Aggregated operator check-in/out times, working hours, and status flags.',
      filters: {
        Search: searchQuery || 'All',
        Status: statusFilter,
        Attendance: attendanceFilter,
        Date: dateFilter || 'All'
      }
    });
  };

  const triggerPDFExport = () => {
    if (filteredAttendance.length === 0) {
      triggerNotification('System Alert', 'No Data to Export', 'No attendance logs match the current filters.', 'Warning');
      return;
    }
    const headers = ['Employee Name', 'Role', 'Check-In', 'Check-Out', 'Working Hours', 'Break Duration', 'Status', 'Date'];
    const rows = filteredAttendance.map(a => [
      a.employeeName,
      a.role || 'Driver',
      a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--',
      a.workingHours || 0,
      a.breakDuration || 0,
      a.attendanceStatus || a.status,
      a.date
    ]);
    
    const totalCheckins = filteredAttendance.length;
    const totalHours = filteredAttendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
    const avgHours = totalCheckins > 0 ? totalHours / totalCheckins : 0;
    const lateCount = filteredAttendance.filter(a => a.status === 'Late' || a.attendanceStatus === 'Late').length;

    downloadReport({
      fileName: 'shift_duty_attendance_ledger',
      title: 'Staging Area Check-Ins & Attendance Log',
      format: 'PDF',
      headers,
      rows,
      summary: 'Aggregated operator check-in/out times, working hours, and status flags.',
      filters: {
        Search: searchQuery || 'All',
        Status: statusFilter,
        Attendance: attendanceFilter,
        Date: dateFilter || 'All'
      },
      kpis: [
        { label: 'Total Check-ins', value: totalCheckins },
        { label: 'Avg Working Hours', value: `${avgHours.toFixed(1)} Hrs` },
        { label: 'Late Flags', value: lateCount }
      ],
      totals: [
        'TOTALS',
        '',
        '',
        '',
        Math.round(totalHours),
        '',
        '',
        ''
      ]
    });
  };

  // 3. DYNAMIC RECHARTS ANALYTICS DATASETS (Derived directly from real attendance & trips)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const dynamicTrendData = useMemo(() => {
    const countsByDay: Record<string, { Present: number; Late: number; Absent: number }> = {
      Mon: { Present: 0, Late: 0, Absent: 0 },
      Tue: { Present: 0, Late: 0, Absent: 0 },
      Wed: { Present: 0, Late: 0, Absent: 0 },
      Thu: { Present: 0, Late: 0, Absent: 0 },
      Fri: { Present: 0, Late: 0, Absent: 0 },
      Sat: { Present: 0, Late: 0, Absent: 0 },
      Sun: { Present: 0, Late: 0, Absent: 0 }
    };

    if (attendance && attendance.length > 0) {
      attendance.forEach(record => {
        let dayName = 'Mon';
        if (record.date) {
          const dateObj = new Date(record.date);
          if (!isNaN(dateObj.getTime())) {
            dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          }
        }
        if (!countsByDay[dayName]) countsByDay[dayName] = { Present: 0, Late: 0, Absent: 0 };

        if (record.attendanceStatus === 'Late' || record.status === 'Late') {
          countsByDay[dayName].Late += 1;
        } else if (record.attendanceStatus === 'Absent' || record.status === 'Absent') {
          countsByDay[dayName].Absent += 1;
        } else {
          countsByDay[dayName].Present += 1;
        }
      });
    }

    return daysOfWeek.map(day => ({
      day,
      Present: countsByDay[day]?.Present || 0,
      Late: countsByDay[day]?.Late || 0,
      Absent: countsByDay[day]?.Absent || 0
    }));
  }, [attendance]);

  const dynamicWorkingHoursData = useMemo(() => {
    const hoursByDay: Record<string, { totalHours: number; count: number }> = {
      Mon: { totalHours: 0, count: 0 },
      Tue: { totalHours: 0, count: 0 },
      Wed: { totalHours: 0, count: 0 },
      Thu: { totalHours: 0, count: 0 },
      Fri: { totalHours: 0, count: 0 },
      Sat: { totalHours: 0, count: 0 },
      Sun: { totalHours: 0, count: 0 }
    };

    if (attendance && attendance.length > 0) {
      attendance.forEach(record => {
        let dayName = 'Mon';
        if (record.date) {
          const dateObj = new Date(record.date);
          if (!isNaN(dateObj.getTime())) {
            dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          }
        }
        if (!hoursByDay[dayName]) hoursByDay[dayName] = { totalHours: 0, count: 0 };

        const hrs = record.workingHours || 0;
        if (hrs > 0) {
          hoursByDay[dayName].totalHours += hrs;
          hoursByDay[dayName].count += 1;
        }
      });
    }

    return daysOfWeek.map(day => {
      const item = hoursByDay[day];
      const avg = item && item.count > 0 ? parseFloat((item.totalHours / item.count).toFixed(1)) : 0;
      return { day, hours: avg };
    });
  }, [attendance]);

  const dynamicLateArrivalData = useMemo(() => {
    let onTime = 0;
    let late = 0;
    let absent = 0;

    if (attendance && attendance.length > 0) {
      attendance.forEach(a => {
        if (a.attendanceStatus === 'Late' || a.status === 'Late') late += 1;
        else if (a.attendanceStatus === 'Absent' || a.status === 'Absent') absent += 1;
        else onTime += 1;
      });
    } else {
      onTime = presentDriversCount;
      late = lateCheckInCount;
      absent = absentDriversCount;
    }

    return [
      { name: 'On-Time', value: onTime, color: 'var(--color-success, #10B981)' },
      { name: 'Late Arrival', value: late, color: 'var(--color-warning, #F59E0B)' },
      { name: 'Absent Logs', value: absent, color: 'var(--color-danger, #EF4444)' }
    ];
  }, [attendance, presentDriversCount, lateCheckInCount, absentDriversCount]);

  const dynamicTripCompletionData = useMemo(() => {
    let success = 0;
    let delayed = 0;

    if (trips && trips.length > 0) {
      trips.forEach(t => {
        if (t.status === 'Completed' || t.status === 'Delivered' || t.status === 'POD Uploaded') {
          success += 1;
        } else {
          delayed += 1;
        }
      });
    }

    return [
      { name: 'Success Deliveries', value: success, color: 'var(--color-primary, #006A6A)' },
      { name: 'Delayed / In-Transit', value: delayed, color: 'var(--color-danger, #EF4444)' }
    ];
  }, [trips]);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title & Alerts Section */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 border-b border-[#E5EEFF] dark:border-[#334155] pb-5">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-white tracking-tight leading-none">Driver Duty & Telemetry Control</h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">Real-time GPS dispatch check-ins, automated attendance logs, and rest regulations monitor.</p>
        </div>
        <div className="flex gap-2.5 self-stretch sm:self-auto">
          <Button variant="outline" size="sm" onClick={triggerPDFExport} className="text-xs font-semibold py-2 rounded-xl flex items-center gap-1.5 border border-[#E5EEFF] dark:border-[#334155] bg-white text-slate-700">
            <FileText className="h-4 w-4" /> Download PDF Reports
          </Button>
          <Button variant="primary" size="sm" onClick={triggerCSVExport} className="text-xs font-bold py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-900/10">
            <SlidersHorizontal className="h-4 w-4" /> Operations Control
          </Button>
        </div>
      </div>



      {/* metrics grid: 8 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Present Drivers"
          value={presentDriversCount}
          change="Daily presence logs"
          isPositive={true}
          icon={UserCheck}
          progress={presentDriversProgress}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        <MetricCard
          title="Absent Drivers"
          value={absentDriversCount}
          change="Awaiting clock-in"
          isPositive={false}
          icon={UserX}
          progress={absentDriversProgress}
          color="text-[#6D7A79]"
          bgColor="bg-[#F8F9FF] dark:bg-[#0F172A]/20"
        />
        <MetricCard
          title="Late Drivers"
          value={lateCheckInCount}
          change="Checked-in after 08:30"
          isPositive={false}
          icon={AlertTriangle}
          progress={lateDriversProgress}
          color="text-amber-500"
          bgColor="bg-amber-50 dark:bg-amber-950/20"
        />
        <MetricCard
          title="Checked-Out Drivers"
          value={checkedOutDriversCount}
          change="Shift completed"
          isPositive={true}
          icon={CheckCircle2}
          progress={checkedOutDriversProgress}
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-950/20"
        />
        <MetricCard
          title="Total Driver Pool"
          value={totalDriversCount}
          change="Operators rostered"
          isPositive={true}
          icon={Users}
          progress={100}
          color="text-violet-600"
          bgColor="bg-violet-50 dark:bg-violet-950/20"
        />
        <MetricCard
          title="Overtime Hours"
          value={`${totalOvertimeHours.toFixed(totalOvertimeHours % 1 === 0 ? 0 : 1)} hrs`}
          change={overtimeCount > 0 ? `${overtimeCount} driver${overtimeCount === 1 ? '' : 's'} logged` : 'Shift overtime logs'}
          isPositive={true}
          icon={Clock}
          progress={overtimeProgress}
          color="text-rose-600"
          bgColor="bg-rose-50 dark:bg-rose-950/20"
        />
        <MetricCard
          title="Active Transit Runs"
          value={activeTripsCount}
          change="Live consignments"
          isPositive={true}
          icon={Truck}
          progress={activeTransitProgress}
          color="text-sky-600"
          bgColor="bg-sky-50 dark:bg-sky-950/20"
        />
        <MetricCard
          title="Completed Delivery"
          value={completedTripsCount}
          change="SLA target tracking"
          isPositive={true}
          icon={TrendingUp}
          progress={completedDeliveryProgress}
          color="text-indigo-600"
          bgColor="bg-indigo-50 dark:bg-indigo-950/20"
        />
      </div>

      {/* Main Professional Attendance Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-3.5 border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800">
          <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] uppercase tracking-wide">Operational Shift Attendance Ledger</h3>
          
          {/* Custom Filters Drawer Trigger */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="relative">
              <Search className="search-icon-glow absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="navbar-search-input pl-9 pr-3 h-9 text-xs border border-[#E5E7EB] dark:border-[#334155] rounded-full bg-slate-50/50 dark:bg-slate-800/40 text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#006A6A] focus:border-[#006A6A] transition-all font-medium"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] rounded-xl px-3 text-xs focus:outline-none font-bold cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="On Duty">On Duty</option>
              <option value="On Trip">On Trip</option>
              <option value="On Break">On Break</option>
              <option value="Off Duty">Off Duty</option>
            </select>

            <select
              value={attendanceFilter}
              onChange={e => setAttendanceFilter(e.target.value)}
              className="h-10 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] rounded-xl px-3 text-xs focus:outline-none font-bold cursor-pointer"
            >
              <option value="All">Attendance Status</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>

            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-[#006A6A] dark:text-[#14B8A6] font-bold hover:underline"
              >
                Clear Date
              </button>
            )}
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="h-10 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] dark:bg-[#0F172A] rounded-xl px-3 text-xs focus:outline-none font-semibold cursor-pointer"
            />
          </div>
        </div>

        {/* Attendance ledger table */}
        <Table
          data={filteredAttendance}
          columns={[
            {
              header: 'Driver Operator',
              accessor: (row: AttendanceRecord) => (
                <div className="flex items-center gap-3">
                  <img
                    src={row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.employeeName)}`}
                    alt="Driver Photo"
                    className="w-9 h-9 rounded-full bg-[#F8F9FF] dark:bg-slate-800 border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 shrink-0 object-cover"
                  />
                  <div>
                    <span className="font-bold text-[#0B1C30] dark:text-[#F8FAFC] text-xs block">{row.employeeName}</span>
                    <span className="text-[10px] text-slate-400 dark:text-[#6D7A79] font-semibold block mt-0.5">ID: {row.driverId || 'DRV-9041'}</span>
                  </div>
                </div>
              ),
              sortKey: 'employeeName'
            },
            {
              header: 'Vehicle Code',
              accessor: (row: AttendanceRecord) => (
                <span className="font-mono text-xs text-slate-700 dark:text-[#CBD5E1] font-semibold">
                  {row.driverId === 'DRV-9042' ? 'KA-03-MN-4512' : 'MH-12-QW-9874'}
                </span>
              )
            },
            {
              header: 'Check-In',
              accessor: (row: AttendanceRecord) => (
                <div>
                  <span className="text-xs text-[#0B1C30] dark:text-[#F8FAFC] font-semibold block">{row.checkIn}</span>
                  <span className="text-[9px] text-slate-400 dark:text-[#6D7A79] font-medium block mt-0.5">{row.checkInWarehouse || 'Warehouse A'}</span>
                </div>
              )
            },
            {
              header: 'Check-Out',
              accessor: (row: AttendanceRecord) => (
                <span className="text-[#545F73] dark:text-[#CBD5E1]">{row.checkOut || '--'}</span>
              )
            },
            {
              header: 'Active Hours',
              accessor: (row: AttendanceRecord) => (
                <span className="text-[#545F73] dark:text-[#CBD5E1]">{row.workingHours ? `${row.workingHours} hrs` : '--'}</span>
              ),
              sortKey: 'workingHours'
            },
            {
              header: 'Trips (Dist)',
              accessor: (row: AttendanceRecord) => (
                <div>
                  <span className="text-xs text-[#0B1C30] dark:text-[#F8FAFC] font-semibold block">{row.tripsCompleted || 0} runs</span>
                  <span className="text-[10px] text-slate-400 dark:text-[#6D7A79] font-semibold block mt-0.5">{row.distanceCovered || 0} km covered</span>
                </div>
              )
            },
            {
              header: 'Break Time',
              accessor: (row: AttendanceRecord) => (
                <span className="text-[#545F73] dark:text-[#CBD5E1]">{row.breakDuration ? `${row.breakDuration} mins` : '--'}</span>
              )
            },
            {
              header: 'Live Status',
              accessor: (row: AttendanceRecord) => (
                <Badge variant={
                  row.currentStatus === 'On Duty' ? 'success' :
                  row.currentStatus === 'On Trip' ? 'info' :
                  row.currentStatus === 'On Break' ? 'warning' : 'neutral'
                }>
                  {row.currentStatus || 'Off Duty'}
                </Badge>
              )
            },
            {
              header: 'Overtime',
              accessor: (row: AttendanceRecord) => (
                <span className={`text-xs font-semibold ${row.overtime && row.overtime > 0 ? 'text-red-500 font-bold dark:text-red-400' : 'text-[#6D7A79] dark:text-[#94A3B8]'}`}>
                  {row.overtime ? `${row.overtime} hrs` : '--'}
                </span>
              )
            },
            {
              header: 'Shift Marker',
              accessor: (row: AttendanceRecord) => (
                <Badge variant={row.attendanceStatus === 'Present' ? 'success' : row.attendanceStatus === 'Late' ? 'warning' : 'danger'}>
                  {row.attendanceStatus || 'Present'}
                </Badge>
              ),
              sortKey: 'attendanceStatus'
            }
          ]}
          searchKey="employeeName"
          searchPlaceholder="Search operator records..."
          exportFileName="driver-duty-ledger"
        />
      </div>

      {/* Side Slide-Over Drawer for Driver Details */}
      <AnimatePresence>
        {drawerOpen && selectedRecord && createPortal(
          <>
            {/* Drawer Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white dark:bg-[#1E293B] border-l border-slate-350 dark:border-slate-700 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] z-50 overflow-y-auto flex flex-col"
            >
              {/* Header profile block */}
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex justify-between items-start shrink-0 relative">
                <div className="flex gap-4">
                  <img
                    src={selectedRecord.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedRecord.employeeName)}`}
                    alt="Profile Avatar"
                    className="w-16 h-16 rounded-full border-2 border-white/20 bg-slate-800 object-cover"
                  />
                  <div className="space-y-1 pt-1">
                    <h3 className="text-base font-bold text-white leading-none">{selectedRecord.employeeName}</h3>
                    <p className="text-xs text-blue-400 font-semibold">{selectedRecord.driverId || 'DRV-9041'} • Active Truck Operator</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
                      <span>Lic: DL-MH12-9988</span>
                      <span>•</span>
                      <span>Phone: +91 91234 56789</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-6 space-y-6">
                {/* 1. Performance Indicator Dials */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F8F9FF] dark:bg-[#0F172A]/60 rounded-2xl border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-[#6D7A79] uppercase">Productivity Index</span>
                      <h4 className="text-lg font-bold text-[#0B1C30] dark:text-slate-100 mt-1">{selectedRecord.performanceScore || 100}%</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-4 bg-[#F8F9FF] dark:bg-[#0F172A]/60 rounded-2xl border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-[#6D7A79] uppercase">Final Duty Status</span>
                      <h4 className="text-lg font-bold text-[#0B1C30] dark:text-slate-100 mt-1">{selectedRecord.attendanceStatus || 'Present'}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* 2. Today's Activity Vertical Timeline */}
                <div className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-gray-50 dark:border-slate-800 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-500" /> Today's Telemetry Shift Timeline
                  </h4>

                  <div className="relative pl-6 space-y-5 pt-2">
                    <div className="absolute left-[7px] top-1.5 bottom-1.5 w-[2px] bg-slate-100 dark:bg-slate-800" />

                    {(selectedRecord.timeline && selectedRecord.timeline.length > 0) ? (
                      selectedRecord.timeline.map((event, idx) => (
                        <div key={idx} className="relative flex justify-between items-start gap-4 text-xs">
                          <span className="absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#0B1C30] dark:text-[#F8FAFC]">{event.event}</p>
                            <p className="text-[10px] text-slate-400 dark:text-[#6D7A79]">{event.description || 'Verified via telemetry logs.'}</p>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400 dark:text-[#6D7A79] shrink-0">{event.time}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="relative flex justify-between items-start gap-4 text-xs">
                          <span className="absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Start Duty</p>
                            <p className="text-[10px] text-slate-400 dark:text-[#6D7A79]">Clocked in at Warehouse A (Pune).</p>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400 dark:text-[#6D7A79] shrink-0">{selectedRecord.checkIn}</span>
                        </div>
                        <div className="relative flex justify-between items-start gap-4 text-xs">
                          <span className="absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Trip Assigned</p>
                            <p className="text-[10px] text-slate-400 dark:text-[#6D7A79]">TRP-2026-8801 linked successfully.</p>
                          </div>
                          <span className="font-mono text-[9px] text-[#64748B] dark:text-[#6D7A79] shrink-0">09:00 AM</span>
                        </div>
                        <div className="relative flex justify-between items-start gap-4 text-xs">
                          <span className="absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Lunch Break</p>
                            <p className="text-[10px] text-slate-400 dark:text-[#6D7A79]">Halted at highway food court plaza.</p>
                          </div>
                          <span className="font-mono text-[9px] text-[#64748B] dark:text-[#6D7A79] shrink-0">12:30 PM</span>
                        </div>
                        <div className="relative flex justify-between items-start gap-4 text-xs">
                          <span className="absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/40" />
                          <div className="space-y-0.5">
                            <p className="font-bold text-[#0B1C30] dark:text-[#F8FAFC]">End Duty</p>
                            <p className="text-[10px] text-slate-400 dark:text-[#6D7A79]">Shift terminated at Mumbai terminal DC.</p>
                          </div>
                          <span className="font-mono text-[9px] text-[#64748B] dark:text-[#6D7A79] shrink-0">{selectedRecord.checkOut || '--'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Salary & Payroll Integration Summary */}
                <div className="bg-[#F8F9FF] dark:bg-[#0F172A]/60 border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 rounded-3xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider pb-2 border-b border-gray-150 dark:border-slate-800/80 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-600" /> Integrated Salary Pay Calculation
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6D7A79] dark:text-[#94A3B8]">Shift Base Payment rate</span>
                      <span className="font-bold text-slate-700 dark:text-[#CBD5E1]">INR 1,200.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6D7A79] dark:text-[#94A3B8]">Overtime hours logged ({selectedRecord.overtime || 0} hrs)</span>
                      <span className="font-bold text-slate-700 dark:text-[#CBD5E1]">INR {Math.floor((selectedRecord.overtime || 0) * 400).toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6D7A79] dark:text-[#94A3B8]">Trip dispatch incentives</span>
                      <span className="font-bold text-slate-700 dark:text-[#CBD5E1]">INR {Math.floor((selectedRecord.tripsCompleted || 0) * 500).toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6D7A79] dark:text-[#94A3B8]">Fuel saving performance bonuses</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+ INR {Math.floor((selectedRecord.performanceScore || 100) * 5).toLocaleString()}.00</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-slate-800 text-sm font-bold">
                      <span className="text-[#0B1C30] dark:text-[#F8FAFC] font-extrabold">Final Shift Cash-Out Pay</span>
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold">
                        INR {Math.floor(1200 + (selectedRecord.overtime || 0) * 400 + (selectedRecord.tripsCompleted || 0) * 500 + (selectedRecord.performanceScore || 100) * 5).toLocaleString()}.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Details and Expiries */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Start GPS Coordinates</span>
                    <span className="font-mono font-bold text-slate-700 block mt-0.5">{selectedRecord.checkInGPS || '18.5204, 73.8567'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">End GPS Coordinates</span>
                    <span className="font-mono font-bold text-slate-700 block mt-0.5">{selectedRecord.checkOutGPS || '19.0760, 72.8777'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Checking Device model</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{selectedRecord.checkInDeviceInfo || 'Samsung SM-G998B'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9px] block">Connectivity status</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{selectedRecord.checkInInternetStatus || 'Connected (5G)'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>,
          document.body
        )}
      </AnimatePresence>

      {/* Analytics Section with Recharts */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-gray-100 dark:border-[#334155] shadow-sm space-y-6">
        <div className="border-b border-gray-50 dark:border-[#334155] pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Operational Duty & Shifts Analytics Desk</h3>
            <p className="text-xs text-slate-400 dark:text-[#94A3B8] mt-1">Review historical trends, productivity graphs, and checkout compliance.</p>
          </div>
          <Badge variant="info">LIVE TELEMETRY LOGS</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Attendance Trend Area Chart */}
          <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/40 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Weekly Shift Attendance Trend</h4>
            <div className="h-60 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaColorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success, #10B981)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-success, #10B981)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant, #E2E8F0)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-text-muted, #64748B)" }} stroke="var(--color-border, #CBD5E1)" />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted, #64748B)" }} stroke="var(--color-border, #CBD5E1)" />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="Present" stroke="var(--color-success, #10B981)" fillOpacity={1} fill="url(#areaColorPresent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Late" stroke="var(--color-warning, #F59E0B)" fillOpacity={0} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Weekly Working Hours Line Chart */}
          <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/40 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Average Daily Shift Duty Hours</h4>
            <div className="h-60 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicWorkingHoursData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant, #E2E8F0)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-text-muted, #64748B)" }} stroke="var(--color-border, #CBD5E1)" />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted, #64748B)" }} stroke="var(--color-border, #CBD5E1)" />
                  <Tooltip formatter={(value) => [`${value} hrs`, 'Duty Hours']} />
                  <Line type="monotone" dataKey="hours" stroke="var(--color-primary, #006A6A)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Donut chart for late check-in reports */}
          <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/40 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Check-In Arrival Compliance Distribution</h4>
            <div className="h-60 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicLateArrivalData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dynamicLateArrivalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Trip Completion Success rate */}
          <div className="border border-gray-100 dark:border-slate-800 rounded-2xl p-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/40 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Delivery Route SLA Targets</h4>
            <div className="h-60 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicTripCompletionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dynamicTripCompletionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



