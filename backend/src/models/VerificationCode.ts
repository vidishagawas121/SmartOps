import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
  identifier: string; // normalized email address or mobile number
  channel: 'email' | 'mobile';
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  verifiedAt?: Date;
  resendAvailableAt?: Date;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>({
  identifier: { type: String, required: true, index: true },
  channel: { type: String, enum: ['email', 'mobile'], required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL auto-cleanup
  verifiedAt: { type: Date },
  resendAvailableAt: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
