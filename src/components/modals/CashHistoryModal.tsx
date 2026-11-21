import React from 'react';
import { History, X, RotateCcw } from 'lucide-react';
import { CashAdjustment } from '../../types';

interface CashHistoryModalProps {
  isOpen: boolean;
  cashAdjustments: CashAdjustment[];
  onClose: () => void;
  onUndoCashAdjustment: (id: string) => void;
}

export const CashHistoryModal: React.FC<CashHistoryModalProps> = ({
  isOpen,
  cashAdjustments,
  onClose,
  onUndoCashAdjustment,
}) => {
  if (!isOpen) return null;

  const sorted = [...cashAdjustments].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

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
        aria-labelledby="cash-history-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cash-history-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Cash Withdrawal History
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Manual subtractions &amp; reversals
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
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {sorted.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8 font-medium">
              No cash withdrawals recorded yet.
            </p>
          ) : (
            sorted.map((entry) => {
              const isReversed = entry.status === 'reversed';
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3.5 rounded-lg border ${
                    isReversed
                      ? 'bg-slate-50/60 dark:bg-darksurface/40 border-slate-200/60 dark:border-darkborder/50 opacity-60'
                      : 'bg-slate-50 dark:bg-darksurface border-slate-200 dark:border-darkborder'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold font-mono tabular-nums whitespace-nowrap ${
                          isReversed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        -₱ {(parseFloat(String(entry.amount)) || 0).toFixed(2)}
                      </span>
                      {isReversed ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          Reversed
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 truncate">
                      {entry.reason || 'Manual cash withdrawal'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                      {entry.date}
                      {isReversed && entry.reversedAt ? ` • Undone ${entry.reversedAt}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {!isReversed && (
                      <button
                        onClick={() => onUndoCashAdjustment(entry.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-darkcard text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-darkborder shadow-xs transition-all flex items-center gap-1"
                        title="Restore this amount back to Liquid Cash"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Undo
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
