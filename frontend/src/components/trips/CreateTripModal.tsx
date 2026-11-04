import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MapPin, Plus, Trash2, Truck, User, Calendar, Clock, AlertCircle, Zap } from 'lucide-react';
import { Trip, TripStop } from '../../types';
import { useOperations } from '../../store/OperationsContext';
import { api } from '../../api/client';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated?: (trip: Trip) => void;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({ isOpen, onClose, onTripCreated }) => {
  const { vehicles, attendance, createTrip, triggerNotification } = useOperations();

  const [tripId, setTripId] = useState<string>(`TRP-${Date.now().toString().slice(-6)}`);
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState<string>('Pune DC Gate 1, Maharashtra');
  const [pickupLat, setPickupLat] = useState<number>(18.5204);
  const [pickupLng, setPickupLng] = useState<number>(73.8567);
  const [dropLocation, setDropLocation] = useState<string>('Chakan Industrial Estate, Pune');
  const [dropLat, setDropLat] = useState<number>(18.7602);
  const [dropLng, setDropLng] = useState<number>(73.8612);

  // Cargo & Priority
  const [cargoDesc, setCargoDesc] = useState<string>('Automotive Spare Components');
  const [cargoQty, setCargoQty] = useState<number>(120);
  const [cargoWeight, setCargoWeight] = useState<string>('2.4 Tons');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');

  // Time & Schedule Flow Settings
  const [scheduleDate, setScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [expectedEndTime, setExpectedEndTime] = useState<string>('14:00');
  const [notes, setNotes] = useState<string>('Handle fragile crates with care. Verify identity upon arrival.');

  // Intermediate Waypoint Stops
  const [stops, setStops] = useState<TripStop[]>([
    {
      sequence: 1,
      address: 'Bhiwandi Hub Gate 4',
      latitude: 19.2968,
      longitude: 73.0631,
      status: 'Pending',
      notes: 'Unload Crate B-12'
    }
  ]);

  const [driverOptions, setDriverOptions] = useState<{ driverId: string; name: string; vehicleNumber?: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset modal fields on open
  useEffect(() => {
    if (isOpen) {
      setTripId(`TRP-${Date.now().toString().slice(-6)}`);
      setErrorMsg(null);
      setScheduleDate(new Date().toISOString().split('T')[0]);
      
      const now = new Date();
      const startH = String(now.getHours()).padStart(2, '0');
      const startM = String(now.getMinutes()).padStart(2, '0');
      setStartTime(`${startH}:${startM}`);

      const endH = String((now.getHours() + 4) % 24).padStart(2, '0');
      setExpectedEndTime(`${endH}:${startM}`);
    }
  }, [isOpen]);

  // Load Drivers from DB & Context
  useEffect(() => {
    let isMounted = true;
    const fetchRegisteredDrivers = async () => {
      const list: { driverId: string; name: string; vehicleNumber?: string }[] = [];
      const seen = new Set<string>();

      // 1. Attendance drivers
      attendance.forEach(a => {
        if (!a) return;
        const id = a.driverId;
        const name = a.driverName || a.employeeName || '';
        if (id && name && !seen.has(id)) {
          seen.add(id);
          list.push({ driverId: id, name, vehicleNumber: a.vehicleNumber });
        }
      });

      // 2. MongoDB Drivers
      try {
        const dbRes = await api.drivers.getAll();
        const driversData = Array.isArray(dbRes) ? dbRes : dbRes?.data || [];
        driversData.forEach((d: any) => {
          const id = d.driverId || d.id || d._id;
          const name = d.fullName || d.name || 'Driver';
          if (id && !seen.has(id)) {
            seen.add(id);
            list.push({ driverId: id, name, vehicleNumber: d.vehicleNumber });
          }
        });
      } catch (err) {
        console.warn('API driver fetch fallback:', err);
      }

      if (isMounted) {
        setDriverOptions(list);
        if (list.length > 0 && !driverId) {
          setDriverId(list[0].driverId);
          setDriverName(list[0].name);
          if (list[0].vehicleNumber) setVehicleNumber(list[0].vehicleNumber);
        }
      }
    };

    fetchRegisteredDrivers();
    return () => { isMounted = false; };
  }, [isOpen, attendance]);

  // Default vehicle fallback
  useEffect(() => {
    if (!vehicleNumber && vehicles.length > 0) {
      setVehicleNumber(vehicles[0].vehicleNumber);
    }
  }, [vehicles, vehicleNumber]);

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = e.target.value;
    setDriverId(dId);
    const selected = driverOptions.find(d => d.driverId === dId);
    if (selected) {
      setDriverName(selected.name);
      if (selected.vehicleNumber) setVehicleNumber(selected.vehicleNumber);
    }
  };

  const handleAddStop = () => {
    setStops(prev => [
      ...prev,
      {
        sequence: prev.length + 1,
        address: `Transit Stop ${prev.length + 1}`,
        latitude: 18.6000 + prev.length * 0.05,
        longitude: 73.8000 + prev.length * 0.05,
        status: 'Pending'
      }
    ]);
  };

  const handleRemoveStop = (idx: number) => {
    setStops(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sequence: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const effectiveDriverId = driverId || (driverOptions[0]?.driverId) || '';
    const effectiveDriverName = driverName || (driverOptions[0]?.name) || 'Unassigned Driver';
    const effectiveVehicle = vehicleNumber || (vehicles[0]?.vehicleNumber) || 'Unassigned Vehicle';

    if (!pickupLocation) return setErrorMsg('Pickup location is required.');
    if (!dropLocation) return setErrorMsg('Destination location is required.');

    setIsSubmitting(true);
    try {
      const scheduledStartISO = new Date(`${scheduleDate}T${startTime}:00`).toISOString();
      const expectedEndISO = new Date(`${scheduleDate}T${expectedEndTime}:00`).toISOString();

      const payload: Partial<Trip> = {
        tripNumber: tripId,
        driverId: effectiveDriverId,
        driverName: effectiveDriverName,
        vehicleNumber: effectiveVehicle,
        pickupLocation,
        pickupCoordinates: { lat: pickupLat || 18.5204, lng: pickupLng || 73.8567 },
        dropLocation,
        dropCoordinates: { lat: dropLat || 18.7602, lng: dropLng || 73.8612 },
        customerName: 'Fourise Logistics Partner',
        customerPhone: '9876543210',
        material: cargoDesc,
        weight: cargoWeight,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        priority,
        cargo: {
          description: cargoDesc,
          quantity: cargoQty,
          weight: cargoWeight
        },
        stops,
        scheduledStart: scheduledStartISO as any,
        expectedEnd: expectedEndISO as any,
        notes,
        status: 'Assigned',
        eta: '34 Mins',
        distanceRemaining: 18.5,
        currentLocation: pickupLocation,
        currentAddress: pickupLocation,
        latitude: pickupLat || 18.5204,
        longitude: pickupLng || 73.8567
      };

      const created = await createTrip(payload);
      setIsSubmitting(false);
      triggerNotification('Trip Started', 'New Trip Dispatched', `Trip ${created.tripNumber || tripId} assigned to driver ${effectiveDriverName}.`, 'Info');
      if (onTripCreated) onTripCreated(created);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to create trip consignment.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create & Assign New Trip (${tripId})`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-left text-xs max-h-[82vh] overflow-y-auto pr-1">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Driver & Vehicle Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#6D7A79] font-bold mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-teal-600" /> Assign Driver *
            </label>
            <select
              value={driverId}
              onChange={handleDriverChange}
              className="w-full p-2.5 rounded-xl border border-[#E5EEFF] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-bold text-slate-800 dark:text-white"
            >
              {driverOptions.map(d => d && d.driverId ? (
                <option key={d.driverId} value={d.driverId}>
                  {d.name || 'Driver'} ({d.driverId})
                </option>
              ) : null)}
            </select>
          </div>

          <div>
            <label className="block text-[#6D7A79] font-bold mb-1 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-teal-600" /> Vehicle Registration *
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={e => setVehicleNumber(e.target.value)}
              placeholder="e.g. MH-12-TRK-9041"
              className="w-full p-2.5 rounded-xl border border-[#E5EEFF] dark:border-[#334155] bg-white dark:bg-[#0F172A] font-bold text-slate-800 dark:text-white"
              required
            />
          </div>
        </div>

        {/* TIME & SCHEDULE FLOW SETTINGS */}
        <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
          <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
            <Clock className="w-4 h-4 text-teal-600" /> Schedule & Time Flow Settings
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Dispatch Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Scheduled Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Expected Delivery Time</label>
              <input
                type="time"
                value={expectedEndTime}
                onChange={e => setExpectedEndTime(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                required
              />
            </div>
          </div>
        </div>

        {/* Pickup & Drop Locations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 uppercase text-[10px] tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Pickup Location (Origin) *
            </span>
            <input
              type="text"
              placeholder="Pickup Street Address"
              value={pickupLocation}
              onChange={e => setPickupLocation(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-2">
            <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1 uppercase text-[10px] tracking-wide">
              <MapPin className="w-3.5 h-3.5 text-red-600" /> Drop Location (Destination) *
            </span>
            <input
              type="text"
              placeholder="Drop Street Address"
              value={dropLocation}
              onChange={e => setDropLocation(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              required
            />
          </div>
        </div>

        {/* Intermediate Waypoints */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wide">
              Intermediate Waypoints ({stops.length})
            </span>
            <button
              type="button"
              onClick={handleAddStop}
              className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Stop
            </button>
          </div>
          {stops.map((stop, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-slate-400 font-bold text-[10px]">#{stop.sequence}</span>
              <input
                type="text"
                value={stop.address}
                onChange={e => {
                  const updated = [...stops];
                  updated[idx].address = e.target.value;
                  setStops(updated);
                }}
                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs"
              />
              <button
                type="button"
                onClick={() => handleRemoveStop(idx)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Cargo & Priority */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-slate-500 font-bold mb-1">Cargo Description</label>
            <input
              type="text"
              value={cargoDesc}
              onChange={e => setCargoDesc(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-bold mb-1">Weight</label>
            <input
              type="text"
              value={cargoWeight}
              onChange={e => setCargoWeight(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-bold mb-1">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-slate-500 font-bold mb-1">Dispatch Remarks / Instructions</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
          />
        </div>

        {/* Submit */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="bg-[#006A6A] hover:bg-[#005555] text-white px-5 py-2 rounded-xl font-bold"
          >
            {isSubmitting ? 'Dispatching Trip...' : 'Confirm & Dispatch Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
