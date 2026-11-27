import React from 'react';
import { History, Check } from 'lucide-react';
import { BnplRecord } from '../../types';
import { ModalShell } from '../common/ModalShell';

interface PaymentHistoryModalProps {
  record: BnplRecord | null;
  onClose: () => void;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const payments = record.payments || [];

  return (
    <ModalShell
      title="Payment History"
      titleId="payment-history-modal-title"
      subtitle="Installment logs for this invoice"
      icon={<History className="w-5 h-5" />}
      maxWidthClass="max-w-md"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-darksurface p-4 rounded-xl border border-slate-200 dark:border-darkborder space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Supplier</span>
            <span className="font-semibold text-slate-900 dark:text-white">{record.supplierName}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Batch Invoice</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {record.invoiceNumber || `Batch (${(record.items || []).length} items)`}
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-darkborder whitespace-nowrap">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Total Procurement</span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
              ₱ {record.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          {payments.length === 0 ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center py-6 font-medium">
              No installment payments recorded yet.
            </p>
          ) : (
            payments.map((p, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-darksurface rounded-xl border border-slate-200 dark:border-darkborder"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-1.5 rounded-lg">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      Installment Paid
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.date}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400 text-xs whitespace-nowrap">
                  ₱ {p.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
};
