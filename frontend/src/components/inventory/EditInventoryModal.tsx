import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InventoryItem } from '../../types';
import { Save, Package, ShieldAlert, Calendar, Layers } from 'lucide-react';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSubmit: (id: string, item: Partial<InventoryItem>) => Promise<void>;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    itemName: '',
    sku: '',
    category: 'Raw Materials',
    unit: 'Pieces',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    status: 'Active',
    reservedStock: 0,
    minimumQuantity: 0,
    maximumStockLevel: 1000,
    storageLocation: 'Warehouse Floor',
    supplier: '',
    warehouse: 'Default Warehouse',
    manufacturingDate: '',
    expiryDate: '',
    lastRestockedDate: '',
    description: '',
  });

  useEffect(() => {
    if (item && isOpen) {
      setForm({
        itemName: item.itemName || '',
        sku: item.sku || '',
        category: item.category || 'Raw Materials',
        unit: item.unit || 'Pieces',
        quantity: item.quantity ?? 0,
        purchasePrice: item.purchasePrice ?? 0,
        sellingPrice: item.sellingPrice ?? 0,
        status: item.status || 'Active',
        reservedStock: item.reservedStock ?? 0,
        minimumQuantity: item.minimumQuantity ?? 0,
        maximumStockLevel: item.maximumStockLevel ?? 1000,
        storageLocation: item.storageLocation || 'Warehouse Floor',
        supplier: item.supplier || '',
        warehouse: item.warehouse || 'Default Warehouse',
        manufacturingDate: item.manufacturingDate || '',
        expiryDate: item.expiryDate || '',
        lastRestockedDate: item.lastRestockedDate || '',
        description: item.description || '',
      });
    }
  }, [item, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: [
        'quantity',
        'purchasePrice',
        'sellingPrice',
        'reservedStock',
        'minimumQuantity',
        'maximumStockLevel',
      ].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    try {
      await onSubmit(item.id, form);
      onClose();
    } catch (err) {
      // Keep modal open on failure
    }
  };

  const categoryOptions = [
    'Raw Materials',
    'Assemblies',
    'Electronics',
    'Packaging',
    'Lubricants',
    'Finished Goods',
    'Tools & Equipment',
  ];

  const unitOptions = ['Pieces', 'Kg', 'Grams', 'Litre', 'Meters', 'Boxes', 'Packs', 'Rolls'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit Inventory Item — ${item.sku}` : 'Edit Inventory Item'}
      size="inventory"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-left">
        {/* Section 1: Basic Information */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#006A6A] dark:text-teal-400 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5" /> Basic Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Item Name <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                name="itemName"
                placeholder="e.g. Industrial Steel Sheet (Grade 304)"
                value={form.itemName}
                onChange={handleChange}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>SKU Code <span className="text-red-500 font-bold">*</span></span>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Fixed Identifier</span>
              </label>
              <input
                type="text"
                required
                readOnly
                name="sku"
                value={form.sku}
                tabIndex={-1}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-mono font-extrabold rounded-lg focus:outline-none cursor-not-allowed select-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Category <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                required
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-2.5 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none cursor-pointer"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Unit <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                required
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full px-2.5 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none cursor-pointer"
              >
                {unitOptions.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Current Stock <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                name="quantity"
                placeholder="e.g. 450"
                value={form.quantity || ''}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Purchase Price (INR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="purchasePrice"
                placeholder="e.g. 1200.00"
                value={form.purchasePrice || ''}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Selling Price (INR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="sellingPrice"
                placeholder="e.g. 1850.00"
                value={form.sellingPrice || ''}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-2.5 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Storage & Supplier */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#006A6A] dark:text-teal-400 uppercase tracking-wider">
            <Package className="h-3.5 w-3.5" /> Storage & Supplier
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Warehouse</label>
              <input
                type="text"
                name="warehouse"
                placeholder="e.g. Main Warehouse A"
                value={form.warehouse}
                onChange={handleChange}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Storage Location</label>
              <input
                type="text"
                name="storageLocation"
                placeholder="e.g. Shelf A-4, Rack 2"
                value={form.storageLocation}
                onChange={handleChange}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Supplier</label>
              <input
                type="text"
                name="supplier"
                placeholder="e.g. Apex Steel Corp Ltd"
                value={form.supplier}
                onChange={handleChange}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Stock Limits */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#006A6A] dark:text-teal-400 uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" /> Stock Limits & Thresholds
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Reserved Stock</label>
              <input
                type="number"
                min="0"
                name="reservedStock"
                placeholder="e.g. 25"
                value={form.reservedStock || ''}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Minimum Level</label>
              <input
                type="number"
                min="0"
                name="minimumQuantity"
                placeholder="e.g. 50"
                value={form.minimumQuantity || ''}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Maximum Level</label>
              <input
                type="number"
                min="0"
                name="maximumStockLevel"
                placeholder="e.g. 1000"
                value={form.maximumStockLevel || ''}
                onChange={handleChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Batches & Dates */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#006A6A] dark:text-teal-400 uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5" /> Dates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Mfg Date</label>
              <input
                type="date"
                name="manufacturingDate"
                value={form.manufacturingDate}
                onChange={handleChange}
                className="w-full px-2 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                className="w-full px-2 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Last Restocked</label>
              <input
                type="date"
                name="lastRestockedDate"
                value={form.lastRestockedDate}
                onChange={handleChange}
                className="w-full px-2 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Remarks / Description */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Remarks / Description</label>
          <textarea
            name="description"
            rows={2}
            placeholder="e.g. High-grade cold-rolled industrial sheet metal used for chassis fabrication."
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2 text-xs rounded-xl">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-5 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 bg-[#006A6A] hover:bg-[#005555]"
          >
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
