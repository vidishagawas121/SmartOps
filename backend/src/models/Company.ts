import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import { getNextSequenceValue } from './Counter';

export interface ICompany extends Document {
  companyId: string;
  companyName: string;
  companyType: 'Logistics' | 'Manufacturing' | 'Warehouse' | 'Transport' | 'Other';
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  gstNumber?: string;
  logo?: string;
  createdBy: string; // userId of the Owner who registered this company
  createdAt: Date;
  updatedAt: Date;
}


/**
 * Generates a unique company ID in the format CMP-100001
 */
export const generateCompanyId = async (): Promise<string> => {
  const seq = await getNextSequenceValue('company_id_seq');
  return `CMP-${100000 + seq}`;
};

const CompanySchema = new Schema<ICompany>(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
      index: true,
    },
    companyType: {
      type: String,
      enum: ['Logistics', 'Manufacturing', 'Warehouse', 'Transport', 'Other'],
      required: true,
    },
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    companyPhone: {
      type: String,
      trim: true,
    },
    companyAddress: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICompany>('Company', CompanySchema);
