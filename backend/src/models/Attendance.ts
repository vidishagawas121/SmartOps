import mongoose, { Schema, Document } from 'mongoose';

export interface IBreak extends Document {
  type: string;
  breakStart: string;
  breakEnd?: string;
  gps?: string;
  remarks?: string;
  duration?: number;
}

export interface ITimeline extends Document {
  time: string;
  event: string;
  description?: string;
  gps?: string;
}

export interface IAttendance extends Document {
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
  breaks: IBreak[];
  timeline: ITimeline[];
  status: 'Present' | 'Late' | 'Absent'; // Backwards compatibility
  date: string;
  remarks?: string;
  attendanceId?: string;
  vehicleNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  // Multi-tenant isolation
  companyId?: string;
  ownerId?: string;
}

const BreakSchema = new Schema<IBreak>({
  type: { type: String, required: true },
  breakStart: { type: String, required: true },
  breakEnd: { type: String },
  gps: { type: String },
  remarks: { type: String },
  duration: { type: Number }
});

const TimelineSchema = new Schema<ITimeline>({
  time: { type: String, required: true },
  event: { type: String, required: true },
  description: { type: String },
  gps: { type: String }
});

const AttendanceSchema = new Schema<IAttendance>({
  employeeName: { type: String, required: true },
  driverName: { type: String },
  driverId: { type: String },
  checkIn: { type: String, required: true },
  checkOut: { type: String },
  checkInGPS: { type: String },
  checkOutGPS: { type: String },
  checkInWarehouse: { type: String },
  checkInDeviceInfo: { type: String },
  checkInInternetStatus: { type: String },
  workingHours: { type: Number, default: 0 },
  breakDuration: { type: Number, default: 0 },
  tripsCompleted: { type: Number, default: 0 },
  distanceCovered: { type: Number, default: 0 },
  fuelUsed: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  attendanceStatus: { type: String, enum: ['Present', 'Late', 'Absent', 'On Leave'], default: 'Present' },
  currentStatus: { type: String, enum: ['On Duty', 'On Trip', 'On Break', 'Off Duty', 'Emergency'], default: 'Off Duty' },
  performanceScore: { type: Number, default: 100 },
  breaks: [BreakSchema],
  timeline: [TimelineSchema],
  status: { type: String, enum: ['Present', 'Late', 'Absent'], required: true }, // Backwards compatibility
  date: { type: String, required: true },
  remarks: { type: String },
  attendanceId: { type: String },
  vehicleNumber: { type: String },
  checkInTime: { type: String },
  checkOutTime: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  address: { type: String },
  // Multi-tenant isolation
  companyId: { type: String, index: true, sparse: true },
  ownerId: { type: String, index: true, sparse: true }
}, {
  timestamps: true
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
