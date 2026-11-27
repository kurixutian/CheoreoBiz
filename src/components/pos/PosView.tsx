import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Grid3x3,
  ChevronDown,
  Search,
  SearchX,
  Plus,
  ShoppingCart,
  X,
  Sparkles,
  Info,
  Minus,
  Tag,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Inbox,
  XCircle,
  Check,
  Clock,
  AlertCircle,
  PackageCheck,
  Truck,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  InventoryItem,
  Order,
  Bundle,
  CartItem,
  OrderTab,
  SortEntry,
} from '../../types';
import {
  calculateCart,
  getFilteredOrders,
  getOrderItems,
} from '../../services/calculations';
import { SortIndicator } from '../common/SortIndicator';
import { ViewHeader } from '../common/ViewHeader';

interface PosViewProps {
  inventory: InventoryItem[];
  orders: Order[];
  bundles: Bundle[];
  cart: CartItem[];
  editingOrderId: string | null;
  posCustomer: string;
  setPosCustomer: (v: string) => void;
  posPaidAmount: string;
  setPosPaidAmount: (v: string) => void;
  posPaidFull: boolean;
  setPosPaidFull: (v: boolean) => void;
  isCartModalOpen: boolean;
  setIsCartModalOpen: (v: boolean) => void;
  isFabScrollHidden: boolean;
  orderSortStack: SortEntry[];
  onToggleOrderSort: (col: string, isShift: boolean) => void;
  onAddToCart: (itemId: string) => void;
  onUpdateCartQty: (itemId: string, delta: number) => void;
  onClearCart: () => void;
  onCheckoutCart: () => void;
  onToggleOrderPaid: (orderId: string) => void;
  onToggleOrderReceived: (orderId: string) => void;
  onEditOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onDeleteOrderPermanently: (orderId: string) => void;
  onGenerateReceipt: (orderId: string) => void;
  onExportCSV: () => void;
}

const ORDER_TABS: { id: OrderTab; label: string; btnId: string }[] = [
  { id: 'all', label: 'All Active', btnId: 'tab-all-orders' },
  { id: 'active', label: 'Unpaid / Open', btnId: 'tab-active-orders' },
  { id: 'completed', label: 'Completed', btnId: 'tab-completed-orders' },
  { id: 'cancelled', label: 'Cancelled / Void', btnId: 'tab-cancelled-orders' },
];

export const PosView: React.FC<PosViewProps> = ({
  inventory,
  orders,
  bundles,
  cart,
  editingOrderId,
  posCustomer,
  setPosCustomer,
  posPaidAmount,
  setPosPaidAmount,
  posPaidFull,
  setPosPaidFull,
  isCartModalOpen,
  setIsCartModalOpen,
  isFabScrollHidden,
  orderSortStack,
  onToggleOrderSort,
  onAddToCart,
  onUpdateCartQty,
  onClearCart,
  onCheckoutCart,
  onToggleOrderPaid,
  onToggleOrderReceived,
  onEditOrder,
  onCancelOrder,
  onDeleteOrderPermanently,
  onGenerateReceipt,
  onExportCSV,
}) => {
  const [posSubTab, setPosSubTab] = useState<'register' | 'ledger'>('register');
  const [posSearch, setPosSearch] = useState('');
  const [currentOrderTab, setCurrentOrderTab] = useState<OrderTab>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const custWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingOrderId) {
      setPosSubTab('register');
    }
  }, [editingOrderId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (custWrapperRef.current && !custWrapperRef.current.contains(e.target as Node)) {
        setShowCustDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const cartCalc = calculateCart(cart, bundles);
  const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
  const badgeText = totalQty > 99 ? '99+' : String(totalQty);

  useEffect(() => {
    if (posPaidFull) {
      setPosPaidAmount(cartCalc.total.toFixed(2));
    }
  }, [cartCalc.total, posPaidFull, setPosPaidAmount]);

  const handleTogglePaidFull = (checked: boolean) => {
    setPosPaidFull(checked);
    if (checked) {
      setPosPaidAmount(cartCalc.total.toFixed(2));
    } else {
      setPosPaidAmount('');
    }
  };

  const handleQuickTenderAdd = (delta: number) => {
    setPosPaidFull(false);
    const current = parseFloat(posPaidAmount) || 0;
    setPosPaidAmount((current + delta).toFixed(2));
  };

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) {
      onCheckoutCart();
      return;
    }
    const totalRevenue = cartCalc.total;
    let paidVal = parseFloat(posPaidAmount);
    if (isNaN(paidVal) || paidVal < 0) paidVal = 0;
    const willBePaid = posPaidFull || paidVal >= totalRevenue - 0.01;

    onCheckoutCart();
    setPosSubTab('ledger');
    setCurrentOrdersPage(1);
    if (willBePaid && currentOrderTab === 'active') {
      setCurrentOrderTab('all');
    }
  };

  const catalogItems = inventory.filter((i) =>
    i.name.toLowerCase().includes(posSearch.toLowerCase())
  );

  const cartIds = cart.map((c) => c.id);
  const suggestionCandidates = inventory.filter(
    (i) => !cartIds.includes(i.id) && i.stockQty > 0
  );
  const topSuggestions = cart.length > 0 ? suggestionCandidates.slice(0, 2) : [];

  const distinctCustomers = Array.from(
    new Set(orders.map((o) => o.customerName).filter(Boolean))
  );
  const matchingCustomers = posCustomer.trim()
    ? distinctCustomers.filter((c) =>
        c.toLowerCase().includes(posCustomer.trim().toLowerCase())
      )
    : [];

  const filteredOrders = getFilteredOrders(
    orders,
    currentOrderTab,
    historySearch,
    orderSortStack
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage) || 1;
  const safePage = Math.min(currentOrdersPage, totalPages);
  const pageSlicedOrders = filteredOrders.slice(
    (safePage - 1) * ordersPerPage,
    safePage * ordersPerPage
  );

  return (
    <section data-tab-content="orders" className="space-y-6 relative block animate-fade-in">
      <ViewHeader title="Point of Sale">
        <div className="flex bg-slate-200/70 dark:bg-darkcard p-1 rounded-xl text-xs font-semibold border border-slate-200 dark:border-darkborder w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setPosSubTab('register')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-1 sm:flex-none whitespace-nowrap text-xs ${
              posSubTab === 'register'
                ? 'bg-white dark:bg-darksurface text-slate-900 dark:text-white border border-slate-200/70 dark:border-white/10 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span className="whitespace-nowrap">Counter Register</span>
          </button>
          <button
            type="button"
            onClick={() => setPosSubTab('ledger')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all flex-1 sm:flex-none whitespace-nowrap text-xs ${
              posSubTab === 'ledger'
                ? 'bg-white dark:bg-darksurface text-slate-900 dark:text-white border border-slate-200/70 dark:border-white/10 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <span className="whitespace-nowrap">Sales Ledger</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums bg-slate-200/80 dark:bg-darkinput text-slate-700 dark:text-slate-300">
              {orders.length}
            </span>
          </button>
        </div>
      </ViewHeader>

      {posSubTab === 'register' && (
        <>
          {/* Mobile Floating Action Cart Trigger */}
          <div
            id="mobile-cart-fab-container"
            aria-hidden={isFabScrollHidden}
            className={`fixed bottom-20 right-6 z-40 xl:hidden block ${
              isFabScrollHidden ? 'is-scroll-hidden' : ''
            }`}
          >
            <button
              onClick={() => setIsCartModalOpen(true)}
              aria-label="Open checkout basket"
              className="w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl flex items-center justify-center shadow-xl border border-white/10 transition-transform active:scale-95 relative"
            >
              <ShoppingBag className="w-6 h-6" />
              <span
                id="mobile-fab-badge-count"
                className={`absolute -top-2 -right-2 bg-rose-600 text-white text-[11px] font-bold rounded-full h-5 min-w-[20px] px-1.5 ${
                  totalQty === 0 ? 'hidden' : 'inline-flex'
                } items-center justify-center border-2 border-white dark:border-darkbg shadow-md z-10 leading-none pointer-events-none font-mono tabular-nums`}
              >
                {badgeText}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Catalog Container */}
            <details
              id="pos-catalog-container"
              className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder xl:col-span-2 group flex flex-col overflow-hidden transition-all duration-300"
              open
            >
              <summary className="p-4 sm:p-5 border-b border-slate-200 dark:border-darkborder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 bg-slate-50/60 dark:bg-darksurface/40 cursor-pointer select-none focus:outline-none">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 whitespace-nowrap text-slate-900 dark:text-white">
                    <Grid3x3 className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Product Catalog
                  </h2>
                  <div className="text-slate-500 dark:text-slate-400 group-open:rotate-180 transition-transform sm:hidden ml-2">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="text"
                      id="pos-search"
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      placeholder="Quick filter products..."
                      className="w-full bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-brand-500/30 outline-none transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="text-slate-400 group-open:rotate-180 transition-transform hidden sm:block">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </summary>

          <div
            id="pos-catalog-grid"
            className="p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 overflow-y-auto content-start bg-slate-50/30 dark:bg-darkbg/20 flex-1 custom-scrollbar min-h-[350px] sm:min-h-[500px]"
          >
            {catalogItems.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                <SearchX className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs font-bold">No products match search criteria.</p>
              </div>
            ) : (
              catalogItems.map((item) => {
                const outOfStock = item.stockQty <= 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!outOfStock) onAddToCart(item.id);
                    }}
                    className={`bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl p-3 flex flex-col justify-between transition-all shadow-xs ${
                      outOfStock
                        ? 'opacity-40 grayscale cursor-not-allowed'
                        : 'hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md cursor-pointer group active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {item.image ? (
                        <div className="aspect-square w-full rounded-lg mb-2 overflow-hidden bg-slate-100 dark:bg-darkinput border border-slate-200/50 dark:border-darkborder">
                          <img
                            src={item.image}
                            loading="lazy"
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square w-full rounded-lg mb-2 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg border border-brand-100/50 dark:border-brand-900/50 shadow-inner">
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <h4 className="font-semibold text-xs leading-tight mb-1 text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {item.name}
                      </h4>
                      <span
                        className={`text-[11px] font-medium whitespace-nowrap ${
                          outOfStock ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.stockQty} in stock
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-slate-900 dark:text-white font-mono tabular-nums font-bold text-xs whitespace-nowrap tracking-tight">
                        ₱{' '}
                        {(item.sellPrice || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {!outOfStock && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-950 flex items-center justify-center text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </details>

        {/* Sidebar Checkout Basket Modal Container */}
        <div
          id="cartModal"
          onClick={(e) => {
            if (e.target === e.currentTarget && window.innerWidth < 1280) {
              setIsCartModalOpen(false);
            }
          }}
          className={`fixed inset-0 z-[90] items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-darkbg/80 transition-all overflow-y-auto ${
            isCartModalOpen ? 'flex opacity-100' : 'hidden opacity-0'
          } xl:static xl:z-auto xl:p-0 xl:bg-transparent xl:dark:bg-transparent xl:flex xl:opacity-100 xl:col-span-1 xl:sticky xl:top-6`}
        >
          <div
            id="cart-wrapper"
            className={`bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder w-full max-w-[420px] xl:max-w-none rounded-2xl xl:rounded-xl shadow-2xl xl:shadow-none flex flex-col transform ${
              isCartModalOpen ? 'scale-100' : 'scale-95'
            } xl:transform-none transition-transform duration-200 relative overflow-hidden max-h-[92vh] xl:max-h-[calc(100vh-120px)] my-auto`}
          >
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-darkborder flex justify-between items-center bg-slate-50/70 dark:bg-darksurface/40 select-none flex-none">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <ShoppingCart className="w-5 h-5 text-brand-500" />
                  <span
                    id="cart-badge-count"
                    className={`absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 items-center justify-center border border-white dark:border-darkcard ${
                      totalQty === 0 ? 'hidden' : 'flex'
                    }`}
                  >
                    {badgeText}
                  </span>
                </div>
                <h2
                  id="cart-title"
                  className="text-base font-bold text-slate-900 dark:text-white truncate"
                >
                  {editingOrderId ? `Edit: ${editingOrderId}` : 'Checkout Basket'}
                </h2>
              </div>

              {editingOrderId && (
                <div
                  id="cart-mode-badge"
                  className="mr-2 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/30"
                >
                  Editing Ticket
                </div>
              )}

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  id="cart-action-btn"
                  onClick={onClearCart}
                  className="text-xs text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1 rounded-full btn-transition border border-transparent"
                >
                  {editingOrderId ? 'Cancel' : 'Clear'}
                </button>
                <button
                  onClick={() => setIsCartModalOpen(false)}
                  aria-label="Close checkout basket"
                  className="xl:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30 dark:bg-darkbg/20">
              <div id="cart-items-container" className="space-y-2.5">
                {cart.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                    <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-xs font-semibold">
                      Basket is empty
                    </p>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => {
                      const calcItem =
                        cartCalc.items.find((c) => c.id === item.id) || item;
                      const discount = calcItem.discountedAmount || 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white dark:bg-darkcard p-3 rounded-xl border border-slate-200 dark:border-darkborder transition-colors hover:border-brand-400 dark:hover:border-brand-500 animate-scale-in"
                        >
                          <div className="flex flex-col flex-1 min-w-0 mr-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate text-xs mb-0.5">
                              {item.name}
                            </span>
                            <div className="whitespace-nowrap">
                              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                ₱{' '}
                                {item.sellPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              {discount > 0 && (
                                <span className="ml-1.5 text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  - ₱{' '}
                                  {discount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-darkinput p-1 rounded-xl border border-slate-200/80 dark:border-darkborder">
                            <button
                              onClick={() => onUpdateCartQty(item.id, -1)}
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-white dark:hover:bg-darksurface rounded-lg transition-colors active:scale-95"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-7 text-center font-mono tabular-nums font-bold text-xs text-slate-900 dark:text-white">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => onUpdateCartQty(item.id, 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-white dark:hover:bg-darksurface rounded-lg transition-colors active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {cartCalc.appliedBundles.length > 0 && (
                      <div className="mt-3 pt-2.5 border border-emerald-200 dark:border-emerald-800/40 space-y-1 bg-emerald-50/70 dark:bg-emerald-500/10 p-3.5 rounded-xl">
                        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          Applied Promotions
                        </div>
                        {cartCalc.appliedBundles.map((b, idx) => (
                          <div
                            key={`${b.name}-${idx}`}
                            className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold font-mono tabular-nums"
                          >
                            <span>
                              <Tag className="w-3 h-3 inline mr-1 mb-0.5" />
                              {b.times}x {b.name}
                            </span>
                            <span>
                              - ₱{' '}
                              {b.save.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <details
                id="smart-suggestions-section"
                className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder p-3.5 mt-2 group"
              >
                <summary className="flex justify-between items-center cursor-pointer select-none list-none">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Smart Recommendation
                  </span>
                  <span className="text-[11px] font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 px-2 py-0.5 rounded-full">
                    Cross-Sell
                  </span>
                </summary>
                <div id="smart-suggestions-list" className="grid grid-cols-1 gap-2 mt-2.5">
                  {topSuggestions.length === 0 ? (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-darkbg/60 border border-slate-200/80 dark:border-darkborder text-left text-slate-600 dark:text-slate-400 text-xs font-medium flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      Add items to basket to activate complementary product suggestions.
                    </div>
                  ) : (
                    topSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="suggestion-item-card flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-darkborder bg-slate-50/60 dark:bg-darksurface/40 text-xs font-semibold animate-scale-in"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-slate-900 dark:text-slate-200 font-semibold truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium font-mono tabular-nums">
                            Stock: {item.stockQty} left • ₱ {(item.sellPrice || 0).toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart(item.id)}
                          className="px-3 py-1.5 bg-brand-50 dark:bg-brand-500/15 hover:bg-brand-100 dark:hover:bg-brand-500/25 text-brand-700 dark:text-brand-300 text-xs font-semibold rounded-lg btn-transition flex items-center gap-1 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </details>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-darkborder bg-white dark:bg-darkcard space-y-3 flex-none">
              <div className="space-y-1 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-darkborder pb-2.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-mono">
                    ₱{' '}
                    <span id="cart-subtotal-display">
                      {cart.length === 0
                        ? '0.00'
                        : (cartCalc.total + cartCalc.savings).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Applied Promos / Savings:</span>
                  <span className="font-mono">
                    - ₱{' '}
                    <span id="cart-discount-display">
                      {cart.length === 0
                        ? '0.00'
                        : cartCalc.savings.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (12%):</span>
                  <span className="text-slate-700 dark:text-slate-200 font-mono">
                    ₱{' '}
                    <span id="cart-tax-display">
                      {cart.length === 0
                        ? '0.00'
                        : (cartCalc.total * 0.12).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                    </span>
                  </span>
                </div>
              </div>

              <div ref={custWrapperRef} className="space-y-1 relative">
                <label
                  htmlFor="pos-customer"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Customer Reference
                </label>
                <input
                  type="text"
                  id="pos-customer"
                  value={posCustomer}
                  onFocus={() => setShowCustDropdown(true)}
                  onChange={(e) => {
                    setPosCustomer(e.target.value);
                    setShowCustDropdown(true);
                  }}
                  autoComplete="off"
                  placeholder="Walk-in Customer..."
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3.5 text-xs font-medium focus:ring-2 focus:ring-brand-500/30 outline-none transition-all text-slate-900 dark:text-white"
                />
                {showCustDropdown && matchingCustomers.length > 0 && (
                  <div
                    id="customer-dropdown"
                    className="absolute z-50 left-0 right-0 top-full mt-1 max-h-36 overflow-y-auto bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-xl flex flex-col custom-scrollbar"
                  >
                    {matchingCustomers.map((c) => (
                      <div
                        key={c}
                        onMouseDown={() => {
                          setPosCustomer(c);
                          setShowCustDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-950/40 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5 items-end">
                  <div className="space-y-1">
                    <label
                      htmlFor="pos-paid-amount"
                      className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Payment / Deposit (₱)
                    </label>
                    <input
                      type="number"
                      id="pos-paid-amount"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={posPaidFull}
                      value={posPaidAmount}
                      onChange={(e) => setPosPaidAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCheckoutSubmit();
                        }
                      }}
                      className={`w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3 text-sm sm:text-xs font-mono tabular-nums font-semibold focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all text-slate-900 dark:text-white ${
                        posPaidFull ? 'opacity-50 bg-slate-100 dark:bg-slate-800' : ''
                      }`}
                    />
                  </div>
                  <label
                    className={`h-[38px] flex items-center justify-center gap-2 rounded-lg px-2.5 cursor-pointer border transition-colors select-none ${
                      posPaidFull
                        ? 'bg-brand-50 dark:bg-brand-500/15 border-brand-500/60 text-brand-700 dark:text-brand-300'
                        : 'bg-slate-50 dark:bg-darkinput border-slate-200 dark:border-darkborder text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="pos-paid-full"
                      checked={posPaidFull}
                      onChange={(e) => handleTogglePaidFull(e.target.checked)}
                      className="accent-brand-600 w-4 h-4 rounded"
                    />
                    <span className="text-xs font-semibold">
                      Paid Exact
                    </span>
                  </label>
                </div>

                {/* Quick Cash Tender Denominations */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTogglePaidFull(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkinput hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap active:scale-[0.98]"
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosPaidFull(false);
                      setPosPaidAmount('0.00');
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkinput hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap active:scale-[0.98]"
                  >
                    Pay on Delivery
                  </button>
                  {[50, 100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickTenderAdd(amt)}
                      className="px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold rounded-lg border border-slate-200 dark:border-darkborder bg-slate-50 dark:bg-darkinput hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap active:scale-[0.98]"
                    >
                      +₱{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Payment Status / Balance / Change Summary */}
              {(() => {
                const paidVal = posPaidFull ? cartCalc.total : (parseFloat(posPaidAmount) || 0);
                const diff = paidVal - cartCalc.total;
                if (!posPaidFull && cart.length > 0) {
                  if (diff < -0.01) {
                    return (
                      <div className="flex justify-between items-center text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40 whitespace-nowrap">
                        <span className="whitespace-nowrap">Balance Due on Delivery:</span>
                        <span className="font-mono tabular-nums whitespace-nowrap">₱ {Math.abs(diff).toFixed(2)}</span>
                      </div>
                    );
                  } else if (diff > 0.01) {
                    return (
                      <div className="flex justify-between items-center text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 whitespace-nowrap">
                        <span className="whitespace-nowrap">Change Due (Sukli):</span>
                        <span className="font-mono tabular-nums whitespace-nowrap">₱ {diff.toFixed(2)}</span>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              <div className="flex justify-between items-end pt-3 border-t border-slate-200 dark:border-darkborder">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Total Order Amount
                </span>
                <div className="flex items-baseline text-slate-900 dark:text-white whitespace-nowrap">
                  <span className="text-sm font-bold opacity-60 mr-1">₱</span>
                  <span
                    id="cart-total-display"
                    className="text-xl sm:text-2xl font-mono tabular-nums font-bold leading-none tracking-tight whitespace-nowrap"
                  >
                    {cart.length === 0
                      ? '0.00'
                      : cartCalc.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutSubmit}
                className="btn-transition w-full bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold py-3 rounded-xl flex justify-center items-center gap-2 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {posPaidFull || (parseFloat(posPaidAmount) || 0) >= cartCalc.total - 0.01
                    ? 'Complete & Print Receipt'
                    : 'Book Order (Pay on Delivery)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick jump to Sales History Ledger */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder text-xs shadow-xs">
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          {orders.length} transaction records in sales history ledger.
        </span>
        <button
          type="button"
          onClick={() => setPosSubTab('ledger')}
          className="text-brand-700 dark:text-brand-400 hover:underline font-bold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded px-1.5 py-0.5"
        >
          <span>View Sales Ledger</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )}

  {posSubTab === 'ledger' && (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPosSubTab('register')}
          className="text-xs font-bold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded px-1.5 py-0.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Counter Register</span>
        </button>
      </div>

      {/* Sales History Ledger Table Container */}
      <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder flex flex-col overflow-hidden w-full">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-darkborder flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/60 dark:bg-darksurface/40">
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full xl:w-auto">
            <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white flex-shrink-0">
              <Receipt className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Transaction Sales Ledger
            </h2>
            <div className="flex bg-slate-200/70 dark:bg-darkinput p-1 rounded-lg border border-slate-200 dark:border-darkborder w-full md:w-auto overflow-x-auto no-scrollbar">
              {ORDER_TABS.map(({ id, label, btnId }) => {
                const active = currentOrderTab === id;
                return (
                  <button
                    key={id}
                    id={btnId}
                    onClick={() => {
                      setCurrentOrderTab(id);
                      setCurrentOrdersPage(1);
                    }}
                    className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
            <div className="relative w-full sm:max-w-xs group">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                type="text"
                id="history-search"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setCurrentOrdersPage(1);
                }}
                placeholder="Search customer or receipt..."
                className="w-full bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-1.5 pl-9 pr-3 text-xs font-medium focus:ring-2 focus:ring-brand-500/30 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                Rows:
              </span>
              <select
                id="rows-per-page-select"
                aria-label="Rows per page"
                value={ordersPerPage}
                onChange={(e) => {
                  setOrdersPerPage(parseInt(e.target.value, 10) || 10);
                  setCurrentOrdersPage(1);
                }}
                className="bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder py-1 px-2 rounded-lg text-xs font-medium outline-none text-slate-900 dark:text-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button
              onClick={onExportCSV}
              className="btn-transition flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/15 hover:bg-brand-100 dark:hover:bg-brand-500/25 px-3.5 py-1.5 rounded-lg border border-brand-200/80 dark:border-brand-500/30"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full divide-y divide-slate-200 dark:divide-darkborder ledger-orders-table">
            <thead className="bg-slate-50/80 dark:bg-darkbg/80">
              <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-left whitespace-nowrap select-none">
                <th
                  onClick={(e) => onToggleOrderSort('customer', e.shiftKey)}
                  className="py-3.5 px-4 sm:px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Customer <SortIndicator stack={orderSortStack} col="customer" />
                  </div>
                </th>
                <th
                  onClick={(e) => onToggleOrderSort('date', e.shiftKey)}
                  className="py-3.5 px-3 sm:px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Timestamp <SortIndicator stack={orderSortStack} col="date" />
                  </div>
                </th>
                <th className="py-3.5 px-3 sm:px-4 text-left">
                  <div className="flex items-center gap-1">Summary Items</div>
                </th>
                <th
                  onClick={(e) => onToggleOrderSort('total', e.shiftKey)}
                  className="py-3.5 px-3 sm:px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Grand Total <SortIndicator stack={orderSortStack} col="total" />
                  </div>
                </th>
                <th
                  onClick={(e) => onToggleOrderSort('payment', e.shiftKey)}
                  className="py-3.5 px-3 sm:px-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Payment <SortIndicator stack={orderSortStack} col="payment" />
                  </div>
                </th>
                <th
                  onClick={(e) => onToggleOrderSort('delivery', e.shiftKey)}
                  className="py-3.5 px-3 sm:px-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Delivery <SortIndicator stack={orderSortStack} col="delivery" />
                  </div>
                </th>
                <th className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody
              id="orders-list"
              className="divide-y divide-slate-100 dark:divide-darkborder/60 text-xs"
            >
              {pageSlicedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold">No order records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageSlicedOrders.map((order) => {
                  const due = order.totalRevenue - (order.amountPaid || 0);
                  const isCancelled = order.status === 'cancelled';
                  const orderItems = getOrderItems(order);

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onGenerateReceipt(order.id)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isCancelled
                          ? 'opacity-50 grayscale bg-slate-50/30 dark:bg-darkbg/20'
                          : ''
                      }`}
                    >
                      <td data-label="Customer" className="py-3 px-4 sm:px-5 truncate-cell">
                        <div
                          className="font-bold text-xs text-slate-900 dark:text-white truncate"
                          title={order.customerName}
                        >
                          {order.customerName}
                          {order.isEdited && !isCancelled && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 align-middle whitespace-nowrap">
                              Edited
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        data-label="Timestamp"
                        className="py-3 px-3 sm:px-4 text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
                      >
                        {order.date || 'N/A'}
                      </td>
                      <td
                        data-label="Summary Items"
                        className="py-3 px-3 sm:px-4 text-[11px] font-medium text-slate-600 dark:text-slate-300 max-w-[220px]"
                      >
                        {orderItems.map((i, idx) => {
                          const matchedInv = inventory.find(
                            (inv) =>
                              inv.name.toLowerCase().trim() === i.name.toLowerCase().trim()
                          );
                          return (
                            <div
                              key={`${i.id}-${idx}`}
                              className="flex items-center gap-2 mb-1 last:mb-0"
                            >
                              {matchedInv && matchedInv.image ? (
                                <img
                                  src={matchedInv.image}
                                  loading="lazy"
                                  alt={i.name}
                                  className="w-7 h-7 object-cover rounded-xl border border-slate-200/80 dark:border-darkborder flex-shrink-0"
                                  title={i.name}
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-brand-100">
                                  {i.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span
                                className="font-bold text-slate-800 dark:text-slate-200 truncate"
                                title={`${i.qty}x ${i.name}`}
                              >
                                {i.qty}x {i.name}
                              </span>
                            </div>
                          );
                        })}
                      </td>
                      <td
                        data-label="Grand Total"
                        className={`py-3 px-3 sm:px-4 text-right font-mono font-bold text-xs tabular-nums text-slate-900 dark:text-white tracking-tight whitespace-nowrap ${
                          isCancelled ? 'line-through' : ''
                        }`}
                      >
                        ₱{' '}
                        {order.totalRevenue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        data-label="Payment"
                        onClick={(e) => e.stopPropagation()}
                        className="py-3 px-3 sm:px-4 text-center action-prevent-trigger whitespace-nowrap"
                      >
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full whitespace-nowrap">
                            <XCircle className="w-3 h-3" /> Void
                          </span>
                        ) : order.isPaid ? (
                          <button
                            onClick={() => onToggleOrderPaid(order.id)}
                            className="btn-transition inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/30 whitespace-nowrap hover:bg-emerald-100"
                          >
                            <Check className="w-3 h-3" /> Paid
                          </button>
                        ) : (order.amountPaid || 0) > 0 ? (
                          <button
                            onClick={() => onToggleOrderPaid(order.id)}
                            className="btn-transition inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800/30 whitespace-nowrap"
                          >
                            <Clock className="w-3 h-3" /> Bal: ₱ {due.toFixed(2)}
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleOrderPaid(order.id)}
                            className="btn-transition inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800/30 whitespace-nowrap"
                          >
                            <AlertCircle className="w-3 h-3" /> Unpaid
                          </button>
                        )}
                      </td>
                      <td
                        data-label="Delivery"
                        onClick={(e) => e.stopPropagation()}
                        className="py-3 px-3 sm:px-4 text-center action-prevent-trigger whitespace-nowrap"
                      >
                        {isCancelled ? (
                          <span className="text-slate-400 font-bold">-</span>
                        ) : order.isReceived ? (
                          <button
                            onClick={() => onToggleOrderReceived(order.id)}
                            className="btn-transition inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800/30 whitespace-nowrap"
                          >
                            <PackageCheck className="w-3 h-3 text-blue-500" /> Completed
                          </button>
                        ) : (
                          <button
                            onClick={() => onToggleOrderReceived(order.id)}
                            className="btn-transition inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-white dark:bg-darkcard text-slate-500 rounded-full border border-slate-200 dark:border-darkborder whitespace-nowrap shadow-xs"
                          >
                            <Truck className="w-3 h-3 text-amber-500" /> Pending
                          </button>
                        )}
                      </td>
                      <td
                        data-label="Actions"
                        onClick={(e) => e.stopPropagation()}
                        className="py-3 px-4 sm:px-5 text-right action-prevent-trigger whitespace-nowrap"
                      >
                        <div className="inline-flex items-center justify-end gap-1 flex-nowrap">
                          <button
                            onClick={() => onGenerateReceipt(order.id)}
                            title="Receipt"
                            aria-label="Receipt"
                            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors btn-transition"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          {!isCancelled ? (
                            <>
                              <button
                                onClick={() => onEditOrder(order.id)}
                                title="Edit Order"
                                aria-label="Edit Order"
                                className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-full transition-colors btn-transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onCancelOrder(order.id)}
                                title="Cancel Order"
                                aria-label="Cancel Order"
                                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors btn-transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onDeleteOrderPermanently(order.id)}
                              title="Delete Permanently"
                              aria-label="Delete Permanently"
                              className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors btn-transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Orders Table Pagination Bar */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-darkbg/40 text-xs">
          <span id="pagination-info-text" className="text-slate-500 font-bold">
            Showing page {safePage} of {totalPages} ({filteredOrders.length} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentOrdersPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="p-1.5 bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all shadow-xs btn-transition flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentOrdersPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="p-1.5 bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all shadow-xs btn-transition flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</section>
  );
};
