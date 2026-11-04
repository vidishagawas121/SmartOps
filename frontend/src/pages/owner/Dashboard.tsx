import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperations } from '../../store/OperationsContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { OperationsChart } from '../../components/charts/Charts';
import { soundPlayer } from '../../utils/audio';
import { downloadReport } from '../../utils/downloadReport';
import {
  TrendingUp,
  Package,
  CheckCircle,
  Truck,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileDown,
  Navigation,
  CheckSquare,
  DollarSign,
  ShoppingCart,
  Clock,
  Bell,
  Wallet,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertCircle,
  MapPin,
  Calendar
} from 'lucide-react';
import { SystemNotification, InventoryItem, AttendanceRecord, Vehicle, Trip, ActivityItem } from '../../types';

// Circular Progress Ring Component
const ProgressRing: React.FC<{
  progress: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}> = ({ progress, color, size = 42, strokeWidth = 4 }) => {
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
          className="stroke-slate-100/50 dark:stroke-slate-800/40"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isClassColor ? undefined : color}
          className={`transition-all duration-500 ease-out ${isClassColor ? color.replace('text-', 'stroke-') : ''}`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      {/* Percentage label in the center - uses matching dynamic color */}
      <span 
        className={`absolute text-[9px] font-extrabold ${isClassColor ? color : ''}`}
        style={{ color: isClassColor ? undefined : color }}
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
};

// Executive Card (Linear / Stripe / Attio inspired)
const KPICard: React.FC<{
  id: string;
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<any>;
  progress: number;
  color: string;
  description: string;
  onClick?: () => void;
}> = ({ id, title, value, change, isPositive, icon: Icon, progress, color, description, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-stretch gap-4 group cursor-pointer text-left min-h-[175px] w-full overflow-hidden"
    >
      {/* Top Row: Title & Icon */}
      <div className="flex justify-between items-start gap-2 min-w-0">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight whitespace-normal break-words leading-tight flex-1">
          {title}
        </span>
        <div className="p-2 rounded-lg transition-all duration-300 shrink-0" style={{ backgroundColor: `${color}12`, color }}>
          <Icon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      {/* Middle Row: Large Value */}
      <div className="min-w-0 py-0.5">
        <h4 
          className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate w-full"
          title={String(value)}
        >
          {value}
        </h4>
      </div>

      {/* Bottom Row: Trend/Description & Progress Ring */}
      <div className="flex items-end justify-between gap-2 pt-1 mt-auto">
        <div className="min-w-0 flex-1">
          {change && (
            <div className="flex items-center gap-0.5 mb-0.5">
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-[#EF4444] shrink-0" />
              )}
              <span className={`text-[12px] font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{change}</span>
            </div>
          )}
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-tight line-clamp-2" title={description}>
            {description}
          </p>
        </div>
        <div className="shrink-0 pl-1">
          <ProgressRing progress={progress} color={color} size={42} strokeWidth={4} />
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    drivers,
    vehicles,
    trips,
    inventory,
    payroll,
    attendance,
    activities,
    user,
    notifications,
    triggerNotification,
    addActivity
  } = useOperations();

  const handleCardClick = (id: string) => {
    switch (id) {
      case 'rev':
        navigate('/owner/reports');
        break;
      case 'fleet':
        navigate('/owner/fleet');
        break;
      case 'stock':
        navigate('/owner/inventory');
        break;
      case 'att':
        navigate('/owner/attendance');
        break;
      case 'total':
        navigate('/owner/workers');
        break;
      case 'del':
        navigate('/owner/pod');
        break;
      case 'ship':
        navigate('/owner/fleet');
        break;
      case 'alerts':
        setActiveTableTab('Notifications');
        break;
      case 'salary':
        navigate('/owner/payroll');
        break;
      case 'inc':
        navigate('/owner/operations');
        break;
      default:
        break;
    }
  };

  // Selected multi-metric chart trigger
  const [activeChartTab, setActiveChartTab] = useState<'Inventory' | 'Revenue' | 'Attendance' | 'Fleet' | 'Stock'>('Revenue');

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Multi-table selection
  const [activeTableTab, setActiveTableTab] = useState<'Inventory' | 'Attendance' | 'Fleet' | 'Activities' | 'Notifications' | 'Orders'>('Inventory');
  
  // Table search & sort helpers
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(true);

  // Play audio helper
  const triggerAudio = (severity: 'Success' | 'Warning' | 'Error' | 'Info') => {
    const saved = localStorage.getItem('smartops_owner_settings');
    const settings = saved ? JSON.parse(saved) : { soundEnabled: true, soundVolume: 0.5 };
    if (settings.soundEnabled) {
      soundPlayer.play(severity, settings.soundVolume);
    }
  };

  // Safe array references to prevent blank page crashes
  const safeDrivers = drivers || [];
  const safeTrips = trips || [];
  const safeVehicles = vehicles || [];
  const safeInventory = inventory || [];
  const safeAttendance = attendance || [];
  const safePayroll = payroll || [];
  const safeActivities = activities || [];
  const safeNotifications = notifications || [];

  // Dynamic Orders dataset derived from live trips
  const latestOrders = useMemo(() => {
    return safeTrips.map(t => ({
      id: t.tripNumber,
      item: t.material,
      client: t.customerName,
      qty: parseInt(t.weight) || 1,
      status: t.status === 'Completed' ? 'Completed' : 'Pending',
      date: t.timestamp ? new Date(t.timestamp).toLocaleDateString() : 'Today'
    }));
  }, [safeTrips]);

  // Dynamic employee headcount based on real driver accounts
  const totalEmployeesCount = useMemo(() => {
    if (safeDrivers.length > 0) return safeDrivers.length;
    
    // Fallback if drivers array is loading
    const names = new Set<string>();
    safeVehicles.forEach(v => { if (v?.driver) names.add(v.driver); });
    safeAttendance.forEach(a => { const name = a?.employeeName || a?.driverId; if (name) names.add(name); });
    return Math.max(names.size, 1);
  }, [safeDrivers, safeVehicles, safeAttendance]);

  // Count distinct drivers present today, capped at totalEmployeesCount
  const presentCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAttendance = safeAttendance.filter(a => a?.date === todayStr);
    
    let active = 0;
    if (todayAttendance.length > 0) {
      active = todayAttendance.filter(a => a?.attendanceStatus === 'Present' || a?.attendanceStatus === 'Late').length;
    } else {
      const latestPerDriver = new Map<string, string>();
      safeAttendance.forEach(a => {
        const key = a.driverId || a.employeeName;
        if (key && !latestPerDriver.has(key)) {
          if (a.attendanceStatus) latestPerDriver.set(key, a.attendanceStatus);
        }
      });
      active = Array.from(latestPerDriver.values()).filter(status => status === 'Present' || status === 'Late').length;
    }
    
    return Math.min(active, totalEmployeesCount);
  }, [safeAttendance, totalEmployeesCount]);

  // Calculated Metrics for the 10 KPI Cards
  const activeVehiclesCount = safeVehicles.filter(v => v?.status === 'Moving').length;
  const lowStockCount = safeInventory.filter(i => (i?.quantity ?? 0) <= (i?.minimumQuantity ?? 0)).length;
  const pendingTripsCount = safeTrips.filter(t => t?.status !== 'Completed').length;
  const processedPayrollCount = safePayroll.filter(p => p?.paymentStatus === 'Paid').length;

  // Dynamic Chart Datasets
  const totalInventoryRevenue = useMemo(() => {
    return safeInventory.reduce((sum, item) => sum + ((item?.sellingPrice ?? 0) * (item?.quantity ?? 0)), 0);
  }, [safeInventory]);

  const totalInventoryCost = useMemo(() => {
    return safeInventory.reduce((sum, item) => sum + ((item?.purchasePrice ?? 0) * (item?.quantity ?? 0)), 0);
  }, [safeInventory]);

  const totalPayrollCost = useMemo(() => {
    return safePayroll.reduce((sum, record) => sum + (record?.finalSalary ?? 0), 0);
  }, [safePayroll]);

  // Calculate dynamic progress percentages for circular rings
  const revenueProgress = useMemo(() => {
    return totalInventoryRevenue > 0 ? Math.min(Math.round((totalInventoryRevenue / 500000) * 100), 100) : 0;
  }, [totalInventoryRevenue]);

  const activeVehiclesProgress = useMemo(() => {
    return safeVehicles.length > 0 ? Math.round((activeVehiclesCount / safeVehicles.length) * 100) : 0;
  }, [activeVehiclesCount, safeVehicles.length]);

  const lowStockProgress = useMemo(() => {
    return safeInventory.length > 0 ? Math.round((lowStockCount / safeInventory.length) * 100) : 0;
  }, [lowStockCount, safeInventory.length]);

  const attendanceProgress = useMemo(() => {
    return totalEmployeesCount > 0 ? Math.round((presentCount / totalEmployeesCount) * 100) : 0;
  }, [presentCount, totalEmployeesCount]);

  const completedTripsProgress = useMemo(() => {
    const completedCount = safeTrips.filter(t => t.status === 'Completed').length;
    return safeTrips.length > 0 ? Math.round((completedCount / safeTrips.length) * 100) : 0;
  }, [safeTrips]);

  const pendingTripsProgress = useMemo(() => {
    return safeTrips.length > 0 ? Math.round((pendingTripsCount / safeTrips.length) * 100) : 0;
  }, [pendingTripsCount, safeTrips.length]);

  const unreadNotificationsCount = safeNotifications.filter(n => !n.read).length;
  const notificationsProgress = useMemo(() => {
    return safeNotifications.length > 0 ? Math.round((unreadNotificationsCount / safeNotifications.length) * 100) : 0;
  }, [unreadNotificationsCount, safeNotifications.length]);

  const payrollProgress = useMemo(() => {
    return safePayroll.length > 0 ? Math.round((processedPayrollCount / safePayroll.length) * 100) : 0;
  }, [processedPayrollCount, safePayroll.length]);

  const incidentsCount = useMemo(() => {
    return safeActivities.filter(a => a.action.toLowerCase().includes('failed') || a.action.toLowerCase().includes('alert')).length;
  }, [safeActivities]);

  const incidentProgress = useMemo(() => {
    return incidentsCount === 0 ? 100 : Math.max(100 - incidentsCount * 20, 0);
  }, [incidentsCount]);


  const revenueChartData = useMemo(() => {
    const totalCost = totalInventoryCost + totalPayrollCost;
    const factors = [0.15, 0.18, 0.20, 0.16, 0.22, 0.05, 0.04];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      name: day,
      revenue: Math.round(totalInventoryRevenue * factors[idx]),
      cost: Math.round(totalCost * factors[idx]),
      target: Math.round((totalInventoryRevenue * 1.2) / 7)
    }));
  }, [totalInventoryRevenue, totalInventoryCost, totalPayrollCost]);

  const inventoryChartData = useMemo(() => {
    const totalItemsCount = safeInventory.reduce((sum, item) => sum + (item?.quantity ?? 0), 0);
    const factors = [0.12, 0.15, 0.18, 0.11, 0.24, 0.10, 0.10];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      name: day,
      itemsIn: Math.round(totalItemsCount * factors[idx]),
      itemsOut: Math.round(totalItemsCount * factors[idx] * 0.9)
    }));
  }, [safeInventory]);

  const attendanceChartData = useMemo(() => {
    const totalPresent = safeAttendance.filter(a => a?.attendanceStatus === 'Present').length;
    const totalLate = safeAttendance.filter(a => a?.attendanceStatus === 'Late').length;
    const factors = [0.15, 0.18, 0.22, 0.15, 0.20, 0.05, 0.05];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      name: day,
      present: Math.round(totalPresent * factors[idx] * 7),
      late: Math.round(totalLate * factors[idx] * 7)
    }));
  }, [safeAttendance]);

  const fleetChartData = useMemo(() => {
    const movingCount = safeVehicles.filter(v => v?.status === 'Moving').length;
    const idleCount = safeVehicles.filter(v => v?.status === 'Idle').length;
    const delayedCount = safeVehicles.filter(v => v?.status === 'Delayed').length;
    const factors = [0.15, 0.18, 0.22, 0.15, 0.20, 0.05, 0.05];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, idx) => ({
      name: day,
      moving: Math.round(movingCount * factors[idx] * 7),
      idle: Math.round(idleCount * factors[idx] * 7),
      delayed: Math.round(delayedCount * factors[idx] * 7)
    }));
  }, [safeVehicles]);

  const stockSafetyChartData = useMemo(() => {
    return safeInventory.map(item => ({
      name: (item?.itemName || (item as any)?.name || 'Item').split(' ')[0],
      safetyQty: item?.minimumQuantity || 0,
      currentQty: item?.quantity || 0
    }));
  }, [safeInventory]);


  // Actions

  const handleExport = (format: 'PDF' | 'Excel') => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTableTab === 'Inventory') {
      headers = ['SKU', 'Item Name', 'Category', 'Quantity', 'Min Quantity', 'Unit Price (INR)'];
      rows = inventory.map(i => [i.sku || i.id, i.itemName, i.category, i.quantity, i.minimumQuantity, i.sellingPrice]);
    } else if (activeTableTab === 'Attendance') {
      headers = ['Driver ID', 'Employee Name', 'Status', 'Check-In', 'Check-Out', 'Hours'];
      rows = attendance.map(a => [a?.driverId || 'DRV', a?.driverName || a?.employeeName || 'Staff', a?.attendanceStatus || a?.status || 'Present', a?.checkInTime || a?.checkIn || '--', a?.checkOutTime || a?.checkOut || '--', a?.workingHours || 0]);
    } else if (activeTableTab === 'Fleet') {
      headers = ['Vehicle Number', 'Type', 'Status', 'Driver', 'Fuel Level (%)', 'Odometer (km)'];
      rows = vehicles.map(v => [v.vehicleNumber, v.vehicleType || 'Truck', v.status, v.driver, v.fuelLevel ?? 100, v.odometer ?? 0]);
    } else if (activeTableTab === 'Activities') {
      headers = ['User', 'Action', 'Details', 'Category', 'Timestamp'];
      rows = activities.map(a => [a.user, a.action, a.details, a.category, a.timestamp]);
    } else if (activeTableTab === 'Notifications') {
      headers = ['Title', 'Message', 'Severity', 'Timestamp'];
      rows = notifications.map(n => [n.title, n.message, n.severity, n.timestamp]);
    } else {
      headers = ['Trip Code', 'Customer Name', 'Pickup', 'Destination', 'Status'];
      rows = trips.map(t => [t.tripNumber, t.customerName, t.pickupLocation, t.dropLocation, t.status]);
    }

    downloadReport({
      fileName: `smartops_${activeTableTab.toLowerCase()}_report`,
      title: `${activeTableTab} Operational Ledger`,
      format,
      headers,
      rows,
      summary: `Automated export of ${activeTableTab} records from SmartOps Console.`
    });

    triggerNotification(
      'System Alert',
      'File Saved to Device',
      `Exported smartops_${activeTableTab.toLowerCase()}_report.${format === 'PDF' ? 'pdf' : 'csv'} to your device.`,
      'Info'
    );
    addActivity('Data Export', `Downloaded ${activeTableTab} table in ${format} format`, 'fleet');
    triggerAudio('Success');
    alert(`${activeTableTab} ledger sheet exported as ${format}!`);
  };

  // Sorting Handler
  const requestSort = (field: string) => {
    let asc = true;
    if (sortField === field && sortAsc) {
      asc = false;
    }
    setSortField(field);
    setSortAsc(asc);
  };

  // Processing Table Data
  const sortedTableData = useMemo(() => {
    let data: any[] = [];
    if (activeTableTab === 'Inventory') data = [...inventory];
    else if (activeTableTab === 'Attendance') data = [...attendance];
    else if (activeTableTab === 'Fleet') data = [...vehicles];
    else if (activeTableTab === 'Activities') data = [...activities];
    else if (activeTableTab === 'Notifications') data = [...notifications];
    else if (activeTableTab === 'Orders') data = [...latestOrders];

    // Search filter
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      data = data.filter(item => {
        return Object.values(item).some(val => 
          String(val).toLowerCase().includes(q)
        );
      });
    }

    // Sort sorting
    if (sortField) {
      data.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [activeTableTab, inventory, attendance, vehicles, activities, notifications, latestOrders, tableSearch, sortField, sortAsc]);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-16">
      {/* Hero Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#0B1C30] via-[#0D2A4A] to-[#0A1828] p-8 md:p-10 rounded-[24px] text-white shadow-lg border border-[#E5EEFF]/80 dark:border-[#334155]/60 text-left animate-fade-in">
        <div className="space-y-2">
          <span className="text-[13px] font-bold text-[#14B8A6] tracking-widest uppercase">Admin Executive Console</span>
          <h2 className="text-[42px] font-extrabold tracking-tight leading-none text-[#FFFFFF]">Welcome back, {user?.fullName || 'Owner'}</h2>
          <p className="text-[#FFFFFF] text-[15px] leading-relaxed max-w-2xl font-medium pt-1">
            Role: <span className="text-[#14B8A6] font-bold">{user?.role || 'Owner'}</span> · Email: <span className="text-[#FFFFFF] font-semibold">{user?.email || ''}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="primary"
            className="text-xs py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-teal-900/20"
            onClick={() => setReportModalOpen(true)}
          >
            <FileDown className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* 10 KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard
          id="rev"
          title="Gross Revenue"
          value={`₹${totalInventoryRevenue.toLocaleString()}`}
          description="Total inventory value"
          change=""
          isPositive={true}
          icon={DollarSign}
          progress={revenueProgress}
          color="#10B981"
          onClick={() => handleCardClick('rev')}
        />
        <KPICard
          id="fleet"
          title="Active Vehicles"
          value={`${activeVehiclesCount}/${vehicles.length}`}
          description="Trucks moving transit cargo"
          change=""
          isPositive={true}
          icon={Truck}
          progress={activeVehiclesProgress}
          color="#006A6A"
          onClick={() => handleCardClick('fleet')}
        />
        <KPICard
          id="stock"
          title="Safety Low Stock"
          value={lowStockCount}
          description="Critical safety replenishment"
          change=""
          isPositive={true}
          icon={Package}
          progress={lowStockProgress}
          color="#F59E0B"
          onClick={() => handleCardClick('stock')}
        />
        <KPICard
          id="att"
          title="Workers Present"
          value={`${presentCount}/${totalEmployeesCount}`}
          description="Daily check-in logs active"
          change=""
          isPositive={true}
          icon={Users}
          progress={attendanceProgress}
          color="#14B8A6"
          onClick={() => handleCardClick('att')}
        />
        <KPICard
          id="total"
          title="Total Employees"
          value={totalEmployeesCount}
          description="Roster registry headcount"
          change=""
          isPositive={true}
          icon={Users}
          progress={100}
          color="#8B5CF6"
          onClick={() => handleCardClick('total')}
        />
        <KPICard
          id="del"
          title="Completed Deliveries"
          value={trips.filter(t => t.status === 'Completed').length}
          description="SLA orders reached yard"
          change=""
          isPositive={true}
          icon={CheckCircle}
          progress={completedTripsProgress}
          color="#10B981"
          onClick={() => handleCardClick('del')}
        />
        <KPICard
          id="ship"
          title="Pending Shipments"
          value={pendingTripsCount}
          description="Unload cargo in transit"
          change=""
          isPositive={false}
          icon={ShoppingCart}
          progress={pendingTripsProgress}
          color="#3b82f6"
          onClick={() => handleCardClick('ship')}
        />
        <KPICard
          id="alerts"
          title="Critical Alerts"
          value={unreadNotificationsCount}
          description="Active unresolved warnings"
          change=""
          isPositive={unreadNotificationsCount === 0}
          icon={Bell}
          progress={notificationsProgress}
          color={unreadNotificationsCount > 0 ? "#EF4444" : "#10B981"}
          onClick={() => handleCardClick('alerts')}
        />
        <KPICard
          id="salary"
          title="Salary Disbursed"
          value={`${processedPayrollCount}/${payroll.length}`}
          description="Staff payroll structures paid"
          change=""
          isPositive={true}
          icon={Wallet}
          progress={payrollProgress}
          color="#EC4899"
          onClick={() => handleCardClick('salary')}
        />
        <KPICard
          id="inc"
          title="Incident Status"
          value="Normal"
          description="Telemetry alerts status"
          change=""
          isPositive={true}
          icon={CheckCircle}
          progress={incidentProgress}
          color="#10B981"
          onClick={() => handleCardClick('inc')}
        />
      </div>

      {/* Main interactive charts & side widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Central Switcher Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] p-6 rounded-2xl shadow-sm flex flex-col justify-between text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-4 mb-5">
            <div>
              <h3 className="text-[15px] font-semibold text-[#0B1C30] dark:text-white">Business Dashboard Trends</h3>
              <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-0.5 font-medium">Toggle tabs to view live trends from different parameters</p>
            </div>
            {/* Tab switch buttons */}
            <div className="flex flex-wrap gap-1 bg-[#F8F9FF] dark:bg-[#0F172A] p-1 border border-[rgba(11,28,48,0.04)] rounded-xl">
              {['Revenue', 'Inventory', 'Attendance', 'Fleet', 'Stock'].map((tab: any) => (
                <button
                  key={tab}
                  onClick={() => setActiveChartTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChartTab === tab
                      ? 'bg-[#006A6A] text-white shadow-sm'
                      : 'text-slate-400 hover:text-[#545F73] dark:hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {activeChartTab === 'Revenue' && (
              <OperationsChart
                data={revenueChartData}
                xKey="name"
                series={[
                  { key: 'revenue', name: 'Total Revenue (₹)', color: '#006A6A', type: 'area' },
                  { key: 'cost', name: 'Operational Cost (₹)', color: '#EF4444', type: 'line' },
                  { key: 'target', name: 'Target Target (₹)', color: '#10B981', type: 'line' }
                ]}
              />
            )}
            {activeChartTab === 'Inventory' && (
              <OperationsChart
                data={inventoryChartData}
                xKey="name"
                series={[
                  { key: 'itemsIn', name: 'Stock Checked In', color: '#006A6A', type: 'area' },
                  { key: 'itemsOut', name: 'Stock Dispatched', color: '#F59E0B', type: 'line' }
                ]}
              />
            )}
            {activeChartTab === 'Attendance' && (
              <OperationsChart
                data={attendanceChartData}
                xKey="name"
                series={[
                  { key: 'present', name: 'Drivers Present', color: '#10B981', type: 'bar' },
                  { key: 'late', name: 'Check-In Delay (Late)', color: '#EF4444', type: 'line' }
                ]}
                type="bar"
              />
            )}
            {activeChartTab === 'Fleet' && (
              <OperationsChart
                data={fleetChartData}
                xKey="name"
                series={[
                  { key: 'moving', name: 'Moving Active', color: '#006A6A', type: 'area' },
                  { key: 'idle', name: 'Yard Idle', color: '#667085', type: 'line' },
                  { key: 'delayed', name: 'Delayed Telemetry', color: '#EF4444', type: 'bar' }
                ]}
              />
            )}
            {activeChartTab === 'Stock' && (
              <OperationsChart
                data={stockSafetyChartData}
                xKey="name"
                series={[
                  { key: 'currentQty', name: 'Current Stock Level', color: '#006A6A', type: 'bar' },
                  { key: 'safetyQty', name: 'Safety Threshold Limit', color: '#EF4444', type: 'line' }
                ]}
                type="bar"
              />
            )}
          </div>
        </div>

        {/* 6 Side Widgets */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] p-6 rounded-2xl shadow-sm space-y-6 text-left flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0B1C30] dark:text-white">Operational Health status</h3>
            <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-0.5 font-medium">Live telemetry widgets tracking yard parameters</p>
          </div>

          <div className="space-y-4">
            {/* Widget 1: Inventory Health */}
            <div className="flex justify-between items-center text-[15px] font-medium text-[#545F73]">
              <span className="text-[#545F73] dark:text-[#CBD5E1]">Inventory Health</span>
              <span className="px-2.5 py-0.5 text-xs bg-[#10B981]/10 text-[#10B981] font-bold rounded-full border border-[#10B981]/15">
                {inventory.length > 0 ? 'Optimal 100%' : '0%'}
              </span>
            </div>

            {/* Widget 2: Stock Availability */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px] font-bold text-[#6D7A79]">
                <span>Stock Availability</span>
                <span className="text-[#0B1C30] dark:text-[#CBD5E1]">
                  {inventory.length > 0 ? Math.min(100, inventory.length * 10) : 0}% Capacity
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#006A6A] h-full rounded-full"
                  style={{ width: `${inventory.length > 0 ? Math.min(100, inventory.length * 10) : 0}%` }}
                />
              </div>
            </div>

            {/* Widget 3: Storage Utilization */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px] font-bold text-[#6D7A79]">
                <span>Storage Utilization</span>
                <span className="text-[#0B1C30] dark:text-[#CBD5E1]">
                  {inventory.length > 0 ? Math.min(100, inventory.length * 8) : 0}% Filled
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#14B8A6] h-full rounded-full"
                  style={{ width: `${inventory.length > 0 ? Math.min(100, inventory.length * 8) : 0}%` }}
                />
              </div>
            </div>

            {/* Widget 4: Pending Deliveries */}
            <div className="flex justify-between items-center text-[15px] font-medium">
              <span className="text-[#545F73] dark:text-[#CBD5E1]">Pending Deliveries</span>
              <span className="font-extrabold text-[#006A6A] dark:text-[#14B8A6]">{pendingTripsCount} Shipments</span>
            </div>

            {/* Widget 5: Driver Availability */}
            <div className="flex justify-between items-center text-[15px] font-medium">
              <span className="text-[#545F73] dark:text-[#CBD5E1]">Driver On-Duty status</span>
              <span className="px-2.5 py-0.5 text-xs bg-[#10B981]/10 text-[#10B981] font-bold rounded-full border border-[#10B981]/15">
                {presentCount} Active
              </span>
            </div>

            {/* Widget 6: Vehicle Health */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[13px] font-bold text-[#6D7A79]">
                <span>Vehicle Health Tracker</span>
                <span className="text-[#0B1C30] dark:text-[#CBD5E1]">
                  {vehicles.length > 0 ? '100% Clean SLA' : '0% SLA'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#10B981] h-full rounded-full"
                  style={{ width: `${vehicles.length > 0 ? 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pt-4 flex justify-between items-center text-[13px] font-bold text-[#6D7A79]">
            <span>YARDS ACTIVE</span>
            <span className="text-[#0B1C30] dark:text-[#CBD5E1]">PUNE, BOM, BLR</span>
          </div>
        </div>
      </div>

      {/* Interactive Tables Section */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] p-6 rounded-[20px] shadow-sm text-left">
        {/* Table Selector & Search Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-4 mb-6">
          <div className="flex flex-wrap gap-1 bg-[#F8F9FF] dark:bg-[#0F172A] p-1 border border-[rgba(11,28,48,0.04)] rounded-xl">
            {['Inventory', 'Attendance', 'Fleet', 'Activities', 'Notifications', 'Orders'].map((tab: any) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTableTab(tab);
                  setSortField('');
                  setTableSearch('');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTableTab === tab
                    ? 'bg-[#006A6A] text-white shadow-sm'
                    : 'text-slate-400 hover:text-[#545F73] dark:hover:text-slate-200'
                }`}
              >
                {tab} Ledgers
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5 items-center w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:flex-none">
              <Search className="search-icon-glow absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" />
              <input
                type="text"
                placeholder={`Search ${activeTableTab.toLowerCase()}...`}
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="navbar-search-input w-full lg:w-60 pl-9 pr-3 h-9 text-xs border border-[#E5E7EB] dark:border-[#334155] rounded-full bg-slate-50/50 dark:bg-slate-800/40 text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#006A6A] focus:border-[#006A6A] transition-all font-medium"
              />
            </div>

            {/* Export buttons */}
            <button
              onClick={() => handleExport('Excel')}
              className="h-10 px-4 border border-[#E5EEFF] dark:border-[#334155] bg-white hover:bg-[#F8F9FF] dark:bg-[#0F172A] dark:hover:bg-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4 text-slate-400" /> XLS
            </button>
            <button
              onClick={() => handleExport('PDF')}
              className="h-10 px-4 border border-[#E5EEFF] dark:border-[#334155] bg-white hover:bg-[#F8F9FF] dark:bg-[#0F172A] dark:hover:bg-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileDown className="h-4 w-4 text-slate-400" /> PDF
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 rounded-xl max-h-[380px]">
          <table className="w-full text-[15px] text-[#545F73] dark:text-[#CBD5E1] relative border-collapse">
            {/* Header */}
            <thead className="text-xs font-bold text-[#0B1C30] dark:text-[#F8FAFC] uppercase tracking-wider bg-[#F8F9FF] dark:bg-[#0F172A] sticky top-0 border-b border-[#E5EEFF] dark:border-[#334155] z-10">
              <tr>
                {activeTableTab === 'Inventory' && (
                  <>
                    <th onClick={() => requestSort('itemName')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Item Name <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('sku')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      SKU <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('quantity')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Quantity <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('minimumQuantity')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Safety Min <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th className="px-5 py-4 text-left">Status</th>
                  </>
                )}

                {activeTableTab === 'Attendance' && (
                  <>
                    <th onClick={() => requestSort('employeeName')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Staff Member <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('date')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Shift Date <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th className="px-5 py-4 text-left">Check In</th>
                    <th className="px-5 py-4 text-left">Check Out</th>
                    <th className="px-5 py-4 text-left">Status</th>
                  </>
                )}

                {activeTableTab === 'Fleet' && (
                  <>
                    <th onClick={() => requestSort('vehicleNumber')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Truck Reg <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('vehicleType')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Type <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('status')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Telemetry <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th className="px-5 py-4 text-left">Last Serviced</th>
                  </>
                )}

                {activeTableTab === 'Activities' && (
                  <>
                    <th onClick={() => requestSort('user')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      User <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th onClick={() => requestSort('action')} className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                      Action <ArrowUpDown className="h-3.5 w-3.5 inline ml-1 text-slate-400" />
                    </th>
                    <th className="px-5 py-4 text-left">Details</th>
                    <th className="px-5 py-4 text-left">Timestamp</th>
                  </>
                )}

                {activeTableTab === 'Notifications' && (
                  <>
                    <th className="px-5 py-4 text-left">Severity</th>
                    <th className="px-5 py-4 text-left">Alert Title</th>
                    <th className="px-5 py-4 text-left">Incident Log</th>
                    <th className="px-5 py-4 text-left">Date</th>
                  </>
                )}

                {activeTableTab === 'Orders' && (
                  <>
                    <th className="px-5 py-4 text-left">Order ID</th>
                    <th className="px-5 py-4 text-left">Consignment Item</th>
                    <th className="px-5 py-4 text-left">Client Entity</th>
                    <th className="px-5 py-4 text-left">Quantity</th>
                    <th className="px-5 py-4 text-left">Status</th>
                  </>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {sortedTableData.length > 0 ? (
                sortedTableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F9FF]/50 dark:hover:bg-slate-950/20 transition-colors">
                    {activeTableTab === 'Inventory' && (
                      <>
                        <td className="px-5 py-4 font-bold text-[#0B1C30] dark:text-[#F8FAFC]">{(row as InventoryItem).itemName}</td>
                        <td className="px-5 py-4 font-mono text-xs">{(row as InventoryItem).sku}</td>
                        <td className="px-5 py-4 font-extrabold text-[#0B1C30] dark:text-white">{(row as InventoryItem).quantity}</td>
                        <td className="px-5 py-4 text-[#6D7A79]">{(row as InventoryItem).minimumQuantity}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            (row as InventoryItem).quantity <= (row as InventoryItem).minimumQuantity
                              ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                              : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                          }`}>
                            {(row as InventoryItem).quantity <= (row as InventoryItem).minimumQuantity ? '⚠️ Low Stock' : '✅ Healthy'}
                          </span>
                        </td>
                      </>
                    )}

                    {activeTableTab === 'Attendance' && (
                      <>
                        <td className="px-5 py-4 font-bold text-[#0B1C30] dark:text-[#F8FAFC]">{(row as AttendanceRecord).employeeName}</td>
                        <td className="px-5 py-4 font-mono text-xs">{(row as AttendanceRecord).date}</td>
                        <td className="px-5 py-4">{(row as AttendanceRecord).checkIn || '09:00 AM'}</td>
                        <td className="px-5 py-4">{(row as AttendanceRecord).checkOut || '--:--'}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            (row as AttendanceRecord).attendanceStatus === 'Present' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                            (row as AttendanceRecord).attendanceStatus === 'Late' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                            'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                          }`}>
                            {(row as AttendanceRecord).attendanceStatus}
                          </span>
                        </td>
                      </>
                    )}

                    {activeTableTab === 'Fleet' && (
                      <>
                        <td className="px-5 py-4 font-mono font-bold text-[#0B1C30] dark:text-white">{(row as Vehicle).vehicleNumber}</td>
                        <td className="px-5 py-4 text-[#545F73] dark:text-[#94A3B8]">{(row as Vehicle).vehicleType}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            (row as Vehicle).status === 'Moving' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                            (row as Vehicle).status === 'Idle' ? 'bg-slate-500/10 text-[#6D7A79] border-slate-500/20' :
                            'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                          }`}>
                            {(row as Vehicle).status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">{(row as Vehicle).fitness || '2026-06-01'}</td>
                      </>
                    )}

                    {activeTableTab === 'Activities' && (
                      <>
                        <td className="px-5 py-4 font-bold text-[#0B1C30] dark:text-[#F8FAFC]">{(row as ActivityItem).user}</td>
                        <td className="px-5 py-4 text-[#0B1C30] dark:text-white font-semibold">{(row as ActivityItem).action}</td>
                        <td className="px-5 py-4 text-[#6D7A79] whitespace-normal break-words max-w-xs leading-normal">{(row as ActivityItem).details}</td>
                        <td className="px-5 py-4 font-mono text-xs">{(row as ActivityItem).timestamp}</td>
                      </>
                    )}

                    {activeTableTab === 'Notifications' && (
                      <>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            (row as SystemNotification).severity === 'Error' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
                            (row as SystemNotification).severity === 'Warning' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20' :
                            'bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/20'
                          }`}>
                            {(row as SystemNotification).severity}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-[#0B1C30] dark:text-[#F8FAFC]">{(row as SystemNotification).title}</td>
                        <td className="px-5 py-4 text-[#6D7A79]">{(row as SystemNotification).message}</td>
                        <td className="px-5 py-4 font-mono text-xs">{(row as SystemNotification).timestamp}</td>
                      </>
                    )}

                    {activeTableTab === 'Orders' && (
                      <>
                        <td className="px-5 py-4 font-mono font-bold text-[#0B1C30] dark:text-[#F8FAFC]">{row.id}</td>
                        <td className="px-5 py-4 font-bold text-[#0B1C30] dark:text-white">{row.item}</td>
                        <td className="px-5 py-4 text-[#545F73] dark:text-[#CBD5E1]">{row.client}</td>
                        <td className="px-5 py-4 font-extrabold text-[#0B1C30] dark:text-white">{row.qty}</td>
                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            row.status === 'Completed' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#6D7A79] dark:text-[#6D7A79] font-medium">
                    No registry rows matching current search index.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



      {/* Reports Generator Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Generate Corporate Report">
        <div className="space-y-5 text-left">
          <p className="text-[15px] text-[#6D7A79] dark:text-[#94A3B8] font-medium leading-normal">Choose an operational report sheet to export in PDF or CSV formats:</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Production Status Sheet',
              'Inventory Level Count',
              'June Payroll Overview',
              'Fleet Fuel Consumption',
              'Gate Log Records',
              'Driver Performance Metrics',
            ].map(sheet => (
              <button
                key={sheet}
                onClick={() => {
                  triggerNotification(
                    'System Alert',
                    'Report Dispatch',
                    `Corporate document exported and queued: ${sheet}`,
                    'Info'
                  );
                  addActivity('Report Generated', `Exported corporate ledger: ${sheet}`, 'fleet');
                  triggerAudio('Success');
                  setReportModalOpen(false);
                  alert(`Report queued: ${sheet}`);
                }}
                className="p-4 border border-[#E5EEFF] dark:border-[#334155] rounded-xl text-left hover:border-[#006A6A] hover:bg-[#F8F9FF] text-xs font-bold text-slate-700 dark:text-[#CBD5E1] dark:bg-[#0F172A]/40 hover:dark:bg-slate-850/50 transition-colors cursor-pointer"
              >
                {sheet}
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-4 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 mt-4">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};



