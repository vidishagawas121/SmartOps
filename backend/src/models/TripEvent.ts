import mongoose, { Schema, Document } from 'mongoose';

export interface ITripEvent extends Document {
  tripId: string;
  driverId: string;
  companyId?: string;
  eventType: 'trip-started' | 'location-update' | 'checkpoint-reached' | 'pod-uploaded' | 'trip-completed' | 'incident-reported' | 'delay-reported';
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  payload?: any;
  timestamp: Date;
}

const TripEventSchema = new Schema<ITripEvent>({
  tripId: { type: String, required: true, index: true },
  driverId: { type: String, required: true, index: true },
  companyId: { type: String, index: true, sparse: true },
  eventType: {
    type: String,
    enum: ['trip-started', 'location-update', 'checkpoint-reached', 'pod-uploaded', 'trip-completed', 'incident-reported', 'delay-reported'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  address: { type: String },
  payload: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

TripEventSchema.index({ tripId: 1, timestamp: -1 });

export default (mongoose.models.TripEvent as mongoose.Model<ITripEvent>) || mongoose.model<ITripEvent>('TripEvent', TripEventSchema);
