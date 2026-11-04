import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Calendar, Wifi, CheckCircle, AlertOctagon, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOperations } from '../../store/OperationsContext';

interface AttendanceModalProps {
  onSuccess: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({ onSuccess }) => {
  const { user, logout, driverStartDuty } = useOperations();
  
  // States
  const [currentTime, setCurrentTime] = useState(new Date());
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'granted' | 'denied' | 'prompt'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [deviceType, setDeviceType] = useState('Desktop Browser');
  const [browserInfo, setBrowserInfo] = useState('Unknown Browser');
  const [ipAddress, setIpAddress] = useState('192.168.1.115'); // default local/mock IP

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Capture System info on load
  useEffect(() => {
    const ua = navigator.userAgent;
    let dev = 'Desktop Browser';
    if (/android/i.test(ua)) dev = 'Android Mobile';
    else if (/iPad|iPhone|iPod/.test(ua)) dev = 'iOS Mobile';
    else if (/mac/i.test(ua)) dev = 'macOS Desktop';
    else if (/win/i.test(ua)) dev = 'Windows Desktop';
    setDeviceType(dev);

    // Basic browser parsing
    let browser = 'Chrome/Safari';
    if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/edg/i.test(ua)) browser = 'Edge';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
    setBrowserInfo(browser);
  }, []);

  // Geolocalisation Reverse Geocoder with Fallback
  const getAddress = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: {
          'User-Agent': 'SmartOpsAttendanceApp/1.0'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
    } catch (e) {
      console.warn("External geocoding failed, using fallback.", e);
    }
    // Context-dependent mock coordinates fallback
    if (lat > 18.9) {
      return "Mumbai DC Gate 2, Port Area, Maharashtra, India";
    }
    return "Pune Warehouse Yard A, Hadapsar, Maharashtra, India";
  };

  // Get location handler
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsCapturingLocation(true);
    setLocationStatus('prompt');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsCoords({ lat, lng });
        setLocationStatus('granted');
        setIsCapturingLocation(false);
        const resolvedAddress = await getAddress(lat, lng);
        setAddress(resolvedAddress);
      },
      (error) => {
        console.error("Location access denied", error);
        setLocationStatus('denied');
        setIsCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Mark Attendance handler
  const handleMarkAttendance = async () => {
    if (!gpsCoords) {
      // Force trigger location capture
      requestLocation();
      return;
    }

    setIsSubmitting(true);
    try {
      const checkInTimeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = currentTime.toISOString().split('T')[0];

      // Formulate attendance payload
      const payload = {
        driverId: user?.driverId || '',
        driverName: user?.fullName || 'Driver',
        employeeName: user?.fullName || 'Driver',
        checkInGPS: `${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`,
        checkInWarehouse: address.split(',')[0] || 'Pune Warehouse Yard A',
        checkInDeviceInfo: deviceType,
        checkInInternetStatus: `IP: ${ipAddress} (Online)`,
        vehicleNumber: user?.vehicleNumber || '',
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
        address: address,
        checkInTime: checkInTimeStr,
        date: dateStr,
        browserInfo: browserInfo,
        deviceType: deviceType
      };

      await driverStartDuty(payload);
      
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setIsSubmitting(false);
      alert("Failed to submit attendance. Please try again.");
      console.error(err);
    }
  };

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent Backdrop overlay */}
      <div className="fixed inset-0 bg-transparent animate-fade-in" />
      
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6 z-10"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-550 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/5 animate-bounce">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">Attendance Marked Successfully</h2>
              <p className="text-xs text-[#6D7A79] dark:text-[#94A3B8] leading-normal">
                Shift logged. Synced with Owner Dashboard and Telemetry Server.
              </p>
            </div>

            <div className="p-4 bg-[#F8F9FF] dark:bg-[#0F172A]/40 rounded-2xl border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Logged Time:</span>
                <span className="font-bold text-slate-700 dark:text-[#CBD5E1]">{formattedTime.split(' ')[0]} {formattedTime.split(' ')[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className="font-extrabold text-emerald-550 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Present
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Location:</span>
                <span className="font-bold text-slate-700 dark:text-[#CBD5E1] whitespace-normal break-words leading-tight max-w-[220px] text-right">{address.split(',')[0]}</span>
              </div>
            </div>
          </motion.div>
        ) : locationStatus === 'denied' ? (
          <motion.div
            key="denied"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6 z-10"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto ring-8 ring-red-500/5">
              <AlertOctagon className="h-10 w-10 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Location Denied</h2>
              <p className="text-xs text-[#6D7A79] dark:text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
                Location permission is required to mark attendance. Without GPS coordinates, you cannot check in to the console.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={requestLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-2xl transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4 animate-spin-slow" /> Retry Permission
              </button>
              <button
                onClick={logout}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-[#CBD5E1] text-xs font-bold py-3 rounded-2xl transition-all border border-transparent cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 space-y-6 flex flex-col modal-container"
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-[#0B1C30] dark:text-[#F8FAFC] modal-title">Mark Today's Attendance</h2>
              <p className="text-[15px] text-[#334155] dark:text-[#CBD5E1] font-medium modal-description">Please mark your attendance before starting today's work.</p>
            </div>

            {/* Profile Row */}
            <div className="flex items-center gap-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/30 p-4 rounded-2xl border border-slate-105/50 dark:border-slate-800/40">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.fullName || 'Driver')}`}
                alt="Driver Avatar"
                className="w-14 h-14 rounded-full border border-slate-200/50 bg-slate-205 dark:bg-slate-800 object-cover"
              />
              <div className="space-y-0.5 text-left">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-[#F8FAFC] leading-tight">{user?.fullName || 'Driver'}</h3>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Driver ID: {user?.driverId || 'N/A'}</p>
                <p className="text-[10px] font-semibold text-slate-400">Vehicle: {user?.vehicleNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Attendance Details Grid */}
            <div className="p-4 bg-[#F8F9FF]/50 dark:bg-[#0F172A]/30 rounded-2xl border border-slate-105/50 dark:border-slate-800/40 grid grid-cols-2 gap-4 text-left text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-wider block">Current Date</span>
                <p className="font-bold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> {formattedDate}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-wider block">Current Time</span>
                <p className="font-bold text-slate-700 dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500 animate-pulse" /> <span className="font-mono">{formattedTime}</span>
                </p>
              </div>
              <div className="space-y-1 col-span-2 border-t border-slate-150/40 dark:border-slate-800/40 pt-3">
                <span className="text-[9px] font-bold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-wider block">Current GPS Location</span>
                {gpsCoords ? (
                  <p className="font-semibold text-slate-700 dark:text-[#CBD5E1] flex items-start gap-1.5 leading-normal">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-mono text-[#6D7A79] block text-[11px] mb-0.5">{gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</span>
                      <span className="text-[10px] text-slate-400 font-normal leading-normal">{address || 'Resolving address...'}</span>
                    </span>
                  </p>
                ) : (
                  <p className="text-[#6D7A79] dark:text-[#6D7A79] italic flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> 
                    {isCapturingLocation ? "Acquiring location..." : "Location not captured. Click 'Get Location'"}
                  </p>
                )}
              </div>
              <div className="space-y-1 border-t border-slate-150/40 dark:border-slate-800/40 pt-3">
                <span className="text-[9px] font-bold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-wider block">Internet Status</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5" /> Online (IP: {ipAddress})
                </p>
              </div>
              <div className="space-y-1 border-t border-slate-150/40 dark:border-slate-800/40 pt-3">
                <span className="text-[9px] font-bold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-wider block">Attendance Status</span>
                <p className="font-bold text-[#545F73] dark:text-[#CBD5E1] flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-slate-400" /> Awaiting Check-In
                </p>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={requestLocation}
                disabled={isCapturingLocation}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-[#F8FAFC] text-xs font-bold py-3 px-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <MapPin className="h-4 w-4 text-blue-500" />
                {isCapturingLocation ? "Acquiring..." : "Get Location"}
              </button>
              
              <button
                onClick={handleMarkAttendance}
                disabled={!gpsCoords || isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900/40 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle className="h-4 w-4" />
                {isSubmitting ? "Marking..." : "Mark Attendance"}
              </button>

              <button
                onClick={logout}
                className="bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


