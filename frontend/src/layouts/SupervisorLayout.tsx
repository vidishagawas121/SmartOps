import React, { useState, createContext, useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useOperations } from '../store/OperationsContext';
import { ToastContainer } from '../components/Toast';
import { AddStockModal, ReorderModal } from '../components/Modals';
import { api } from '../services/api';

export const SupervisorContext = createContext<any>({});
export const useSupervisor = () => useContext(SupervisorContext);

export const SupervisorPage: React.FC<{ Component: any; [key: string]: any }> = ({ Component, ...extraProps }) => {
  const ctx = useSupervisor();
  return <Component {...ctx} {...extraProps} />;
};

export const SupervisorLayout: React.FC = () => {
  const { user, logout } = useOperations();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchVal, setSearchVal] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderItem, setReorderItem] = useState<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const openAddModal = () => {
    setEditItem(null);
    setAddModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setAddModalOpen(true);
  };

  const openReorderModal = (item: any) => {
    setReorderItem(item);
    setReorderModalOpen(true);
  };

  const handleAddEditSubmit = async (formData: any) => {
    try {
      let res;
      if (editItem) {
        res = await api.updateItem(editItem._id || editItem.id, formData);
      } else {
        res = await api.addItem(formData);
      }

      if (res && res.success) {
        showToast(editItem ? 'Item updated successfully' : 'New item added successfully', 'success');
        setAddModalOpen(false);
        setEditItem(null);
        triggerRefresh();
      } else {
        showToast((res && res.error) || 'Operation failed', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to connect to server', 'error');
    }
  };

  const handleReorderSubmit = async (reorderData: any) => {
    try {
      const res = await api.reorderItem({
        sku: reorderData.sku,
        qty: reorderData.qty,
        supplier: reorderData.supplier || '',
        priority: reorderData.priority || 'Standard (5–7 Business Days)'
      });
      if (res && res.success) {
        showToast(`Successfully reordered ${reorderData.qty} units. Stock replenished.`, 'success');
        setReorderModalOpen(false);
        setReorderItem(null);
        triggerRefresh();
      } else {
        showToast((res && res.error) || 'Reorder request failed', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to replenish stock', 'error');
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const contextValue = {
    user,
    showToast,
    searchVal,
    setSearchVal,
    refreshTrigger,
    triggerRefresh,
    openAddModal,
    openEditModal,
    openReorderModal,
    onAddClick: openAddModal,
    onEditClick: openEditModal,
    onReorderClick: openReorderModal,
  };

  return (
    <SupervisorContext.Provider value={contextValue}>
      <div className="flex bg-bg min-h-screen text-slate-800 dark:text-slate-100 transition-all duration-300">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-[1600px] w-full mx-auto pb-16">
            <Outlet context={contextValue} />
          </main>
        </div>

        {/* Global Modals for Supervisor */}
        {addModalOpen && (
          <AddStockModal
            isOpen={addModalOpen}
            onClose={() => { setAddModalOpen(false); setEditItem(null); }}
            onSubmit={handleAddEditSubmit}
            editItem={editItem}
          />
        )}
        {reorderModalOpen && (
          <ReorderModal
            isOpen={reorderModalOpen}
            onClose={() => { setReorderModalOpen(false); setReorderItem(null); }}
            onSubmit={handleReorderSubmit}
            item={reorderItem}
          />
        )}

        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </SupervisorContext.Provider>
  );
};
