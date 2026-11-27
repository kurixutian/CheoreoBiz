import React from 'react';
import { BarChart2 } from 'lucide-react';
import {
  BnplRecord,
  FinancialModalType,
  InventoryItem,
  Order,
  StockHistoryEntry,
  Timeframe,
} from '../../types';
import {
  getOrderItems,
  getProductHistoricalCPP,
  isWithinTimeframe,
} from '../../services/calculations';
import { ModalShell } from '../common/ModalShell';

interface FinancialDetailsModalProps {
  type: FinancialModalType | null;
  timeframe: Timeframe;
  orders: Order[];
  inventory: InventoryItem[];
  stockHistory: StockHistoryEntry[];
  bnplRecords: BnplRecord[];
  onClose: () => void;
}

export const FinancialDetailsModal: React.FC<FinancialDetailsModalProps> = ({
  type,
  timeframe,
  orders,
  inventory,
  stockHistory,
  bnplRecords,
  onClose,
}) => {
  if (!type) return null;

  const filteredOrders = orders
    .filter((o) => o.status !== 'cancelled' && isWithinTimeframe(o.date, timeframe))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const filteredStockHistory = stockHistory
    .filter((s) => isWithinTimeframe(s.date, timeframe))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  let title = 'Financial Breakdown';
  let subtitle = 'Detailed Transaction Log';
  let headers: { label: string; align?: 'right' }[] = [];
  const rows: React.ReactNode[] = [];
  let footerLabel = 'Total';
  let footerValue = '₱ 0.00';

  if (type === 'revenue') {
    title = 'Total Revenue Breakdown';
    subtitle = 'Orders within selected timeframe';
    headers = [
      { label: 'Date' },
      { label: 'Customer' },
      { label: 'Items' },
      { label: 'Order Total', align: 'right' },
      { label: 'Cash Paid', align: 'right' },
    ];
    let sum = 0;
    filteredOrders.forEach((o) => {
      sum += o.totalRevenue || 0;
      const itemSummary = getOrderItems(o)
        .map((i) => `${i.qty}x ${i.name}`)
        .join(', ');
      rows.push(
        <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
            {o.date}
          </td>
          <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px] whitespace-nowrap">{o.customerName}</td>
          <td
            className="px-6 py-3 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate whitespace-nowrap"
            title={itemSummary}
          >
            {itemSummary}
          </td>
          <td className="px-6 py-3 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            ₱ {(o.totalRevenue || 0).toFixed(2)}
          </td>
          <td className="px-6 py-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
            ₱ {(o.amountPaid || 0).toFixed(2)}
          </td>
        </tr>
      );
    });
    footerLabel = 'Total Revenue';
    footerValue = `₱ ${sum.toFixed(2)}`;
  } else if (type === 'profit') {
    title = 'Net Profit Breakdown';
    subtitle = 'Realized profit from completed & delivered orders';
    headers = [
      { label: 'Date' },
      { label: 'Customer' },
      { label: 'Revenue', align: 'right' },
      { label: 'Total COGS', align: 'right' },
      { label: 'Net Profit', align: 'right' },
    ];
    let sum = 0;
    filteredOrders
      .filter((o) => o.isPaid && o.isReceived)
      .forEach((o) => {
        const cogs = o.totalCost || 0;
        const realized =
          o.totalProfit !== undefined ? o.totalProfit : (o.totalRevenue || 0) - cogs;
        sum += realized;
        rows.push(
          <tr
            key={o.id}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
              {o.date}
            </td>
            <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px] whitespace-nowrap">
              {o.customerName}
            </td>
            <td className="px-6 py-3 text-right font-mono text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
              ₱ {(o.totalRevenue || 0).toFixed(2)}
            </td>
            <td className="px-6 py-3 text-right font-mono text-rose-500 dark:text-rose-400 text-xs whitespace-nowrap">
              -₱ {cogs.toFixed(2)}
            </td>
            <td
              className={`px-6 py-3 text-right font-mono font-bold text-xs whitespace-nowrap ${
                realized >= 0
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              ₱ {realized.toFixed(2)}
            </td>
          </tr>
        );
      });
    footerLabel = 'Total Realized Net Profit';
    footerValue = `₱ ${sum.toFixed(2)}`;
  } else if (type === 'outstanding') {
    title = 'Uncollected Balances (Receivables)';
    subtitle = 'Customers with unpaid or partially paid orders';
    headers = [
      { label: 'Date' },
      { label: 'Customer' },
      { label: 'Order Total', align: 'right' },
      { label: 'Amount Paid', align: 'right' },
      { label: 'Balance Due', align: 'right' },
    ];
    let sum = 0;
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((o) => {
        const bal = (o.totalRevenue || 0) - (o.amountPaid || 0);
        if (bal > 0.01) {
          sum += bal;
          rows.push(
            <tr
              key={o.id}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                {o.date}
              </td>
              <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[180px] whitespace-nowrap">
                {o.customerName}
              </td>
              <td className="px-6 py-3 text-right font-mono text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                ₱ {(o.totalRevenue || 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400 text-xs whitespace-nowrap">
                ₱ {(o.amountPaid || 0).toFixed(2)}
              </td>
              <td className="px-6 py-3 text-right font-mono font-bold text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                ₱ {bal.toFixed(2)}
              </td>
            </tr>
          );
        }
      });
    footerLabel = 'Total Uncollected';
    footerValue = `₱ ${sum.toFixed(2)}`;
  } else if (type === 'inventory_value') {
    title = 'Current Inventory Asset Valuation';
    subtitle = 'Active stock quantities multiplied by historical weighted CPP';
    headers = [
      { label: 'Product Name' },
      { label: 'Stock Qty', align: 'right' },
      { label: 'Unit CPP', align: 'right' },
      { label: 'Asset Value', align: 'right' },
    ];
    let sum = 0;
    inventory.forEach((item) => {
      if (item.stockQty > 0) {
        const cpp = getProductHistoricalCPP(item.name, bnplRecords, item.unitCost);
        const val = item.stockQty * cpp;
        sum += val;
        rows.push(
          <tr
            key={item.id}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">{item.name}</td>
            <td className="px-6 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {item.stockQty}
            </td>
            <td className="px-6 py-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
              ₱ {cpp.toFixed(2)}
            </td>
            <td className="px-6 py-3 text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
              ₱ {val.toFixed(2)}
            </td>
          </tr>
        );
      }
    });
    footerLabel = 'Total Inventory Asset Value';
    footerValue = `₱ ${sum.toFixed(2)}`;
  } else if (type === 'money_spent') {
    title = 'Capital Deployed (Stock Purchases)';
    subtitle = 'Total money spent acquiring inventory batches';
    headers = [
      { label: 'Date' },
      { label: 'Product Name' },
      { label: 'Qty Added', align: 'right' },
      { label: 'Unit Cost', align: 'right' },
      { label: 'Total Batch Cost', align: 'right' },
    ];
    let sum = 0;
    filteredStockHistory.forEach((s) => {
      sum += s.totalCost || 0;
      rows.push(
        <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
          <td className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
            {s.date}
          </td>
          <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">{s.productName}</td>
          <td className="px-6 py-3 text-right font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
            +{s.qtyAdded}
          </td>
          <td className="px-6 py-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
            ₱ {(s.costPerItem || 0).toFixed(2)}
          </td>
          <td className="px-6 py-3 text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400 whitespace-nowrap">
            ₱ {(s.totalCost || 0).toFixed(2)}
          </td>
        </tr>
      );
    });
    footerLabel = 'Total Capital Spent';
    footerValue = `₱ ${sum.toFixed(2)}`;
  } else if (type === 'expected_sales') {
    title = 'Projected Retail Sales Value';
    subtitle = 'Retail value of remaining stock if sold at current selling price';
    headers = [
      { label: 'Product Name' },
      { label: 'Stock Qty', align: 'right' },
      { label: 'Selling Price', align: 'right' },
      { label: 'Expected Sales', align: 'right' },
    ];
    let sum = 0;
    inventory.forEach((i) => {
      if (i.stockQty > 0) {
        const val = i.stockQty * (i.sellPrice || 0);
        sum += val;
        rows.push(
          <tr
            key={i.id}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">{i.name}</td>
            <td className="px-6 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {i.stockQty}
            </td>
            <td className="px-6 py-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
              ₱ {(i.sellPrice || 0).toFixed(2)}
            </td>
            <td className="px-6 py-3 text-right font-mono font-bold text-xs text-brand-600 dark:text-brand-400 whitespace-nowrap">
              ₱ {val.toFixed(2)}
            </td>
          </tr>
        );
      }
    });
    footerLabel = 'Total Expected Sales';
    footerValue = `₱ ${sum.toFixed(2)}`;
  } else if (type === 'expected_profit') {
    title = 'Projected Inventory Profit';
    subtitle = 'Potential profit from remaining stock (Selling Price minus CPP)';
    headers = [
      { label: 'Product Name' },
      { label: 'Stock Qty', align: 'right' },
      { label: 'Unit Margin', align: 'right' },
      { label: 'Expected Profit', align: 'right' },
    ];
    let sum = 0;
    inventory.forEach((i) => {
      if (i.stockQty > 0) {
        const cpp = getProductHistoricalCPP(i.name, bnplRecords, i.unitCost);
        const unitMargin = (i.sellPrice || 0) - cpp;
        const val = i.stockQty * unitMargin;
        sum += val;
        rows.push(
          <tr
            key={i.id}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td className="px-6 py-3 font-bold text-xs text-slate-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">{i.name}</td>
            <td className="px-6 py-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {i.stockQty}
            </td>
            <td className="px-6 py-3 text-right font-mono text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
              ₱ {unitMargin.toFixed(2)}
            </td>
            <td className="px-6 py-3 text-right font-mono font-bold text-xs text-teal-600 dark:text-teal-400 whitespace-nowrap">
              ₱ {val.toFixed(2)}
            </td>
          </tr>
        );
      }
    });
    footerLabel = 'Total Expected Profit';
    footerValue = `₱ ${sum.toFixed(2)}`;
  }

  return (
    <ModalShell
      title={title}
      titleId="financial-details-modal-title"
      subtitle={subtitle}
      icon={<BarChart2 className="w-5 h-5" />}
      maxWidthClass="max-w-4xl"
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
            {headers.map((h, i) => (
              <th key={i} className={`px-5 sm:px-6 py-3 ${h.align === 'right' ? 'text-right' : ''}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-darkborder text-xs tabular-nums">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-6 py-10 text-center text-slate-600 dark:text-slate-400 font-medium"
              >
                No records found for this metric.
              </td>
            </tr>
          ) : (
            rows
          )}
        </tbody>
        <tfoot className="sticky bottom-0 bg-slate-100 dark:bg-darksurface border-t border-slate-200 dark:border-darkborder">
          <tr>
            <td
              colSpan={Math.max(1, headers.length - 1)}
              className="px-5 sm:px-6 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-300 text-xs"
            >
              {footerLabel}
            </td>
            <td className="px-5 sm:px-6 py-3.5 text-right font-bold font-mono tabular-nums text-slate-900 dark:text-white text-sm sm:text-base">
              {footerValue}
            </td>
          </tr>
        </tfoot>
      </table>
    </ModalShell>
  );
};
