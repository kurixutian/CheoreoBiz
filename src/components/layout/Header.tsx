import React from 'react';
import {
  Calculator,
  Moon,
  Sun,
  Download,
  LogOut,
  LayoutDashboard,
  Package,
  Sparkles,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { TabId } from '../../types';

interface HeaderProps {
  activeTab: TabId;
  isDark: boolean;
  onSwitchTab: (tab: TabId) => void;
  onOpenCalculator: () => void;
  onToggleTheme: () => void;
  onExportData: () => void;
  onLogout: () => void;
}

const NAV_TABS: { id: TabId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory Stocks', Icon: Package },
  { id: 'bundles', label: 'Promos & Bundles', Icon: Sparkles },
  { id: 'orders', label: 'Point of Sale (POS)', Icon: ShoppingBag },
  { id: 'bnpl', label: 'Supplier AP', Icon: Truck },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isDark,
  onSwitchTab,
  onOpenCalculator,
  onToggleTheme,
  onExportData,
  onLogout,
}) => {
  return (
    <header className="bg-[#F7F7F5]/85 dark:bg-darkbg/85 backdrop-blur-xl border-b border-[#E2E4E9]/70 dark:border-white/[0.06] relative z-40 transition-colors flex-none">
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 max-w-[1440px] flex flex-row justify-between items-center py-2.5 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <img
            src="./icon-192.png"
            alt="CheoreoBiz"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover flex-shrink-0 ring-1 ring-slate-200/80 dark:ring-0"
          />
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold tracking-[-0.02em] text-slate-900 dark:text-white leading-none truncate">
              CheoreoBiz
            </div>
            <div className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              POS &amp; Operations Ledger
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenCalculator}
            aria-label="Open Quick Calculator"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            title="Calculator"
          >
            <Calculator className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle Dark or Light Mode"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            title="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onExportData}
            aria-label="Export Backup JSON"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            title="Export Backup JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign Out"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Header Navigation Tabs */}
      <nav className="hidden sm:flex container mx-auto px-4 lg:px-8 max-w-[1440px] gap-1 overflow-x-auto no-scrollbar pt-1">
        {NAV_TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSwitchTab(id)}
              data-tab-btn={id}
              className={`${
                isActive
                  ? 'tab-active text-brand-700 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-b-2 border-transparent'
              } flex-shrink-0 flex items-center gap-2 px-3 py-2 font-semibold text-xs transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
