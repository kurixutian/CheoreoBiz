import React from 'react';
import { Package, AlertTriangle, AlertOctagon } from 'lucide-react';
import { DashboardModalType, InventoryItem } from '../../types';
import { ModalShell } from '../common/ModalShell';

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
  let iconBg = 'bg-slate-100 dark:bg-darksurface text-slate-700 dark:text-slate-300';

  if (type === 'total') {
    filtered = [...inventory];
    title = 'All Registered Products';
    subtitle = `Complete catalog (${filtered.length} items)`;
  } else if (type === 'low') {
    filtered = inventory.filter((i) => i.stockQty > 0 && i.stockQty <= 3);
    title = 'Low Stock Alert';
    subtitle = 'Products with 3 or fewer units remaining';
    iconNode = <AlertTriangle className="w-5 h-5" />;
    iconBg = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400';
  } else if (type === 'out') {
    filtered = inventory.filter((i) => i.stockQty <= 0);
    title = 'Depleted Stock (Out of Stock)';
    subtitle = 'Products requiring immediate restocking';
    iconNode = <AlertOctagon className="w-5 h-5" />;
    iconBg = 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400';
  }

  return (
    <ModalShell
      title={title}
      titleId="dashboard-products-modal-title"
      subtitle={subtitle}
      icon={iconNode}
      iconClassName={iconBg}
      maxWidthClass="max-w-2xl"
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
            <th className="px-5 sm:px-6 py-3">Product Name</th>
            <th className="px-5 sm:px-6 py-3 text-right">Stock Qty</th>
            <th className="px-5 sm:px-6 py-3 text-right">Selling Price</th>
            <th className="px-5 sm:px-6 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-darkborder text-xs tabular-nums">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-600 dark:text-slate-400 font-medium">
                No products match this status.
              </td>
            </tr>
          ) : (
            filtered.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/80 dark:hover:bg-darksurface/50 transition-colors"
              >
                <td className="px-5 sm:px-6 py-3 font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-5 sm:px-6 py-3 text-right font-mono font-semibold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {item.stockQty}
                </td>
                <td className="px-5 sm:px-6 py-3 text-right font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  ₱ {(item.sellPrice || 0).toFixed(2)}
                </td>
                <td className="px-5 sm:px-6 py-3 text-center whitespace-nowrap">
                  {item.stockQty <= 0 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 whitespace-nowrap">
                      Out of Stock
                    </span>
                  ) : item.stockQty <= 3 ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 whitespace-nowrap">
                      Low Stock
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      In Stock
                    </span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ModalShell>
  );
};
