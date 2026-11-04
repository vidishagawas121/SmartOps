import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { CheckCircle2, XCircle, FileText, MapPin, Calendar, User, Truck, Image as ImageIcon, PenTool } from 'lucide-react';
import { api } from '../../api/client';
import { PODRecord } from '../../types';

interface PODViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
  orderNumber?: string;
  podData?: PODRecord | null;
}

export const PODViewerModal: React.FC<PODViewerModalProps> = ({
  isOpen,
  onClose,
  tripId,
  orderNumber,
  podData: initialPodData
}) => {
  const [pod, setPod] = useState<PODRecord | null>(initialPodData || null);
  const [loading, setLoading] = useState<boolean>(!initialPodData);

  useEffect(() => {
    if (!isOpen) return;
    if (initialPodData) {
      setPod(initialPodData);
      setLoading(false);
      return;
    }

    const fetchPOD = async () => {
      setLoading(true);
      try {
        const pods = await api.pod.getAll();
        const found = pods.find(p => p.orderNumber === orderNumber || p.podId === orderNumber || (p as any).tripId === tripId);
        if (found) {
          setPod(found);
        } else if (pods.length > 0) {
          setPod(pods[0]);
        }
      } catch (err) {
        console.error('Failed to load POD:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPOD();
  }, [isOpen, tripId, orderNumber, initialPodData]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Proof of Delivery (POD) - ${pod?.podId || 'Verification Record'}`}
    >
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading POD verification details...</div>
      ) : !pod ? (
        <div className="py-12 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-slate-700 dark:text-slate-200">No POD Uploaded Yet</p>
          <p className="text-xs text-slate-500 mt-1">The driver has not yet submitted proof of delivery for this consignment.</p>
        </div>
      ) : (
        <div className="space-y-4 text-left text-xs">
          {/* Header Status */}
          <div className="flex items-center justify-between bg-slate-900 text-white p-3.5 rounded-xl">
            <div>
              <span className="font-bold block text-sm">{pod.orderNumber}</span>
              <span className="text-slate-400 text-[11px]">POD ID: {pod.podId}</span>
            </div>
            <Badge
              variant={pod.status === 'Approved' ? 'success' : pod.status === 'Rejected' ? 'danger' : 'warning'}
              className="px-3 py-1 font-bold text-xs"
            >
              {pod.status === 'Approved' ? '✅ Verified & Approved' : pod.status === 'Rejected' ? '❌ Discrepancy Rejected' : '⏳ Pending Review'}
            </Badge>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-teal-600" /> Driver Name
              </span>
              <span className="font-bold text-slate-800 dark:text-white">{pod.driverName}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5 flex items-center gap-1">
                <Truck className="w-3 h-3 text-teal-600" /> Vehicle Number
              </span>
              <span className="font-bold text-slate-800 dark:text-white">{pod.vehicleNumber}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 col-span-2">
              <span className="text-slate-400 font-bold block text-[10px] uppercase mb-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> Customer & Delivery Address
              </span>
              <span className="font-semibold text-slate-800 dark:text-white block">{pod.customerName}</span>
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">{pod.customerAddress}</span>
            </div>
          </div>

          {/* Delivery Images: Photo Gallery & Signature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Consignment Delivery Photos
                </span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {pod.images && pod.images.length > 0 ? `${pod.images.length} Photos` : '1 Photo'}
                </span>
              </span>

              {pod.images && pod.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {pod.images.map((imgUrl, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-24 flex items-center justify-center group">
                      <img src={imgUrl} alt={`Delivery Photo #${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : pod.imageUrl ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center">
                  <img src={pod.imageUrl} alt="Delivery Photo" className="max-h-48 object-contain" />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-100 rounded-lg">No photos captured</div>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5 text-emerald-500" /> Receiver Signature
              </span>
              {pod.signatureUrl ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-white p-2 max-h-48 flex items-center justify-center">
                  <img src={pod.signatureUrl} alt="Signature" className="max-h-40 object-contain" />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-slate-100 rounded-lg">No signature provided</div>
              )}
            </div>
          </div>

          {/* Remarks & GPS Timestamp */}
          {pod.remarks && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
              <strong className="block mb-0.5">Driver Remarks:</strong>
              {pod.remarks}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
            <span>📅 Timestamp: {pod.createdAt ? new Date(pod.createdAt).toLocaleString() : 'Recent'}</span>
            <span>📍 Coordinates: {pod.latitude && pod.longitude ? `${pod.latitude.toFixed(4)}, ${pod.longitude.toFixed(4)}` : 'Verified On-site'}</span>
          </div>
        </div>
      )}
    </Modal>
  );
};
