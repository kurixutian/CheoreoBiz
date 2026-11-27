import React from 'react';
import { History } from 'lucide-react';
import { StockHistoryEntry } from '../../types';
import { ModalShell } from '../common/ModalShell';

interface StockHistoryModalProps {
  isOpen: boolean;
  stockHistory: StockHistoryEntry[];
  onClose: () => void;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  stockHistory,
  onClose,
}) => {
  if (!isOpen) return null;

  const sorted = [...stockHistory].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  return (
    <ModalShell
      title="Stock Purchase Log"
      titleId="stock-history-modal-title"
      subtitle="Chronological record of inventory additions"
      icon={<History className="w-5 h-5" />}
      maxWidthClass="max-w-3xl"
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
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-slate-50 dark:bg-darksurface z-10 border-b border-slate-200 dark:border-darkborder">
          <tr className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            <th className="px-5 sm:px-6 py-3">Date &amp; Time</th>
            <th className="px-5 sm:px-6 py-3">Product Name</th>
            <th className="px-5 sm:px-6 py-3 text-right">Qty Added</th>
            <th className="px-5 sm:px-6 py-3 text-right">Cost/Item</th>
            <th className="px-5 sm:px-6 py-3 text-right">Total Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-darkborder text-xs tabular-nums">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-slate-600 dark:text-slate-400 font-medium">
                No stock purchase logs recorded yet.
              </td>
            </tr>
          ) : (
            sorted.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-slate-50/80 dark:hover:bg-darksurface/50 transition-colors"
              >
                <td className="px-5 sm:px-6 py-3 text-slate-600 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                  {entry.date}
                </td>
                <td className="px-5 sm:px-6 py-3 font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">
                  {entry.productName}
                </td>
                <td className="px-5 sm:px-6 py-3 text-right font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  +{entry.qtyAdded}
                </td>
                <td className="px-5 sm:px-6 py-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  ₱ {(entry.costPerItem || 0).toFixed(2)}
                </td>
                <td className="px-5 sm:px-6 py-3 text-right font-mono font-semibold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                  ₱ {(entry.totalCost || 0).toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ModalShell>
  );
};
