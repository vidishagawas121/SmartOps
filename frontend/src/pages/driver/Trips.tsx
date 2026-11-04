import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOperations } from '../../store/OperationsContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Truck,
  CheckCircle,
  Clock,
  Navigation,
  MapPin,
  FileText,
  AlertTriangle,
  Play,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Trip } from '../../types';

export const Trips: React.FC = () => {
  const { trips, user, updateTripStatus, triggerNotification } = useOperations();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'Assigned' | 'Active' | 'Completed' | 'Cancelled'>('Active');
  const [selectedDetailsTrip, setSelectedDetailsTrip] = useState<Trip | null>(null);

  // Filter ONLY trips assigned to logged-in Driver
  const driverId = user?.driverId || user?.id || 'DRV-9041';
  const myTrips = useMemo(() => {
    return trips.filter(t => t.driverId === driverId || t.driverId === 'd1' || t.driverId === 'DRV-9041');
  }, [trips, driverId]);

  // Tabbed Trip Collections
  const assignedTrips = useMemo(() => myTrips.filter(t => t.status === 'Assigned'), [myTrips]);
  const activeTrips = useMemo(() => myTrips.filter(t => ['Accepted', 'Started', 'In Transit', 'At Stop', 'Reached Pickup', 'Loaded', 'Reached Destination', 'Delayed', 'Incident Reported'].includes(t.status)), [myTrips]);
  const completedTrips = useMemo(() => myTrips.filter(t => t.status === 'Completed' || t.status === 'Delivered'), [myTrips]);
  const cancelledTrips = useMemo(() => myTrips.filter(t => t.status === 'Cancelled'), [myTrips]);

  const displayedTrips =
    activeTab === 'Assigned' ? assignedTrips :
    activeTab === 'Active' ? activeTrips :
    activeTab === 'Completed' ? completedTrips :
    cancelledTrips;

  const handleAccept = async (tripId: string) => {
    try {
      await updateTripStatus(tripId, 'Accepted');
      triggerNotification('Trip Started', 'Trip Assignment Accepted', 'Consignment accepted. Ready for departure.', 'Info');
    } catch (err: any) {
      alert(err.message || 'Failed to accept trip.');
    }
  };

  const handleStart = async (tripId: string) => {
    try {
      await updateTripStatus(tripId, 'In Transit');
      triggerNotification('Trip Started', 'Trip Started', 'Live location streaming active.', 'Info');
      navigate('/driver/active-trip');
    } catch (err: any) {
      alert(err.message || 'Failed to start trip.');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'success';
      case 'In Transit':
      case 'Started':
      case 'Accepted':
        return 'info';
      case 'Assigned':
        return 'warning';
      case 'At Stop':
        return 'warning';
      case 'Cancelled':
      case 'Incident Reported':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-[#0B1C30] dark:text-slate-100 tracking-tight leading-none">
            My Assigned Consignments
          </h2>
          <p className="text-[13px] text-[#6D7A79] dark:text-[#94A3B8] mt-1.5 font-medium">
            View, accept, and execute your assigned delivery routes and freight orders.
          </p>
        </div>

        {activeTrips.length > 0 && (
          <Button
            variant="primary"
            onClick={() => navigate('/driver/active-trip')}
            className="bg-[#006A6A] hover:bg-[#005555] text-white px-5 py-2.5 rounded-xl font-bold shadow-md"
          >
            <Navigation className="h-4 w-4 mr-2" /> Open Active Navigation Console
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5EEFF] dark:border-[#334155] pb-2 font-bold text-xs">
        <button
          onClick={() => setActiveTab('Active')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'Active'
              ? 'bg-[#006A6A] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Active Trips ({activeTrips.length})
        </button>

        <button
          onClick={() => setActiveTab('Assigned')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'Assigned'
              ? 'bg-[#006A6A] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          New Assignments ({assignedTrips.length})
        </button>

        <button
          onClick={() => setActiveTab('Completed')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'Completed'
              ? 'bg-[#006A6A] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Completed ({completedTrips.length})
        </button>

        <button
          onClick={() => setActiveTab('Cancelled')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'Cancelled'
              ? 'bg-[#006A6A] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Cancelled ({cancelledTrips.length})
        </button>
      </div>

      {/* Trip Cards Grid */}
      {displayedTrips.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <Truck className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-[#1F2937] dark:text-slate-100">No Trips Found in "{activeTab}" Category</h4>
          <p className="text-xs text-slate-400">Assignments will appear here when dispatched by your Fleet Manager.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedTrips.map(trip => (
            <div
              key={trip.id}
              className="bg-white dark:bg-[#1E293B] border border-[#E5EEFF] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E5EEFF] dark:border-[#334155] pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#6D7A79] uppercase tracking-wider block">Trip Reference</span>
                    <span className="font-mono font-extrabold text-base text-[#1F2937] dark:text-white">
                      {trip.tripNumber}
                    </span>
                  </div>
                  <Badge variant={getStatusVariant(trip.status)} className="px-2.5 py-1 text-xs font-bold">
                    {trip.status}
                  </Badge>
                </div>

                {/* Route */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5 uppercase">Origin</span>
                    <span className="font-semibold text-[#1F2937] dark:text-slate-200 block truncate">📍 {trip.pickupLocation}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50">
                    <span className="text-[10px] text-red-700 dark:text-red-400 font-bold block mb-0.5 uppercase">Destination</span>
                    <span className="font-semibold text-[#1F2937] dark:text-slate-200 block truncate">🏁 {trip.dropLocation}</span>
                  </div>
                </div>

                {/* Cargo Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div>
                    <span className="text-[#4B5563] dark:text-slate-400 block text-[10px] uppercase font-bold">Material</span>
                    <span className="font-bold text-[#1F2937] dark:text-white truncate block">{trip.material}</span>
                  </div>
                  <div>
                    <span className="text-[#4B5563] dark:text-slate-400 block text-[10px] uppercase font-bold">Truck</span>
                    <span className="font-bold text-[#1F2937] dark:text-white truncate block">{trip.vehicleNumber}</span>
                  </div>
                </div>
              </div>

              {/* Contextual Action Buttons */}
              <div className="pt-3 border-t border-[#E5EEFF] dark:border-[#334155] flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDetailsTrip(trip)} className="text-xs">
                  View Manifest
                </Button>

                {trip.status === 'Assigned' && (
                  <Button variant="primary" size="sm" onClick={() => handleAccept(trip.id)} className="bg-emerald-600 text-white font-bold text-xs">
                    Accept Assignment
                  </Button>
                )}

                {trip.status === 'Accepted' && (
                  <Button variant="primary" size="sm" onClick={() => handleStart(trip.id)} className="bg-[#006A6A] text-white font-bold text-xs">
                    Start Trip & Navigation
                  </Button>
                )}

                {['In Transit', 'Started', 'At Stop', 'Reached Pickup', 'Loaded', 'Reached Destination'].includes(trip.status) && (
                  <Button variant="primary" size="sm" onClick={() => navigate('/driver/active-trip')} className="bg-[#006A6A] text-white font-bold text-xs">
                    Open Console <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}

                {trip.status === 'Completed' && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> POD Transmitted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedDetailsTrip && (
        <Modal
          isOpen={Boolean(selectedDetailsTrip)}
          onClose={() => setSelectedDetailsTrip(null)}
          title={`Trip Manifest Details - ${selectedDetailsTrip.tripNumber}`}
        >
          <div className="space-y-4 text-left text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[#4B5563] dark:text-slate-400 font-bold block">Assigned Truck & Driver</span>
              <p className="font-extrabold text-[#1F2937] dark:text-white text-sm">{selectedDetailsTrip.driverName} ({selectedDetailsTrip.vehicleNumber})</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-[#4B5563] dark:text-slate-300 block uppercase text-[10px]">Freight Cargo Specifications</span>
              <div className="grid grid-cols-2 gap-2 text-[#4B5563] dark:text-slate-300">
                <div>Material: <strong className="text-[#1F2937] dark:text-white">{selectedDetailsTrip.material}</strong></div>
                <div>Weight: <strong className="text-[#1F2937] dark:text-white">{selectedDetailsTrip.weight}</strong></div>
                <div>Invoice #: <strong className="text-[#1F2937] dark:text-white">{selectedDetailsTrip.invoiceNumber}</strong></div>
                <div>Priority: <strong className="text-[#1F2937] dark:text-white">{selectedDetailsTrip.priority || 'Normal'}</strong></div>
              </div>
            </div>

            {selectedDetailsTrip.notes && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 text-amber-800 dark:text-amber-300">
                <strong className="block mb-0.5">Instructions:</strong>
                {selectedDetailsTrip.notes}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
