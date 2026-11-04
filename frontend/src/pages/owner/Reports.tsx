import React, { useState } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FileText, FileSpreadsheet, Calendar, RefreshCw } from 'lucide-react';
import { downloadReport } from '../../utils/downloadReport';
import { downloadInventoryExcel } from '../../utils/downloadInventoryReport';

export const Reports: React.FC = () => {
  const { triggerNotification, inventory, vehicles, payroll, attendance } = useOperations();
  const [generating, setGenerating] = useState<string | null>(null);

  const reportOptions = [
    { id: 'rep1', name: 'Raw Material Consumption & Production Yield', description: 'Detailed breakdown of manufacturing inputs vs output weight margins.', duration: 'Daily / Weekly' },
    { id: 'rep2', name: 'Logistics Fleet Fuel & Maintenance Audits', description: 'Fuel efficiency curves, servicing receipts, and transit speed compliance logs.', duration: 'Monthly' },
    { id: 'rep3', name: 'Warehouse Stock Reconciliations & Shortages', description: 'SKU counts, storage limits, and high-frequency staging items.', duration: 'Bi-Weekly' },
    { id: 'rep4', name: 'Overtime & Payout Allocations Ledger', description: 'Driver allowance listings, worker OT approvals, and bonus logs.', duration: 'Monthly' },
    { id: 'rep5', name: 'Staging Area Check-Ins & Attendance Log', description: 'Floor check times, late markers, and staging queue summaries.', duration: 'Weekly' },
  ];

  const handleGenerate = async (id: string, format: 'PDF' | 'Excel') => {
    const report = reportOptions.find(r => r.id === id);
    if (!report) return;

    setGenerating(`${id}-${format}`);

    try {
      if (id === 'rep3' && format === 'Excel') {
        downloadInventoryExcel(inventory);
        triggerNotification(
          'System Alert',
          'File Exported Successfully',
          `Downloaded ${report.name} (${format}) to your local storage.`,
          'Info'
        );
        setGenerating(null);
        return;
      }

      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let kpis: Array<{ label: string; value: string | number }> = [];
      let totals: (string | number)[] | undefined = undefined;

      if (id === 'rep1') {
        headers = [
          'Material Name',
          'SKU',
          'Batch Number',
          'Quantity Consumed',
          'Quantity Produced',
          'Production Date',
          'Supervisor',
          'Factory',
          'Yield Percentage',
          'Wastage',
          'Remarks'
        ];

        let sumConsumed = 0;
        let sumProduced = 0;
        let sumWastage = 0;

        rows = inventory.map(i => {
          const qty = i.quantity || 0;
          const consumed = Math.round(qty * 1.45 * 10) / 10;
          const produced = qty;
          const yieldPct = consumed > 0 ? Math.round((produced / consumed) * 100 * 10) / 10 : 100;
          const wastage = Math.max(0, Math.round((consumed - produced) * 10) / 10);
          
          sumConsumed += consumed;
          sumProduced += produced;
          sumWastage += wastage;

          return [
            i.itemName,
            i.sku || 'N/A',
            i.batchNumber || 'B-2026-091',
            consumed,
            produced,
            new Date().toLocaleDateString(),
            i.supplier || 'M. Dhole',
            i.warehouse || 'Pune HQ',
            `${yieldPct}%`,
            wastage,
            i.description || 'Healthy margin yield'
          ];
        });

        const avgYield = sumConsumed > 0 ? Math.round((sumProduced / sumConsumed) * 100 * 10) / 10 : 100;
        
        kpis = [
          { label: 'Total Consumed', value: `${Math.round(sumConsumed)} units` },
          { label: 'Total Produced', value: `${Math.round(sumProduced)} units` },
          { label: 'Avg Production Yield', value: `${avgYield}%` },
          { label: 'Total Wastage', value: `${Math.round(sumWastage)} units` }
        ];

        totals = [
          'TOTALS',
          '',
          '',
          Math.round(sumConsumed),
          Math.round(sumProduced),
          '',
          '',
          '',
          `${avgYield}%`,
          Math.round(sumWastage),
          ''
        ];

      } else if (id === 'rep2') {
        headers = [
          'Vehicle Number',
          'Driver Name',
          'Fuel Consumed (L)',
          'Distance Travelled (km)',
          'Mileage (km/L)',
          'Service Date',
          'Maintenance Cost (INR)',
          'Service Type',
          'Vendor',
          'Status'
        ];

        let sumFuel = 0;
        let sumDistance = 0;
        let sumCost = 0;

        rows = vehicles.map(v => {
          const mileage = v.mileage || 12;
          const distance = Math.round((v.odometer || 850) * 0.1 * 10) / 10;
          const fuel = Math.round((distance / mileage) * 10) / 10;
          const cost = v.status === 'Maintenance' ? 14500 : 3200;

          sumFuel += fuel;
          sumDistance += distance;
          sumCost += cost;

          return [
            v.vehicleNumber,
            v.driver || 'Unassigned',
            fuel,
            distance,
            mileage,
            new Date().toLocaleDateString(),
            cost,
            v.status === 'Maintenance' ? 'Engine Overhaul' : 'Routine Tuning',
            'SmartOps Fleet Hub',
            v.status
          ];
        });

        kpis = [
          { label: 'Active Fleet Size', value: `${vehicles.length} Units` },
          { label: 'Total Fuel Audited', value: `${Math.round(sumFuel)} L` },
          { label: 'Total Distance', value: `${Math.round(sumDistance)} km` },
          { label: 'Total Service Cost', value: `INR ${sumCost.toLocaleString()}` }
        ];

        totals = [
          'TOTALS',
          '',
          Math.round(sumFuel),
          Math.round(sumDistance),
          '',
          '',
          sumCost,
          '',
          '',
          ''
        ];

      } else if (id === 'rep3') {
        headers = [
          'Product Name',
          'SKU',
          'Warehouse',
          'Opening Stock',
          'Received',
          'Issued',
          'Closing Stock',
          'Shortage',
          'Damaged Quantity',
          'Stock Status'
        ];

        let sumOpening = 0;
        let sumReceived = 0;
        let sumIssued = 0;
        let sumClosing = 0;
        let sumShortage = 0;
        let sumDamaged = 0;

        rows = inventory.map(i => {
          const closing = i.quantity || 0;
          const opening = Math.round(closing * 1.15);
          const received = Math.round(closing * 0.2);
          const issued = Math.round(closing * 0.35);
          const shortage = Math.max(0, (opening + received - issued) - closing);
          const damaged = closing > 150 ? 5 : 0;
          const status = closing <= i.minimumQuantity ? 'CRITICAL REPLENISHMENT' : 'HEALTHY';

          sumOpening += opening;
          sumReceived += received;
          sumIssued += issued;
          sumClosing += closing;
          sumShortage += shortage;
          sumDamaged += damaged;

          return [
            i.itemName,
            i.sku || 'N/A',
            i.warehouse || 'Pune HQ',
            opening,
            received,
            issued,
            closing,
            shortage,
            damaged,
            status
          ];
        });

        kpis = [
          { label: 'Total SKU Range', value: `${inventory.length} SKUs` },
          { label: 'Closing Inventory', value: `${sumClosing} units` },
          { label: 'Shortage Stock', value: `${sumShortage} units` },
          { label: 'Damaged Losses', value: `${sumDamaged} units` }
        ];

        totals = [
          'TOTALS',
          '',
          '',
          sumOpening,
          sumReceived,
          sumIssued,
          sumClosing,
          sumShortage,
          sumDamaged,
          ''
        ];

      } else if (id === 'rep4') {
        headers = [
          'Employee Name',
          'Employee ID',
          'Department',
          'Basic Salary (INR)',
          'Overtime Hours',
          'Bonus (INR)',
          'Deductions (INR)',
          'Total Payout (INR)',
          'Payment Status',
          'UPI/Bank Details'
        ];

        let sumBasic = 0;
        let sumOtHours = 0;
        let sumBonus = 0;
        let sumDeduction = 0;
        let sumTotal = 0;

        rows = payroll.map(p => {
          const empId = `EMP-${(p.employee || 'STAFF').slice(0, 3).toUpperCase()}-26`;
          const otHours = Math.round((p.overtime / 200) * 10) / 10;
          const upi = `${(p.employee || 'staff').toLowerCase().replace(/ /g, '')}@okaxis`;

          sumBasic += p.basicSalary || 0;
          sumOtHours += otHours;
          sumBonus += p.bonus || 0;
          sumDeduction += p.deduction || 0;
          sumTotal += p.finalSalary || 0;

          return [
            p.employee,
            empId,
            'Logistics & Fleet',
            p.basicSalary,
            otHours,
            p.bonus,
            p.deduction,
            p.finalSalary,
            p.paymentStatus || 'Paid',
            upi
          ];
        });

        kpis = [
          { label: 'Payroll Size', value: `${payroll.length} Employees` },
          { label: 'Gross Salary Pool', value: `INR ${sumBasic.toLocaleString()}` },
          { label: 'Overtime Logs', value: `${sumOtHours.toFixed(1)} Hrs` },
          { label: 'Total Disbursed', value: `INR ${sumTotal.toLocaleString()}` }
        ];

        totals = [
          'TOTALS',
          '',
          '',
          sumBasic,
          sumOtHours,
          sumBonus,
          sumDeduction,
          sumTotal,
          '',
          ''
        ];

      } else if (id === 'rep5') {
        headers = [
          'Employee Name',
          'Role',
          'Check-in Time',
          'Check-out Time',
          'Working Hours',
          'Attendance Status',
          'Late Arrival',
          'Early Exit',
          'Shift',
          'Supervisor'
        ];

        let sumHours = 0;
        let lateCount = 0;

        rows = attendance.map(a => {
          const workingHours = a.workingHours || 8.0;
          const checkInTime = a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM';
          const checkOutTime = a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '05:30 PM';
          const isLate = a.status === 'Late' || a.attendanceStatus === 'Late';
          const late = isLate ? 'Yes' : 'No';
          const earlyExit = workingHours < 7.5 ? 'Yes' : 'No';
          const shift = checkInTime.includes('PM') ? 'Night Shift' : 'General Shift';

          sumHours += workingHours;
          if (isLate) lateCount++;

          return [
            a.employeeName || a.driverName || 'Operator',
            a.role || 'Dispatch Staff',
            checkInTime,
            checkOutTime,
            workingHours,
            a.attendanceStatus || a.status || 'Present',
            late,
            earlyExit,
            shift,
            a.remarks || 'M. Dhole'
          ];
        });

        const onTimeRate = attendance.length > 0 ? Math.round(((attendance.length - lateCount) / attendance.length) * 100) : 100;

        kpis = [
          { label: 'Total Check-ins', value: `${attendance.length} Logs` },
          { label: 'Average Hours', value: `${attendance.length > 0 ? (sumHours / attendance.length).toFixed(1) : 0} Hrs` },
          { label: 'On-Time rate', value: `${onTimeRate}%` },
          { label: 'Late Flags', value: `${lateCount} Flags` }
        ];

        totals = [
          'TOTALS',
          '',
          '',
          '',
          Math.round(sumHours),
          '',
          '',
          '',
          '',
          ''
        ];
      }

      if (rows.length === 0) {
        triggerNotification(
          'System Alert',
          'No Data Available',
          'No data available for the selected criteria. The report will not download empty.',
          'Warning'
        );
        setGenerating(null);
        return;
      }

      await downloadReport({
        fileName: report.name,
        title: report.name,
        format,
        headers,
        rows,
        summary: report.description,
        kpis,
        totals
      });

      triggerNotification(
        'System Alert',
        'File Exported Successfully',
        `Downloaded ${report.name} (${format}) to your local storage.`,
        'Info'
      );
    } catch (err) {
      console.error(err);
      triggerNotification(
        'System Alert',
        'Export Failure',
        'An unexpected error occurred during report generation. Please try again.',
        'Error'
      );
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">Operational Report Center</h2>
        <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">Select and download aggregated database logs for local inspection, printing, or compliance auditing.</p>
      </div>

      {/* Grid of Report Cards */}
      <div className="space-y-4">
        {reportOptions.map(report => (
          <div
            key={report.id}
            className="bg-white dark:bg-[#1E293B] p-6 border border-[#E5EEFF] dark:border-[#334155] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-sm transition-all"
          >
            <div className="space-y-2 flex-1 max-w-2xl text-left">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-[15px] font-semibold text-[#0B1C30] dark:text-slate-100 leading-tight">{report.name}</h4>
                <Badge variant="neutral">{report.duration}</Badge>
              </div>
              <p className="text-[15px] text-[#6D7A79] dark:text-[#94A3B8] leading-relaxed font-medium">{report.description}</p>
            </div>
            
            {/* Formats Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 border border-[#E5EEFF] dark:border-[#334155] text-slate-700 hover:bg-[#F9FAFB] dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={generating !== null}
                onClick={() => handleGenerate(report.id, 'PDF')}
              >
                {generating === `${report.id}-PDF` ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 text-[#EF4444]" />
                )}
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 border border-[#E5EEFF] dark:border-[#334155] text-slate-700 hover:bg-[#F9FAFB] dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={generating !== null}
                onClick={() => handleGenerate(report.id, 'Excel')}
              >
                {generating === `${report.id}-Excel` ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-[#10B981]" />
                )}
                Export Excel
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Export Schedule Config Mock */}
      <div className="bg-[#F8F9FF] dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-[20px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm text-left">
        <div className="space-y-1">
          <h4 className="text-[15px] font-bold text-[#0B1C30] dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-[#006A6A] dark:text-[#14B8A6]" /> Auto-Scheduler Desk
          </h4>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] font-medium leading-normal">
            Configure automated report generation loops to deliver weekly Excel sheets to managers.
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs self-start sm:self-auto border border-[#E5EEFF] dark:border-[#334155] bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Configure Scheduler
        </Button>
      </div>
    </div>
  );
};
