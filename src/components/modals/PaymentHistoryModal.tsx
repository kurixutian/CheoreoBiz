import React from 'react';
import { History, X, Check } from 'lucide-react';
import { BnplRecord } from '../../types';

interface PaymentHistoryModalProps {
  record: BnplRecord | null;
  onClose: () => void;
}

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const payments = record.payments || [];

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-history-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="payment-history-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Payment History
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Installment logs for this invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-darksurface p-1.5 rounded-lg border border-slate-200 dark:border-darkborder shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 dark:bg-darksurface p-4 rounded-lg border border-slate-200 dark:border-darkborder space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">Supplier:</span>
              <span className="font-bold text-slate-800 dark:text-white">{record.supplierName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">Batch Invoice:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {record.invoiceNumber || `Batch (${(record.items || []).length} items)`}
              </span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-darkborder whitespace-nowrap">
              <span className="font-bold text-slate-400 uppercase">Total Procurement:</span>
              <span className="font-mono font-extrabold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                ₱ {record.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-medium">
                No installment payments recorded yet.
              </p>
            ) : (
              payments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-slate-50 dark:bg-darksurface rounded-lg border border-slate-100 dark:border-darkborder"
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white whitespace-nowrap">
                        Installment Paid
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 whitespace-nowrap">{p.date}</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                    ₱ {p.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-darkborder bg-slate-50 dark:bg-darksurface flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
