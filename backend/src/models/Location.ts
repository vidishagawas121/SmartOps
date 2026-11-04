import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  driverId: string;
  tripId?: string;
  companyId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery?: number;
  network?: string;
  address?: string;
  createdAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    driverId: {
      type: String,
      required: true,
      index: true
    },
    tripId: {
      type: String,
      index: true,
      default: null
    },
    companyId: {
      type: String,
      index: true,
      sparse: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      default: 0
    },
    speed: {
      type: Number,
      default: 0
    },
    heading: {
      type: Number,
      default: 0
    },
    battery: {
      type: Number,
      default: 100
    },
    network: {
      type: String,
      default: '4G'
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

// Compound Index for fast range & history queries
LocationSchema.index({ driverId: 1, createdAt: -1 });
LocationSchema.index({ tripId: 1, createdAt: -1 });
LocationSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model<ILocation>('Location', LocationSchema);
