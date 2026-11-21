import React, { useState, useEffect } from 'react';
import { Banknote, X } from 'lucide-react';
import { BnplRecord } from '../../types';

interface ApPaymentModalProps {
  record: BnplRecord | null;
  onClose: () => void;
  onSubmit: (recordId: string, amount: number) => void;
}

export const ApPaymentModal: React.FC<ApPaymentModalProps> = ({
  record,
  onClose,
  onSubmit
}) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (record) {
      const remaining = Math.max(0, record.totalAmount - (record.amountPaid || 0));
      setAmount(remaining.toFixed(2));
    }
  }, [record]);

  if (!record) return null;

  const remaining = Math.max(0, record.totalAmount - (record.amountPaid || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    onSubmit(record.id, num);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ap-payment-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 id="ap-payment-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Record Supplier Payment</h3>
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
          <div className="bg-slate-50 dark:bg-darksurface p-4 rounded-lg border border-slate-200 dark:border-darkborder">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-400">Supplier</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white">{record.supplierName}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-darkborder">
              <span className="text-xs font-bold text-slate-400">Outstanding Balance</span>
              <span className="text-lg font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                ₱ {remaining.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Amount (₱)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold">₱</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining.toFixed(2)}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white bg-white dark:bg-darkinput shadow-xs transition-all"
              />
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-1.5">
              Enter partial installment or full remaining balance.
            </p>
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
              className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-500 transition-all shadow-md shadow-brand-500/20 active:scale-[0.99]"
            >
              Submit Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
