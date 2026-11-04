import React, { useState } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Table } from '../../components/tables/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AlertCircle, PackageCheck, AlertOctagon, Edit2, Trash2, Plus, FileSpreadsheet } from 'lucide-react';
import { InventoryItem } from '../../types';
import { downloadInventoryExcel } from '../../utils/downloadInventoryReport';
import { CreateInventoryModal } from '../../components/inventory/CreateInventoryModal';
import { EditInventoryModal } from '../../components/inventory/EditInventoryModal';
import { Toast, ToastMessage } from '../../components/ui/Toast';

export const Inventory: React.FC = () => {
  const { inventory, createInventory, updateInventory, deleteInventory } = useOperations();
  const [filterType, setFilterType] = useState<'All' | 'Low Stock' | 'Out Of Stock'>('All');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Toast state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const handleCreateSubmit = async (itemData: Omit<InventoryItem, 'id'>, openMoreDetails = false) => {
    try {
      // createInventory now returns the real DB item with MongoDB _id
      const createdItem = await createInventory(itemData);

      setToast({
        id: `toast-${Date.now()}`,
        title: 'Inventory Item Created Successfully',
        message: `${createdItem.itemName} (${createdItem.sku}) saved to stock.`,
        actionLabel: 'Complete More Details',
        onAction: () => {
          setSelectedItem(createdItem);
          setEditModalOpen(true);
        },
      });

      if (openMoreDetails) {
        setSelectedItem(createdItem);
        setEditModalOpen(true);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save inventory item.';
      console.error('[Inventory] createInventory failed:', msg);
      setToast({
        id: `toast-err-${Date.now()}`,
        title: 'Failed to Add Item',
        message: msg,
      });
      throw err;
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      await updateInventory(id, itemData);
      setToast({
        id: `toast-${Date.now()}`,
        title: 'Inventory Item Updated',
        message: 'Stock details modified successfully.',
      });
    } catch (err: any) {
      console.error('Failed to update inventory item:', err);
      setToast({
        id: `toast-${Date.now()}`,
        title: 'Failed to Update',
        message: err?.response?.data?.message || err.message || 'Failed to update inventory item.',
      });
      throw err;
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to remove this stock record?')) {
      try {
        await deleteInventory(id);
        setToast({
          id: `toast-${Date.now()}`,
          title: 'Inventory Item Removed',
          message: 'Item has been deleted from your inventory.',
        });
      } catch (err: any) {
        console.error('Failed to delete inventory item:', err);
        setToast({
          id: `toast-${Date.now()}`,
          title: 'Failed to Delete',
          message: err?.response?.data?.message || err.message || 'Failed to delete inventory item.',
        });
      }
    }
  };
  // Calculate stats
  const totalItemsVal = inventory.reduce((acc, curr) => acc + curr.quantity * curr.sellingPrice, 0);
  const lowStockCount = inventory.filter(i => i.quantity <= i.minimumQuantity && i.quantity > 0).length;
  const outOfStockCount = inventory.filter(i => i.quantity === 0).length;

  const handleFilter = (data: InventoryItem[]) => {
    if (filterType === 'All') return data;
    if (filterType === 'Low Stock') return data.filter(i => i.quantity <= i.minimumQuantity && i.quantity > 0);
    if (filterType === 'Out Of Stock') return data.filter(i => i.quantity === 0);
    return data;
  };

  const columns = [
    {
      header: 'Material Name',
      accessor: (row: InventoryItem) => (
        <div className="text-left">
          <span className="font-bold text-[#0B1C30] dark:text-slate-200 text-sm block">{row.itemName}</span>
          <span className="text-[11px] text-[#6D7A79] dark:text-slate-400 font-mono mt-0.5 block">{row.sku}</span>
        </div>
      ),
      sortKey: 'itemName' as keyof InventoryItem,
    },
    {
      header: 'Category',
      accessor: 'category' as keyof InventoryItem,
      sortKey: 'category' as keyof InventoryItem,
    },
    {
      header: 'Stock Levels',
      accessor: (row: InventoryItem) => (
        <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
          {row.quantity.toLocaleString()} {row.unit || 'Pieces'} / {row.minimumQuantity?.toLocaleString() || 0} Min
        </span>
      ),
      sortKey: 'quantity' as keyof InventoryItem,
    },
    {
      header: 'Prices (Buy/Sell)',
      accessor: (row: InventoryItem) => `INR ${row.purchasePrice || 0} / INR ${row.sellingPrice || 0}`,
    },
    {
      header: 'Location',
      accessor: (row: InventoryItem) => row.warehouse || 'Default Warehouse',
      sortKey: 'warehouse' as keyof InventoryItem,
    },
    {
      header: 'Supplier',
      accessor: (row: InventoryItem) => row.supplier || 'N/A',
    },
    {
      header: 'Safety Status',
      accessor: (row: InventoryItem) => {
        const isOut = row.quantity === 0;
        const isLow = row.quantity <= (row.minimumQuantity || 0);
        return (
          <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (row: InventoryItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(row)}
            title="Edit Item Details"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[#6D7A79] hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row.id)}
            title="Delete Item"
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-400 hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Success Toast Banner */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">
            Inventory & Stock Console
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            Manage raw materials, stock levels, suppliers, and enterprise inventory tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-[#F8F9FF] dark:bg-[#0F172A] p-1 border border-[#E5EEFF]/80 dark:border-[#334155]/60 rounded-xl">
            {(['All', 'Low Stock', 'Out Of Stock'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === type
                    ? 'bg-[#006A6A] text-white shadow-sm'
                    : 'text-[#6D7A79] hover:text-[#545F73] dark:hover:text-slate-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
          <Button
            onClick={() => downloadInventoryExcel(inventory)}
            variant="outline"
            className="text-xs py-2 rounded-xl flex items-center gap-1.5 border border-[#E5EEFF] dark:border-[#334155] text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#107C41]" /> Export Enterprise Excel
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            variant="primary"
            className="text-xs py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-900/10 cursor-pointer bg-[#006A6A] hover:bg-[#005555]"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-[#14B8A6]">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Total Stock Valuation
            </span>
            <h4 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-white leading-tight">
              INR {totalItemsVal.toLocaleString()}
            </h4>
            <p className="text-[11px] text-[#6D7A79] dark:text-slate-400 mt-0.5 font-medium">
              Calculated using selling values
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B]">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Low Stock Alerts
            </span>
            <h4 className="text-[26px] font-extrabold text-[#F59E0B] leading-tight">
              {lowStockCount} SKUs
            </h4>
            <p className="text-[11px] text-[#6D7A79] dark:text-slate-400 mt-0.5 font-medium">
              Need safety replenishment
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 text-[#EF4444]">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-slate-400 uppercase tracking-tight block">
              Out of Stock Count
            </span>
            <h4 className="text-[26px] font-extrabold text-[#EF4444] leading-tight">
              {outOfStockCount} SKUs
            </h4>
            <p className="text-[11px] text-[#6D7A79] dark:text-slate-400 mt-0.5 font-medium">
              Line halts active
            </p>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <Table
        data={inventory}
        columns={columns}
        searchKey="itemName"
        searchPlaceholder="Search inventory by material name, SKU, category, warehouse, or supplier..."
        filterComponent={handleFilter}
        exportFileName="inventory-crud-ledger"
      />

      {/* Add New Item Modal (Fast 2-Step Wizard) */}
      <CreateInventoryModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Item Drawer / Modal */}
      <EditInventoryModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        item={selectedItem}
        onSubmit={handleEditSubmit}
      />
    </div >
  );
};
