import React, { useState } from 'react';
import { useOperations } from '../../store/OperationsContext';
import { Table } from '../../components/tables/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Truck, MapPin, Gauge, ShieldAlert, Plus, Edit2, Trash2, Download, FileCheck, CheckCircle2, Clock, Users, UserCheck, Navigation } from 'lucide-react';
import { Trip, Vehicle } from '../../types';
import { GoogleDriverMap } from '../../components/common/GoogleDriverMap';

export const Fleet: React.FC = () => {
  const { vehicles, trips, createVehicle, updateVehicle, deleteVehicle } = useOperations();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedPODTrip, setSelectedPODTrip] = useState<Trip | null>(null);
  const [trackingModalTrip, setTrackingModalTrip] = useState<Trip | null>(null);
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [fleetSubmitting, setFleetSubmitting] = useState(false);

  const downloadPODPDF = (trip: Trip) => {
    alert(`Compiling Proof of Delivery PDF for ${trip.tripNumber}... Download started!`);
    const doc = window.open('', '_blank');
    if (doc) {
      doc.document.write(`
        <html>
          <head>
            <title>Proof of Delivery - ${trip.tripNumber}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #1e293b; }
              .ref { font-family: monospace; color: #64748b; margin-top: 5px; }
              .section { margin-bottom: 25px; }
              .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .field { font-size: 12px; }
              .label { color: #64748b; font-weight: 500; }
              .value { font-weight: 600; color: #0f172a; margin-top: 2px; }
              .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px; }
              .photo { width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; }
              .signature { max-width: 200px; max-height: 100px; border-bottom: 1px dashed #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">SMARTOPS LOGISTICS GATEWAY</div>
              <div class="ref">Official Receipt Reference: POD-RECIEPT-${trip.tripNumber}</div>
            </div>
            <div class="section">
              <div class="section-title">Consignment Run Details</div>
              <div class="grid">
                <div class="field"><div class="label">Trip ID</div><div class="value">${trip.tripNumber}</div></div>
                <div class="field"><div class="label">Invoice Reference</div><div class="value">${trip.invoiceNumber}</div></div>
                <div class="field"><div class="label">Assigned Operator</div><div class="value">${trip.driverName}</div></div>
                <div class="field"><div class="label">Vehicle Registration</div><div class="value">${trip.vehicleNumber}</div></div>
                <div class="field"><div class="label">Pickup Source</div><div class="value">${trip.pickupLocation}</div></div>
                <div class="field"><div class="label">Delivery Drop Destination</div><div class="value">${trip.dropLocation}</div></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Consignee Receipt Checklist</div>
              <div class="grid">
                <div class="field"><div class="label">Customer Name</div><div class="value">${trip.customerName}</div></div>
                <div class="field"><div class="label">Status</div><div class="value">Delivered & Verified</div></div>
                <div class="field"><div class="label">Timestamp</div><div class="value">${new Date((trip as any).updatedAt || trip.timestamp).toLocaleString()}</div></div>
                <div class="field"><div class="label">GPS Validation coordinates</div><div class="value">Lat: 19.0760, Lng: 72.8777 (Verified)</div></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Proof of Delivery Photos</div>
              <div class="photo-grid">
                \${trip.deliveryPhoto && trip.deliveryPhoto.length > 0
                  ? trip.deliveryPhoto.map(p => \`<img src="\${p}" class="photo" />\`).join('')
                  : '<p style="font-size: 12px; color: #94a3b8;">No physical cargo photo verification loaded.</p>'
                }
              </div>
            </div>
            <div class="section">
              <div class="section-title">Customer Consignee Signature Verification</div>
              \${trip.signatureData
                ? \`<img src="\${trip.signatureData}" class="signature" />\`
                : '<p style="font-size: 12px; color: #94a3b8;">No customer consignee digital signature locked.</p>'
              }
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      doc.document.close();
    }
  };

  // Form state
  const [form, setForm] = useState({
    vehicleNumber: '',
    vehicleType: 'Container Truck (18T)',
    driver: '',
    rcNumber: '',
    insurance: '',
    permit: '',
    fitness: '',
    fuelType: 'Diesel',
    mileage: 6.0,
    currentLocation: '',
    status: 'Idle' as Vehicle['status']
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'mileage' ? Number(value) : value
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFleetError(null);
    setFleetSubmitting(true);
    try {
      await createVehicle(form);
      setCreateModalOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to register vehicle.';
      setFleetError(msg);
    } finally {
      setFleetSubmitting(false);
    }
  };

  const handleEditClick = (veh: Vehicle) => {
    setSelectedVehicle(veh);
    setForm({
      vehicleNumber: veh.vehicleNumber,
      vehicleType: veh.vehicleType,
      driver: veh.driver,
      rcNumber: veh.rcNumber,
      insurance: veh.insurance,
      permit: veh.permit,
      fitness: veh.fitness,
      fuelType: veh.fuelType,
      mileage: veh.mileage,
      currentLocation: veh.currentLocation,
      status: veh.status
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    setFleetError(null);
    setFleetSubmitting(true);
    try {
      await updateVehicle(selectedVehicle.id, form);
      setEditModalOpen(false);
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update vehicle.';
      setFleetError(msg);
    } finally {
      setFleetSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to remove this vehicle asset from register?')) {
      try {
        await deleteVehicle(id);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to delete vehicle.';
        setFleetError(msg);
      }
    }
  };

  const resetForm = () => {
    setForm({
      vehicleNumber: '',
      vehicleType: 'Container Truck (18T)',
      driver: '',
      rcNumber: '',
      insurance: '',
      permit: '',
      fitness: '',
      fuelType: 'Diesel',
      mileage: 6.0,
      currentLocation: '',
      status: 'Idle'
    });
    setSelectedVehicle(null);
  };

  const activeTripColumns = [
    {
      header: 'Trip ID',
      accessor: (row: Trip) => <span className="font-mono text-xs font-semibold text-[#0B1C30] dark:text-[#CBD5E1]">{row.tripNumber}</span>,
      sortKey: 'tripNumber' as keyof Trip,
    },
    {
      header: 'Driver Name',
      accessor: 'driverName' as keyof Trip,
      sortKey: 'driverName' as keyof Trip,
    },
    {
      header: 'Vehicle Reg',
      accessor: 'vehicleNumber' as keyof Trip,
      sortKey: 'vehicleNumber' as keyof Trip,
    },
    {
      header: 'Locations Map',
      accessor: (row: Trip) => (
        <div className="flex flex-col gap-1 max-w-xs text-left">
          <span className="text-xs text-[#545F73] dark:text-[#CBD5E1] font-semibold whitespace-normal break-words leading-tight flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006A6A] shrink-0" />
            Pick: {row.pickupLocation}
          </span>
          <span className="text-xs text-[#6D7A79] whitespace-normal break-words leading-tight flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0" />
            Drop: {row.dropLocation}
          </span>
        </div>
      ),
    },
    {
      header: 'Remaining dist',
      accessor: (row: Trip) => (
        <div className="flex flex-col gap-1.5 w-28 text-left">
          <span className="font-bold text-slate-700 dark:text-[#CBD5E1] text-xs">{row.distanceRemaining} km left</span>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#006A6A] rounded-full" 
              style={{ width: `${Math.max(10, Math.min(100, 100 - (row.distanceRemaining / 4.8)))}%` }} 
            />
          </div>
        </div>
      ),
      sortKey: 'distanceRemaining' as keyof Trip,
    },
    {
      header: 'ETA Clock',
      accessor: (row: Trip) => <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{row.eta}</span>,
    },
    {
      header: 'Transit Status',
      accessor: (row: Trip) => (
        <Badge
          variant={
            row.status === 'Completed' || row.status === 'Delivered'
              ? 'success'
              : (row.status as any) === 'Delayed'
              ? 'danger'
              : row.status === 'In Transit' || row.status === 'Started'
              ? 'info'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
      sortKey: 'status' as keyof Trip,
    },
    {
      header: 'Actions',
      accessor: (row: Trip) => {
        const hasPOD = row.status === 'Completed' || row.deliveryPhoto?.length || row.signatureData;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrackingModalTrip(row)}
              className="text-[10px] py-1 px-2.5 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-400 font-bold flex items-center gap-1"
            >
              <Navigation className="w-3 h-3 text-blue-500" />
              <span>Track Map</span>
            </Button>
            {hasPOD ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedPODTrip(row)}
                className="text-[10px] py-1 px-3 rounded-lg shadow-md shadow-teal-900/10 cursor-pointer"
              >
                View POD
              </Button>
            ) : (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                In Transit
              </span>
            )}
          </div>
        );
      }
    }
  ];

  const vehicleColumns = [
    {
      header: 'Vehicle Registration',
      accessor: (row: Vehicle) => (
        <div className="text-left">
          <span className="font-bold text-[#0B1C30] text-sm block">{row.vehicleNumber}</span>
          <span className="text-[11px] text-[#6D7A79] block mt-0.5">{row.vehicleType}</span>
        </div>
      ),
      sortKey: 'vehicleNumber' as keyof Vehicle,
    },
    {
      header: 'Driver Assigned',
      accessor: 'driver' as keyof Vehicle,
      sortKey: 'driver' as keyof Vehicle,
    },
    {
      header: 'Fuel / Mileage',
      accessor: (row: Vehicle) => (
        <div className="text-left">
          <span className="font-bold text-slate-700 dark:text-[#CBD5E1] block">{row.fuelType}</span>
          <span className="text-[11px] text-[#6D7A79] block mt-0.5">({row.mileage} km/l)</span>
        </div>
      ),
    },
    {
      header: 'Last Location',
      accessor: 'currentLocation' as keyof Vehicle,
      sortKey: 'currentLocation' as keyof Vehicle,
    },
    {
      header: 'Expiry Dates',
      accessor: (row: Vehicle) => (
        <div className="text-[11px] text-[#6D7A79] space-y-0.5 text-left">
          <div>Permit: <span className="font-mono text-slate-700 dark:text-[#CBD5E1]">{row.permit}</span></div>
          <div>Fitness: <span className="font-mono text-slate-700 dark:text-[#CBD5E1]">{row.fitness}</span></div>
        </div>
      ),
    },
    {
      header: 'Diagnostics Status',
      accessor: (row: Vehicle) => (
        <Badge variant={row.status === 'Moving' ? 'success' : row.status === 'Delayed' ? 'danger' : 'info'}>
          {row.status}
        </Badge>
      ),
      sortKey: 'status' as keyof Vehicle,
    },
    {
      header: 'Actions',
      accessor: (row: Vehicle) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[#6D7A79] hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl text-slate-400 hover:text-[#EF4444] transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">Fleet & Diagnostics Registry</h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">Directly execute full CRUD operations over transport vehicles.</p>
        </div>
        <Button
          onClick={() => { resetForm(); setCreateModalOpen(true); }}
          variant="primary"
          className="text-xs py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-teal-900/10 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {/* Fleet Error Banner */}
      {fleetError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <span className="text-red-600 dark:text-red-400 text-sm font-semibold">⚠ {fleetError}</span>
          <button
            onClick={() => setFleetError(null)}
            className="ml-auto text-red-400 hover:text-red-600 text-xs font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#006A6A]/10 text-[#006A6A] dark:text-[#14B8A6]">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Total Fleet Size</span>
            <h4 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-white leading-tight">{vehicles.length} Carriers</h4>
            <p className="text-[11px] text-[#6D7A79] mt-0.5 font-medium">Medium to heavy cargo haulers</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#10B981]/10 text-[#10B981]">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Transit Cargo Runs</span>
            <h4 className="text-[26px] font-extrabold text-[#10B981] leading-tight">{trips.filter(t => t.status !== 'Completed').length} active</h4>
            <p className="text-[11px] text-[#6D7A79] mt-0.5 font-medium">GPS trackers synced</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-[#E5EEFF] dark:border-[#334155] shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 text-[#EF4444]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[13px] font-semibold text-[#6D7A79] dark:text-[#6D7A79] uppercase tracking-tight block">Yard Maintenance Alerts</span>
            <h4 className="text-[26px] font-extrabold text-[#EF4444] leading-tight">{vehicles.filter(v => v.status === 'Maintenance').length} Flags</h4>
            <p className="text-[11px] text-[#6D7A79] mt-0.5 font-medium">Servicing in progress</p>
          </div>
        </div>
      </div>

      {/* Trips list */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] mb-5 uppercase tracking-wide">Active Cargo Trips (Real-time telemetry)</h3>
        <Table
          data={trips}
          columns={activeTripColumns}
          searchKey="tripNumber"
          searchPlaceholder="Search active runs..."
          exportFileName="trips-telemetry"
        />
      </div>

      {/* Vehicles CRUD list */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
        <h3 className="text-[15px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] mb-5 uppercase tracking-wide">Diagnostics Registry</h3>
        <Table
          data={vehicles}
          columns={vehicleColumns}
          searchKey="vehicleNumber"
          searchPlaceholder="Search registry plates..."
          exportFileName="vehicles-crud-registry"
        />
      </div>

      {/* Forms */}
      {[
        { isOpen: createModalOpen, setOpen: setCreateModalOpen, title: 'Register New Fleet Vehicle', submit: handleCreateSubmit },
        { isOpen: editModalOpen, setOpen: setEditModalOpen, title: 'Modify Vehicle Details', submit: handleEditSubmit }
      ].map((modal, idx) => (
        <Modal key={idx} isOpen={modal.isOpen} onClose={() => modal.setOpen(false)} title={modal.title} size="lg">
          <form onSubmit={modal.submit} className="space-y-5 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Vehicle Registration No.</label>
                <input
                  type="text"
                  required
                  name="vehicleNumber"
                  placeholder="e.g. MH-12-QW-9874"
                  value={form.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Vehicle Type</label>
                <select
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                  <option>Container Truck (18T)</option>
                  <option>Flatbed Trailer (24T)</option>
                  <option>Reefer Truck (15T)</option>
                  <option>Box Truck (7T)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Assigned Driver</label>
                <input
                  type="text"
                  required
                  name="driver"
                  placeholder="e.g. Driver Name"
                  value={form.driver}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">RC Smartcard Number</label>
                <input
                  type="text"
                  required
                  name="rcNumber"
                  placeholder="e.g. RC-MH-12-9874"
                  value={form.rcNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Insurance Expiry</label>
                <input
                  type="date"
                  required
                  name="insurance"
                  value={form.insurance}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Permit Expiry</label>
                <input
                  type="date"
                  required
                  name="permit"
                  value={form.permit}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Fitness Cert Expiry</label>
                <input
                  type="date"
                  required
                  name="fitness"
                  value={form.fitness}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Fuel Type</label>
                <select
                  name="fuelType"
                  value={form.fuelType}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="EV">Electric (EV)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Mileage (km/l)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  name="mileage"
                  value={form.mileage}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Diagnostics Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleInputChange}
                  className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium cursor-pointer"
                >
                  <option value="Idle">Idle (Yard)</option>
                  <option value="Moving">Moving (Transit)</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-[#545F73] dark:text-[#CBD5E1] uppercase">Current GPS Location</label>
              <input
                type="text"
                required
                name="currentLocation"
                placeholder="e.g. Pune Highway"
                value={form.currentLocation}
                onChange={handleInputChange}
                className="w-full px-4 h-12 text-sm border border-[#E5EEFF] dark:border-[#334155] bg-[#F8F9FF] focus:bg-white focus:ring-2 focus:ring-[#006A6A]/20 focus:border-[#006A6A] rounded-xl focus:outline-none transition-all shadow-sm font-medium"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => modal.setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={fleetSubmitting}>
                {fleetSubmitting ? 'Saving...' : 'Save Vehicle'}

              </Button>
            </div>
          </form>
        </Modal>
      ))}

      {/* Proof of Delivery Inspection Modal */}
      <Modal
        isOpen={selectedPODTrip !== null}
        onClose={() => setSelectedPODTrip(null)}
        title={`POD Cargo Verification: ${selectedPODTrip?.tripNumber}`}
        size="xl"
      >
        {selectedPODTrip && (
          <div className="space-y-6 text-[#0B1C30] dark:text-slate-100 text-left">
            {/* Header Status Bar */}
            <div className="flex justify-between items-center bg-[#F8F9FF] dark:bg-[#1E293B]/60 p-5 rounded-2xl border border-[#E5EEFF] dark:border-[#334155]">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#6D7A79] uppercase tracking-wider block">Official Receipt Code</span>
                <p className="font-mono text-xs font-bold text-[#006A6A] dark:text-[#14B8A6]">
                  POD-RECEIPT-{selectedPODTrip.tripNumber}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant="success">? Verified & Audited</Badge>
                <Button
                  onClick={() => downloadPODPDF(selectedPODTrip)}
                  variant="primary"
                  className="text-xs py-1.5 px-3 rounded-lg shadow-sm"
                >
                  <Download className="h-4 w-4" /> Print PDF Receipt
                </Button>
              </div>
            </div>

            {/* Side-by-Side Metadata Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white dark:bg-[#1E293B]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-2xl space-y-3.5 shadow-sm">
                <h5 className="text-[13px] font-bold text-[#0B1C30] dark:text-[#6D7A79] uppercase tracking-wide border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-2.5">
                  Consignment & Vehicle
                </h5>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-[#6D7A79] block font-medium">Operator Name</span>
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{selectedPODTrip.driverName}</span>
                  </div>
                  <div>
                    <span className="text-[#6D7A79] block font-medium">Vehicle Reg</span>
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{selectedPODTrip.vehicleNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6D7A79] block font-medium">Invoice Number</span>
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC] font-mono">{selectedPODTrip.invoiceNumber}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-[#1E293B]/40 border border-[#E5EEFF] dark:border-[#334155] rounded-2xl space-y-3.5 shadow-sm">
                <h5 className="text-[13px] font-bold text-[#0B1C30] dark:text-[#6D7A79] uppercase tracking-wide border-b border-[#E5EEFF] dark:border-[#334155] dark:border-slate-800 pb-2.5">
                  Client & Transit Info
                </h5>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-[#6D7A79] block font-medium">Consignee Client</span>
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">{selectedPODTrip.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[#6D7A79] block font-medium">GPS Telemetry</span>
                    <span className="font-bold text-emerald-600 font-mono flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#10B981]" /> Verified GPS
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6D7A79] block font-medium">Completion Clock</span>
                    <span className="font-bold text-slate-800 dark:text-[#F8FAFC] font-mono">
                      {new Date((selectedPODTrip as any).updatedAt || selectedPODTrip.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Photos Gallery Section */}
            <div className="space-y-3">
              <h5 className="text-[13px] font-bold text-[#0B1C30] dark:text-[#6D7A79] uppercase tracking-wide">
                Cargo Delivery Verification Photos ({selectedPODTrip.deliveryPhoto?.length || 0})
              </h5>
              <div className="grid grid-cols-3 gap-4">
                {selectedPODTrip.deliveryPhoto && selectedPODTrip.deliveryPhoto.length > 0 ? (
                  selectedPODTrip.deliveryPhoto.map((photoUrl, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-[#E5EEFF] dark:border-[#334155] bg-slate-950 group shadow-sm">
                      <img
                        src={photoUrl}
                        alt={`Verification capture ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 p-8 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400 dark:text-[#6D7A79] bg-[#F8F9FF] dark:bg-[#0F172A]/20">
                    No physical cargo photo verification documents uploaded.
                  </div>
                )}
              </div>
            </div>

            {/* Signature Block */}
            <div className="space-y-3">
              <h5 className="text-[13px] font-bold text-[#0B1C30] dark:text-[#6D7A79] uppercase tracking-wide">
                Consignee E-Signature Verification
              </h5>
              <div className="p-5 bg-white dark:bg-[#0F172A] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl flex items-center justify-center h-36 relative shadow-sm">
                {selectedPODTrip.signatureData ? (
                  <img
                    src={selectedPODTrip.signatureData}
                    alt="Customer Consignee Signature"
                    className="max-h-full max-w-xs object-contain"
                  />
                ) : (
                  <p className="text-xs text-slate-400 dark:text-[#6D7A79] italic">No signature file archived.</p>
                )}
                <div className="absolute bottom-2.5 right-3.5 flex items-center gap-1 text-[11px] text-[#6D7A79] font-semibold">
                  <FileCheck className="h-4 w-4 text-emerald-500" /> Signature Match ID
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Live Driver Google Maps Tracking Modal */}
      <Modal
        isOpen={trackingModalTrip !== null}
        onClose={() => setTrackingModalTrip(null)}
        title={`Live Google Maps Telemetry: ${trackingModalTrip?.tripNumber || ''}`}
        size="xl"
      >
        {trackingModalTrip && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-800 text-slate-200">
              <div className="space-y-0.5">
                <span className="text-slate-400 block text-[10px] uppercase">Route Pathway</span>
                <span className="font-semibold text-white">
                  📍 {trackingModalTrip.pickupLocation} ➔ 🏁 {trackingModalTrip.dropLocation}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">Consignee</span>
                <span className="font-semibold text-teal-300">{trackingModalTrip.customerName}</span>
              </div>
            </div>

            <GoogleDriverMap
              driverLocation={{
                lat: trackingModalTrip.latitude || 18.5204,
                lng: trackingModalTrip.longitude || 73.8567,
                speed: trackingModalTrip.speed || 42,
                heading: trackingModalTrip.heading || 90,
                address: trackingModalTrip.currentAddress || trackingModalTrip.currentLocation || trackingModalTrip.pickupLocation
              }}
              pickupLocation={{
                lat: 18.5204,
                lng: 73.8567,
                address: trackingModalTrip.pickupLocation
              }}
              dropLocation={{
                lat: 18.7602,
                lng: 73.8612,
                address: trackingModalTrip.dropLocation
              }}
              driverName={trackingModalTrip.driverName}
              vehicleNumber={trackingModalTrip.vehicleNumber}
              tripNumber={trackingModalTrip.tripNumber}
              eta={trackingModalTrip.eta}
              distanceRemaining={trackingModalTrip.distanceRemaining}
              status={trackingModalTrip.status}
              height="400px"
              showControls={true}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};



