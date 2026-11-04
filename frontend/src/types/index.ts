export type UserRole = 'Owner' | 'Supervisor' | 'Driver' | 'Worker';

export interface User {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  companyId?: string;
  companyName?: string;
  driverId?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  avatarUrl?: string;
}

export interface Company {
  id?: string;
  companyId: string;
  companyName: string;
  companyType: 'Logistics' | 'Manufacturing' | 'Warehouse' | 'Transport' | 'Other';
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  gstNumber?: string;
  logo?: string;
  createdBy?: string;
  createdAt?: string;
}

/**
 * DriverRecord — shape returned by GET /api/users/drivers.
 * Mirrors the backend DTO (no sensitive fields).
 */
export interface DriverRecord {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  role: 'Driver';
  driverId: string | null;
  vehicleNumber: string | null;
  licenseNumber: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  /** Derived by backend: 'Active' when isEmailVerified=true, 'Inactive' otherwise */
  status: 'Active' | 'Inactive';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  driver: string;
  rcNumber: string;
  insurance: string; // Expiry Date
  permit: string; // Expiry Date
  fitness: string; // Expiry Date
  fuelType: string;
  mileage: number;
  currentLocation: string;
  status: 'Moving' | 'Idle' | 'Maintenance' | 'Delayed';
  // UI Compatibility fields
  fuelLevel?: number;
  odometer?: number;
  health?: 'Excellent' | 'Good' | 'Needs Service' | 'Critical';
  rcExpiry?: string;
  permitExpiry?: string;
  fitnessExpiry?: string;
  insuranceExpiry?: string;
}

export interface TripStop {
  id?: string;
  _id?: string;
  sequence: number;
  address: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'Arrived' | 'Completed' | 'Skipped';
  arrivedAt?: string;
  completedAt?: string;
  stopReason?: string;
  podId?: string;
  notes?: string;
}

export interface Trip {
  id: string;
  tripNumber: string;
  vehicleNumber: string;
  vehicleId?: string;
  driverId: string;
  driverName: string;
  pickupLocation: string;
  dropLocation: string;
  customerName: string;
  customerPhone: string;
  material: string;
  weight: string;
  invoiceNumber: string;
  priority?: 'Normal' | 'High' | 'Urgent';
  cargo?: {
    description?: string;
    quantity?: number;
    weight?: string;
  };
  stops?: TripStop[];
  scheduledStart?: string;
  expectedEnd?: string;
  notes?: string;
  status: 'Draft' | 'Assigned' | 'Accepted' | 'Started' | 'On Route' | 'Reached Pickup' | 'Loaded' | 'In Transit' | 'At Stop' | 'Near Destination' | 'Reached Destination' | 'Delivered' | 'POD Uploaded' | 'Completed' | 'Cancelled' | 'Delayed' | 'Incident Reported';
  eta: string;
  distanceRemaining: number;
  stopReason?: string;
  deliveryPhoto?: string[];
  signatureData?: string;
  timestamp: string;
  startedAt?: string;
  completedAt?: string;
  // Google Maps Telemetry Fields
  currentLocation?: string;
  currentAddress?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  lastGpsUpdate?: string;
  gpsFreshnessStatus?: 'LIVE' | 'STALE' | 'OFFLINE';
  gpsFreshnessMinutesAgo?: number;
  pickupCoordinates?: { lat: number; lng: number };
  dropCoordinates?: { lat: number; lng: number };
  locationHistory?: Array<{ lat: number; lng: number; timestamp: string; address?: string; speed?: number; heading?: number; accuracy?: number }>;
}


export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  deadline: string;
  progress: number;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  sku: string;
  quantity: number;
  minimumQuantity: number;
  warehouse: string;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  expiryDate?: string;
  description?: string;
  // Extra enterprise fields
  unit?: string;
  storageLocation?: string;
  reservedStock?: number;
  availableStock?: number;
  maximumStockLevel?: number;
  manufacturingDate?: string;
  lastRestockedDate?: string;
  remarks?: string;
  status?: string;
  // UI Compatibility fields
  batchNumber?: string;
  name?: string;
  type?: 'Raw Material' | 'Finished Goods' | 'Packaging';
}

export interface BreakItem {
  type: string;
  breakStart: string;
  breakEnd?: string;
  gps?: string;
  remarks?: string;
  duration?: number;
}

export interface TimelineItem {
  time: string;
  event: string;
  description?: string;
  gps?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  driverName?: string;
  driverId?: string;
  checkIn: string;
  checkOut?: string;
  checkInGPS?: string;
  checkOutGPS?: string;
  checkInWarehouse?: string;
  checkInDeviceInfo?: string;
  checkInInternetStatus?: string;
  workingHours?: number;
  breakDuration?: number;
  tripsCompleted?: number;
  distanceCovered?: number;
  fuelUsed?: number;
  overtime?: number;
  attendanceStatus?: 'Present' | 'Late' | 'Absent' | 'On Leave';
  currentStatus?: 'On Duty' | 'On Trip' | 'On Break' | 'Off Duty' | 'Emergency';
  performanceScore?: number;
  breaks?: BreakItem[];
  timeline?: TimelineItem[];
  status: 'Present' | 'Late' | 'Absent'; // Keep for backwards compatibility
  date: string;
  remarks?: string;
  attendanceId?: string;
  vehicleNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  // UI Compatibility fields
  workerName?: string;
  avatar?: string;
  role?: string;
}

export interface PayrollRecord {
  id: string;
  employee: string;
  basicSalary: number;
  overtime: number;
  bonus: number;
  allowance: number;
  deduction: number;
  tax: number;
  finalSalary: number;
  paymentStatus: 'Pending' | 'Paid' | 'Approved';
  paymentDate?: string;
  // UI Compatibility fields
  netPay?: number;
  employeeName?: string;
  month?: string;
  avatar?: string;
  status?: string;
}

export interface SystemNotification {
  id: string;
  type: 'Low Stock' | 'Task Assigned' | 'Trip Started' | 'Salary Pending' | 'Document Expiry' | 'Vehicle Alert' | 'System Alert' | 'Critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'Info' | 'Warning' | 'Error';
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  category: 'attendance' | 'task' | 'inventory' | 'fleet' | 'payroll' | 'gate';
}

export interface PODRecord {
  id: string;
  podId: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  imageUrl: string;
  images?: string[];
  signatureUrl?: string;
  remarks?: string;
  latitude?: number;
  longitude?: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}
