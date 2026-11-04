import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOperations } from '../../store/OperationsContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Compass, CheckCircle, Navigation, Phone, Gauge, Sparkles, Award, MapPin,
  Clock, ShieldAlert, FileText, Camera, Edit3, Calendar, Activity, AlertTriangle, Play, RefreshCw, Eye, FileCheck, LogOut,
  TrendingUp, Package, ArrowUpRight, ArrowDownRight, Fuel, ShieldCheck, Zap, Lock
} from 'lucide-react';
import { Trip, Vehicle } from '../../types';
import { DriverLiveMap } from '../../components/maps/DriverLiveMap';
import { api } from '../../api/client';
import { useDriverLocationTracker } from '../../hooks/useDriverLocationTracker';

// Circular Progress Ring Component (Identical to Owner Dashboard)
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100/50 dark:stroke-slate-800/40"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
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
      <span 
        className={`absolute text-[9px] font-extrabold ${isClassColor ? color : ''}`}
        style={{ color: isClassColor ? undefined : color }}
      >
        {Math.round(progress)}%
      </span>
    </div>
  );
};

// Executive KPI Card (Identical to Owner Dashboard)
const KPICard: React.FC<{
  id: string;
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ComponentType<any>;
  progress: number;
  color: string;
  description: string;
  onClick?: () => void;
}> = ({ id, title, value, change, isPositive = true, icon: Icon, progress, color, description, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between items-stretch gap-4 group cursor-pointer text-left min-h-[175px] w-full overflow-hidden"
    >
      <div className="flex justify-between items-start gap-2 min-w-0">
        <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight whitespace-normal break-words leading-tight flex-1">
          {title}
        </span>
        <div className="p-2 rounded-lg transition-all duration-300 shrink-0" style={{ backgroundColor: `${color}12`, color }}>
          <Icon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      <div className="min-w-0 py-0.5">
        <h4 
          className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight truncate w-full"
          title={String(value)}
        >
          {value}
        </h4>
      </div>

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

export const Home: React.FC = () => {
  const {
    trips,
    updateTripStatus,
    vehicles,
    notifications,
    triggerNotification,
    user,
    attendance,
    driverStartDuty,
    driverStartBreak,
    driverEndBreak,
    driverEndDuty
  } = useOperations();
  const navigate = useNavigate();
  const tracker = useDriverLocationTracker();

  // Active Trip for Driver
  const driverId = user?.driverId || 'DRV-9041';
  const driverTrips = trips.filter(t => t.driverId === driverId || t.driverId === 'd1');
  const activeTrip = trips.find(t => (t.driverId === driverId || t.driverId === 'd1') && t.status !== 'Completed') || trips[0];
  const completedTrips = trips.filter(t => (t.driverId === driverId || t.driverId === 'd1') && t.status === 'Completed');
  
  const fallbackVehicle: Vehicle = {
    id: 'veh-default',
    vehicleNumber: user?.vehicleNumber || 'MH-12-QW-9874',
    vehicleType: 'Container Truck (18T)',
    status: 'Moving',
    driver: user?.fullName || 'Driver Operator',
    rcNumber: 'RC-MH12-9988-ABC',
    insurance: '2026-12-31',
    permit: '2027-06-30',
    fitness: '2026-10-15',
    fuelType: 'Diesel',
    fuelLevel: 78,
    odometer: 48200,
    mileage: 4.8,
    currentLocation: 'Pune Logistics Hub'
  };

  const driverVehicle = vehicles.find(v => 
    (v?.driver && user?.fullName && v.driver.toLowerCase().includes(user.fullName.toLowerCase())) ||
    (v?.driver && user?.driverId && v.driver.toLowerCase().includes(user.driverId.toLowerCase()))
  ) || vehicles[0] || fallbackVehicle;

  // Shift Duty States
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a && a.driverId === driverId && a.date === todayStr);
  const currentDutyStatus = todayRecord ? todayRecord.currentStatus : 'Off Duty';

  const [deviceInfo, setDeviceInfo] = useState('Mobile Web Console (Chrome)');
  const [ipAddress, setIpAddress] = useState('192.168.1.115');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [breakType, setBreakType] = useState('Lunch Break');
  const [breakRemarks, setBreakRemarks] = useState('');
  const [isEndingDuty, setIsEndingDuty] = useState(false);
  const [showCheckOutSuccess, setShowCheckOutSuccess] = useState(false);
  const [liveWorkingTime, setLiveWorkingTime] = useState('00h 00m 00s');

  // ── 🎯 ENTERPRISE REAL-TIME GPS WATCHER STATES ──
  const [watchLat, setWatchLat] = useState<number>(18.5204);
  const [watchLng, setWatchLng] = useState<number>(73.8567);
  const [watchAccuracy, setWatchAccuracy] = useState<number>(6);
  const [watchSpeed, setWatchSpeed] = useState<number>(45);
  const [watchHeading, setWatchHeading] = useState<number>(90);
  const [watchAddress, setWatchAddress] = useState<string>('Pune Logistics Hub Terminal A');
  const [gpsStatusBadge, setGpsStatusBadge] = useState<'LIVE' | 'SEARCHING' | 'DISABLED' | 'OFFLINE' | 'SYNCING'>('SEARCHING');
  const [gpsPermissionState, setGpsPermissionState] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [lastGpsSyncTime, setLastGpsSyncTime] = useState<string>('Just now');
  const lastSentPosRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  // Haversine distance calculator helper (in meters)
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Reverse Geocoding helper
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: { 'User-Agent': 'SmartOpsLogisticsApp/1.0' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (e) {}
    if (lat > 18.9) return 'Mumbai DC Gate 2, Port Area';
    return 'Pune Logistics Hub Terminal A';
  };

  // Initialize navigator.geolocation.watchPosition()
  useEffect(() => {
    const ua = navigator.userAgent;
    let dev = 'Desktop Browser';
    if (/android/i.test(ua)) dev = 'Android Mobile';
    else if (/iPad|iPhone|iPod/.test(ua)) dev = 'iOS Mobile';
    else if (/mac/i.test(ua)) dev = 'macOS Desktop';
    else if (/win/i.test(ua)) dev = 'Windows Desktop';
    setDeviceInfo(dev);

    if (!navigator.geolocation) {
      setGpsPermissionState('denied');
      setGpsStatusBadge('DISABLED');
      return;
    }

    setGpsStatusBadge('SEARCHING');

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy || 5;
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
        const heading = pos.coords.heading || 0;

        setWatchLat(lat);
        setWatchLng(lng);
        setWatchAccuracy(accuracy);
        if (speed > 0) setWatchSpeed(speed);
        if (heading > 0) setWatchHeading(heading);
        setGpsPermissionState('granted');
        setGpsStatusBadge('LIVE');
        setLastGpsSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        // Distance & Throttling Check (Every 20 meters moved OR > 8 seconds elapsed)
        const now = Date.now();
        let shouldSend = false;

        if (!lastSentPosRef.current) {
          shouldSend = true;
        } else {
          const dist = calculateDistanceMeters(lastSentPosRef.current.lat, lastSentPosRef.current.lng, lat, lng);
          const timeElapsed = now - lastSentPosRef.current.time;
          if (dist >= 20 || timeElapsed >= 8000) {
            shouldSend = true;
          }
        }

        if (shouldSend) {
          lastSentPosRef.current = { lat, lng, time: now };
          const resolvedAddr = await reverseGeocode(lat, lng);
          setWatchAddress(resolvedAddr);

          // Dispatch to Backend POST /api/driver/location
          api.driver.sendLocation({
            driverId,
            tripId: activeTrip?.id || activeTrip?.tripNumber,
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            heading,
            address: resolvedAddr,
            timestamp: new Date().toISOString()
          });
        }
      },
      (err) => {
        console.warn('Geolocation watchPosition error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsPermissionState('denied');
          setGpsStatusBadge('DISABLED');
        } else {
          setGpsStatusBadge('SEARCHING');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [driverId, activeTrip]);

  // Live Timer for Working Hours
  useEffect(() => {
    const updateTimer = () => {
      const checkInStr = todayRecord?.checkInTime || todayRecord?.checkIn;
      if (!checkInStr) {
        setLiveWorkingTime('00h 00m 00s');
        return;
      }

      try {
        const today = new Date();
        const [time, modifier] = checkInStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const checkInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
        const now = new Date();
        
        let endPoint = now;
        if (todayRecord.checkOut) {
          const [coTime, coMod] = (todayRecord.checkOutTime || todayRecord.checkOut).split(' ');
          let [coHours, coMinutes] = coTime.split(':').map(Number);
          if (coMod === 'PM' && coHours !== 12) coHours += 12;
          if (coMod === 'AM' && coHours === 12) coHours = 0;
          endPoint = new Date(today.getFullYear(), today.getMonth(), today.getDate(), coHours, coMinutes, 0);
        }

        const diffMs = endPoint.getTime() - checkInDate.getTime();
        if (diffMs < 0) {
          setLiveWorkingTime('00h 00m 00s');
          return;
        }

        const diffSecs = Math.floor(diffMs / 1000);
        const h = Math.floor(diffSecs / 3600);
        const m = Math.floor((diffSecs % 3600) / 60);
        const s = diffSecs % 60;
        setLiveWorkingTime(
          `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
        );
      } catch (e) {
        console.error("Live timer calculation error:", e);
        setLiveWorkingTime('00h 00m 00s');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todayRecord]);

  // Handlers
  const handleStartDuty = async () => {
    setIsCheckingIn(true);
    setTimeout(async () => {
      try {
        const payload = {
          driverId,
          driverName: user?.fullName || 'Driver',
          employeeName: user?.fullName || 'Driver',
          checkInGPS: `${watchLat.toFixed(5)}, ${watchLng.toFixed(5)}`,
          checkInWarehouse: watchAddress,
          checkInDeviceInfo: deviceInfo,
          checkInInternetStatus: `IP: ${ipAddress} (Online)`
        };
        await driverStartDuty(payload);
        setIsCheckingIn(false);
        setShowCheckInSuccess(true);
        setTimeout(() => {
          setShowCheckInSuccess(false);
        }, 2200);
      } catch (err) {
        setIsCheckingIn(false);
        console.error(err);
      }
    }, 1000);
  };

  const handleStartBreak = async () => {
    try {
      await driverStartBreak({
        driverId,
        type: breakType,
        remarks: breakRemarks,
        gps: `${watchLat.toFixed(5)}, ${watchLng.toFixed(5)}`
      });
      setBreakModalOpen(false);
      setBreakRemarks('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndBreak = async () => {
    try {
      await driverEndBreak({
        driverId,
        gps: `${watchLat.toFixed(5)}, ${watchLng.toFixed(5)}`
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndDuty = async () => {
    setIsEndingDuty(true);
    try {
      const checkOutTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      await driverEndDuty({
        driverId,
        checkOutGPS: `${watchLat.toFixed(5)}, ${watchLng.toFixed(5)}`,
        latitude: watchLat,
        longitude: watchLng,
        address: watchAddress,
        checkOutTime,
        tripsCompleted: completedTrips.length || 1,
        distanceCovered: 148,
        fuelUsed: 24
      });
      setIsEndingDuty(false);
      setShowCheckOutSuccess(true);
    } catch (err) {
      setIsEndingDuty(false);
      console.error(err);
    }
  };

  const handleStatusTransition = () => {
    if (!activeTrip) return;
    let nextStatus: any = 'Assigned';
    if (activeTrip.status === 'Assigned') nextStatus = 'Accepted';
    else if (activeTrip.status === 'Accepted') nextStatus = 'Started';
    else if (activeTrip.status === 'Started') nextStatus = 'Reached Pickup';
    else if (activeTrip.status === 'Reached Pickup') nextStatus = 'Loaded';
    else if (activeTrip.status === 'Loaded') nextStatus = 'In Transit';
    else if (activeTrip.status === 'In Transit') nextStatus = 'Reached Destination';
    else if (activeTrip.status === 'Reached Destination' || activeTrip.status === 'Delivered') {
      nextStatus = 'Completed';
    }
    updateTripStatus(activeTrip.id, nextStatus);
    triggerNotification('Trip Started', 'Status Updated', `Trip status for ${activeTrip.tripNumber} changed to ${nextStatus}`, 'Info');
  };

  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Traffic Congestion');

  const isDutyEnded = todayRecord && todayRecord.checkOut;

  if (isDutyEnded) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 text-left animate-fade-in">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-[#1E293B] rounded-2xl p-8 max-w-lg w-full border border-[#E5EEFF] dark:border-[#334155] shadow-xl space-y-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-[#10B981] flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-[#0B1C30] dark:text-slate-100 animate-fade-in">Shift Check-Out Complete</h3>
            <p className="text-xs text-[#6D7A79] dark:text-[#94A3B8]">Shift log processed. Metrics synced to SmartOps Owner Dashboard.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-left">
            <div className="p-3.5 bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-xl">
              <span className="text-[10px] text-[#6D7A79] dark:text-[#94A3B8] uppercase font-bold block">Worked Time</span>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] block mt-1">{todayRecord.workingHours} hrs</span>
            </div>
            <div className="p-3.5 bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-xl">
              <span className="text-[10px] text-[#6D7A79] dark:text-[#94A3B8] uppercase font-bold block">Overtime</span>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] block mt-1">{todayRecord.overtime} hrs</span>
            </div>
            <div className="p-3.5 bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-xl">
              <span className="text-[10px] text-[#6D7A79] dark:text-[#94A3B8] uppercase font-bold block">Break Duration</span>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] block mt-1">{todayRecord.breakDuration} mins</span>
            </div>
            <div className="p-3.5 bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-xl">
              <span className="text-[10px] text-[#6D7A79] dark:text-[#94A3B8] uppercase font-bold block">Distance</span>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] block mt-1">{todayRecord.distanceCovered} km</span>
            </div>
            <div className="p-3.5 bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-xl">
              <span className="text-[10px] text-[#6D7A79] dark:text-[#94A3B8] uppercase font-bold block">Fuel Used</span>
              <span className="text-sm font-bold text-slate-800 dark:text-[#F8FAFC] block mt-1">{todayRecord.fuelUsed} L</span>
            </div>
            <div className="p-3.5 bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-xl">
              <span className="text-[10px] text-[#6D7A79] dark:text-[#94A3B8] uppercase font-bold block">Safety Score</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-1">{todayRecord.performanceScore}%</span>
            </div>
          </div>

          <div className="bg-[#F8F9FF] dark:bg-[#0F172A]/40 p-4 rounded-xl text-xs flex justify-between items-center text-left border border-[#E5EEFF] dark:border-[#334155]">
            <div>
              <p className="font-bold text-slate-700 dark:text-[#F8FAFC]">Calculated Attendance Status</p>
              <p className="text-[10px] text-slate-400">Determined automatically based on check-in hour.</p>
            </div>
            <Badge variant={todayRecord.attendanceStatus === 'Present' ? 'success' : todayRecord.attendanceStatus === 'Late' ? 'warning' : 'danger'}>
              {todayRecord.attendanceStatus}
            </Badge>
          </div>

          <div className="pt-2 text-slate-400 text-xs font-medium">
            Shift closed. Telemetry sync complete.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* ── 1. EXECUTIVE CONSOLE HERO BANNER (Identical to Owner Dashboard) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#0B1C30] via-[#0D2A4A] to-[#0A1828] p-8 md:p-10 rounded-[24px] text-white shadow-lg border border-[#E5EEFF]/80 dark:border-[#334155]/60 text-left animate-fade-in relative overflow-hidden">
        <div className="space-y-2 z-10">
          <span className="text-[13px] font-bold text-[#14B8A6] tracking-widest uppercase flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#14B8A6]" /> DRIVER LOGISTICS CONSOLE
          </span>
          <h2 className="text-[36px] sm:text-[42px] font-extrabold tracking-tight leading-none text-[#FFFFFF]">
            Welcome back, {user?.fullName || 'Driver'}
          </h2>
          <p className="text-[#FFFFFF] text-[14px] sm:text-[15px] leading-relaxed max-w-2xl font-medium pt-1">
            Role: <span className="text-[#14B8A6] font-bold">Driver</span> · ID: <span className="text-[#FFFFFF] font-semibold">{driverId}</span> · Vehicle: <span className="text-[#FFFFFF] font-semibold">{user?.vehicleNumber || driverVehicle?.vehicleNumber || 'MH-12-QW-9874'}</span> · Duty: <span className="text-[#14B8A6] font-bold">{currentDutyStatus}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {tracker.isPermissionDenied ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> GPS Permission Required
              </span>
            ) : tracker.isTrackingActive ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Tracking Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Location Syncing
              </span>
            )}
            {tracker.lastUpdated && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Last Updated: {tracker.lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          {currentDutyStatus === 'Off Duty' ? (
            <Button
              variant="primary"
              className="text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-900/30"
              onClick={handleStartDuty}
              disabled={isCheckingIn}
            >
              <Play className="h-4 w-4 text-white" />
              {isCheckingIn ? 'Starting Shift...' : 'Start Shift Duty'}
            </Button>
          ) : (
            <>
              {currentDutyStatus === 'On Break' ? (
                <Button
                  variant="primary"
                  className="text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-900/30"
                  onClick={handleEndBreak}
                >
                  <Play className="h-4 w-4 text-white" />
                  End Break
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => setBreakModalOpen(true)}
                >
                  <Clock className="h-4 w-4 text-amber-300" />
                  Take Break
                </Button>
              )}
              <Button
                variant="outline"
                className="text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30"
                onClick={handleEndDuty}
                disabled={isEndingDuty}
              >
                <LogOut className="h-4 w-4 text-rose-400" />
                {isEndingDuty ? 'Checking Out...' : 'End Shift Duty'}
              </Button>
            </>
          )}

          <Button
            variant="primary"
            className="text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-900/30"
            onClick={() => navigate('/driver/pod')}
          >
            <Camera className="h-4 w-4 text-white" />
            Upload POD
          </Button>
        </div>
      </div>

      {/* ── 2. ENTERPRISE DRIVER KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          id="trips"
          title="Today's Assigned Trips"
          value={driverTrips.length}
          description="Total dispatches for today"
          progress={driverTrips.length ? 100 : 0}
          color="#00A3A3"
          icon={Truck}
          onClick={() => navigate('/driver/trips')}
        />
        <KPICard
          id="completed"
          title="Completed Deliveries"
          value={completedTrips.length}
          description="Verified PODs uploaded"
          progress={completedTrips.length ? 100 : 0}
          color="#10B981"
          icon={CheckCircle}
          onClick={() => navigate('/driver/trips')}
        />
        <KPICard
          id="pending"
          title="Pending Shipments"
          value={Math.max(0, driverTrips.length - completedTrips.length)}
          description="In transit or scheduled"
          progress={Math.max(0, driverTrips.length - completedTrips.length) ? 50 : 0}
          color="#F59E0B"
          icon={Package}
          onClick={() => navigate('/driver/active-trip')}
        />
        <KPICard
          id="distance"
          title="Distance Covered"
          value="148 km"
          description="Shift GPS telemetry"
          progress={74}
          color="#3B82F6"
          icon={Navigation}
        />
        <KPICard
          id="fuel"
          title="Fuel Efficiency"
          value={`${driverVehicle?.mileage || 4.8} km/L`}
          description="Current fuel rating"
          progress={88}
          color="#8B5CF6"
          icon={Fuel}
        />
        <KPICard
          id="hours"
          title="Worked Shift Time"
          value={liveWorkingTime}
          description={`Duty: ${currentDutyStatus}`}
          progress={currentDutyStatus === 'On Duty' ? 100 : 0}
          color="#10B981"
          icon={Clock}
        />
        <KPICard
          id="pod"
          title="Uploaded PODs"
          value={`${completedTrips.length}/1`}
          description="Owner verified receipts"
          progress={completedTrips.length ? 100 : 0}
          color="#14B8A6"
          icon={FileCheck}
          onClick={() => navigate('/driver/pod')}
        />
        <KPICard
          id="vehicle"
          title="Vehicle Status"
          value={driverVehicle?.status || 'Moving'}
          description={driverVehicle?.vehicleNumber || user?.vehicleNumber || 'MH-12-QW-9874'}
          progress={95}
          color="#10B981"
          icon={Gauge}
          onClick={() => navigate('/driver/fleet')}
        />
      </div>

      {/* ── 3. ACTIVE TRIP ENTERPRISE CONSOLE ── */}
      {activeTrip && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#E5EEFF] dark:border-[#334155]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-[#7DF5F5] flex items-center justify-center font-bold">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Active Delivery Trip</span>
                <h3 className="text-lg font-extrabold text-[#0B1C30] dark:text-[#F8FAFC] leading-tight">
                  {activeTrip.tripNumber} · {activeTrip.customerName}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={activeTrip.status === 'In Transit' ? 'success' : 'info'}>
                {activeTrip.status}
              </Badge>
              <Button
                variant="primary"
                className="text-xs py-2 rounded-xl"
                onClick={() => navigate('/driver/active-trip')}
              >
                View Console & Map →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Route Timeline */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
                <span>Origin: <strong className="text-[#0B1C30] dark:text-[#F8FAFC]">{activeTrip.pickupLocation}</strong></span>
                <span>Destination: <strong className="text-[#0B1C30] dark:text-[#F8FAFC]">{activeTrip.dropLocation}</strong></span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                <div className="bg-gradient-to-r from-[#006A6A] to-[#10B981] h-full rounded-full transition-all duration-500" style={{ width: activeTrip.status === 'In Transit' ? '70%' : activeTrip.status === 'Completed' ? '100%' : '30%' }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="p-3 bg-[#F8F9FF] dark:bg-[#0F172A]/50 rounded-xl border border-[#E5EEFF] dark:border-[#334155]">
                  <span className="text-[10px] text-slate-400 font-bold block">Vehicle</span>
                  <span className="font-bold text-[#0B1C30] dark:text-[#F8FAFC] mt-0.5 block">{activeTrip.vehicleNumber || driverVehicle?.vehicleNumber || 'MH-12-QW-9874'}</span>
                </div>
                <div className="p-3 bg-[#F8F9FF] dark:bg-[#0F172A]/50 rounded-xl border border-[#E5EEFF] dark:border-[#334155]">
                  <span className="text-[10px] text-slate-400 font-bold block">Cargo Weight</span>
                  <span className="font-bold text-[#0B1C30] dark:text-[#F8FAFC] mt-0.5 block">{activeTrip.weight || '12.5 Tons'}</span>
                </div>
                <div className="p-3 bg-[#F8F9FF] dark:bg-[#0F172A]/50 rounded-xl border border-[#E5EEFF] dark:border-[#334155]">
                  <span className="text-[10px] text-slate-400 font-bold block">Invoice No</span>
                  <span className="font-bold text-[#0B1C30] dark:text-[#F8FAFC] mt-0.5 block">{activeTrip.invoiceNumber}</span>
                </div>
                <div className="p-3 bg-[#F8F9FF] dark:bg-[#0F172A]/50 rounded-xl border border-[#E5EEFF] dark:border-[#334155]">
                  <span className="text-[10px] text-slate-400 font-bold block">ETA</span>
                  <span className="font-bold text-[#006A6A] dark:text-[#7DF5F5] mt-0.5 block">{activeTrip.eta || '1h 45m'}</span>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="bg-[#F8F9FF] dark:bg-[#0F172A]/50 p-4 rounded-xl border border-[#E5EEFF] dark:border-[#334155] space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#0B1C30] dark:text-[#F8FAFC] uppercase tracking-wider mb-2">Trip Control Actions</h4>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-tight">Update dispatch state in real-time to alert Owner telemetry console.</p>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full text-xs py-2 rounded-xl justify-center cursor-pointer"
                  onClick={handleStatusTransition}
                >
                  Update Trip: {activeTrip.status} →
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="text-[11px] py-1.5 rounded-xl justify-center cursor-pointer text-amber-600 border-amber-300 dark:border-amber-700 hover:bg-amber-50"
                    onClick={() => setStopModalOpen(true)}
                  >
                    Report Delay
                  </Button>
                  <a
                    href={`tel:${activeTrip.customerPhone || '9876543210'}`}
                    className="flex items-center justify-center gap-1 text-[11px] font-bold py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="h-3 w-3 text-emerald-500" />
                    Call Owner
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ENTERPRISE LIVE GPS MAP & TELEMETRY SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* GPS Permission Denied Alert Banner */}
          {gpsPermissionState === 'denied' && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Location Access Required</h4>
                  <p className="text-[11px] text-slate-300">
                    Location access is required during an active delivery. Please enable browser GPS permissions to continue live trip tracking.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer whitespace-nowrap"
              >
                Retry Permission
              </button>
            </div>
          )}

          {/* Reusable DriverLiveMap Component */}
          <DriverLiveMap
            latitude={watchLat}
            longitude={watchLng}
            accuracy={watchAccuracy}
            speed={watchSpeed}
            heading={watchHeading}
            address={watchAddress}
            vehicleNumber={activeTrip?.vehicleNumber || driverVehicle?.vehicleNumber || user?.vehicleNumber || 'MH-12-QW-9874'}
            statusBadge={gpsStatusBadge}
            lastUpdatedText={lastGpsSyncTime}
            onRefreshLocation={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                  setWatchLat(pos.coords.latitude);
                  setWatchLng(pos.coords.longitude);
                  setWatchAccuracy(pos.coords.accuracy || 5);
                  setLastGpsSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                });
              }
            }}
          />
        </div>

        {/* Vehicle Health & Compliance */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-4 text-left flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] pb-3 border-b border-[#E5EEFF] dark:border-[#334155] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Vehicle Health & Compliance
            </h3>

            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Fuel Level</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">78% (Tank Full)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Tyre Pressure</span>
                <span className="font-bold text-[#0B1C30] dark:text-[#F8FAFC]">32 PSI (Normal)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Insurance Expiry</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Valid (Nov 2026)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">RC Expiry</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Valid (2031)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F8F9FF] dark:bg-[#0F172A]/50 rounded-xl border border-[#E5EEFF] dark:border-[#334155] text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Vehicle health telemetry synced with SmartOps Fleet Manager.
          </div>
        </div>
      </div>

      {/* ── MODALS PRESERVED ── */}
      {/* Break Modal */}
      <Modal isOpen={breakModalOpen} onClose={() => setBreakModalOpen(false)} title="Log Shift Break">
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Break Reason</label>
            <select
              value={breakType}
              onChange={e => setBreakType(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-medium"
            >
              <option>Lunch Break</option>
              <option>Rest Stop</option>
              <option>Refueling Break</option>
              <option>Vehicle Inspection</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Highway plaza rest stop"
              value={breakRemarks}
              onChange={e => setBreakRemarks(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-medium"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBreakModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleStartBreak}>Confirm Break</Button>
          </div>
        </div>
      </Modal>

      {/* Delay Modal */}
      <Modal isOpen={stopModalOpen} onClose={() => setStopModalOpen(false)} title="Report Route Delay / Incident">
        <div className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Delay Reason</label>
            <select
              value={selectedReason}
              onChange={e => setSelectedReason(e.target.value)}
              className="w-full h-10 px-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs font-medium"
            >
              <option>Traffic Congestion</option>
              <option>Weather Delay</option>
              <option>Vehicle Maintenance Check</option>
              <option>Toll Plaza Delay</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setStopModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => {
              updateTripStatus(activeTrip?.id || '', 'Delayed', { stopReason: selectedReason });
              setStopModalOpen(false);
              triggerNotification('System Alert', 'Delay Logged', `Route delay reported: ${selectedReason}`, 'Warning');
            }}>Submit Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
