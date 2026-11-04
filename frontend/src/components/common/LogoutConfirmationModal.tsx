import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2 } from 'lucide-react';
import { useOperations } from '../../store/OperationsContext';

export const LogoutConfirmationModal: React.FC = () => {
  const { isLogoutModalOpen, isLoggingOut, cancelLogout, performLogout } = useOperations();
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Auto focus Cancel button on open for keyboard accessibility
  useEffect(() => {
    if (isLogoutModalOpen) {
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isLogoutModalOpen]);

  // ESC key listener & Keyboard Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLogoutModalOpen) return;

      if (e.key === 'Escape' && !isLoggingOut) {
        e.preventDefault();
        cancelLogout();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean) as HTMLElement[];
        if (focusables.length < 2) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutModalOpen, isLoggingOut, cancelLogout]);

  return (
    <AnimatePresence>
      {isLogoutModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75"
          onClick={() => !isLoggingOut && cancelLogout()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-[92%] sm:w-full max-w-[460px] bg-white dark:bg-[#111827] rounded-[24px] p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-left relative overflow-hidden modal-container"
          >
            {/* 1. Single Top Logout Icon */}
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200/80 dark:border-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-5 shadow-xs shrink-0">
              <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            {/* 2. Dialog Title (28px Bold) */}
            <h2
              id="logout-modal-title"
              className="text-[28px] font-bold text-[#0B1C30] dark:text-[#F8FAFC] tracking-tight leading-tight mb-2 modal-title"
            >
              Confirm Logout
            </h2>

            {/* 3. Description (16px Medium, Professional Enterprise Copy) */}
            <div id="logout-modal-description" className="space-y-1 text-[16px] font-medium text-[#475569] dark:text-[#CBD5E1] leading-relaxed mb-8 modal-description">
              <p>Are you sure you want to log out of your account?</p>
              <p className="text-slate-500 dark:text-slate-400">You will need to sign in again to access SmartOps.</p>
            </div>

            {/* 4. Action Buttons Row (Equal Height, Clean Layout) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={cancelLogout}
                disabled={isLoggingOut}
                className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-[#334155] dark:text-[#E2E8F0] text-[15px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-11 flex items-center justify-center"
              >
                Cancel
              </button>

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={performLogout}
                disabled={isLoggingOut}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[15px] font-semibold transition-all shadow-md shadow-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2 h-11"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span className="text-white">Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 text-white" />
                    <span className="text-white">Log Out</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
