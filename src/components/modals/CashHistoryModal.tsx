import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import { CashAdjustment } from '../../types';
import { ModalShell } from '../common/ModalShell';

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
    <ModalShell
      title="Cash Withdrawal History"
      titleId="cash-history-modal-title"
      subtitle="Manual subtractions & reversals"
      icon={<History className="w-5 h-5" />}
      maxWidthClass="max-w-lg"
      zIndexClass="z-[70]"
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
      <div className="p-5 sm:p-6 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8 font-medium">
            No cash withdrawals recorded yet.
          </p>
        ) : (
          sorted.map((entry) => {
            const isReversed = entry.status === 'reversed';
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  isReversed
                    ? 'bg-slate-50/60 dark:bg-darksurface/40 border-slate-200/70 dark:border-darkborder/60 opacity-60'
                    : 'bg-slate-50 dark:bg-darksurface border-slate-200 dark:border-darkborder'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums whitespace-nowrap ${
                        isReversed
                          ? 'line-through text-slate-500 dark:text-slate-500'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      -₱ {(parseFloat(String(entry.amount)) || 0).toFixed(2)}
                    </span>
                    {isReversed ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-slate-200 dark:bg-darkinput text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        Reversed
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 whitespace-nowrap">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {entry.reason || 'Manual cash withdrawal'}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5 whitespace-nowrap">
                    {entry.date}
                    {isReversed && entry.reversedAt ? ` • Undone ${entry.reversedAt}` : ''}
                  </p>
                </div>
                <div className="shrink-0">
                  {!isReversed && (
                    <button
                      onClick={() => onUndoCashAdjustment(entry.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-darkcard text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-brand-500/15 hover:text-brand-700 dark:hover:text-brand-300 border border-slate-200 dark:border-darkborder transition-all flex items-center gap-1"
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
    </ModalShell>
  );
};
