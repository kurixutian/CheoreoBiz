import React from 'react';
import {
  AlertTriangle,
  XCircle,
  History,
  ArrowUpRight,
} from 'lucide-react';
import {
  Timeframe,
  SummaryMetrics,
  ActivityLogEntry,
  FinancialModalType,
  DashboardModalType,
} from '../../types';

interface DashboardViewProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  summary: SummaryMetrics;
  activityLog: ActivityLogEntry[];
  onOpenFinancialModal: (type: FinancialModalType) => void;
  onOpenDashboardModal: (type: DashboardModalType) => void;
  onClearActivityLog: () => void;
}

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  timeframe,
  onTimeframeChange,
  summary,
  activityLog,
  onOpenFinancialModal,
  onOpenDashboardModal,
  onClearActivityLog,
}) => {
  return (
    <section data-tab-content="dashboard" className="space-y-6 animate-fade-in block">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Overview
          </h1>
        </div>

        <div className="flex bg-slate-200/70 dark:bg-darkcard p-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-darkborder w-full sm:w-auto">
          {TIMEFRAMES.map(({ id, label }) => {
            const active = timeframe === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTimeframeChange(id)}
                data-timeframe={id}
                className={`px-3.5 py-1.5 rounded-md transition-colors flex-1 sm:flex-none ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Financial KPI Strip (Divided Container per App Screen Rules) */}
      <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-slate-200 dark:divide-darkborder overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => onOpenFinancialModal('revenue')}
          className="p-4 sm:p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Gross sales
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-brand-600 transition-all" />
          </div>
          <div className="mt-2 flex items-baseline text-slate-900 dark:text-white whitespace-nowrap min-w-0">
            <span className="text-xs font-medium text-slate-500 mr-1">₱</span>
            <span
              id="summary-revenue"
              className="text-xl sm:text-2xl font-mono tabular-nums font-bold tracking-tight truncate whitespace-nowrap"
            >
              {summary.revenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
            Total order revenue
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenFinancialModal('profit')}
          className="p-4 sm:p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Net profit
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-40 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-2 flex items-baseline text-emerald-700 dark:text-emerald-400 whitespace-nowrap min-w-0">
            <span className="text-xs font-medium mr-1">₱</span>
            <span
              id="summary-profit"
              className="text-xl sm:text-2xl font-mono tabular-nums font-bold tracking-tight truncate whitespace-nowrap"
            >
              {summary.profit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <span
            id="summary-roi"
            className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mt-1 whitespace-nowrap"
          >
            {summary.roi.toFixed(1)}% ROI on capital
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenFinancialModal('profit')}
          className="p-4 sm:p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Realized sales value
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-brand-600 transition-all" />
          </div>
          <div className="mt-2 flex items-baseline text-slate-900 dark:text-white whitespace-nowrap min-w-0">
            <span className="text-xs font-medium text-slate-500 mr-1">₱</span>
            <span
              id="summary-completed-value-display"
              className="text-xl sm:text-2xl font-mono tabular-nums font-bold tracking-tight truncate whitespace-nowrap"
            >
              {summary.completedOrdersTotalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <span
            id="summary-completed-orders"
            className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1 whitespace-nowrap"
          >
            {summary.completedOrdersCount} completed orders
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenFinancialModal('outstanding')}
          className="p-4 sm:p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 min-w-0"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Outstanding receivables
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 opacity-40 group-hover:opacity-100 transition-all" />
          </div>
          <div className="mt-2 flex items-baseline text-rose-700 dark:text-rose-400 whitespace-nowrap min-w-0">
            <span className="text-xs font-medium mr-1">₱</span>
            <span
              id="stat-pending-balance"
              className="text-xl sm:text-2xl font-mono tabular-nums font-bold tracking-tight truncate whitespace-nowrap"
            >
              {summary.pendingBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
            Unpaid customer balances
          </span>
        </button>
      </div>

      {/* Inventory Financial Metrics Breakdown */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Inventory valuation &amp; projections
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onOpenFinancialModal('inventory_value')}
            className="text-left bg-white dark:bg-darkcard p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
          >
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Inventory cost value
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-brand-600 transition-all" />
            </div>
            <p className="text-lg sm:text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white tracking-tight truncate mt-2 whitespace-nowrap">
              <span className="text-xs text-slate-500 mr-0.5">₱</span>
              <span id="dash-inv-value">
                {summary.inventoryVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              Active stock at weighted CPP
            </p>
          </button>

          <button
            type="button"
            onClick={() => onOpenFinancialModal('money_spent')}
            className="text-left bg-white dark:bg-darkcard p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
          >
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Capital deployed
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-brand-600 transition-all" />
            </div>
            <p className="text-lg sm:text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white tracking-tight truncate mt-2 whitespace-nowrap">
              <span className="text-xs text-slate-500 mr-0.5">₱</span>
              <span id="dash-money-spent">
                {summary.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              Historical procurement cost
            </p>
          </button>

          <button
            type="button"
            onClick={() => onOpenFinancialModal('expected_sales')}
            className="text-left bg-white dark:bg-darkcard p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
          >
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Expected retail sales
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-brand-600 transition-all" />
            </div>
            <p className="text-lg sm:text-xl font-mono tabular-nums font-bold text-slate-900 dark:text-white tracking-tight truncate mt-2 whitespace-nowrap">
              <span className="text-xs text-slate-500 mr-0.5">₱</span>
              <span id="dash-exp-sales">
                {summary.expectedSalesVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              Unsold stock at retail price
            </p>
          </button>

          <button
            type="button"
            onClick={() => onOpenFinancialModal('expected_profit')}
            className="text-left bg-white dark:bg-darkcard p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-darkborder hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between group shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 min-w-0"
          >
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Expected stock profit
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-40 group-hover:opacity-100 transition-all" />
            </div>
            <p className="text-lg sm:text-xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 tracking-tight truncate mt-2 whitespace-nowrap">
              <span className="text-xs mr-0.5">₱</span>
              <span id="dash-exp-profit">
                {summary.expectedProfitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
              Projected net margin on stock
            </p>
          </button>
        </div>
      </div>

      {/* Split Widgets Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder p-5 flex flex-col gap-3 lg:col-span-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
            Stock status counts
          </h2>
          <button
            type="button"
            onClick={() => onOpenDashboardModal('total')}
            className="w-full text-left bg-slate-50 dark:bg-darkbg/60 hover:bg-slate-100 dark:hover:bg-darkbg p-3.5 rounded-lg border border-slate-200 dark:border-darkborder flex items-center justify-between transition-colors min-w-0"
          >
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap truncate">
              Total registered products
            </span>
            <span
              id="dash-total-products"
              className="text-base font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap ml-2"
            >
              {summary.totalProductsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenDashboardModal('low')}
            className="w-full text-left bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/70 p-3.5 rounded-lg border border-amber-200 dark:border-amber-800/40 flex items-center justify-between transition-colors min-w-0"
          >
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2 whitespace-nowrap truncate">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Low stock (3 or fewer)
            </span>
            <span
              id="dash-low-stock"
              className="text-base font-mono font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap ml-2"
            >
              {summary.lowStockCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenDashboardModal('out')}
            className="w-full text-left bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/70 p-3.5 rounded-lg border border-rose-200 dark:border-rose-800/40 flex items-center justify-between transition-colors min-w-0"
          >
            <span className="text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2 whitespace-nowrap truncate">
              <XCircle className="w-3.5 h-3.5 flex-shrink-0" /> Out of stock
            </span>
            <span
              id="dash-out-stock"
              className="text-base font-mono font-bold text-rose-800 dark:text-rose-300 whitespace-nowrap ml-2"
            >
              {summary.outOfStockCount}
            </span>
          </button>
        </div>

        {/* Audit Activity Stream Feed Widget */}
        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder flex flex-col lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-darkborder flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Recent activity log
            </h2>
            <button
              type="button"
              onClick={onClearActivityLog}
              className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Clear history
            </button>
          </div>
          <div className="p-5 overflow-y-auto max-h-[320px] custom-scrollbar flex-1">
            <div id="activity-log-container" className="divide-y divide-slate-100 dark:divide-darkborder">
              {activityLog.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <History className="w-5 h-5 mx-auto mb-2 opacity-60" />
                  No recent activity recorded.
                </div>
              ) : (
                activityLog.slice(0, 15).map((act) => (
                  <div
                    key={act.id}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-baseline justify-between gap-4"
                  >
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {act.message}
                    </p>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {act.date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
