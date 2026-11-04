import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Vehicle, Trip, InventoryItem, PayrollRecord, SystemNotification, ActivityItem, AttendanceRecord, Company, DriverRecord } from '../types';
import { mockNotifications, mockActivities, mockInventory, mockPayroll } from '../api/mockData';
import { api } from '../api/client';
import { io } from 'socket.io-client';
import { LogoutConfirmationModal } from '../components/common/LogoutConfirmationModal';

interface OperationsContextType {
  user: User | null;
  company: Company | null;
  vehicles: Vehicle[];
  trips: Trip[];
  inventory: InventoryItem[];
  payroll: PayrollRecord[];
  attendance: AttendanceRecord[];
  drivers: DriverRecord[];
  notifications: SystemNotification[];
  activities: ActivityItem[];
  refreshDrivers: () => Promise<void>;
  login: (email: string, role: UserRole, password?: string) => Promise<void>;
  googleAuth: (googleToken: string, role: UserRole) => Promise<any>;
  register: (payload: any) => Promise<{ success?: boolean; message: string; otpCode?: string; token?: string; user?: User }>;
  verifyOTP: (emailOrPayload: string | { email?: string; mobileNumber?: string; channel?: 'email' | 'mobile'; otpCode: string }, code?: string) => Promise<{ message: string; token?: string; user?: User }>;
  resendOTP: (emailOrPayload: string | { email?: string; mobileNumber?: string; channel?: 'email' | 'mobile' }) => Promise<{ success?: boolean; message: string; channel?: string; cooldownSeconds?: number }>;
  isLogoutModalOpen: boolean;
  isLoggingOut: boolean;
  cancelLogout: () => void;
  performLogout: () => void;
  logout: () => void;
  // Inventory CRUD
  createInventory: (item: Omit<InventoryItem, 'id'>) => Promise<InventoryItem>;
  updateInventory: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  // Attendance CRUD
  createAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  updateAttendance: (id: string, record: Partial<AttendanceRecord>) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;
  // Driver Duty Actions
  driverStartDuty: (payload: { 
    driverId: string; 
    driverName: string; 
    employeeName: string; 
    checkInGPS?: string; 
    checkInWarehouse?: string; 
    checkInDeviceInfo?: string; 
    checkInInternetStatus?: string;
    vehicleNumber?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    checkInTime?: string;
    browserInfo?: string;
    deviceType?: string;
  }) => Promise<void>;
  driverStartBreak: (payload: { driverId: string; type: string; remarks: string; gps: string }) => Promise<void>;
  driverEndBreak: (payload: { driverId: string; gps: string }) => Promise<void>;
  driverEndDuty: (payload: { 
    driverId: string; 
    checkOutGPS?: string; 
    tripsCompleted: number; 
    distanceCovered: number; 
    fuelUsed: number;
    checkOutTime?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }) => Promise<void>;
  // Salary CRUD
  createSalary: (pay: Omit<PayrollRecord, 'id'>) => Promise<void>;
  updateSalary: (id: string, pay: Partial<PayrollRecord>) => Promise<void>;
  deleteSalary: (id: string) => Promise<void>;
  // Fleet CRUD
  createVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  // Trip actions
  createTrip: (tripData: Partial<Trip>) => Promise<Trip>;
  cancelTrip: (tripId: string) => Promise<void>;
  updateTripStatus: (tripId: string, status: Trip['status'], details?: { stopReason?: string; signatureData?: string; photo?: string; deliveryPhoto?: string[] }) => Promise<void>;

  approvePayroll: (id: string) => Promise<void>;
  // Helpers
  addActivity: (action: string, details: string, category: ActivityItem['category']) => void;
  triggerNotification: (type: SystemNotification['type'], title: string, message: string, severity?: SystemNotification['severity']) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (payload: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    companyName?: string;
    licenseNumber?: string;
    vehicleNumber?: string;
    avatarUrl?: string;
  }) => Promise<any>;
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smartops_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load Data on Mount & Auth State changes
  const refreshAllData = async () => {
    const jwtToken = localStorage.getItem('smartops_jwt');
    if (!jwtToken || !user) {
      return;
    }
    try {
      const [invData, attData, salData, fltData, trpData, drvData] = await Promise.allSettled([
        api.inventory.getAll(),
        api.attendance.getAll(),
        api.salary.getAll(),
        api.fleet.getAll(),
        api.trips.getAll(),
        api.drivers.getAll({ limit: 100 })
      ]);

      if (invData.status === 'fulfilled') setInventory(invData.value || []);
      if (attData.status === 'fulfilled') setAttendance(attData.value || []);
      if (salData.status === 'fulfilled') setPayroll(salData.value || []);
      if (fltData.status === 'fulfilled') setVehicles(fltData.value || []);
      if (trpData.status === 'fulfilled') setTrips(trpData.value || []);
      if (drvData.status === 'fulfilled') {
        const dVal = drvData.value;
        const dList = Array.isArray(dVal?.data) ? dVal.data : (Array.isArray(dVal) ? dVal : []);
        setDrivers(dList);
      }

      if (user.role === 'Owner') {
        try {
          const companyData = await api.company.getMyCompany();
          if (companyData) setCompany(companyData);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Data refreshing error:', err);
    }
  };

  useEffect(() => {
    const jwt = localStorage.getItem('smartops_jwt');
    if (jwt && user) {
      refreshAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.companyId]);

  // Also run on every hard page load (user restored from localStorage but
  // user?.id hasn't changed so the effect above doesn't re-fire)
  useEffect(() => {
    const jwt = localStorage.getItem('smartops_jwt');
    if (jwt && user) {
      refreshAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synthetic sound play helper
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = 587.33; // D5 tone
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio Context tone trigger blocked by browser policy.', e);
    }
  };

  // Real-time Socket.io synchronizer with tenant isolation
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Operational telemetry link active.');
      if (user?.companyId) {
        socket.emit('join-company', user.companyId);
      }
    });

    const handleLocationUpdate = (data: any) => {
      console.log('Live location telemetry update:', data);
      if (data && data.tripId) {
        setTrips(prevTrips =>
          prevTrips.map(t => {
            if (t.id === data.tripId || (t as any)._id === data.tripId) {
              return {
                ...t,
                latitude: data.latitude,
                longitude: data.longitude,
                currentLocation: data.address || t.currentLocation,
                currentAddress: data.address || t.currentAddress,
                speed: data.speed,
                heading: data.heading,
                accuracy: data.accuracy,
                eta: data.eta || t.eta,
                distanceRemaining: data.distanceRemaining !== undefined ? data.distanceRemaining : t.distanceRemaining,
                lastGpsUpdate: new Date(data.timestamp || Date.now()).toISOString()
              };
            }
            return t;
          })
        );
      } else {
        refreshAllData();
      }
    };

    socket.on('location-update', handleLocationUpdate);
    socket.on('telemetryUpdate', handleLocationUpdate);

    socket.on('driver-online', (data: any) => {
      console.log('Driver online:', data);
      refreshAllData();
    });

    socket.on('driver-offline', (data: any) => {
      console.log('Driver offline:', data);
      refreshAllData();
    });

    socket.on('trip-started', (data: any) => {
      console.log('Trip started event:', data);
      triggerNotification('System Alert', 'Trip Started', `Driver started trip ${data.tripNumber || ''}.`, 'Info');
      refreshAllData();
    });

    socket.on('trip-updated', (data: any) => {
      console.log('Trip updated event:', data);
      refreshAllData();
    });

    socket.on('trip-completed', (data: any) => {
      console.log('Trip completed event:', data);
      triggerNotification('System Alert', 'Trip Completed', `Trip ${data.tripNumber || ''} has been completed.`, 'Info');
      refreshAllData();
    });

    socket.on('pod-uploaded', (data: any) => {
      console.log('POD uploaded event:', data);
      playAlertSound();
      triggerNotification('System Alert', 'New POD Uploaded', `Driver uploaded POD verification record.`, 'Info');
      refreshAllData();
    });

    socket.on('podUpdate', (data: any) => {
      console.log('Real-time POD update received:', data);
      playAlertSound();

      if (data.type === 'UPLOAD') {
        triggerNotification(
          'System Alert',
          'New POD Uploaded',
          `Driver ${data.pod?.driverName || 'Driver'} uploaded POD ${data.pod?.podId || ''}.`,
          'Info'
        );
      } else if (data.type === 'APPROVE') {
        triggerNotification(
          'System Alert',
          'POD Approved',
          `Order ${data.pod?.orderNumber || ''} POD Approved.`,
          'Info'
        );
      } else if (data.type === 'REJECT') {
        triggerNotification(
          'Critical',
          'POD Rejected',
          `Order ${data.pod?.orderNumber || ''} POD Rejected.`,
          'Error'
        );
      }

      // Dispatch custom window event for table re-fetch
      const syncEvent = new CustomEvent('pod-sync-event', { detail: data });
      window.dispatchEvent(syncEvent);
      refreshAllData();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const login = async (email: string, role: UserRole, password?: string) => {
    const res = await api.auth.login(email, role, password);
    setUser(res.user);
    localStorage.setItem('smartops_user', JSON.stringify(res.user)); if (res.token) { localStorage.setItem('smartops_jwt', res.token); localStorage.setItem('smartops_token', res.token); }
    triggerNotification('System Alert', 'Session Initialized', `Welcome back ${res.user.fullName}! JWT validated.`, 'Info');
    await refreshAllData();
  };

  const googleAuth = async (_googleToken: string, _role: UserRole) => {
    throw new Error('Google authentication is temporarily disabled.');
    /*
    // TEMPORARILY DISABLED GOOGLE OAUTH CONTEXT HANDLER
    const res = await api.auth.googleAuth(_googleToken, _role);
    setUser(res.user);
    localStorage.setItem('smartops_user', JSON.stringify(res.user)); if (res.token) { localStorage.setItem('smartops_jwt', res.token); localStorage.setItem('smartops_token', res.token); }
    triggerNotification('System Alert', 'Google Session Initialized', `Welcome ${res.user.fullName}! Google OAuth authenticated.`, 'Info');
    return res;
    */
  };

  const register = async (payload: any) => {
    const res = await api.auth.register(payload);
    triggerNotification('System Alert', 'OTP Dispatched', res.message || `Verification OTP code sent to ${payload.email}.`, 'Info');
    return res;
  };

  const verifyOTP = async (emailOrPayload: string | { email?: string; mobileNumber?: string; channel?: 'email' | 'mobile'; otpCode: string }, code?: string) => {
    const payload = typeof emailOrPayload === 'string' ? { email: emailOrPayload, otpCode: code || '' } : emailOrPayload;
    const res = await api.auth.verifyOTP(payload);
    if (res.user) {
      setUser(res.user);
      localStorage.setItem('smartops_user', JSON.stringify(res.user)); if (res.token) { localStorage.setItem('smartops_jwt', res.token); localStorage.setItem('smartops_token', res.token); }
      triggerNotification('System Alert', 'Account Verified', res.message || 'Identity verified successfully.', 'Info');
    }
    return res;
  };

  const resendOTP = async (emailOrPayload: string | { email?: string; mobileNumber?: string; channel?: 'email' | 'mobile' }) => {
    const payload = typeof emailOrPayload === 'string' ? { email: emailOrPayload } : emailOrPayload;
    const res = await api.auth.resendOTP(payload);
    triggerNotification('System Alert', 'OTP Resent', res.message || 'Fresh OTP code dispatched.', 'Info');
    return res;
  };

  const logout = () => {
    setIsLogoutModalOpen(true);
  };

  const cancelLogout = () => {
    if (!isLoggingOut) {
      setIsLogoutModalOpen(false);
    }
  };

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (user?.role === 'Driver') {
        try {
          await api.auth.logout(user.id, user.driverId);
        } catch (err) {
          console.warn('Backend logout call warning:', err);
        }
      }

      // Clear React context states
      setUser(null);
      setCompany(null);
      setVehicles([]);
      setTrips([]);
      setInventory([]);
      setPayroll([]);
      setAttendance([]);

      // Clear tokens & storage
      localStorage.removeItem('smartops_user');
      localStorage.removeItem('smartops_jwt');
      localStorage.removeItem('smartops_token');
      localStorage.removeItem('smartops_owner_settings');
      sessionStorage.clear();

      // Clear cookies if applicable
      if (document.cookie) {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    } catch {
      // Silent fallback
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      // Hard replace location to purge back button history access
      window.location.replace('/login');
    }
  };

  const triggerNotification = (
    type: SystemNotification['type'],
    title: string,
    message: string,
    severity: SystemNotification['severity'] = 'Info'
  ) => {
    const newNotif: SystemNotification = {
      id: `n-${Date.now()}`,
      type,
      title,
      message,
      timestamp: 'Just Now',
      read: false,
      severity
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const updateProfile = async (payload: {
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    companyName?: string;
    licenseNumber?: string;
    vehicleNumber?: string;
    avatarUrl?: string;
  }) => {
    const res = await api.auth.updateProfile(payload);
    if (res?.user) {
      setUser(res.user);
      localStorage.setItem('smartops_user', JSON.stringify(res.user)); if (res.token) { localStorage.setItem('smartops_jwt', res.token); localStorage.setItem('smartops_token', res.token); }
    }
    // Refresh company and profile data across components
    refreshAllData();
    return res;
  };

  const addActivity = (action: string, details: string, category: ActivityItem['category']) => {
    const newAct: ActivityItem = {
      id: `ac-${Date.now()}`,
      user: user?.fullName || 'System Admin',
      action,
      details,
      timestamp: 'Just Now',
      category
    };
    setActivities(prev => [newAct, ...prev]);
  };

  // Inventory CRUD triggers
  const createInventory = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const created = await api.inventory.create(item);
    setInventory(prev => [created, ...prev]);
    addActivity('Inventory Created', `Added new item: ${item.itemName} (${item.sku || created.sku})`, 'inventory');
    if (created.quantity <= (created.minimumQuantity || 0)) {
      triggerNotification('Low Stock', 'Safety Limit Alert', `Stock level for ${item.itemName} is below minimum capacity.`, 'Warning');
    }
    return created;
  };

  const updateInventory = async (id: string, item: Partial<InventoryItem>) => {
    const updated = await api.inventory.update(id, item);
    setInventory(prev => prev.map(i => i.id === id ? updated : i));
    addActivity('Inventory Updated', `Edited item: ${updated.itemName}`, 'inventory');
  };

  const deleteInventory = async (id: string) => {
    await api.inventory.delete(id);
    setInventory(prev => prev.filter(i => i.id !== id));
    addActivity('Inventory Removed', `Deleted stock record ID: ${id}`, 'inventory');
  };

  // Attendance CRUD triggers
  const createAttendance = async (record: Omit<AttendanceRecord, 'id'>) => {
    const created = await api.attendance.create(record);
    setAttendance(prev => [...prev, created]);
    addActivity('Attendance Added', `Recorded check-in for ${record.employeeName}`, 'attendance');
  };

  const updateAttendance = async (id: string, record: Partial<AttendanceRecord>) => {
    const updated = await api.attendance.update(id, record);
    setAttendance(prev => prev.map(a => a.id === id ? updated : a));
  };

  const deleteAttendance = async (id: string) => {
    await api.attendance.delete(id);
    setAttendance(prev => prev.filter(a => a.id !== id));
  };

  const driverStartDuty = async (payload: any) => {
    const record = await api.attendance.startDuty(payload);
    setAttendance(prev => {
      const filtered = prev.filter(a => !(a && a.driverId === payload?.driverId && a.date === record.date));
      return [...filtered, record];
    });
    addActivity('Duty Started', `Driver ${payload.driverName} checked in at ${payload.checkInWarehouse}`, 'attendance');
    triggerNotification('System Alert', 'Duty Initiated', `Driver ${payload.driverName} is now ON DUTY at ${payload.checkInWarehouse}`, 'Info');
  };

  const driverStartBreak = async (payload: any) => {
    const record = await api.attendance.startBreak(payload);
    setAttendance(prev => prev.map(a => (a && a.driverId === payload?.driverId && a.date === record.date) ? record : a));
    addActivity('Break Started', `Driver ${user?.fullName || payload?.driverId} started break: ${payload.type}`, 'attendance');
    triggerNotification('System Alert', 'Driver Break Logs', `Driver ${user?.fullName || 'Operator'} started a ${payload.type} break`, 'Info');
  };

  const driverEndBreak = async (payload: any) => {
    const record = await api.attendance.endBreak(payload);
    setAttendance(prev => prev.map(a => (a && a.driverId === payload?.driverId && a.date === record.date) ? record : a));
    addActivity('Break Ended', `Driver ${user?.fullName || payload?.driverId} resumed duty`, 'attendance');
    triggerNotification('System Alert', 'Driver Break Logs', `Driver ${user?.fullName || 'Operator'} break completed, returned to active duty`, 'Info');
  };

  const driverEndDuty = async (payload: any) => {
    const record = await api.attendance.endDuty(payload);
    setAttendance(prev => prev.map(a => (a && a.driverId === payload?.driverId && a.date === record.date) ? record : a));
    
    // Sync with payroll automatically
    const empName = record.employeeName || user?.fullName || '';
    const payrollRecord = payroll.find(p => empName && (p.employee.toLowerCase().includes(empName.toLowerCase()) || p.employeeName?.toLowerCase().includes(empName.toLowerCase())));
    if (payrollRecord) {
      const overtimeBonus = Math.floor((record.overtime || 0) * 400);
      const performanceBonus = Math.floor((record.performanceScore || 100) * 10);
      const tripIncentive = Math.floor((record.tripsCompleted || 0) * 500);
      const allowanceBonus = Math.floor((record.distanceCovered || 0) * 5); // Fuel / mileage allowance
      const bonusAddition = overtimeBonus + performanceBonus + tripIncentive + allowanceBonus;
      
      await updateSalary(payrollRecord.id, {
        overtime: (payrollRecord.overtime || 0) + overtimeBonus,
        bonus: (payrollRecord.bonus || 0) + bonusAddition,
        finalSalary: payrollRecord.basicSalary + (payrollRecord.overtime || 0) + (payrollRecord.bonus || 0) + bonusAddition + payrollRecord.allowance - payrollRecord.deduction - payrollRecord.tax
      });
    }

    addActivity('Duty Completed', `Driver ${user?.fullName || payload?.driverId} checked out. Shift hours: ${record.workingHours} hrs.`, 'attendance');
    triggerNotification('System Alert', 'Duty Terminated', `Driver ${user?.fullName || 'Operator'} shift closed. Total hours: ${record.workingHours} hrs.`, 'Info');
  };

  // Salary CRUD triggers
  const createSalary = async (pay: Omit<PayrollRecord, 'id'>) => {
    try {
      const created = await api.salary.create(pay);
      const safeItem = { ...pay, ...created, id: created?.id || (created as any)?._id || `sal-${Date.now()}` };
      setPayroll(prev => [...prev, safeItem]);
      addActivity('Salary Created', `Calculated salary record for ${pay.employee}`, 'payroll');
    } catch (err) {
      console.warn('createSalary error fallback:', err);
      const localRecord = { ...pay, id: `sal-${Date.now()}` } as PayrollRecord;
      setPayroll(prev => [...prev, localRecord]);
    }
  };

  const updateSalary = async (id: string, pay: Partial<PayrollRecord>) => {
    try {
      const updated = await api.salary.update(id, pay);
      const safeId = id || updated?.id || (updated as any)?._id;
      const safeRecord = { ...pay, ...updated, id: safeId };
      setPayroll(prev => prev.map(p => (p.id === id || p.id === safeId || (p as any)._id === id) ? safeRecord : p));
      if (pay.paymentStatus === 'Paid') {
        addActivity('Salary Approved', `Approved and paid final salary to ${safeRecord.employee}`, 'payroll');
        triggerNotification('Salary Pending', 'Payroll Disbursed', `Salary of INR ${safeRecord.finalSalary} transferred to ${safeRecord.employee}.`, 'Info');
      }
    } catch (err) {
      console.warn('updateSalary error fallback:', err);
      setPayroll(prev => prev.map(p => p.id === id ? { ...p, ...pay } : p));
    }
  };

  const deleteSalary = async (id: string) => {
    try {
      await api.salary.delete(id);
    } catch (err) {
      console.warn('deleteSalary error fallback:', err);
    }
    setPayroll(prev => prev.filter(p => p.id !== id && (p as any)._id !== id));
  };

  // Fleet CRUD triggers
  const createVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    const created = await api.fleet.create(vehicle);
    setVehicles(prev => [...prev, created]);
    addActivity('Vehicle Added', `Registered truck number: ${vehicle.vehicleNumber}`, 'fleet');
  };

  const updateVehicle = async (id: string, vehicle: Partial<Vehicle>) => {
    const updated = await api.fleet.update(id, vehicle);
    setVehicles(prev => prev.map(v => v.id === id ? updated : v));
  };

  const deleteVehicle = async (id: string) => {
    await api.fleet.delete(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
    addActivity('Vehicle Removed', `De-registered vehicle ID: ${id}`, 'fleet');
  };

  const createTrip = async (tripData: Partial<Trip>): Promise<Trip> => {
    const newTrip = await api.trips.create(tripData);
    setTrips(prev => [newTrip, ...prev]);
    addActivity('Trip Created', `Created and assigned trip ${newTrip.tripNumber} for driver ${newTrip.driverName}`, 'fleet');
    triggerNotification('Trip Started', 'New Consignment Dispatched', `Trip ${newTrip.tripNumber} assigned to driver ${newTrip.driverName}.`, 'Info');
    return newTrip;
  };

  const cancelTrip = async (tripId: string): Promise<void> => {
    const cancelled = await api.trips.cancel(tripId);
    setTrips(prev => prev.map(t => t.id === tripId ? cancelled : t));
    addActivity('Trip Cancelled', `Trip ${cancelled.tripNumber} was cancelled`, 'fleet');
    triggerNotification('Critical', 'Trip Assignment Cancelled', `Trip assignment ${cancelled.tripNumber} was cancelled by owner.`, 'Warning');
  };

  // Trip action triggers
  const updateTripStatus = async (
    tripId: string,
    status: Trip['status'],
    details?: { stopReason?: string; signatureData?: string; photo?: string; deliveryPhoto?: string[] }
  ) => {
    const updated = await api.trips.updateStatus(tripId, status, details);
    setTrips(prev => prev.map(t => t.id === tripId ? updated : t));
    
    // Auto-update vehicle status to match coordinates movement
    const activeVeh = vehicles.find(v => v.vehicleNumber === updated.vehicleNumber);
    if (activeVeh) {
      let vehStatus: Vehicle['status'] = 'Idle';
      if (status === 'In Transit' || status === 'Started') vehStatus = 'Moving';
      else if (status === 'Delayed') vehStatus = 'Delayed';
      await updateVehicle(activeVeh.id, { status: vehStatus });
    }

    addActivity('Trip Status Changed', `Trip ${updated.tripNumber} updated to: ${status}`, 'fleet');
    triggerNotification('Trip Started', 'Fleet telemetry Update', `Trip status for ${updated.tripNumber} is now: ${status}`, 'Info');
  };

  // Simulated live coordinate telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && trips.length > 0) {
        setTrips(prevTrips =>
          prevTrips.map(trip => {
            if (trip.status === 'In Transit' || trip.status === 'Started') {
              const distanceReduction = Math.floor(Math.random() * 3) + 1;
              const newDistance = Math.max(0, trip.distanceRemaining - distanceReduction);
              let newStatus: any = trip.status;
              if (newDistance === 0) {
                newStatus = 'Reached Destination';
              } else if (trip.status === 'Started') {
                newStatus = 'In Transit';
              }
              return { ...trip, distanceRemaining: newDistance, status: newStatus };
            }
            return trip;
          })
        );
      }
    }, 9000);

    return () => clearInterval(interval);
  }, [user, trips]);

  const approvePayroll = async (id: string) => {
    await updateSalary(id, { paymentStatus: 'Paid' });
  };

  return (
    <OperationsContext.Provider
      value={{
        user,
        company,
        vehicles,
        trips,
        inventory,
        payroll,
        attendance,
        drivers,
        notifications,
        activities,
        refreshDrivers: refreshAllData,
        login,
        googleAuth,
        register,
        verifyOTP,
        resendOTP,
        isLogoutModalOpen,
        isLoggingOut,
        cancelLogout,
        performLogout,
        logout,
        createInventory,
        updateInventory,
        deleteInventory,
        createAttendance,
        updateAttendance,
        deleteAttendance,
        driverStartDuty,
        driverStartBreak,
        driverEndBreak,
        driverEndDuty,
        createSalary,
        updateSalary,
        deleteSalary,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        createTrip,
        cancelTrip,
        updateTripStatus,
        approvePayroll,
        addActivity,
        triggerNotification,
        markAllNotificationsRead,
        updateProfile
      }}
    >
      {children}
      <LogoutConfirmationModal />
    </OperationsContext.Provider>
  );
};

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (context === undefined) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
};
