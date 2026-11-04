import mongoose, { Schema, Document } from 'mongoose';

export interface IPOD extends Document {
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
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  // Multi-tenant isolation
  companyId?: string;
  ownerId?: string;
}

const PODSchema = new Schema<IPOD>({
  podId: { type: String, required: true, unique: true, index: true },
  driverId: { type: String, required: true, index: true },
  driverName: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  orderNumber: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  customerAddress: { type: String, required: true },
  imageUrl: { type: String, required: true },
  images: [{ type: String }],
  signatureUrl: { type: String },
  remarks: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  rejectedReason: { type: String },
  // Multi-tenant isolation
  companyId: { type: String, index: true, sparse: true },
  ownerId: { type: String, index: true, sparse: true }
}, {
  timestamps: true
});

export default mongoose.model<IPOD>('POD', PODSchema);
