import React, { useState, useEffect } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Table } from '../../components/tables/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { OperationsChart } from '../../components/charts/Charts';
import { CreditCard, Landmark, Clock, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { PayrollRecord } from '../../types';
import { api } from '../../api/client';

export const Payroll: React.FC = () => {
  const { payroll, createSalary, updateSalary, deleteSalary } = useOperations();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [employeeList, setEmployeeList] = useState<string[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.drivers.getAll();
        const driversData = Array.isArray(res) ? res : res?.data || [];
        const driverNames = driversData
          .map((d: any) => d.fullName || d.name)
          .filter(Boolean);

        const namesSet = new Set<string>(driverNames);
        payroll.forEach(p => {
          if (p.employee) namesSet.add(p.employee);
        });

        setEmployeeList(Array.from(namesSet));
      } catch (err) {
        console.warn('Could not fetch drivers list:', err);
        const namesSet = new Set<string>();
        payroll.forEach(p => {
          if (p.employee) namesSet.add(p.employee);
        });
        setEmployeeList(Array.from(namesSet));
      }
    };
    fetchEmployees();
  }, [payroll]);

  // Form state
  const [form, setForm] = useState({
    employee: '',
    basicSalary: 0,
    overtime: 0,
    bonus: 0,
    allowance: 0,
    deduction: 0,
    tax: 0,
    paymentStatus: 'Pending' as PayrollRecord['paymentStatus']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'employee' || name === 'paymentStatus' ? value : Number(value)
    }));
  };

  // Calculate Net payout value helper
  const calculateFinalSalary = (basic: number, ot: number, bon: number) => {
    return Number(basic || 0) + Number(ot || 0) + Number(bon || 0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = calculateFinalSalary(
      form.basicSalary,
      form.overtime,
      form.bonus
    );
    createSalary({
      ...form,
      allowance: 0,
      deduction: 0,
      tax: 0,
      finalSalary: finalVal,
      paymentDate: form.paymentStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
    });
    setCreateModalOpen(false);
    resetForm();
  };

  const handleEditClick = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setForm({
      employee: record.employee,
      basicSalary: record.basicSalary,
      overtime: record.overtime,
      bonus: record.bonus,
      allowance: record.allowance || 0,
      deduction: record.deduction || 0,
      tax: record.tax || 0,
      paymentStatus: record.paymentStatus
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedRecord?.id || (selectedRecord as any)?._id;
    if (targetId) {
      const finalVal = calculateFinalSalary(
        form.basicSalary,
        form.overtime,
        form.bonus
      );
      updateSalary(targetId, {
        ...form,
        allowance: 0,
        deduction: 0,
        tax: 0,
        finalSalary: finalVal,
        paymentDate: form.paymentStatus === 'Paid' ? new Date().toISOString().split('T')[0] : undefined
      });
    }
    setEditModalOpen(false);
    resetForm();
  };

  const handleDeleteClick = (id: string) => {
    if (id && confirm('Are you sure you want to remove this payroll record?')) {
      deleteSalary(id);
    }
  };

  const handleQuickRelease = (record: PayrollRecord) => {
    const targetId = record.id || (record as any)._id;
    if (targetId) {
      updateSalary(targetId, { paymentStatus: 'Paid' });
    }
  };

  const resetForm = () => {
    setForm({
      employee: '',
      basicSalary: 0,
      overtime: 0,
      bonus: 0,
      allowance: 0,
      deduction: 0,
      tax: 0,
      paymentStatus: 'Pending'
    });
    setSelectedRecord(null);
  };

  // Calculations
  const totalPayout = payroll.reduce((acc, curr) => acc + curr.finalSalary, 0);
  const pendingCount = payroll.filter(p => p.paymentStatus === 'Pending').length;
  const approvedCount = payroll.filter(p => p.paymentStatus === 'Paid').length;

  const payrollTrendData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    if (!payroll || payroll.length === 0) {
      return months.map(month => ({ month, payroll: 0 }));
    }
    const monthMap: Record<string, number> = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0 };
    payroll.forEach(p => {
      const date = p.paymentDate ? new Date(p.paymentDate) : new Date();
      const mName = months[date.getMonth()] || 'Jun';
      if (monthMap[mName] !== undefined) {
        monthMap[mName] += p.finalSalary || 0;
      }
    });
    return months.map(month => ({ month, payroll: monthMap[month] || 0 }));
  }, [payroll]);

  const columns = [
    {
      header: 'Employee Name',
      accessor: (row: PayrollRecord) => (
        <div className="flex items-center gap-3 text-left">
          <img
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${row.employee}&backgroundColor=006A6A`}
            alt=""
            className="w-8.5 h-8.5 rounded-full bg-[#F8F9FF] border border-slate-200"
          />
          <span className="font-bold text-[#0B1C30] text-sm block">{row.employee}</span>
        </div>
      ),
      sortKey: 'employee' as keyof PayrollRecord,
    },
    {
      header: 'Basic Salary',
      accessor: (row: PayrollRecord) => `INR ${row.basicSalary.toLocaleString()}`,
      sortKey: 'basicSalary' as keyof PayrollRecord,
    },
    {
      header: 'OT + Bonus',
      accessor: (row: PayrollRecord) => `+INR ${((row.overtime || 0) + (row.bonus || 0) + (row.allowance || 0)).toLocaleString()}`,
    },
    {
      header: 'Net Pay',
      accessor: (row: PayrollRecord) => (
        <span className="font-bold text-slate-800 dark:text-[#F8FAFC] text-sm">INR {row.finalSalary.toLocaleString()}</span>
      ),
      sortKey: 'finalSalary' as keyof PayrollRecord,
    },
    {
      header: 'Payment Status',
      accessor: (row: PayrollRecord) => {
        const isApproved = row.paymentStatus === 'Paid' || row.paymentStatus === 'Approved';
        return (
          <Badge variant={isApproved ? 'success' : 'warning'}>
            {isApproved ? 'Approved' : 'Pending'}
          </Badge>
        );
      },
      sortKey: 'paymentStatus' as keyof PayrollRecord,
    },
    {
      header: 'Actions',
      accessor: (row: PayrollRecord) => {
        const isApproved = row.paymentStatus === 'Paid' || row.paymentStatus === 'Approved';
        return (
          <div className="flex items-center gap-2">
            {!isApproved ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickRelease(row)}
                className="text-[11px] py-1 px-3 border-[#10B981]/25 text-[#10B981] hover:bg-[#10B981]/10 rounded-xl"
              >
                Release
              </Button>
            ) : (
              <span className="text-[#10B981] text-xs font-bold flex items-center gap-0.5 px-2">
                <CheckCircle className="h-4 w-4" /> Approved
              </span>
            )}
            <button
              onClick={() => handleEditClick(row)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[#6D7A79] hover:text-slate-800 transition-colors cursor-pointer"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.id || (row as any)._id)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-400 hover:text-[#EF4444] transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">Salary & Payout Console</h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">Directly execute full CRUD operations over employee payroll slips.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setCreateModalOpen(true); }}
          variant="primary"
          className="text-xs py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-900/10 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Calculate Pay
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#006A6A]/10 text-[#006A6A]">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Total Net Payroll</span>
            <h4 className="text-[22px] font-extrabold text-[#0B1C30] dark:text-white leading-tight">INR {totalPayout.toLocaleString()}</h4>
            <p className="text-[11px] text-[#6D7A79] mt-0.5 font-medium">Aggregated payouts</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Pending Salary Releases</span>
            <h4 className="text-[22px] font-extrabold text-[#F59E0B] leading-tight">{pendingCount} Accounts</h4>
            <p className="text-[11px] text-[#6D7A79] mt-0.5 font-medium">Authorization required</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Disbursed Payouts</span>
            <h4 className="text-[22px] font-extrabold text-[#10B981] leading-tight">{approvedCount} Accounts</h4>
            <p className="text-[11px] text-[#6D7A79] mt-0.5 font-medium">Successfully sent</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        data={payroll}
        columns={columns}
        searchKey="employee"
        searchPlaceholder="Search employee pay slips by name, payment status, or salary amount..."
        exportFileName="payroll-ledger"
      />

      {/* Historical Trend */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm">
        <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] mb-5 uppercase tracking-wide">Historical Monthly Payroll Trend</h3>
        <OperationsChart
          data={payrollTrendData}
          xKey="month"
          series={[{ key: 'payroll', name: 'Total Payout Value (INR)', color: '#006A6A', type: 'bar' }]}
          type="bar"
        />
      </div>

      {/* Forms */}
      {[
        { isOpen: createModalOpen, setOpen: setCreateModalOpen, title: 'Calculate Salary Slip', submit: handleCreateSubmit },
        { isOpen: editModalOpen, setOpen: setEditModalOpen, title: 'Modify Salary Slip', submit: handleEditSubmit }
      ].map((modal, idx) => (
        <Modal key={idx} isOpen={modal.isOpen} onClose={() => modal.setOpen(false)} title={modal.title} size="md">
          <form onSubmit={modal.submit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Emp Name</label>
              <select
                required
                name="employee"
                value={form.employee}
                onChange={handleInputChange}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
              >
                <option value="">Select Employee Name (e.g. Harpreet Singh)</option>
                {employeeList.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
                {form.employee && !employeeList.includes(form.employee) && (
                  <option value={form.employee}>{form.employee}</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Basic Salary (INR)</label>
                <input
                  type="number"
                  required
                  name="basicSalary"
                  placeholder="e.g. 35000"
                  value={form.basicSalary || ''}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Overtime Allowance (INR)</label>
                <input
                  type="number"
                  name="overtime"
                  placeholder="e.g. 2500"
                  value={form.overtime || ''}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Bonuses (INR)</label>
              <input
                type="number"
                name="bonus"
                placeholder="e.g. 1500"
                value={form.bonus || ''}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Initial Payment Status</label>
              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={handleInputChange}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
              >
                <option value="Pending">Pending Approval</option>
                <option value="Paid">Approved</option>
              </select>
            </div>

            <div className="bg-[#F8F9FF] dark:bg-[#0F172A]/60 rounded-xl p-4.5 border border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800/80 flex justify-between items-center text-sm font-bold text-slate-700 dark:text-[#CBD5E1]">
              <span>Auto-Calculated Net Pay:</span>
              <span className="text-[#006A6A] dark:text-[#14B8A6]">
                INR {calculateFinalSalary(form.basicSalary, form.overtime, form.bonus).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155]">
              <Button type="button" variant="outline" onClick={() => modal.setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Pay Slip
              </Button>
            </div>
          </form>
        </Modal>
      ))}
    </div>
  );
};



