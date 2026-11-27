import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmDialogState } from '../../types';

interface ConfirmationModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ dialog, onClose }) => {
  useEffect(() => {
    if (!dialog || !dialog.isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, onClose]);

  if (!dialog || !dialog.isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-darkborder animate-scale-in p-6 text-center"
      >
        <div className="bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 w-12 h-12 rounded-xl border border-rose-200/70 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3
          id="confirmation-modal-title"
          className="text-base sm:text-lg font-semibold tracking-[-0.015em] text-slate-900 dark:text-white mb-2"
        >
          {dialog.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-6 leading-relaxed">
          {dialog.message}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 border border-slate-200 dark:border-darkborder rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darksurface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (dialog.onProceed) dialog.onProceed();
              onClose();
            }}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
          >
            {dialog.proceedText || 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};
