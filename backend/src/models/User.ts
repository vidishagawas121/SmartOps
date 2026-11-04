import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  fullName: string;
  name?: string;
  username?: string;
  email: string;
  mobileNumber?: string;
  role: 'Owner' | 'Supervisor' | 'Driver' | 'Worker' | 'Manager' | 'Admin';
  passwordHash?: string;
  password?: string;
  googleId?: string;
  provider?: 'local' | 'google';
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  verifiedAt?: Date;
  securityQuestion?: string;
  securityAnswerHash?: string;
  // Company Reference — root entity for data isolation
  companyId?: string;
  // Owner Fields
  companyName?: string;
  // Supervisor & Worker Fields
  employeeId?: string;
  branch?: string;
  unit?: string;
  department?: string;
  worker?: any;
  // Driver Fields
  driverId?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  avatarUrl?: string;
  status?: string;
  currentTrip?: string;
  isAvailable?: boolean;
  currentLocation?: string;
  lastGpsUpdate?: Date;
  battery?: number;
  network?: string;
  // Live & Persistent Location Tracking Fields
  isOnline?: boolean;
  latitude?: number;
  longitude?: number;
  address?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
  lastUpdated?: Date;
  lastSeen?: Date;
  loginTime?: Date;
  logoutTime?: Date;
  comparePassword: (password: string) => Promise<boolean>;
  compareSecurityAnswer: (answer: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  fullName: { type: String, required: true },
  name: { type: String },
  username: { type: String, sparse: true },
  email: { type: String, required: true, unique: true, index: true },
  mobileNumber: { type: String, required: false },
  role: { type: String, enum: ['Owner', 'Supervisor', 'Driver', 'Worker', 'Manager', 'Admin'], required: true },
  passwordHash: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  verifiedAt: { type: Date },
  securityQuestion: { type: String },
  securityAnswerHash: { type: String },
  companyId: { type: String, index: true, sparse: true },
  companyName: { type: String },
  employeeId: { type: String, sparse: true },
  branch: { type: String, default: 'Pune Main Branch' },
  unit: { type: String, default: 'Pune Unit-A12' },
  department: { type: String, default: 'General' },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker' },
  driverId: { type: String, unique: true, sparse: true },
  vehicleNumber: { type: String },
  licenseNumber: { type: String },
  avatarUrl: { type: String },
  status: { type: String, default: 'Active' },
  currentTrip: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  currentLocation: { type: String, default: '' },
  lastGpsUpdate: { type: Date },
  battery: { type: Number },
  network: { type: String },
  // Live & Persistent Location Tracking Fields
  isOnline: { type: Boolean, default: false },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  address: { type: String, default: '' },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  lastUpdated: { type: Date },
  lastSeen: { type: Date },
  loginTime: { type: Date },
  logoutTime: { type: Date }
}, {
  timestamps: true
});

// Password verification method
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  const hash = this.passwordHash || (this as any).password;
  if (!hash) return false;
  return bcrypt.compare(password, hash);
};

// Security answer verification method
UserSchema.methods.compareSecurityAnswer = async function(answer: string): Promise<boolean> {
  if (!this.securityAnswerHash) return false;
  return bcrypt.compare(answer.trim().toLowerCase(), this.securityAnswerHash);
};

export default mongoose.model<IUser>('User', UserSchema);
