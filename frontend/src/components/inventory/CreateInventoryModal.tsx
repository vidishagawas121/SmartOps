import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { InventoryItem } from '../../types';
import { ArrowRight, ArrowLeft, Check, Sparkles, Package, ShieldAlert, Calendar, Layers } from 'lucide-react';

interface CreateInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<InventoryItem, 'id'>, requestCompleteDetails?: boolean) => Promise<void>;
}

const generateRandomSKU = () => {
  const time = Date.now().toString().slice(-4);
  const rand = Math.floor(100 + Math.random() * 900);
  return `SKU-${time}${rand}`;
};

export const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const itemNameInputRef = useRef<HTMLInputElement>(null);

  // Form State with Smart Defaults
  const [form, setForm] = useState({
    // Basic Info (Step 1)
    itemName: '',
    sku: '',
    category: 'Raw Materials',
    unit: 'Pieces',
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    status: 'Active',

    // Advanced Info (Step 2 - Optional)
    reservedStock: 0,
    minimumQuantity: 0,
    maximumStockLevel: 1000,
    storageLocation: 'Warehouse Floor',
    supplier: 'General Supplier',
    warehouse: 'Default Warehouse',
    manufacturingDate: '',
    expiryDate: '',
    lastRestockedDate: '',
    description: '',
  });

  // Reset form and step on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setForm({
        itemName: '',
        sku: generateRandomSKU(),
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
        supplier: 'General Supplier',
        warehouse: 'Default Warehouse',
        manufacturingDate: '',
        expiryDate: '',
        lastRestockedDate: '',
        description: '',
      });

      // Auto-focus on Item Name field
      setTimeout(() => {
        itemNameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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

  // Keyboard navigation: Enter key moves focus to next input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const formElements = Array.from(
        e.currentTarget.form?.querySelectorAll('input, select, textarea, button') || []
      ) as HTMLElement[];

      const index = formElements.indexOf(e.currentTarget);
      if (index > -1 && index < formElements.length - 1) {
        const nextElement = formElements[index + 1];
        nextElement.focus();
      }
    }
  };

  const handleRegenerateSKU = (e: React.MouseEvent) => {
    e.preventDefault();
    setForm(prev => ({ ...prev, sku: generateRandomSKU() }));
  };

  const handleSubmit = async (e: React.FormEvent, openMoreDetails = false) => {
    e.preventDefault();
    if (!form.itemName.trim()) return;

    try {
      await onSubmit(form, openMoreDetails);
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
      title="Add New Inventory Item"
      size="inventory"
      headerRight={
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
          <div
            className={`h-2 w-2 rounded-full ${
              step === 1 ? 'bg-[#006A6A] animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Step {step} of 2
          </span>
        </div>
      }
    >
      <form onSubmit={e => handleSubmit(e)} className="space-y-5 text-left">
        {/* Step Progress Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              step === 1
                ? 'bg-[#006A6A]/10 text-[#006A6A] border border-[#006A6A]/30 dark:bg-[#006A6A]/20 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-[#006A6A] text-white flex items-center justify-center text-[11px] font-bold">
              1
            </span>
            Basic Information <span className="text-red-500 font-extrabold">*</span>
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              step === 2
                ? 'bg-[#006A6A]/10 text-[#006A6A] border border-[#006A6A]/30 dark:bg-[#006A6A]/20 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-[11px] font-bold">
              2
            </span>
            Additional Details <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </button>
        </div>

        {/* STEP 1: BASIC INFORMATION */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#006A6A] shrink-0" />
              <span>
                Fill essential details below to create item in <strong>under 20 seconds</strong>.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Item Name */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  Item Name <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  ref={itemNameInputRef}
                  type="text"
                  required
                  name="itemName"
                  placeholder="e.g. Industrial Steel Sheet (Grade 304)"
                  value={form.itemName}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              {/* SKU Code */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  SKU Code <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  readOnly
                  name="sku"
                  value={form.sku}
                  tabIndex={-1}
                  className="w-full px-4 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-mono font-extrabold rounded-xl focus:outline-none cursor-not-allowed select-none shadow-xs"
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  Category <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  required
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3.5 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  Unit <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  required
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3.5 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                  {unitOptions.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Stock */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
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
                  onKeyDown={handleKeyDown}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              {/* Purchase Price */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
                  onKeyDown={handleKeyDown}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
                  onKeyDown={handleKeyDown}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3.5 h-11 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ADVANCED DETAILS (OPTIONAL) */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            {/* Warehouse & Supplier */}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Stock Limits & Controls */}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
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
                    onKeyDown={handleKeyDown}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full px-3 h-9 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
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
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2 text-xs rounded-xl">
            Cancel
          </Button>

          <div className="flex items-center gap-2.5">
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5"
                >
                  Step 2: Additional Details <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 bg-[#006A6A] hover:bg-[#005555]"
                >
                  <Check className="h-4 w-4" /> Create Item
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Basic Info
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 bg-[#006A6A] hover:bg-[#005555]"
                >
                  <Check className="h-4 w-4" /> Create Item
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
