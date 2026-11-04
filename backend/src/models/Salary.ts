import mongoose, { Schema, Document } from 'mongoose';

export interface ISalary extends Document {
  employee: string;
  basicSalary: number;
  overtime: number;
  bonus: number;
  allowance: number;
  deduction: number;
  tax: number;
  finalSalary: number;
  paymentStatus: 'Pending' | 'Paid';
  paymentDate?: string;
  // Multi-tenant isolation
  companyId?: string;
  ownerId?: string;
}

const SalarySchema = new Schema<ISalary>({
  employee: { type: String, required: true },
  basicSalary: { type: Number, required: true },
  overtime: { type: Number, required: true, default: 0 },
  bonus: { type: Number, required: true, default: 0 },
  allowance: { type: Number, required: true, default: 0 },
  deduction: { type: Number, required: true, default: 0 },
  tax: { type: Number, required: true, default: 0 },
  finalSalary: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
  paymentDate: { type: String },
  // Multi-tenant isolation
  companyId: { type: String, index: true, sparse: true },
  ownerId: { type: String, index: true, sparse: true },
}, {
  timestamps: true
});

export default mongoose.model<ISalary>('Salary', SalarySchema);
