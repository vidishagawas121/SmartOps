import mongoose, { Schema, Document } from 'mongoose';

export interface ITripStop {
  _id?: string;
  sequence: number;
  address: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'Arrived' | 'Completed' | 'Skipped';
  arrivedAt?: Date;
  completedAt?: Date;
  stopReason?: string;
  podId?: string;
  notes?: string;
}

export interface ILocationPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  address?: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface ITrip extends Document {
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
  priority: 'Normal' | 'High' | 'Urgent';
  cargo?: {
    description?: string;
    quantity?: number;
    weight?: string;
  };
  stops: ITripStop[];
  scheduledStart?: Date;
  expectedEnd?: Date;
  notes?: string;
  status: 'Draft' | 'Assigned' | 'Accepted' | 'Started' | 'On Route' | 'Reached Pickup' | 'Loaded' | 'In Transit' | 'At Stop' | 'Near Destination' | 'Reached Destination' | 'Delivered' | 'POD Uploaded' | 'Completed' | 'Cancelled' | 'Delayed' | 'Incident Reported';
  eta: string;
  distanceRemaining: number;
  stopReason?: string;
  deliveryPhoto?: string[];
  signatureData?: string;
  timestamp: Date;
  startedAt?: Date;
  completedAt?: Date;
  // Google Maps & GPS Telemetry Fields
  currentLocation?: string;
  currentAddress?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  lastGpsUpdate?: Date;
  pickupCoordinates?: { lat: number; lng: number };
  dropCoordinates?: { lat: number; lng: number };
  locationHistory?: ILocationPoint[];
  // Multi-tenant isolation
  companyId?: string;
  ownerId?: string;
}

const TripStopSchema = new Schema<ITripStop>({
  sequence: { type: Number, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Arrived', 'Completed', 'Skipped'],
    default: 'Pending'
  },
  arrivedAt: { type: Date },
  completedAt: { type: Date },
  stopReason: { type: String },
  podId: { type: String },
  notes: { type: String }
});

const TripSchema = new Schema<ITrip>({
  tripNumber: { type: String, required: true, unique: true },
  vehicleNumber: { type: String, required: true },
  vehicleId: { type: String },
  driverId: { type: String, required: true },
  driverName: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  dropLocation: { type: String, required: true },
  customerName: { type: String, default: 'Logistics Client' },
  customerPhone: { type: String, default: '9876543210' },
  material: { type: String, default: 'General Freight' },
  weight: { type: String, default: '1.5 Tons' },
  invoiceNumber: { type: String, default: 'INV-AUTOMATED' },
  priority: {
    type: String,
    enum: ['Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  cargo: {
    description: { type: String },
    quantity: { type: Number },
    weight: { type: String }
  },
  stops: [TripStopSchema],
  scheduledStart: { type: Date },
  expectedEnd: { type: Date },
  notes: { type: String },
  status: {
    type: String,
    enum: ['Draft', 'Assigned', 'Accepted', 'Started', 'On Route', 'Reached Pickup', 'Loaded', 'In Transit', 'At Stop', 'Near Destination', 'Reached Destination', 'Delivered', 'POD Uploaded', 'Completed', 'Cancelled', 'Delayed', 'Incident Reported'],
    default: 'Assigned'
  },
  eta: { type: String, default: '30 Mins' },
  distanceRemaining: { type: Number, default: 15.0 },
  stopReason: { type: String },
  deliveryPhoto: [{ type: String }],
  signatureData: { type: String },
  timestamp: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  // Telemetry & GPS fields
  currentLocation: { type: String },
  currentAddress: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  accuracy: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  lastGpsUpdate: { type: Date },
  pickupCoordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  dropCoordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  locationHistory: [
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      address: { type: String },
      speed: { type: Number },
      heading: { type: Number },
      accuracy: { type: Number }
    }
  ],
  // Multi-tenant isolation
  companyId: { type: String, index: true, sparse: true },
  ownerId: { type: String, index: true, sparse: true },
}, {
  timestamps: true
});

export default mongoose.model<ITrip>('Trip', TripSchema);
