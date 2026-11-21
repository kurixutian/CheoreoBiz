import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmDialogState } from '../../types';

interface ConfirmationModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ dialog, onClose }) => {
  if (!dialog || !dialog.isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-darkborder animate-scale-in p-6 text-center"
      >
        <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 id="confirmation-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
          {dialog.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
          {dialog.message}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 border border-slate-200 dark:border-darkborder rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (dialog.onProceed) dialog.onProceed();
              onClose();
            }}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            {dialog.proceedText || 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};
