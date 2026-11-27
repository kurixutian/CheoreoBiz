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
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#F7F7F5]/85 dark:bg-darkbg/85 backdrop-blur-xl border-t border-[#E2E4E9]/70 dark:border-white/[0.06] flex justify-around items-center py-1.5 px-2 sm:hidden transition-transform duration-300"
    >
      {MOBILE_TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSwitchTab(id)}
            data-tab-btn={id}
            aria-current={isActive ? 'page' : undefined}
            className={`${
              isActive
                ? 'text-brand-700 dark:text-brand-400 font-bold bg-brand-50/90 dark:bg-brand-500/15'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
            } flex flex-col items-center justify-center gap-1 min-h-[44px] py-1.5 flex-1 transition-all active:scale-95 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};
