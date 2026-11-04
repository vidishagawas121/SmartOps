import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  vehicleNumber: string;
  vehicleType: string;
  driver: string;
  rcNumber: string;
  insurance: string;
  permit: string;
  fitness: string;
  fuelType: string;
  mileage: number;
  currentLocation: string;
  status: 'Moving' | 'Idle' | 'Maintenance' | 'Delayed';
  // Multi-tenant isolation
  companyId?: string;
  ownerId?: string;
}

const VehicleSchema = new Schema<IVehicle>({
  vehicleNumber: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  driver: { type: String, required: true },
  rcNumber: { type: String, required: true },
  insurance: { type: String, required: true },
  permit: { type: String, required: true },
  fitness: { type: String, required: true },
  fuelType: { type: String, required: true },
  mileage: { type: Number, required: true },
  currentLocation: { type: String, required: true },
  status: { type: String, enum: ['Moving', 'Idle', 'Maintenance', 'Delayed'], default: 'Idle' },
  // Multi-tenant isolation
  companyId: { type: String, index: true, sparse: true },
  ownerId: { type: String, index: true, sparse: true },
}, {
  timestamps: true
});

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
