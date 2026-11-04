import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { soundPlayer } from '../../utils/audio';
import { api } from '../../api/client';
import { DriverRecord } from '../../types';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  UserCheck,
  UserX,
  ShieldAlert,
  Send,
  SlidersHorizontal,
  Edit2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const getAvatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=006A6A`;

const formatDate = (iso: string | null) => {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

// ─── component ──────────────────────────────────────────────────────────────

export const Workers: React.FC = () => {
  const { triggerNotification, addActivity, user, company } = useOperations();

  // ── real database state ──────────────────────────────────────────────────
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // ── filter / search ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── modal state ───────────────────────────────────────────────────────────
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(null);

  // ── add-driver form state ─────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newLicenseNumber, setNewLicenseNumber] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ── message form state ────────────────────────────────────────────────────
  const [messageText, setMessageText] = useState('');

  // ── audio ─────────────────────────────────────────────────────────────────
  const playSound = (severity: 'Success' | 'Warning' | 'Error' | 'Info') => {
    const savedSettings = localStorage.getItem('smartops_owner_settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : { soundEnabled: true, soundVolume: 0.5 };
    if (settings.soundEnabled) {
      soundPlayer.play(severity, settings.soundVolume);
    }
  };

  // ── fetch from real API ───────────────────────────────────────────────────
  const fetchDrivers = useCallback(
    async (search: string, status: string, page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = { page, limit: 20 };
        if (search.trim()) params.search = search.trim();
        if (status !== 'All') params.status = status;

        const response = await api.drivers.getAll(params);
        setDrivers(response.data);
        setPagination(response.pagination);
      } catch (err: any) {
        const httpStatus = err?.response?.status;
        const serverMsg: string = err?.response?.data?.message || '';

        if (httpStatus === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (httpStatus === 403) {
          // Backend returns 403 both for "Invalid or expired token" AND for owner-only block.
          // Detect the token-failure case by checking the message from the server.
          const isTokenError =
            serverMsg.toLowerCase().includes('invalid') ||
            serverMsg.toLowerCase().includes('expired') ||
            serverMsg.toLowerCase().includes('token') ||
            serverMsg.toLowerCase().includes('verification pending');
          if (isTokenError) {
            setError('Your session token is invalid or expired. Please log out and log in again.');
          } else {
            setError(serverMsg || 'You do not have permission to view drivers. Owner access is required.');
          }
        } else if (!err?.response) {
          setError('Unable to load drivers. The server is unreachable. Please try again.');
        } else {
          setError(
            err?.response?.data?.message || 'Failed to load drivers. Please try again.'
          );
        }
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // initial load
  useEffect(() => {
    fetchDrivers(searchTerm, filterStatus, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced search/filter re-fetch
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchDrivers(searchTerm, filterStatus, 1);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm, filterStatus, fetchDrivers]);

  // ── add team member (real registration) ──────────────────────────────────
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await api.drivers.register({
        fullName: newName,
        email: newEmail,
        mobileNumber: newPhone || undefined,
        password: newPassword,
        vehicleNumber: newVehicleNumber || undefined,
        licenseNumber: newLicenseNumber || undefined,
        companyId: user?.companyId || company?.companyId,
        companyName: user?.companyName || company?.companyName,
      });
      setAddModalOpen(false);
      playSound('Success');
      triggerNotification(
        'System Alert',
        'Driver Registered',
        `New driver ${newName} registered successfully.`,
        'Info'
      );
      addActivity('Driver Registered', `Added new driver: ${newName}`, 'attendance');
      // Reset form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewVehicleNumber('');
      setNewLicenseNumber('');
      // Refresh list from DB
      fetchDrivers(searchTerm, filterStatus, 1);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please check the details and try again.';
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  };

  // ── deactivate driver (soft delete via PATCH /status) ────────────────────
  const handleDeactivateDriver = async (driver: DriverRecord) => {
    const action = driver.status === 'Active' ? 'deactivate' : 'reactivate';
    const newStatus = driver.status === 'Active' ? 'inactive' : 'active';
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${driver.fullName}? This will ${
          action === 'deactivate'
            ? 'block their login access.'
            : 'restore their login access.'
        }`
      )
    )
      return;

    try {
      await api.drivers.updateStatus(driver.id, newStatus);
      playSound(action === 'deactivate' ? 'Warning' : 'Success');
      triggerNotification(
        'System Alert',
        `Driver ${action === 'deactivate' ? 'Deactivated' : 'Reactivated'}`,
        `${driver.fullName} has been ${action}d.`,
        action === 'deactivate' ? 'Warning' : 'Info'
      );
      addActivity(
        `Driver ${action === 'deactivate' ? 'Deactivated' : 'Reactivated'}`,
        `${action === 'deactivate' ? 'Blocked' : 'Restored'} access for: ${driver.fullName}`,
        'attendance'
      );
      // Refresh list
      fetchDrivers(searchTerm, filterStatus, pagination.page);
    } catch (err: any) {
      playSound('Error');
      alert(
        err?.response?.data?.message ||
          `Failed to ${action} driver. Please try again.`
      );
    }
  };

  // ── send message (existing behavior preserved) ────────────────────────────
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedDriver) return;
    playSound('Success');
    triggerNotification(
      'System Alert',
      'SMS Dispatch Initiated',
      `Internal dispatch notification delivered to ${selectedDriver.fullName}: "${messageText.slice(0, 30)}..."`,
      'Info'
    );
    setMessageText('');
    setMessageModalOpen(false);
    alert(`Message dispatched to ${selectedDriver.fullName} successfully.`);
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-5 gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-white tracking-tight flex items-center gap-2 leading-none">
            <Users className="h-7 w-7 text-[#006A6A] dark:text-[#14B8A6]" />
            Personnel Directory
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            Track employee status registers, branch classifications, performance ratings, and dispatch alert messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchDrivers(searchTerm, filterStatus, 1)}
            disabled={loading}
            title="Refresh driver list"
            className="p-2 rounded-xl border border-[#E5EEFF] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-slate-500 hover:text-[#006A6A] hover:border-[#006A6A]/30 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={() => setAddModalOpen(true)}
            variant="primary"
            className="w-full sm:w-auto text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-teal-900/10"
          >
            <Plus className="h-4 w-4" /> Add Team Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-[20px] p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="search-icon-glow absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="navbar-search-input w-full pl-9 pr-3 h-9 text-xs border border-[#E5E7EB] dark:border-[#334155] rounded-full bg-slate-50/50 dark:bg-slate-800/40 text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#006A6A] focus:border-[#006A6A] transition-all font-medium"
          />
        </div>

        {/* Role (always Driver from DB — kept for UI consistency) */}
        <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            disabled
            className="w-full md:w-44 px-4 h-11 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 focus:outline-none cursor-not-allowed font-semibold opacity-70"
          >
            <option value="Driver">Drivers Only</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full md:w-44 px-4 h-11 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 focus:outline-none cursor-pointer font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Active">✅ Active</option>
            <option value="Inactive">⛔ Inactive</option>
          </select>
        </div>

        {/* Live count badge */}
        {!loading && !error && (
          <span className="ml-auto shrink-0 text-[11px] font-bold text-[#6D7A79] dark:text-[#94A3B8] whitespace-nowrap">
            {pagination.total} driver{pagination.total !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-[20px] p-16 text-center shadow-sm">
          <Loader2 className="h-8 w-8 text-[#006A6A] dark:text-[#14B8A6] mx-auto mb-3 animate-spin" />
          <p className="text-[14px] font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">Loading drivers...</p>
          <p className="text-[12px] text-[#6D7A79] dark:text-[#94A3B8] mt-1">Fetching from database, please wait.</p>
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && error && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#EF4444]/30 rounded-[20px] p-16 text-center shadow-sm">
          <AlertTriangle className="h-10 w-10 text-[#EF4444] mx-auto mb-3.5" />
          <h4 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Failed to load drivers</h4>
          <p className="text-[13px] text-[#EF4444] mt-1 font-medium max-w-md mx-auto">{error}</p>
          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <button
              onClick={() => fetchDrivers(searchTerm, filterStatus, 1)}
              className="px-5 py-2 rounded-xl bg-[#006A6A] hover:bg-[#005555] text-white text-[12px] font-bold transition-colors"
            >
              Try Again
            </button>
            {(error.toLowerCase().includes('token') ||
              error.toLowerCase().includes('expired') ||
              error.toLowerCase().includes('log') ||
              error.toLowerCase().includes('session')) && (
              <button
                onClick={() => {
                  localStorage.removeItem('smartops_jwt');
                  localStorage.removeItem('smartops_user');
                  window.location.href = '/';
                }}
                className="px-5 py-2 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-[12px] font-bold transition-colors"
              >
                Log Out & Log In Again
              </button>
            )}
          </div>
        </div>
      )}


      {/* ── Driver Cards Grid ── */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.length > 0 ? (
            drivers.map(driver => (
              <div
                key={driver.id}
                className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 text-left flex flex-col justify-between"
              >
                {/* Profile Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatarUrl(driver.fullName)}
                      alt={driver.fullName}
                      className="w-12 h-12 rounded-xl border border-slate-50 dark:border-slate-800 bg-[#F8F9FF] shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold text-[#0B1C30] dark:text-white whitespace-normal break-words leading-tight">
                        {driver.fullName}
                      </h4>
                      <p className="text-[11px] text-[#6D7A79] dark:text-[#6D7A79] font-bold uppercase mt-1 tracking-wider">
                        {driver.role}
                        {driver.driverId ? ` · ${driver.driverId}` : ''}
                      </p>
                    </div>
                    <span
                      className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${
                        driver.status === 'Active'
                          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/15'
                          : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                      }`}
                    >
                      {driver.status}
                    </span>
                  </div>

                  <div className="space-y-2.5 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pt-4 text-[13px] text-[#6D7A79] dark:text-[#94A3B8] font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="whitespace-normal break-words leading-tight font-semibold">
                        {driver.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-semibold">{driver.mobileNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold border-t border-dashed border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 pt-3 mt-3">
                      <span className="text-slate-400 uppercase tracking-wider">Vehicle</span>
                      <span className="text-[#0B1C30] dark:text-[#CBD5E1]">
                        {driver.vehicleNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">License</span>
                      <span className="text-[#0B1C30] dark:text-[#CBD5E1]">
                        {driver.licenseNumber || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">Registered</span>
                      <span className="text-[#006A6A] dark:text-[#14B8A6]">
                        {formatDate(driver.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedDriver(driver);
                      setMessageModalOpen(true);
                    }}
                    className="py-2 px-2 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] hover:bg-[#F8F9FF] dark:bg-[#0F172A] dark:hover:bg-slate-800 text-slate-700 dark:text-[#CBD5E1] font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Send className="h-3 w-3 text-[#006A6A]" /> SMS
                  </button>
                  <button
                    onClick={() => {
                      alert(`Details editor for ${driver.fullName} — coming soon.`);
                    }}
                    className="py-2 px-2 border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] hover:bg-[#F8F9FF] dark:bg-[#0F172A] dark:hover:bg-slate-800 text-slate-700 dark:text-[#CBD5E1] font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Edit2 className="h-3 w-3 text-[#6D7A79]" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeactivateDriver(driver)}
                    className={`py-2 px-2 font-semibold rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all border shadow-sm ${
                      driver.status === 'Active'
                        ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/20'
                        : 'bg-[#10B981]/10 hover:bg-[#10B981]/15 text-[#10B981] border-[#10B981]/20'
                    }`}
                  >
                    {driver.status === 'Active' ? (
                      <><UserX className="h-3 w-3" /> Block</>
                    ) : (
                      <><UserCheck className="h-3 w-3" /> Activate</>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            /* Empty state */
            <div className="col-span-full bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-[20px] p-16 text-center shadow-sm">
              <Users className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3.5" />
              <h4 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC]">No personnel found</h4>
              <p className="text-[13px] text-[#6D7A79] dark:text-[#6D7A79] mt-1 font-medium">
                {searchTerm || filterStatus !== 'All'
                  ? 'Try modifying your search or filters.'
                  : 'No registered drivers are available yet. Register a new driver using the button above.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <button
            onClick={() => fetchDrivers(searchTerm, filterStatus, pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-4 py-2 rounded-xl border border-[#E5EEFF] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[12px] font-semibold text-slate-700 dark:text-[#CBD5E1] disabled:opacity-40 hover:border-[#006A6A]/40 transition-all"
          >
            ← Prev
          </button>
          <span className="text-[12px] font-bold text-[#6D7A79] dark:text-[#94A3B8]">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => fetchDrivers(searchTerm, filterStatus, pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-4 py-2 rounded-xl border border-[#E5EEFF] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[12px] font-semibold text-slate-700 dark:text-[#CBD5E1] disabled:opacity-40 hover:border-[#006A6A]/40 transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* ─── MODAL 1: REGISTER DRIVER ─────────────────────────────────────── */}
      <Modal isOpen={addModalOpen} onClose={() => { setAddModalOpen(false); setAddError(null); }} title="Register New Driver">
        <form onSubmit={handleAddDriver} className="space-y-4 text-left">
          {addError && (
            <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[12px] font-semibold text-[#EF4444] flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {addError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Harpreet Singh"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Email Address *</label>
              <input
                type="email"
                required
                placeholder="driver@smartops.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Mobile Number</label>
              <input
                type="text"
                placeholder="+91 XXXXX XXXXX"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Password * <span className="text-[11px] font-normal text-[#6D7A79] normal-case">(min. 6 characters)</span></label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Set a secure password for the driver"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. MH-12-QW-9874"
                value={newVehicleNumber}
                onChange={e => setNewVehicleNumber(e.target.value)}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">License Number</label>
              <input
                type="text"
                placeholder="e.g. DL-MH12-9988"
                value={newLicenseNumber}
                onChange={e => setNewLicenseNumber(e.target.value)}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 mt-4">
            <Button type="button" variant="outline" onClick={() => { setAddModalOpen(false); setAddError(null); }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex items-center gap-1.5" disabled={addLoading}>
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {addLoading ? 'Registering...' : 'Register Driver'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: DISPATCH SMS TEXT ───────────────────────────────────── */}
      <Modal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        title={`Dispatch SMS Alert: ${selectedDriver?.fullName}`}
      >
        <form onSubmit={handleSendMessage} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">SMS Text Notification Details</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Please proceed to warehouse gate 3 for physical inventory inspection..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium resize-none"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setMessageModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex items-center gap-1.5">
              <Send className="h-4 w-4" /> Send SMS
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
