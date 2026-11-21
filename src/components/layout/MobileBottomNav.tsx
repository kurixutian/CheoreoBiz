import React from 'react';
import { LayoutDashboard, Package, Sparkles, ShoppingBag, Truck } from 'lucide-react';
import { TabId } from '../../types';

interface MobileBottomNavProps {
  activeTab: TabId;
  onSwitchTab: (tab: TabId) => void;
}

const MOBILE_TABS: { id: TabId; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Overview', Icon: LayoutDashboard },
  { id: 'inventory', label: 'Stocks', Icon: Package },
  { id: 'bundles', label: 'Promos', Icon: Sparkles },
  { id: 'orders', label: 'POS', Icon: ShoppingBag },
  { id: 'bnpl', label: 'Suppliers', Icon: Truck },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onSwitchTab }) => {
  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-darkcard border-t border-slate-200 dark:border-darkborder flex justify-around items-center py-2 px-1 sm:hidden transition-transform duration-300"
    >
      {MOBILE_TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSwitchTab(id)}
            data-tab-btn={id}
            className={`${
              isActive
                ? 'text-brand-700 dark:text-brand-400 font-bold bg-brand-50/80 dark:bg-brand-950/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            } flex flex-col items-center justify-center gap-1 py-1.5 flex-1 transition-colors rounded-xl outline-none`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
