import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  productName: string;
  sku: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  reorderLevel?: number;
  status?: string; // Active/Inactive
  companyId?: string;
  ownerId?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>({
  productName: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },
  brand: { type: String },
  unit: { type: String, default: 'Pieces' },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  minimumStockLevel: { type: Number, default: 0 },
  maximumStockLevel: { type: Number, default: 1000 },
  reorderLevel: { type: Number, default: 10 },
  status: { type: String, default: 'Active' },
  companyId: { type: String, index: true },
  ownerId: { type: String, index: true },
  createdBy: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IProduct>('Product', ProductSchema);
