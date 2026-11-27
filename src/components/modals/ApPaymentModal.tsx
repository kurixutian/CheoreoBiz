import React, { useState, useEffect } from 'react';
import { Banknote } from 'lucide-react';
import { BnplRecord } from '../../types';
import { ModalShell } from '../common/ModalShell';

interface ApPaymentModalProps {
  record: BnplRecord | null;
  onClose: () => void;
  onSubmit: (recordId: string, amount: number) => void;
}

export const ApPaymentModal: React.FC<ApPaymentModalProps> = ({
  record,
  onClose,
  onSubmit,
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
    <ModalShell
      title="Record Supplier Payment"
      titleId="ap-payment-modal-title"
      icon={<Banknote className="w-5 h-5" />}
      iconClassName="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        <div className="bg-slate-50 dark:bg-darksurface p-4 rounded-xl border border-slate-200 dark:border-darkborder">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Supplier</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{record.supplierName}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-darkborder">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Outstanding Balance</span>
            <span className="text-lg font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
              ₱ {remaining.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Payment Amount (₱)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 dark:text-slate-400 font-semibold">
              ₱
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remaining.toFixed(2)}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white bg-slate-50 dark:bg-darkinput transition-all"
            />
          </div>
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1.5">
            Enter partial installment or full remaining balance.
          </p>
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
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.99]"
          >
            Submit Payment
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
