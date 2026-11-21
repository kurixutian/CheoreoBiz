import React from 'react';
import { History, X } from 'lucide-react';
import { StockHistoryEntry } from '../../types';

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
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-history-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="stock-history-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Stock Purchase Log
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Chronological record of inventory additions
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
        <div className="p-0 overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-darksurface/95 shadow-xs z-10 border-b border-slate-100 dark:border-darkborder">
              <tr className="text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="px-6 py-3.5">Date &amp; Time</th>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5 text-right">Qty Added</th>
                <th className="px-6 py-3.5 text-right">Cost/Item</th>
                <th className="px-6 py-3.5 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-darkborder text-xs tabular-nums">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No stock purchase logs recorded yet.
                  </td>
                </tr>
              ) : (
                sorted.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs font-medium whitespace-nowrap">
                      {entry.date}
                    </td>
                    <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">
                      {entry.productName}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{entry.qtyAdded}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      ₱ {(entry.costPerItem || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                      ₱ {(entry.totalCost || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
