import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId | string;
  quantity: number;
  reservedStock?: number;
  warehouse: string;
  storageLocation?: string;
  supplier: string;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  lastRestockedDate?: string;
  remarks?: string;
  status?: string; // Active/Inactive
  // Multi-tenant isolation
  companyId?: string;
  ownerId?: string;

  // Legacy fields (optional for backward compatibility/migrations)
  itemName?: string;
  category?: string;
  sku?: string;
  minimumQuantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventorySchema = new Schema<IInventory>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, default: 0 },
  warehouse: { type: String, default: 'Primary Warehouse' },
  storageLocation: { type: String, default: 'Warehouse Floor' },
  supplier: { type: String, default: 'General Supplier' },
  batchNumber: { type: String },
  expiryDate: { type: String },
  manufacturingDate: { type: String },
  lastRestockedDate: { type: String },
  remarks: { type: String },
  status: { type: String, default: 'Active' },
  // Multi-tenant isolation
  companyId: { type: String, index: true, sparse: true },
  ownerId: { type: String, index: true, sparse: true },

  // Legacy fields stored on document for fallback
  itemName: { type: String },
  category: { type: String },
  sku: { type: String },
  minimumQuantity: { type: Number },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number },
  description: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IInventory>('Inventory', InventorySchema);

