import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Calendar, Clock, Shield, Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { useOperations } from '../../store/OperationsContext';
import { useTheme } from '../../store/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { soundPlayer } from '../../utils/audio';
import { RoleSwitcher } from '../common/RoleSwitcher';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, notifications, attendance, triggerNotification, markAllNotificationsRead } = useOperations();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchVal, setSearchVal] = useState('');

  const isDriver = user?.role === 'Driver';

  // Live Date/Time Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Playback Triggers
  const getSoundSettings = () => {
    const saved = localStorage.getItem('smartops_owner_settings');
    return saved ? JSON.parse(saved) : { soundEnabled: true, soundVolume: 0.5 };
  };

  const prevLengthRef = useRef(notifications.length);

  useEffect(() => {
    if (notifications.length > prevLengthRef.current) {
      const latest = notifications[0];
      if (latest) {
        const settings = getSoundSettings();
        if (settings.soundEnabled) {
          soundPlayer.play(latest.severity || 'Info', settings.soundVolume);
        }
      }
    }
    prevLengthRef.current = notifications.length;
  }, [notifications]);

  // Check today's attendance record
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = user?.role === 'Driver'
    ? attendance.find(a => a && a.driverId && (a.driverId === user?.driverId || a.driverId === user?.id) && a.date === todayStr)
    : null;
  const isPresent = todayRecord && (todayRecord.attendanceStatus === 'Present' || todayRecord.attendanceStatus === 'Late');

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    const settings = getSoundSettings();
    if (settings.soundEnabled) {
      soundPlayer.play('Success', settings.soundVolume);
    }
    setShowNotifications(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      alert(`Global telemetry search requested: "${searchVal}"`);
      setSearchVal('');
    }
  };

  const handleProfileClick = () => {
    if (isDriver) {
      navigate('/driver/profile');
    } else {
      navigate('/owner/profile');
    }
  };

  const handleNotificationsClick = () => {
    setShowNotifications(false);
    if (isDriver) {
      navigate('/driver/notifications');
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-[#111827] sticky top-0 z-40 transition-colors border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between gap-3 shadow-sm">

      {/* LEFT: Search Bar (always visible) */}
      <form onSubmit={handleSearchSubmit} className="flex relative w-full max-w-[240px] shrink-0">
        <Search className="search-icon-glow absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" />
        <input
          type="text"
          placeholder="Search...."
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          className="navbar-search-input w-full pl-9 pr-3 h-9 text-xs border border-[#E5E7EB] dark:border-[#334155] rounded-full bg-slate-50/50 dark:bg-slate-800/40 text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#006A6A] focus:border-[#006A6A] transition-all font-medium"
        />
      </form>

      {/* RIGHT: Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">

        {/* Clock & Date */}
        <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-semibold text-[#374151] dark:text-[#CBD5E1] bg-[#F9FAFB] dark:bg-[#1E293B] border border-[#E5E7EB] dark:border-[#334155] rounded-xl px-3.5 py-2 shadow-sm whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#6B7280] dark:text-[#94A3B8] shrink-0" />
            <span className="font-bold text-[#111827] dark:text-white">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="h-3.5 w-[1px] bg-[#E5E7EB] dark:bg-[#334155]" />
          <div className="flex items-center gap-1.5 font-bold text-[#111827] dark:text-[#F8FAFC]">
            <Clock className="h-3.5 w-3.5 text-[#006A6A] dark:text-[#7DF5F5] animate-pulse shrink-0" />
            <span className="font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Driver: On Duty Badge + Vehicle Number */}
        {isDriver ? (
          <div className="hidden sm:flex items-center gap-2">
            {isPresent && (
              <div className="px-3 py-1.5 bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#10B981]/30 rounded-xl text-[#059669] dark:text-[#34D399] flex items-center gap-1.5 shadow-sm shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
                </span>
                <span className="font-extrabold text-[9px] uppercase tracking-wider leading-none">ON DUTY</span>
              </div>
            )}
            <div className="px-3 py-2 border border-[#E5E7EB] dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] text-xs font-mono font-bold text-[#111827] dark:text-[#CBD5E1] shadow-sm whitespace-nowrap">
              {user?.vehicleNumber || 'MH-12-QW-9874'}
            </div>
          </div>
        ) : (
          <div
            onClick={handleProfileClick}
            className="relative hidden sm:flex items-center gap-2 px-3 py-2 border border-[#E5E7EB] dark:border-[#334155] rounded-xl bg-white dark:bg-[#1E293B] hover:bg-[#F9FAFB] dark:hover:bg-[#0F172A] cursor-pointer transition-colors text-xs font-semibold text-[#111827] dark:text-[#CBD5E1] shadow-sm whitespace-nowrap"
          >
            <Shield className="h-3.5 w-3.5 text-[#006A6A] dark:text-[#7DF5F5] shrink-0" />
            <span>{user?.companyName || user?.fullName || 'Enterprise Portal'}</span>
          </div>
        )}

        {/* ── Theme Toggle Square Button (No Animation, Instant Tab Toggle) ── */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          className="w-9 h-9 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:bg-[#F3F4F6] dark:hover:bg-[#334155] shadow-sm shrink-0 flex items-center justify-center focus:outline-none cursor-pointer transition-colors"
        >
          {theme === 'light' ? (
            <Sun className="h-4 w-4 text-[#F59E0B]" />
          ) : (
            <Moon className="h-4 w-4 text-[#7DF5F5]" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-[#1E293B] text-[#374151] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-white transition-colors border border-[#E5E7EB] dark:border-[#334155] bg-white dark:bg-[#111827] flex items-center justify-center cursor-pointer shadow-sm shrink-0"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full ring-2 ring-white dark:ring-[#111827] animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-[#E5E7EB] dark:border-[#334155] z-30 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-[#E5E7EB] dark:border-[#334155] flex items-center justify-between">
                    <span className="font-bold text-xs text-[#111827] dark:text-[#F8FAFC]">System Alerts</span>
                    <span className="text-[9px] bg-[#FFDAD4] dark:bg-[#7F1D1D]/30 text-[#BA1A1A] dark:text-[#FCA5A5] px-2.5 py-0.5 rounded-full font-bold border border-[#BA1A1A]/10">
                      {unreadCount} Unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E7EB] dark:divide-[#334155]">
                    {notifications.slice(0, 5).map(notif => (
                      <div
                        key={notif.id}
                        onClick={handleNotificationsClick}
                        className={`p-3.5 transition-colors cursor-pointer ${
                          notif.read
                            ? 'opacity-65 hover:bg-[#F3F4F6] dark:hover:bg-[#0F172A]/40'
                            : 'bg-[#006A6A]/5 dark:bg-[#006A6A]/10 hover:bg-[#F3F4F6] dark:hover:bg-[#0F172A]/60'
                        }`}
                      >
                        <div className="flex gap-2.5">
                          {!notif.read ? (
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                notif.severity === 'Error'
                                  ? 'bg-[#BA1A1A]'
                                  : notif.severity === 'Warning'
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#006A6A]'
                              }`}
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-slate-300 dark:bg-slate-600 opacity-40" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-[#111827] dark:text-[#F8FAFC] leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-[#4B5563] dark:text-[#94A3B8] leading-tight mt-0.5 break-words">{notif.message}</p>
                            <span className="text-[9px] text-[#6B7280] dark:text-[#64748B] font-bold block mt-1">{notif.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-xs text-[#6B7280] dark:text-[#94A3B8]">
                        No active alerts recorded today.
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] flex justify-between items-center text-[10px] font-bold">
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[#006A6A] dark:text-[#7DF5F5] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                    {isDriver && (
                      <button
                        onClick={handleNotificationsClick}
                        className="text-[#4B5563] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-white cursor-pointer"
                      >
                        View all →
                      </button>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Connected Dashboard Switcher */}
        <RoleSwitcher />

        {/* User Profile */}
        <div
          onClick={handleProfileClick}
          className="flex items-center gap-2.5 border-l border-[#E5E7EB] dark:border-[#334155] pl-3 shrink-0 cursor-pointer group"
        >
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'SmartOps'}&backgroundColor=006A6A`}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] shadow-sm group-hover:scale-105 transition-transform shrink-0"
          />
          <div className="hidden md:block text-left">
            <p className="text-[11px] font-bold text-[#111827] dark:text-[#F8FAFC] group-hover:text-[#006A6A] dark:group-hover:text-[#7DF5F5] transition-colors leading-none whitespace-nowrap">
              {user?.fullName || 'User'}
            </p>
            <p className="text-[9px] text-[#006A6A] dark:text-[#7DF5F5] font-bold uppercase mt-0.5 tracking-wider whitespace-nowrap">
              {user?.role || 'Driver'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
