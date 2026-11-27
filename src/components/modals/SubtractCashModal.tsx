import React, { useState, useEffect } from 'react';
import { MinusCircle, Check } from 'lucide-react';
import { ModalShell } from '../common/ModalShell';

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
    <ModalShell
      title="Subtract Liquid Cash"
      titleId="subtract-cash-modal-title"
      icon={<MinusCircle className="w-5 h-5" />}
      iconClassName="bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400"
      zIndexClass="z-[70]"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-darksurface p-4 rounded-xl border border-slate-200 dark:border-darkborder flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Available Cash
          </span>
          <span className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            ₱ {availableCash.toFixed(2)}
          </span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Amount to Subtract (₱)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 dark:text-slate-400 font-semibold">
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
              className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white bg-slate-50 dark:bg-darkinput transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Reason / Note (Optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Personal withdrawal, Petty cash, Misc expense..."
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none text-sm font-medium bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
          />
        </div>
        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200 dark:border-darkborder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darksurface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.99] flex items-center"
          >
            <Check className="w-4 h-4 mr-1.5" /> Confirm Subtraction
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
