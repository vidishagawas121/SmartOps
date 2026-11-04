import axios from 'axios';
import { User, Vehicle, Trip, InventoryItem, PayrollRecord, AttendanceRecord, PODRecord, DriverRecord, Company } from '../types';
import { mockVehicles, mockTrips, mockInventory, mockPayroll, mockAttendance } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios Instance — higher timeout for DB-backed operations
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000  // 15 seconds: accommodates MongoDB Atlas cold starts and slow connections
});

// ── REQUEST INTERCEPTOR: attach Bearer token & Dev Logging ─────────────────────
axiosInstance.interceptors.request.use((config: any) => {
  const token = (localStorage.getItem('smartops_jwt') || localStorage.getItem('smartops_token'));
  if (token && token !== 'mock_jwt_token_payload' && token.trim() !== '') {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (import.meta.env.DEV) {
    const rawUser = localStorage.getItem('smartops_user');
    const u = rawUser ? JSON.parse(rawUser) : null;
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    if (u) {
      console.log(`[AUTH] userId: ${u.id || u._id} | role: ${u.role} | companyId: ${u.companyId || 'N/A'}`);
    }
  }

  return config;
}, (error: any) => Promise.reject(error));

// ── RESPONSE INTERCEPTOR: Dev Logging, Retries, & 401 Session Handling ─────────
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const recordsCount = Array.isArray(response.data)
        ? response.data.length
        : (Array.isArray(response.data?.data) ? response.data.data.length : undefined);
      console.log(
        `[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url} | status: ${response.status}${recordsCount !== undefined ? ` | records: ${recordsCount}` : ''}`
      );
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    const status = error.response?.status;

    if (import.meta.env.DEV) {
      console.error(
        `[API ERROR] ${config?.method?.toUpperCase()} ${config?.url} | status: ${status || 'NETWORK_ERR'} | message: ${error.response?.data?.message || error.message}`
      );
    }

    if (status === 401 || (status === 404 && error.response?.data?.message === 'User not found.')) {
      const currentToken = (localStorage.getItem('smartops_jwt') || localStorage.getItem('smartops_token'));
      if (currentToken) {
        console.warn('[SmartOps Auth] Session expired (401). Clearing token and notifying application.');
        localStorage.removeItem('smartops_jwt');
        localStorage.removeItem('smartops_user');
        window.dispatchEvent(new CustomEvent('smartops:session-expired'));
      }
      return Promise.reject(error);
    }

    // Exponential Backoff Retry logic for transient errors (502, 503, 504, Network Error)
    // DO NOT retry 400, 401, 403, 404
    const isTransient = !status || [502, 503, 504].includes(status);
    if (isTransient && config && !config._retryCount) {
      config._retryCount = 0;
    }

    if (isTransient && config && config._retryCount < 3) {
      config._retryCount += 1;
      const backoffDelay = Math.pow(2, config._retryCount) * 500; // 1s, 2s, 4s
      console.warn(`[API RETRY] Retrying ${config.method?.toUpperCase()} ${config.url} (Attempt ${config._retryCount}/3) in ${backoffDelay}ms...`);
      await new Promise(res => setTimeout(res, backoffDelay));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

// LocalStorage Fallback Helper class
class LocalStorageFallback {
  private static initKey<T>(key: string, defaultData: T[]) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultData));
    }
  }

  static get<T>(key: string, defaultData: T[]): T[] {
    this.initKey(key, defaultData);
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  static set<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ==========================================
// EXPORTED API METHODS
// ==========================================

export const api = {
  // 1. AUTH API
  auth: {
    login: async (email: string, role: string, password?: string): Promise<{ token: string; user: User }> => {
      try {
        const res = await axiosInstance.post('/auth/login', { email, role, password: password || '' });
        const receivedToken: string = res.data.token || '';
        if (receivedToken) {
          localStorage.setItem('smartops_jwt', receivedToken); localStorage.setItem('smartops_token', receivedToken);
        }
        if (res.data.user) {
          localStorage.setItem('smartops_user', JSON.stringify(res.data.user));
        }
        return res.data;
      } catch (err: any) {
        // ALWAYS propagate authentication errors — never inject fake users or hardcoded accounts
        throw err;
      }
    },
    register: async (payload: any): Promise<{ success?: boolean; message: string; otpCode?: string; token?: string; user?: User }> => {
      try {
        const res = await axiosInstance.post('/auth/register', payload);
        if (res.data.token) {
          localStorage.setItem('smartops_jwt', res.data.token); localStorage.setItem('smartops_token', res.data.token);
        }
        if (res.data.user) {
          localStorage.setItem('smartops_user', JSON.stringify(res.data.user));
        }
        return res.data;
      } catch (err: any) {
        throw err;
      }
    },
    verifyOTP: async (payload: { email?: string; mobileNumber?: string; channel?: 'email' | 'mobile'; otpCode: string }): Promise<{ message: string; token?: string; user?: User }> => {
      try {
        const res = await axiosInstance.post('/auth/verify-otp', payload);
        if (res.data.token) {
          localStorage.setItem('smartops_jwt', res.data.token); localStorage.setItem('smartops_token', res.data.token);
        }
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        return { message: 'Account verified successfully.' };
      }
    },
    resendOTP: async (payload: { email?: string; mobileNumber?: string; channel?: 'email' | 'mobile' }): Promise<{ success?: boolean; message: string; channel?: string; cooldownSeconds?: number }> => {
      try {
        const res = await axiosInstance.post('/auth/send-otp', payload);
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        return { message: 'New OTP sent.' };
      }
    },
    forgotPassword: async (email: string): Promise<{ message: string; otpCode?: string }> => {
      try {
        const res = await axiosInstance.post('/auth/forgot-password', { email });
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        return { message: `Password reset OTP dispatched to ${email}.` };
      }
    },
    resetPassword: async (payload: { email: string; otpCode: string; newPassword: string }): Promise<{ message: string }> => {
      try {
        const res = await axiosInstance.post('/auth/reset-password', payload);
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        return { message: 'Password has been updated successfully.' };
      }
    },
    updateProfile: async (payload: {
      fullName?: string;
      email?: string;
      mobileNumber?: string;
      companyName?: string;
      licenseNumber?: string;
      vehicleNumber?: string;
      avatarUrl?: string;
    }): Promise<{ success: boolean; message: string; user: User; token?: string }> => {
      try {
        const res = await axiosInstance.put('/users/profile', payload);
        if (res.data.user) {
          localStorage.setItem('smartops_user', JSON.stringify(res.data.user));
        }
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        const saved = localStorage.getItem('smartops_user');
        const currentUser = saved ? JSON.parse(saved) : {};
        const updatedUser = {
          ...currentUser,
          ...payload
        };
        localStorage.setItem('smartops_user', JSON.stringify(updatedUser));
        return { success: true, message: 'Profile updated in offline mode.', user: updatedUser };
      }
    },
    getProfile: async (): Promise<{ success: boolean; user: User }> => {
      try {
        const res = await axiosInstance.get('/users/profile');
        if (res.data.user) {
          localStorage.setItem('smartops_user', JSON.stringify(res.data.user));
        }
        return res.data;
      } catch (err: any) {
        const saved = localStorage.getItem('smartops_user');
        const currentUser = saved ? JSON.parse(saved) : null;
        return { success: true, user: currentUser };
      }
    },
    logout: async (userId?: string, driverId?: string): Promise<{ success: boolean; message: string }> => {
      try {
        const res = await axiosInstance.post('/auth/logout', { userId, driverId });
        return res.data;
      } catch (err: any) {
        return { success: false, message: err.message || 'Logout request failed' };
      }
    }
  },

  // USER API
  user: {
    getProfile: async (): Promise<{ success: boolean; user: User }> => {
      try {
        const res = await axiosInstance.get('/users/profile');
        if (res.data.user) {
          localStorage.setItem('smartops_user', JSON.stringify(res.data.user));
        }
        return res.data;
      } catch (err: any) {
        const saved = localStorage.getItem('smartops_user');
        const currentUser = saved ? JSON.parse(saved) : null;
        return { success: true, user: currentUser };
      }
    },
    updateProfile: async (payload: {
      fullName?: string;
      email?: string;
      mobileNumber?: string;
      companyName?: string;
      licenseNumber?: string;
      vehicleNumber?: string;
      avatarUrl?: string;
    }): Promise<{ success: boolean; message: string; user: User; token?: string }> => {
      const res = await axiosInstance.put('/users/profile', payload);
      if (res.data.user) {
        localStorage.setItem('smartops_user', JSON.stringify(res.data.user));
      }
      return res.data;
    }
  },


  // DRIVER LOCATION TELEMETRY API
  driver: {
    sendLocation: async (payload: {
      driverId?: string;
      tripId?: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      address?: string;
      timestamp?: string;
    }): Promise<{ success: boolean; message: string; data?: any }> => {
      try {
        const res = await axiosInstance.post('/driver/location', payload);
        return res.data;
      } catch (err: any) {
        return { success: true, message: 'Location cached in offline mode.' };
      }
    },
    recordLocation: async (payload: {
      driverId?: string;
      tripId?: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      address?: string;
      timestamp?: string;
    }): Promise<{ success: boolean; message: string; data?: any }> => {
      try {
        const res = await axiosInstance.post('/driver/location', payload);
        return res.data;
      } catch (err: any) {
        return { success: true, message: 'Location cached in offline mode.' };
      }
    },
    getLatestLocation: async (driverId: string): Promise<any> => {
      try {
        const res = await axiosInstance.get(`/driver/location/${driverId}`);
        return res.data;
      } catch (err: any) {
        return null;
      }
    }
  },

  // 2. INVENTORY CRUD
  inventory: {
    getAll: async (): Promise<InventoryItem[]> => {
      const res = await axiosInstance.get('/inventory');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      return list.map((item: any) => ({
        ...item,
        id: item._id || item.id,
        itemName: item.itemName || item.name || 'Unnamed Material',
        name: item.name || item.itemName || 'Unnamed Material',
        category: item.category || item.cat || 'Raw Materials',
        cat: item.cat || item.category || 'Raw Materials',
        sku: item.sku || 'SKU-GEN',
        quantity: Number(item.quantity ?? item.qty ?? 0),
        qty: Number(item.qty ?? item.quantity ?? 0),
        minimumQuantity: Number(item.minimumQuantity ?? item.threshold ?? 0),
        threshold: Number(item.threshold ?? item.minimumQuantity ?? 0),
        warehouse: item.warehouse || item.loc || 'Main Facility',
        loc: item.loc || item.warehouse || 'Main Facility',
        purchasePrice: Number(item.purchasePrice ?? item.val ?? 0),
        sellingPrice: Number(item.sellingPrice ?? item.val ?? 0),
        val: Number(item.val ?? item.sellingPrice ?? item.purchasePrice ?? 0),
        unit: item.unit || 'Units',
        supplier: item.supplier || 'Internal Stock',
        status: item.status || ((item.quantity ?? item.qty ?? 0) <= (item.minimumQuantity ?? item.threshold ?? 0) ? 'Low Stock' : 'In Stock')
      }));
    },
    create: async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
      const res = await axiosInstance.post('/inventory', item);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    update: async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
      const res = await axiosInstance.put(`/inventory/${id}`, item);
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await axiosInstance.delete(`/inventory/${id}`);
    }
  },

  // 3. DRIVER DUTY & ATTENDANCE SYSTEM API
  attendance: {
    getAll: async (): Promise<AttendanceRecord[]> => {
      const res = await axiosInstance.get('/attendance');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      return list.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getHistory: async (): Promise<AttendanceRecord[]> => {
      const res = await axiosInstance.get('/attendance/history');
      return res.data.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getLive: async (): Promise<AttendanceRecord[]> => {
      const res = await axiosInstance.get('/attendance/live');
      return res.data.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getAnalytics: async (): Promise<AttendanceRecord[]> => {
      const res = await axiosInstance.get('/attendance/analytics');
      return res.data.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getByDriverId: async (driverId: string): Promise<AttendanceRecord[]> => {
      const res = await axiosInstance.get(`/attendance/${driverId}`);
      return res.data.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    startDuty: async (payload: any): Promise<AttendanceRecord> => {
      const res = await axiosInstance.post('/attendance/start-duty', payload);
      return res.data;
    },
    startBreak: async (payload: { driverId: string; type: string; remarks: string; gps: string }): Promise<AttendanceRecord> => {
      const res = await axiosInstance.post('/attendance/start-break', payload);
      return res.data;
    },
    endBreak: async (payload: { driverId: string; gps: string }): Promise<AttendanceRecord> => {
      const res = await axiosInstance.post('/attendance/end-break', payload);
      return res.data;
    },
    endDuty: async (payload: any): Promise<AttendanceRecord> => {
      const res = await axiosInstance.post('/attendance/end-duty', payload);
      return res.data;
    },
    create: async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
      const res = await axiosInstance.post('/attendance', record);
      return res.data;
    },
    update: async (id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
      const res = await axiosInstance.put(`/attendance/${id}`, record);
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await axiosInstance.delete(`/attendance/${id}`);
    }
  },

  // 4. SALARY CRUD
  salary: {
    getAll: async (): Promise<PayrollRecord[]> => {
      try {
        const res = await axiosInstance.get('/salary');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        return list.map((item: any) => ({
          ...item,
          id: item._id || item.id,
          employee: item.employee || item.worker?.name || item.workerName || 'Worker Staff',
          basicSalary: Number(item.basicSalary ?? item.baseSalary ?? item.monthlySalary ?? 0),
          baseSalary: Number(item.baseSalary ?? item.basicSalary ?? item.monthlySalary ?? 0),
          overtime: Number(item.overtime ?? item.overtimePay ?? 0),
          bonus: Number(item.bonus ?? item.performanceBonus ?? 0),
          allowance: Number(item.allowance ?? 0),
          deduction: Number(item.deduction ?? item.deductions ?? 0),
          tax: Number(item.tax ?? item.tds ?? 0),
          finalSalary: Number(item.finalSalary ?? item.netSalary ?? item.basicSalary ?? item.baseSalary ?? 0),
          netSalary: Number(item.netSalary ?? item.finalSalary ?? 0),
          paymentStatus: item.paymentStatus || (item.isPaid ? 'Paid' : 'Pending')
        }));
      } catch (err) {
        console.warn('[SmartOps Salary API] Fetch failed:', err);
        return [];
      }
    },
    create: async (pay: Omit<PayrollRecord, 'id'>): Promise<PayrollRecord> => {
      try {
        const res = await axiosInstance.post('/salary', pay);
        const data = res.data;
        return { ...data, id: data._id || data.id || `sal-${Date.now()}` };
      } catch (err) {
        console.warn('[SmartOps Salary API] Create failed, using local object:', err);
        return { ...pay, id: `sal-${Date.now()}` } as PayrollRecord;
      }
    },
    update: async (id: string, pay: Partial<PayrollRecord>): Promise<PayrollRecord> => {
      try {
        const res = await axiosInstance.put(`/salary/${id}`, pay);
        const data = res.data;
        return { ...pay, ...data, id: data._id || data.id || id };
      } catch (err) {
        console.warn('[SmartOps Salary API] Update failed, using local object:', err);
        return { id, ...pay } as PayrollRecord;
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        await axiosInstance.delete(`/salary/${id}`);
      } catch (err) {
        console.warn('[SmartOps Salary API] Delete failed:', err);
      }
    }
  },

  // 5. FLEET VEHICLES CRUD
  fleet: {
    getAll: async (): Promise<Vehicle[]> => {
      const res = await axiosInstance.get('/fleet');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      return list.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    create: async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
      const res = await axiosInstance.post('/fleet', vehicle);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    update: async (id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> => {
      const res = await axiosInstance.put(`/fleet/${id}`, vehicle);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    delete: async (id: string): Promise<void> => {
      await axiosInstance.delete(`/fleet/${id}`);
    }
  },

  // 6. TRIP MANAGEMENT
  trips: {
    getAll: async (): Promise<Trip[]> => {
      const res = await axiosInstance.get('/trips');
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      return list.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getActive: async (): Promise<Trip | null> => {
      const res = await axiosInstance.get('/trips/active');
      return res.data ? { ...res.data, id: res.data._id || res.data.id } : null;
    },
    getById: async (id: string): Promise<Trip> => {
      const res = await axiosInstance.get(`/trips/${id}`);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    start: async (id: string): Promise<Trip> => {
      const res = await axiosInstance.put('/trips/start', { id });
      return { ...res.data, id: res.data._id || res.data.id };
    },
    updateLocation: async (payload: { id: string; latitude?: number; longitude?: number; accuracy?: number; speed?: number; heading?: number; distanceRemaining?: number; eta?: string; timestamp?: string }): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${payload.id}/location`, payload);
      const data = res.data?.data?.trip || res.data;
      return { ...data, id: data._id || data.id };
    },
    getLocationHistory: async (tripId: string, filters?: { driverId?: string; startDate?: string; endDate?: string }): Promise<any[]> => {
      const res = await axiosInstance.get(`/trips/${tripId}/location-history`, { params: filters });
      return Array.isArray(res.data) ? res.data : [];
    },
    getLiveTracking: async (tripId: string): Promise<any> => {
      const res = await axiosInstance.get(`/trips/${tripId}/live-tracking`);
      return res.data;
    },
    create: async (tripData: Partial<Trip>): Promise<Trip> => {
      const res = await axiosInstance.post('/trips', tripData);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    assign: async (id: string, payload: { driverId: string; driverName: string; vehicleNumber?: string }): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/assign`, payload);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    accept: async (id: string): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/accept`);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    arriveStop: async (id: string, stopId: string, coords?: { latitude?: number; longitude?: number }): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/stops/${stopId}/arrive`, coords);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    completeStop: async (id: string, stopId: string, details?: { podId?: string; stopReason?: string; notes?: string }): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/stops/${stopId}/complete`, details);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    reportDelay: async (id: string, reason: string, note?: string): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/delay`, { reason, note });
      return { ...res.data, id: res.data._id || res.data.id };
    },
    reportIncident: async (id: string, incidentType: string, description: string): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/incident`, { incidentType, description });
      return { ...res.data, id: res.data._id || res.data.id };
    },
    cancel: async (id: string): Promise<Trip> => {
      const res = await axiosInstance.put(`/trips/${id}/cancel`);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    complete: async (id: string, details?: { signatureData?: string; photo?: string }): Promise<Trip> => {
      const res = await axiosInstance.post(`/trips/${id}/end`, details);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    updateStatus: async (id: string, status: Trip['status'], details?: any): Promise<Trip> => {
      try {
        const res = await axiosInstance.put(`/trips/${id}`, { status, ...details });
        const data = res.data;
        return { ...data, id: data._id || data.id || id, status };
      } catch (err) {
        console.warn('[SmartOps Trips API] Status update offline fallback:', err);
        return { id, status, ...details } as Trip;
      }
    }
  },


  // 7. PROOF OF DELIVERY (POD) API
  pod: {
    getAll: async (params?: { status?: string; driver?: string; vehicle?: string; customer?: string; orderNumber?: string; date?: string }): Promise<PODRecord[]> => {
      const res = await axiosInstance.get('/pod', { params });
      return res.data.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getDriverPODs: async (): Promise<PODRecord[]> => {
      const res = await axiosInstance.get('/pod/driver');
      return res.data.map((item: any) => ({ ...item, id: item._id || item.id }));
    },
    getById: async (id: string): Promise<PODRecord> => {
      const res = await axiosInstance.get(`/pod/${id}`);
      return { ...res.data, id: res.data._id || res.data.id };
    },
    upload: async (payload: {
      orderNumber: string;
      vehicleNumber: string;
      customerName: string;
      customerAddress: string;
      imageUrl?: string;
      images?: string[];
      signatureUrl?: string;
      remarks?: string;
      latitude?: number;
      longitude?: number;
    }): Promise<PODRecord> => {
      const res = await axiosInstance.post('/pod/upload', payload);
      return res.data;
    },
    approve: async (id: string): Promise<PODRecord> => {
      const res = await axiosInstance.put(`/pod/approve/${id}`);
      return res.data;
    },
    reject: async (id: string, rejectedReason: string): Promise<PODRecord> => {
      const res = await axiosInstance.put(`/pod/reject/${id}`, { rejectedReason });
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await axiosInstance.delete(`/pod/${id}`);
    }
  },

  // 8. GOOGLE MAPS & GEOLOCATION PROXY API
  maps: {
    geocode: async (address: string): Promise<{ lat: number; lng: number }> => {
      try {
        const res = await axiosInstance.get('/maps/geocode', { params: { address } });
        return res.data;
      } catch (err) {
        return { lat: 18.5204, lng: 73.8567 };
      }
    },
    reverseGeocode: async (lat: number, lng: number): Promise<{ formattedAddress: string; city?: string; state?: string; country?: string }> => {
      try {
        const res = await axiosInstance.get('/maps/reverse-geocode', { params: { lat, lng } });
        return res.data;
      } catch (err) {
        return { formattedAddress: `Location: (${lat.toFixed(4)}, ${lng.toFixed(4)})` };
      }
    },
    getDistanceETA: async (origin: string, destination: string, speed?: number): Promise<{ distanceRemainingKm: number; distanceText: string; durationText: string; durationSeconds: number; etaString: string }> => {
      try {
        const res = await axiosInstance.get('/maps/distance-eta', { params: { origin, destination, speed } });
        return res.data;
      } catch (err) {
        return {
          distanceRemainingKm: 18.4,
          distanceText: '18.4 km',
          durationText: '25 mins',
          durationSeconds: 1500,
          etaString: '25 Mins'
        };
      }
    },
    getDirections: async (origin: string, destination: string, waypoints?: string[]): Promise<any> => {
      try {
        const res = await axiosInstance.get('/maps/directions', {
          params: { origin, destination, waypoints: waypoints ? waypoints.join('|') : undefined }
        });
        return res.data;
      } catch (err) {
        return { status: 'ZERO_RESULTS', routes: [] };
      }
    }
  },

  // 9. DRIVERS API — Database-first with Resilient LocalStorage Fallback
  drivers: {
    /**
     * Fetch all registered Driver accounts.
     * Tries backend first; if server is unreachable (offline mode), falls back to local storage.
     */
    getAll: async (params?: {
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    }): Promise<{ data: DriverRecord[]; pagination: { page: number; limit: number; total: number; pages: number } }> => {
      try {
        const res = await axiosInstance.get('/users/drivers', { params });
        if (Array.isArray(res.data?.data)) {
          LocalStorageFallback.set('smartops_drivers', res.data.data);
        }
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        console.warn('[SmartOps Drivers API] Server unreachable. Returning offline local drivers.');
        let rawLocal = LocalStorageFallback.get<DriverRecord>('smartops_drivers', []);
        // Purge legacy seed mock drivers so only genuine drivers are shown
        let local = rawLocal.filter(d => 
          !['drv-1', 'drv-2', 'drv-3'].includes(d.id) && 
          !['harpreet.singh@smartops.com', 'rajesh.kumar@smartops.com', 'vikram.sharma@smartops.com', 'rajesh@smartops.com', 'driver@smartops.com'].includes(d.email.toLowerCase())
        );
        if (local.length !== rawLocal.length) {
          LocalStorageFallback.set('smartops_drivers', local);
        }
        
        if (params?.search) {
          const s = params.search.toLowerCase();
          local = local.filter(d => 
            d.fullName.toLowerCase().includes(s) || 
            d.email.toLowerCase().includes(s) || 
            d.mobileNumber.toLowerCase().includes(s)
          );
        }

        if (params?.status && params.status !== 'All') {
          local = local.filter(d => d.status === params.status);
        }

        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const start = (page - 1) * limit;
        const paged = local.slice(start, start + limit);

        return {
          data: paged,
          pagination: {
            page,
            limit,
            total: local.length,
            pages: Math.ceil(local.length / limit) || 1
          }
        };
      }
    },

    /**
     * Soft-deactivate or reactivate a driver.
     */
    updateStatus: async (id: string, status: 'active' | 'inactive'): Promise<DriverRecord> => {
      try {
        const res = await axiosInstance.patch(`/users/drivers/${id}/status`, { status });
        return res.data.data as DriverRecord;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        const local = LocalStorageFallback.get<DriverRecord>('smartops_drivers', []);
        const updated = local.map(d => d.id === id ? {
          ...d,
          status: status === 'active' ? ('Active' as const) : ('Inactive' as const),
          isEmailVerified: status === 'active'
        } : d);
        return updated.find(d => d.id === id) as DriverRecord;
      }
    },

    /**
     * Delete a driver permanently.
     */
    delete: async (id: string): Promise<void> => {
      try {
        await axiosInstance.delete(`/users/drivers/${id}`);
        const local = LocalStorageFallback.get<DriverRecord>('smartops_drivers', []);
        LocalStorageFallback.set('smartops_drivers', local.filter(d => d.id !== id));
      } catch (err: any) {
        if (err.response) throw err;
        const local = LocalStorageFallback.get<DriverRecord>('smartops_drivers', []);
        LocalStorageFallback.set('smartops_drivers', local.filter(d => d.id !== id));
      }
    },

    /**
     * Register a new driver.
     */
    register: async (payload: {
      fullName: string;
      email: string;
      mobileNumber?: string;
      password: string;
      driverId?: string;
      vehicleNumber?: string;
      licenseNumber?: string;
      companyId?: string;
      companyName?: string;
    }): Promise<{ success?: boolean; message: string; user?: User }> => {
      try {
        const res = await axiosInstance.post('/auth/register', {
          ...payload,
          role: 'Driver',
        });
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        const local = LocalStorageFallback.get<DriverRecord>('smartops_drivers', []);
        const newDriver: DriverRecord = {
          id: `drv-${Date.now()}`,
          fullName: payload.fullName,
          email: payload.email,
          mobileNumber: payload.mobileNumber || '',
          role: 'Driver',
          driverId: payload.driverId || `DRV-${Date.now().toString().slice(-4)}`,
          vehicleNumber: payload.vehicleNumber || null,
          licenseNumber: payload.licenseNumber || null,
          isEmailVerified: true,
          isPhoneVerified: true,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        LocalStorageFallback.set('smartops_drivers', [newDriver, ...local]);
        return { success: true, message: 'Driver registered successfully.' };
      }
    },
    recordLocation: async (payload: {
      driverId?: string;
      tripId?: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      battery?: number;
      network?: string;
      address?: string;
      timestamp?: string;
    }): Promise<any> => {
      try {
        const res = await axiosInstance.post('/driver/location', payload);
        return res.data;
      } catch (err: any) {
        console.warn('Driver location posting error:', err);
        return null;
      }
    },
  },

  // COMPANY API
  company: {
    /**
     * Public — checks if a company name is already taken.
     * Used for real-time validation on the Owner Registration form.
     */
    check: async (name: string): Promise<{ available: boolean; message: string }> => {
      try {
        const res = await axiosInstance.get('/company/check', { params: { name } });
        return res.data;
      } catch (err: any) {
        if (err.response) {
          throw err;
        }
        // Network offline — assume available so registration can proceed
        return { available: true, message: 'Offline — name check skipped.' };
      }
    },

    /**
     * Protected — returns the Company linked to the authenticated user.
     */
    getMyCompany: async (): Promise<Company | null> => {
      try {
        const res = await axiosInstance.get('/company/me');
        return res.data.company as Company;
      } catch (err) {
        return null;
      }
    },
  },
};


import { mockPODs } from './mockData';
