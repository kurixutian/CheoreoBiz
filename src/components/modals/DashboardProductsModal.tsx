import React from 'react';
import { Package, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { DashboardModalType, InventoryItem } from '../../types';

interface DashboardProductsModalProps {
  type: DashboardModalType | null;
  inventory: InventoryItem[];
  onClose: () => void;
}

export const DashboardProductsModal: React.FC<DashboardProductsModalProps> = ({
  type,
  inventory,
  onClose,
}) => {
  if (!type) return null;

  let filtered: InventoryItem[] = [];
  let title = 'Filtered Products';
  let subtitle = 'Inventory Status';
  let iconNode = <Package className="w-5 h-5" />;
  let iconBg = 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';

  if (type === 'total') {
    filtered = [...inventory];
    title = 'All Registered Products';
    subtitle = `Complete catalog (${filtered.length} items)`;
  } else if (type === 'low') {
    filtered = inventory.filter((i) => i.stockQty > 0 && i.stockQty <= 3);
    title = 'Low Stock Alert';
    subtitle = 'Products with 3 or fewer units remaining';
    iconNode = <AlertTriangle className="w-5 h-5" />;
    iconBg = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
  } else if (type === 'out') {
    filtered = inventory.filter((i) => i.stockQty <= 0);
    title = 'Depleted Stock (Out of Stock)';
    subtitle = 'Products requiring immediate restocking';
    iconNode = <AlertOctagon className="w-5 h-5" />;
    iconBg = 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400';
  }

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
        aria-labelledby="dashboard-products-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-3">
            <div className={`${iconBg} p-2 rounded-lg`}>{iconNode}</div>
            <div>
              <h3 id="dashboard-products-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
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
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5 text-right">Stock Qty</th>
                <th className="px-6 py-3.5 text-right">Selling Price</th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-darkborder text-xs tabular-nums">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No products match this status.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-bold text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {item.stockQty}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      ₱ {(item.sellPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      {item.stockQty <= 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 whitespace-nowrap">
                          Out of Stock
                        </span>
                      ) : item.stockQty <= 3 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          In Stock
                        </span>
                      )}
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
