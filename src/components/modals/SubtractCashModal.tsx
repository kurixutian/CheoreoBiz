import React, { useState, useEffect } from 'react';
import { MinusCircle, X, Check } from 'lucide-react';

interface SubtractCashModalProps {
  isOpen: boolean;
  availableCash: number;
  onClose: () => void;
  onSubmit: (amount: number, reason: string) => void;
}

export const SubtractCashModal: React.FC<SubtractCashModalProps> = ({
  isOpen,
  availableCash,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    onSubmit(num, reason.trim() || 'Manual cash withdrawal');
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subtract-cash-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-2 rounded-lg">
              <MinusCircle className="w-5 h-5" />
            </div>
            <h3 id="subtract-cash-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Subtract Liquid Cash
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-darksurface p-1.5 rounded-lg border border-slate-200 dark:border-darkborder shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 dark:bg-darksurface p-4 rounded-lg border border-slate-200 dark:border-darkborder flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Available Cash
            </span>
            <span className="text-lg font-extrabold font-mono tabular-nums text-brand-600 dark:text-brand-400">
              ₱ {availableCash.toFixed(2)}
            </span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Amount to Subtract (₱)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white bg-white dark:bg-darkinput shadow-xs transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Note (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Personal withdrawal, Petty cash, Misc expense..."
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm font-medium bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
            />
          </div>
          <div className="pt-2 flex justify-end space-x-3 border-t border-slate-100 dark:border-darkborder">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-500 transition-all shadow-md shadow-rose-500/20 active:scale-[0.99] flex items-center"
            >
              <Check className="w-4 h-4 mr-1.5" /> Confirm Subtraction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
