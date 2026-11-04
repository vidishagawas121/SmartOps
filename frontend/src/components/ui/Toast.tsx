import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3.5 bg-[#0B1C30] dark:bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 max-w-md"
        >
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>

          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold text-white tracking-tight">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-slate-300 mt-0.5 font-medium truncate">{toast.message}</p>
            )}
          </div>

          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                onClose();
              }}
              className="px-3.5 py-1.5 bg-[#006A6A] hover:bg-[#005555] text-white text-xs font-bold rounded-lg transition-all shadow-sm shrink-0 cursor-pointer"
            >
              {toast.actionLabel}
            </button>
          )}

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
