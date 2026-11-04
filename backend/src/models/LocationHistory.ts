import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationHistory extends Document {
  tripId: string;
  driverId: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  address?: string;
  timestamp: Date;
  serverReceivedAt: Date;
}

const LocationHistorySchema = new Schema<ILocationHistory>({
  tripId: { type: String, required: true, index: true },
  driverId: { type: String, required: true, index: true },
  vehicleId: { type: String, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  speed: { type: Number },
  heading: { type: Number },
  address: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  serverReceivedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

LocationHistorySchema.index({ tripId: 1, timestamp: -1 });
LocationHistorySchema.index({ driverId: 1, timestamp: -1 });

export default mongoose.model<ILocationHistory>('LocationHistory', LocationHistorySchema);
