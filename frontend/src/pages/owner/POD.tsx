import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOperations } from '../../store/OperationsContext';
import { downloadReport } from '../../utils/downloadReport';
import { api } from '../../api/client';
import { PODRecord } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, SlidersHorizontal, CheckCircle2, AlertOctagon, XCircle,
  Eye, Download, FileSpreadsheet, User, Truck, MapPin, Clock, Calendar,
  ArrowRight, ShieldCheck, X, Clipboard, ArrowDown, Plus, Upload
} from 'lucide-react';

export const POD: React.FC = () => {
  const { user, triggerNotification } = useOperations();
  const [pods, setPods] = useState<PODRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    orderNumber: '',
    vehicleNumber: '',
    customerName: '',
    customerAddress: '',
    driverName: '',
    imageUrl: '',
    remarks: ''
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // UI Selection State
  const [selectedPod, setSelectedPod] = useState<PODRecord | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Sorting State
  const [sortField, setSortField] = useState<'createdAt' | 'driverName' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchPods = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (filterStatus !== 'All') filters.status = filterStatus;
      if (filterDriver.trim()) filters.driver = filterDriver;
      if (filterVehicle.trim()) filters.vehicle = filterVehicle;
      if (filterCustomer.trim()) filters.customer = filterCustomer;
      if (filterDate.trim()) filters.date = filterDate;
      if (searchTerm.trim()) filters.orderNumber = searchTerm;

      const records = await api.pod.getAll(filters);
      setPods(records);
    } catch (err) {
      console.error('Failed to pull POD logs: ', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPods();
  }, [filterStatus, filterDriver, filterVehicle, filterCustomer, filterDate, searchTerm]);

  // Hook up Socket real-time sync event
  useEffect(() => {
    const handleSync = () => {
      fetchPods();
    };
    window.addEventListener('pod-sync-event', handleSync);
    return () => {
      window.removeEventListener('pod-sync-event', handleSync);
    };
  }, []);

  // Action: Approve POD
  const handleApprove = async (id: string) => {
    try {
      const updated = await api.pod.approve(id);
      setPods(prev => prev.map(p => p.id === id || p.podId === id ? updated : p));
      if (selectedPod?.id === id || selectedPod?.podId === id) {
        setSelectedPod(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Reject POD
  const handleReject = async () => {
    if (!rejectReason.trim() || !selectedPod) return;
    try {
      const updated = await api.pod.reject(selectedPod.id, rejectReason);
      setPods(prev => prev.map(p => p.id === selectedPod.id ? updated : p));
      setSelectedPod(updated);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Export Excel / CSV Mock
  const handleExportCSV = () => {
    if (pods.length === 0) {
      triggerNotification('System Alert', 'No Data to Export', 'No POD logs available to export.', 'Warning');
      return;
    }
    const headers = ['POD ID', 'Driver Name', 'Driver ID', 'Vehicle', 'Order ID', 'Customer', 'Address', 'Status', 'Remarks', 'Uploaded Date'];
    const rows = pods.map(p => [
      p?.podId || '',
      p?.driverName || '',
      p?.driverId || '',
      p?.vehicleNumber || '',
      p?.orderNumber || '',
      p?.customerName || '',
      p?.customerAddress || '',
      p?.status || '',
      p?.remarks || '--',
      p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : '--'
    ]);
    downloadReport({
      fileName: 'smartops_pod_ledger',
      title: 'Proof of Delivery (POD) Console Ledger',
      format: 'CSV',
      headers,
      rows,
      summary: 'Logs of verified digital signatures, delivery cargo photographs, and client dispatch handovers.',
      filters: {
        Search: searchTerm || 'All',
        Status: filterStatus,
        Driver: filterDriver || 'All',
        Vehicle: filterVehicle || 'All',
        Customer: filterCustomer || 'All',
        Date: filterDate || 'All'
      }
    });
  };

  // Action: Export PDF Mock
  const handleExportPDF = () => {
    if (pods.length === 0) {
      triggerNotification('System Alert', 'No Data to Export', 'No POD logs available to export.', 'Warning');
      return;
    }
    const headers = ['POD ID', 'Driver Name', 'Driver ID', 'Vehicle', 'Order ID', 'Customer', 'Address', 'Status', 'Remarks', 'Uploaded Date'];
    const rows = pods.map(p => [
      p?.podId || '',
      p?.driverName || '',
      p?.driverId || '',
      p?.vehicleNumber || '',
      p?.orderNumber || '',
      p?.customerName || '',
      p?.customerAddress || '',
      p?.status || '',
      p?.remarks || '--',
      p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : '--'
    ]);

    const totalCount = pods.length;
    const approvedCount = pods.filter(p => p?.status === 'Approved').length;
    const pendingCount = pods.filter(p => p?.status === 'Pending').length;

    downloadReport({
      fileName: 'smartops_pod_ledger',
      title: 'Proof of Delivery (POD) Console Ledger',
      format: 'Print', // Print format triggers PDF autoprint dialog
      headers,
      rows,
      summary: 'Logs of verified digital signatures, delivery cargo photographs, and client dispatch handovers.',
      filters: {
        Search: searchTerm || 'All',
        Status: filterStatus,
        Driver: filterDriver || 'All',
        Vehicle: filterVehicle || 'All',
        Customer: filterCustomer || 'All',
        Date: filterDate || 'All'
      },
      kpis: [
        { label: 'Total Logs Audited', value: totalCount },
        { label: 'Approved PODs', value: approvedCount },
        { label: 'Pending Verification', value: pendingCount }
      ]
    });
  };

  // Sort logic
  const handleSort = (field: typeof sortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const sortedPods = [...pods].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === 'driverName') {
      comparison = a.driverName.localeCompare(b.driverName);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedPods.length / itemsPerPage);
  const paginatedPods = sortedPods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculation aggregate stats
  const totalCount = pods.length;
  const pendingCount = pods.filter(p => p.status === 'Pending').length;
  const approvedCount = pods.filter(p => p.status === 'Approved').length;
  const rejectedCount = pods.filter(p => p.status === 'Rejected').length;
  const todayCount = pods.filter(p => {
    const todayStr = new Date().toISOString().split('T')[0];
    return (p.createdAt || '').startsWith(todayStr);
  }).length;

  // Action: Upload new POD (Owner / Dispatcher)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.orderNumber || !uploadForm.vehicleNumber || !uploadForm.customerName || !uploadForm.customerAddress) {
      triggerNotification('System Alert', 'Validation Error', 'Please fill in all required fields.', 'Warning');
      return;
    }

    setIsUploading(true);
    try {
      const defaultImage = uploadForm.imageUrl.trim() || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop';
      await api.pod.upload({
        orderNumber: uploadForm.orderNumber.trim(),
        vehicleNumber: uploadForm.vehicleNumber.trim(),
        customerName: uploadForm.customerName.trim(),
        customerAddress: uploadForm.customerAddress.trim(),
        imageUrl: defaultImage,
        remarks: uploadForm.remarks.trim() || 'Manual POD logged via Owner Console',
        ...(uploadForm.driverName.trim() ? { driverName: uploadForm.driverName.trim() } : {})
      });
      triggerNotification('System Alert', 'Log Registered', `POD for ${uploadForm.orderNumber} successfully created.`, 'Info');
      setShowUploadModal(false);
      setUploadForm({ orderNumber: '', vehicleNumber: '', customerName: '', customerAddress: '', driverName: '', imageUrl: '', remarks: '' });
      fetchPods();
    } catch (err: any) {
      triggerNotification('System Alert', 'Error', err.response?.data?.message || err.message || 'Failed to upload POD.', 'Error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 text-left animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">Proof of Delivery (POD) Console</h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">Audit incoming cargo receipts, verify customer signatures, and validate GPS drops.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)} className="flex items-center gap-1.5 bg-[#006A6A] hover:bg-[#005555] text-white shadow font-bold text-xs">
            <Plus className="h-4 w-4" /> Upload POD
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="flex items-center gap-1.5 border border-[#E5EEFF] dark:border-[#334155] bg-white shadow-sm font-bold text-xs text-[#545F73]">
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5 border border-[#E5EEFF] dark:border-[#334155] bg-white shadow-sm font-bold text-xs text-[#545F73]">
            <FileText className="h-4 w-4" /> Print Ledger
          </Button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { title: 'Total PODs', val: totalCount, desc: 'Logged manifests', color: 'text-[#0B1C30] dark:text-white', icon: Clipboard, bg: 'bg-slate-100/50 dark:bg-slate-800/40' },
          { title: 'Pending Audit', val: pendingCount, desc: 'Awaiting signature checks', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50/60 dark:bg-amber-950/20' },
          { title: 'Approved PODs', val: approvedCount, desc: 'Closed run logs', color: 'text-emerald-600', icon: CheckCircle2, bg: 'bg-emerald-50/60 dark:bg-emerald-950/20' },
          { title: 'Rejected PODs', val: rejectedCount, desc: 'Re-runs requested', color: 'text-rose-600', icon: XCircle, bg: 'bg-rose-50/60 dark:bg-rose-950/20' },
          { title: 'Uploaded Today', val: todayCount, desc: 'Shift deliveries', color: 'text-[#006A6A]', icon: ShieldCheck, bg: 'bg-teal-50/60 dark:bg-teal-950/20' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`border border-[#E5EEFF] dark:border-[#334155] p-5 rounded-2xl shadow-sm text-left flex items-start justify-between ${stat.bg}`}>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#374151] dark:text-slate-400 uppercase tracking-wider block">{stat.title}</span>
                <h4 className={`text-3xl font-extrabold mt-1 leading-none ${stat.color}`}>{stat.val}</h4>
                <p className="text-[10px] text-[#4B5563] dark:text-[#6D7A79] font-bold">{stat.desc}</p>
              </div>
              <div className="p-2 bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 rounded-xl shadow-sm text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter / Control Console */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/80 pb-3">
          <SlidersHorizontal className="h-4 w-4 text-[#006A6A]" />
          <span className="text-xs font-bold text-slate-700 dark:text-[#CBD5E1] uppercase tracking-wider">Search & Filters Console</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Order</label>
            <div className="relative">
              <Search className="search-icon-glow absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none z-10" />
              <input
                type="text"
                placeholder="TRP-XXXX"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="navbar-search-input w-full pl-9 pr-3 h-9 text-xs border border-[#E5E7EB] dark:border-[#334155] rounded-full bg-slate-50/50 dark:bg-slate-800/40 text-[#111827] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#006A6A] focus:border-[#006A6A] transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver</label>
            <input
              type="text"
              placeholder="Driver Name"
              value={filterDriver}
              onChange={e => setFilterDriver(e.target.value)}
              className="w-full px-3 h-10 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicle Plate</label>
            <input
              type="text"
              placeholder="MH-12-..."
              value={filterVehicle}
              onChange={e => setFilterVehicle(e.target.value)}
              className="w-full px-3 h-10 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</label>
            <input
              type="text"
              placeholder="Client Name"
              value={filterCustomer}
              onChange={e => setFilterCustomer(e.target.value)}
              className="w-full px-3 h-10 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-3 h-10 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] font-bold"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 h-10 text-xs border border-[#E5EEFF] dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-700 dark:text-[#F8FAFC] font-bold"
            />
          </div>
        </div>
      </div>

      {/* POD Logs Ledger Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-[20px] shadow-sm overflow-hidden text-left flex flex-col">
        <div className="overflow-x-auto flex-1 min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8F9FF] dark:bg-[#0F172A] border-b border-[#E5EEFF] dark:border-[#334155] sticky top-0 z-10 font-bold text-xs">
              <tr>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Cargo Photo</th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] cursor-pointer" onClick={() => handleSort('driverName')}>
                  Driver Details {sortField === 'driverName' && (sortOrder === 'asc' ? '?' : '?')}
                </th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Order ID</th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Vehicle</th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC]">Customer Name</th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] cursor-pointer" onClick={() => handleSort('createdAt')}>
                  Upload Time {sortField === 'createdAt' && (sortOrder === 'asc' ? '?' : '?')}
                </th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] cursor-pointer" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortOrder === 'asc' ? '?' : '?')}
                </th>
                <th className="px-6 py-4 text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(11,28,48,0.06)] dark:divide-slate-800/80 text-[14px]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#6D7A79] italic font-semibold">
                    Pulling records from server database...
                  </td>
                </tr>
              ) : paginatedPods.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#6D7A79] italic font-semibold">
                    No matching POD logs registered.
                  </td>
                </tr>
              ) : (
                paginatedPods.map(pod => (
                  <tr key={pod.id} className="hover:bg-[#F8F9FF]/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="w-14 h-14 rounded-lg overflow-hidden border-2 border-[#006A6A] bg-slate-200 cursor-pointer relative group"
                        onClick={() => {
                          const url = pod.imageUrl || pod.images?.[0];
                          console.log('[POD Zoom] imageUrl =', url?.substring(0, 80));
                          if (url) setZoomedImage(url);
                          else alert('No image available for this POD record.');
                        }}
                      >
                        {pod.imageUrl || pod.images?.[0] ? (
                          <img src={pod.imageUrl || pod.images?.[0]} alt="POD" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold text-center px-1">No Image</div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold leading-none" style={{ color: '#111827' }}>{pod.driverName}</p>
                        <p className="text-[10px] font-mono mt-1 font-bold" style={{ color: '#374151' }}>{pod.driverId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-[#1a1a2e] dark:text-[#CBD5E1]">{pod.orderNumber}</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-[#1a1a2e] dark:text-[#CBD5E1]">{pod.vehicleNumber}</td>
                    <td className="px-6 py-4 font-semibold text-[#1a1a2e] dark:text-[#CBD5E1]">{pod.customerName}</td>
                    <td className="px-6 py-4 text-xs font-mono font-semibold" style={{ color: '#111827' }}>
                      {new Date(pod.createdAt).toLocaleDateString()} {new Date(pod.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={pod.status === 'Approved' ? 'success' : pod.status === 'Rejected' ? 'danger' : 'warning'} className="font-bold">
                        {pod.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedPod(pod)}
                          className="p-2 border border-[#E5EEFF] dark:border-[#334155] bg-white text-[#6D7A79] rounded-xl"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {pod.status === 'Pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(pod.id)}
                              className="px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow"
                              title="Approve"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedPod(pod);
                                setShowRejectModal(true);
                              }}
                              className="px-3.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-0 shadow"
                              title="Reject"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-5 border-t border-[#E5EEFF]/80 dark:border-[#334155]/60 dark:border-slate-800/80 bg-transparent">
            <div className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] font-medium">
              Showing <span className="font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">
                {Math.min(currentPage * itemsPerPage, sortedPods.length)}
              </span>{' '}
              of <span className="font-semibold text-[#0B1C30] dark:text-[#F8FAFC]">{sortedPods.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border border-[#E5EEFF] dark:border-[#334155] bg-white text-slate-700 dark:text-[#CBD5E1] rounded-xl font-bold"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={currentPage === idx + 1 ? 'primary' : 'outline'}
                  size="sm"
                  className={`w-9 h-9 p-0 border border-[#E5EEFF] dark:border-[#334155] rounded-xl font-bold ${
                    currentPage === idx + 1
                      ? 'bg-[#006A6A] text-white shadow-sm'
                      : 'text-slate-700 bg-white'
                  }`}
                  onClick={() => setCurrentPage(idx + 1)}
                >
                  {idx + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border border-[#E5EEFF] dark:border-[#334155] bg-white text-slate-700 dark:text-[#CBD5E1] rounded-xl font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL PANEL */}
      <AnimatePresence>
        {selectedPod && !showRejectModal && createPortal(
          <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 w-full max-w-4xl rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[90vh] text-left"
            >
              <div className="px-6 py-4 border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 flex items-center justify-between bg-[#F8F9FF] dark:bg-[#0F172A]">
                <div className="flex items-center gap-3">
                  <Badge variant={selectedPod.status === 'Approved' ? 'success' : selectedPod.status === 'Rejected' ? 'danger' : 'warning'} className="font-bold uppercase tracking-wider text-[10px]">
                    {selectedPod.status}
                  </Badge>
                  <h3 className="text-[16px] font-bold text-[#0B1C30] dark:text-white leading-none">{selectedPod.podId} Details</h3>
                </div>
                <button onClick={() => setSelectedPod(null)} className="text-slate-400 hover:text-[#545F73] cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Images and preview */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Cargo Verification Snapshot</span>
                    <div className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-800 bg-[#F8F9FF] flex items-center justify-center shadow-inner group">
                      <img src={selectedPod.imageUrl} alt="Cargo verification" className="max-h-full object-contain" />
                      <button
                        onClick={() => setZoomedImage(selectedPod.imageUrl)}
                        className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-xl shadow cursor-pointer transition-colors text-xs font-bold flex items-center gap-1 border-0"
                      >
                        <Eye className="h-3.5 w-3.5" /> Full Zoom
                      </button>
                    </div>
                  </div>

                  {selectedPod.signatureUrl && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Consignee E-Signature Pad</span>
                      <div className="bg-[#F8F9FF] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-3 rounded-xl h-28 flex items-center justify-center overflow-hidden">
                        <img src={selectedPod.signatureUrl} alt="E-Signature data" className="max-h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Details list */}
                <div className="space-y-6">
                  
                  {/* Cards metadata */}
                  <div className="bg-[#F8F9FF] dark:bg-[#0F172A]/40 border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-[#006A6A] dark:text-[#14B8A6] uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-800/80 pb-2">Delivery Metadata</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                      <div className="space-y-1">
                        <span className="text-slate-400 block font-semibold">Driver Name</span>
                        <span className="text-[#0B1C30] dark:text-[#F8FAFC] flex items-center gap-1.5 font-bold">
                          <User className="h-3.5 w-3.5 text-slate-400" /> {selectedPod.driverName}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block font-semibold">Vehicle Plate</span>
                        <span className="text-[#0B1C30] dark:text-[#F8FAFC] flex items-center gap-1.5 font-bold font-mono">
                          <Truck className="h-3.5 w-3.5 text-slate-400" /> {selectedPod.vehicleNumber}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block font-semibold">Order Number</span>
                        <span className="text-[#0B1C30] dark:text-[#F8FAFC] font-mono font-bold">{selectedPod.orderNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 block font-semibold">Recipient Customer</span>
                        <span className="text-[#0B1C30] dark:text-[#F8FAFC] font-bold">{selectedPod.customerName}</span>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <span className="text-slate-400 block font-semibold">Destination Address</span>
                        <span className="text-[#0B1C30] dark:text-[#F8FAFC] font-bold flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="whitespace-normal break-words leading-tight">{selectedPod.customerAddress}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Geolocation & telemetry details */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Verification stamps</span>
                    
                    <div className="bg-[#0B1C30] text-slate-300 p-4.5 rounded-2xl space-y-3.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#6D7A79] font-bold">STAMP TIME:</span>
                        <span className="text-white font-bold">{new Date(selectedPod.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6D7A79] font-bold">GPS COORDS:</span>
                        <span className="text-[#14B8A6] font-bold">{selectedPod.latitude?.toFixed(5) || '19.076'}, {selectedPod.longitude?.toFixed(5) || '72.8777'}</span>
                      </div>
                      {selectedPod.remarks && (
                        <div className="border-t border-slate-800/80 pt-2.5 mt-2.5 text-slate-400 not-italic font-sans whitespace-normal break-words font-medium">
                          <span className="text-[#6D7A79] font-mono font-bold block text-[10px] uppercase mb-1">Remarks notes:</span>
                          "{selectedPod.remarks}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Approval advice or reject reason */}
                  {selectedPod.status === 'Approved' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl p-4.5 text-xs font-bold space-y-1 animate-fade-in">
                      <p className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> APPROVED BY {selectedPod.approvedBy || 'Owner'}</p>
                      {selectedPod.approvedAt && (
                        <p className="text-[10px] text-slate-400 font-mono">Timestamp: {new Date(selectedPod.approvedAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}

                  {selectedPod.status === 'Rejected' && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-4.5 text-xs font-bold space-y-1 animate-fade-in">
                      <p className="flex items-center gap-1.5"><AlertOctagon className="h-4 w-4" /> REJECTED AUDIT DISCREPANCY</p>
                      <p className="text-[#6D7A79] dark:text-[#94A3B8] font-medium whitespace-normal break-words mt-1">Reason: "{selectedPod.rejectedReason}"</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 flex justify-between items-center gap-3 bg-[#F8F9FF]/40 dark:bg-[#1E293B]/40">
                <a
                  href={selectedPod.imageUrl}
                  download={`POD-${selectedPod.orderNumber}.jpg`}
                  className="border border-[#E5EEFF] dark:border-[#334155] bg-white text-slate-700 hover:bg-[#F8F9FF] text-xs font-bold px-4 h-11 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Download Photo
                </a>
                
                <div className="flex gap-2">
                  {selectedPod.status === 'Pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(selectedPod.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 px-6 rounded-xl border-0 shadow shadow-emerald-950/20 cursor-pointer"
                      >
                        Approve POD
                      </Button>
                      <Button
                        onClick={() => setShowRejectModal(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-11 px-6 rounded-xl border-0 shadow shadow-rose-950/20 cursor-pointer"
                      >
                        Reject POD
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => setSelectedPod(null)}
                    variant="outline"
                    className="border border-[#E5EEFF] dark:border-[#334155] text-[#6D7A79] text-xs font-bold h-11 px-5 rounded-xl cursor-pointer"
                  >
                    Close Drawer
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* REJECTION COMMMENT PROMPT MODAL */}
      <AnimatePresence>
        {showRejectModal && selectedPod && createPortal(
          <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] space-y-5 text-left modal-container"
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertOctagon className="h-5 w-5 shrink-0" />
                <h3 className="text-xl font-bold text-[#0B1C30] dark:text-[#F8FAFC] modal-title">Specify Rejection Discrepancy</h3>
              </div>
              <p className="text-[15px] text-[#334155] dark:text-[#CBD5E1] leading-relaxed font-medium modal-description">
                Please write a clear correction advice description. The assigned driver will review this advice inside their console and re-upload correct proofs.
              </p>
              
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. signature is blurry, wrong invoice paper snapshot uploaded..."
                rows={3}
                className="w-full px-4 py-3 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] font-medium resize-none text-slate-800 dark:text-[#F8FAFC]"
              />

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  variant="outline"
                  className="border border-slate-300 dark:border-slate-700 text-[#334155] dark:text-[#CBD5E1] text-[15px] font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl border-0 shadow cursor-pointer"
                >
                  Reject Proof
                </Button>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* FULL LARGE ZOOM MODAL */}
      {zoomedImage && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 99999 }}
          onClick={() => setZoomedImage(null)}
        >
          {/* Close hint */}
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-xs font-medium tracking-widest uppercase select-none">Click anywhere to close</p>

          <div
            className="relative max-w-5xl w-full mx-4 flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={zoomedImage}
              alt="Cargo proof full view"
              className="max-h-[88vh] max-w-full object-contain rounded-2xl border border-white/10"
              style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
            />

            {/* Top-right action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <a
                href={zoomedImage}
                download="SmartOps-Cargo-Proof-Full.jpg"
                onClick={e => e.stopPropagation()}
                className="p-2.5 bg-white/10 hover:bg-white/25 backdrop-blur text-white rounded-xl shadow-lg border border-white/10 flex items-center gap-1.5 text-xs font-bold transition-colors"
                title="Download Image"
              >
                <Download className="h-4 w-4" /> Download
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                className="p-2.5 bg-white/10 hover:bg-rose-600 backdrop-blur text-white rounded-xl shadow-lg border border-white/10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* UPLOAD POD MODAL */}
      <AnimatePresence>
        {showUploadModal && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-left"
            >
              <div className="px-6 py-4 border-b border-[#E5EEFF] dark:border-slate-800 flex items-center justify-between bg-[#F8F9FF] dark:bg-[#0F172A]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#006A6A]/10 text-[#006A6A] rounded-xl">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B1C30] dark:text-white leading-none">Upload Proof of Delivery</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Log a new delivery receipt into the audit system</p>
                  </div>
                </div>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase tracking-wider block">Order Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ORD-90182"
                      value={uploadForm.orderNumber}
                      onChange={e => setUploadForm({ ...uploadForm, orderNumber: e.target.value })}
                      className="w-full px-3 h-10 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase tracking-wider block">Vehicle Plate *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH-12-PQ-4589"
                      value={uploadForm.vehicleNumber}
                      onChange={e => setUploadForm({ ...uploadForm, vehicleNumber: e.target.value })}
                      className="w-full px-3 h-10 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AutoCorp India Ltd."
                    value={uploadForm.customerName}
                    onChange={e => setUploadForm({ ...uploadForm, customerName: e.target.value })}
                    className="w-full px-3 h-10 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block">Destination Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhiwandi Logistics Hub, Gate 4"
                    value={uploadForm.customerAddress}
                    onChange={e => setUploadForm({ ...uploadForm, customerAddress: e.target.value })}
                    className="w-full px-3 h-10 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase tracking-wider block">Assigned Driver (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Driver Name"
                      value={uploadForm.driverName}
                      onChange={e => setUploadForm({ ...uploadForm, driverName: e.target.value })}
                      className="w-full px-3 h-10 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-500 uppercase tracking-wider block">Cargo Photo URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={uploadForm.imageUrl}
                      onChange={e => setUploadForm({ ...uploadForm, imageUrl: e.target.value })}
                      className="w-full px-3 h-10 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase tracking-wider block">Remarks / Delivery Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Delivery cargo verified and stamped at receiving dock."
                    value={uploadForm.remarks}
                    onChange={e => setUploadForm({ ...uploadForm, remarks: e.target.value })}
                    className="w-full p-3 border border-[#E5EEFF] dark:border-slate-700 rounded-xl bg-[#F8F9FF] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#006A6A]/20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadModal(false)}
                    className="border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold h-10 px-4 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="bg-[#006A6A] hover:bg-[#005555] text-white font-bold text-xs h-10 px-5 rounded-xl border-0 shadow disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Save POD Log'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

    </div>
  );
};



