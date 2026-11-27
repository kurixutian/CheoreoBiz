import React, { useState, useRef, useEffect } from 'react';
import {
  MinusCircle,
  History,
  Truck,
  ChevronDown,
  FilePlus,
  Clock,
  Search,
  PackageCheck,
  DownloadCloud,
  Coins,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import {
  InventoryItem,
  Order,
  BnplRecord,
  StockHistoryEntry,
  CashAdjustment,
  ApFilter,
  SortEntry,
} from '../../types';
import { DEFAULT_BATCH_OPTIONS } from '../../constants/config';
import {
  calculateLiquidCash,
  getSortedBnplRecords,
  getOrderItems,
} from '../../services/calculations';
import { SortIndicator } from '../common/SortIndicator';
import { ViewHeader } from '../common/ViewHeader';

interface BnplViewProps {
  inventory: InventoryItem[];
  orders: Order[];
  bnplRecords: BnplRecord[];
  stockHistory: StockHistoryEntry[];
  cashAdjustments: CashAdjustment[];
  sortStack: SortEntry[];
  onToggleSort: (col: string, isShift: boolean) => void;
  onLogSupplierPurchase: (payload: {
    supplier: string;
    purchaseDate: string;
    dueDate: string;
    batchNumber: string;
    prodName: string;
    qty: number;
    totalCost: number;
    notes: string;
    inventoryReceived: boolean;
  }) => void;
  onReceiveSupplierBatch: (id: string) => void;
  onOpenApPaymentModal: (id: string) => void;
  onViewPaymentHistory: (id: string) => void;
  onOpenSupplierPurchaseEdit: (id: string) => void;
  onDeleteSupplierPurchase: (id: string) => void;
  onOpenSubtractCashModal: () => void;
  onOpenCashHistoryModal: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AP_FILTERS: { id: ApFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'partial', label: 'Partial' },
  { id: 'paid', label: 'Paid' },
];

export const BnplView: React.FC<BnplViewProps> = ({
  inventory,
  orders,
  bnplRecords,
  stockHistory,
  cashAdjustments,
  sortStack,
  onToggleSort,
  onLogSupplierPurchase,
  onReceiveSupplierBatch,
  onOpenApPaymentModal,
  onViewPaymentHistory,
  onOpenSupplierPurchaseEdit,
  onDeleteSupplierPurchase,
  onOpenSubtractCashModal,
  onOpenCashHistoryModal,
  onShowToast,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(todayStr);
  const [batchOptions, setBatchOptions] = useState<string[]>(DEFAULT_BATCH_OPTIONS);
  const [batchNumber, setBatchNumber] = useState('Batch 1');
  const [isAddingCustomBatch, setIsAddingCustomBatch] = useState(false);
  const [customBatchInput, setCustomBatchInput] = useState('');
  const [prodName, setProdName] = useState('');
  const [qty, setQty] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [inventoryReceived, setInventoryReceived] = useState(false);

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);

  const [apFilter, setApFilter] = useState<ApFilter>('all');
  const [bnplSearch, setBnplSearch] = useState('');
  const [bnplRowsPerPage, setBnplRowsPerPage] = useState(10);
  const [bnplCurrentPage, setBnplCurrentPage] = useState(1);

  const supplierRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
      }
      if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
        setShowItemDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const cashData = calculateLiquidCash(orders, bnplRecords, cashAdjustments);

  const distinctSuppliers = Array.from(
    new Set(bnplRecords.map((b) => b.supplierName).filter(Boolean))
  );
  const matchingSuppliers = distinctSuppliers.filter((s) =>
    s.toLowerCase().includes(supplier.trim().toLowerCase())
  );

  const matchingItems = inventory.filter((item) =>
    item.name.toLowerCase().includes(prodName.trim().toLowerCase())
  );

  const parsedQty = parseFloat(qty) || 0;
  const parsedCost = parseFloat(totalCost) || 0;
  const showPreview = Boolean(prodName.trim() && parsedQty > 0 && parsedCost > 0);
  const previewCpp = showPreview ? parsedCost / parsedQty : 0;
  const invMatch = inventory.find(
    (i) => i.name.toLowerCase() === prodName.trim().toLowerCase()
  );
  const previewSp = invMatch ? invMatch.sellPrice || 0 : 0;
  const previewPpp = previewSp - previewCpp;
  const previewMargin = previewSp > 0 ? (previewPpp / previewSp) * 100 : 0;

  const handleSaveCustomBatch = () => {
    const trimmed = customBatchInput.trim();
    if (!trimmed) return;
    if (!batchOptions.includes(trimmed)) {
      setBatchOptions((prev) => [...prev, trimmed]);
    }
    setBatchNumber(trimmed);
    setCustomBatchInput('');
    setIsAddingCustomBatch(false);
    onShowToast('Custom batch reference created', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = parseInt(qty, 10) || 0;
    const numCost = parseFloat(totalCost) || 0;
    if (numQty <= 0 || numCost <= 0 || !prodName.trim()) {
      onShowToast('Please provide valid quantity, cost, and product details.', 'error');
      return;
    }

    onLogSupplierPurchase({
      supplier: supplier.trim(),
      purchaseDate,
      dueDate,
      batchNumber,
      prodName: prodName.trim(),
      qty: numQty,
      totalCost: numCost,
      notes: notes.trim() || 'N/A',
      inventoryReceived,
    });

    const resetToday = new Date().toISOString().split('T')[0];
    setSupplier('');
    setPurchaseDate(resetToday);
    setDueDate(resetToday);
    setBatchNumber('Batch 1');
    setProdName('');
    setQty('');
    setTotalCost('');
    setNotes('');
    setInventoryReceived(false);
  };

  const filteredRecords = getSortedBnplRecords(
    bnplRecords,
    apFilter,
    bnplSearch,
    sortStack
  );
  const totalPages = Math.ceil(filteredRecords.length / bnplRowsPerPage) || 1;
  const safePage = Math.min(bnplCurrentPage, totalPages);
  const pageSlicedRecords = filteredRecords.slice(
    (safePage - 1) * bnplRowsPerPage,
    safePage * bnplRowsPerPage
  );

  // Stock Batch Performance Matrix
  const productMap: Record<string, { spent: number; sold: number }> = {};
  stockHistory.forEach((sh) => {
    const name = sh.productName;
    if (!productMap[name]) productMap[name] = { spent: 0, sold: 0 };
    productMap[name].spent += sh.totalCost || 0;
  });
  orders.forEach((o) => {
    if (o.status === 'cancelled') return;
    getOrderItems(o).forEach((i) => {
      const name = i.name;
      if (!productMap[name]) productMap[name] = { spent: 0, sold: 0 };
      productMap[name].sold += i.effectiveTotal || 0;
    });
  });
  const matrixEntries = Object.keys(productMap);

  return (
    <section data-tab-content="bnpl" className="space-y-6 animate-fade-in block">
      <ViewHeader title="Supplier Accounts Payable">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenSubtractCashModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:bg-slate-50 dark:hover:bg-darksurface text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl transition-colors btn-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <MinusCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Use / Subtract Cash</span>
          </button>
          <button
            type="button"
            onClick={onOpenCashHistoryModal}
            aria-label="View Cash Adjustment History"
            title="View Cash Adjustment History"
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder hover:bg-slate-50 dark:hover:bg-darksurface text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors btn-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Cash Log</span>
          </button>
        </div>
      </ViewHeader>

      {/* Divided Financial Strip */}
      <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 sm:divide-x divide-slate-200 dark:divide-darkborder overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Available liquid cash
          </span>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 tracking-tight whitespace-nowrap truncate">
            ₱{' '}
            <span id="cashflow-available-liquid">
              {cashData.availableLiquidCash.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-darkborder text-[11px] font-medium space-y-0.5 text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>System cash</span>
              <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                ₱{' '}
                <span id="cashflow-system-liquid">
                  {cashData.systemLiquidCash.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
            <div className="flex justify-between text-rose-700 dark:text-rose-400">
              <span>Manual used</span>
              <span className="font-mono font-semibold tabular-nums">
                - ₱{' '}
                <span id="cashflow-manual-used">
                  {cashData.activeManualCashUsed.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Safe liquid capital
          </span>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight whitespace-nowrap truncate">
            ₱{' '}
            <span id="cashflow-liquid-pool">
              {cashData.systemLiquidCash.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            POS revenue pool minus paid AP
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Unpaid AP dues
          </span>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 tracking-tight whitespace-nowrap truncate">
            ₱{' '}
            <span id="cashflow-unpaid-bnpl">
              {cashData.totalApUnpaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Pending accounts payable balances
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Settled AP invoices
          </span>
          <p className="mt-2 text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 tracking-tight whitespace-nowrap truncate">
            ₱{' '}
            <span id="cashflow-paid-bnpl">
              {cashData.totalApPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
            Cumulative supplier payouts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <details
          id="bnpl-form-container"
          className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder xl:col-span-1 group overflow-hidden"
          open
        >
          <summary className="p-5 border-b border-slate-200 dark:border-darkborder flex justify-between items-center cursor-pointer select-none focus:outline-none bg-slate-50/60 dark:bg-darksurface/40">
            <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Truck className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Log Supplier Purchase
            </h2>
            <div className="text-slate-500 dark:text-slate-400 group-open:rotate-180 transition-transform">
              <ChevronDown className="w-4 h-4" />
            </div>
          </summary>

          <div className="p-5 space-y-4">
            <form id="bnpl-form" onSubmit={handleSubmit} className="space-y-4">
              <div ref={supplierRef} className="relative space-y-1.5">
                <label
                  htmlFor="bnpl-supplier"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Supplier Name
                </label>
                <input
                  type="text"
                  id="bnpl-supplier"
                  required
                  value={supplier}
                  onFocus={() => setShowSupplierDropdown(true)}
                  onChange={(e) => {
                    setSupplier(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  placeholder="Type supplier name..."
                  autoComplete="off"
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                />
                {showSupplierDropdown && matchingSuppliers.length > 0 && (
                  <div
                    id="supplier-dropdown"
                    className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-xl flex flex-col custom-scrollbar"
                  >
                    {matchingSuppliers.map((s) => (
                      <div
                        key={s}
                        onMouseDown={() => {
                          setSupplier(s);
                          setShowSupplierDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-950/40 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="bnpl-purchasedate"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="bnpl-purchasedate"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="bnpl-duedate"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    id="bnpl-duedate"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="bnpl-batch-number"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Batch Ref Number
                </label>
                <div className="flex gap-2">
                  <select
                    id="bnpl-batch-number"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3.5 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                  >
                    {batchOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomBatch((v) => !v)}
                    className="px-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold btn-transition"
                  >
                    {isAddingCustomBatch ? 'Cancel' : '+ Custom'}
                  </button>
                </div>
                {isAddingCustomBatch && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customBatchInput}
                      onChange={(e) => setCustomBatchInput(e.target.value)}
                      placeholder="Enter custom batch ID..."
                      className="flex-1 bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-1.5 px-3 text-xs font-semibold outline-none text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomBatch}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div ref={itemRef} className="relative space-y-1.5">
                <label
                  htmlFor="batch-item-search"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Product Title
                </label>
                <input
                  type="text"
                  id="batch-item-search"
                  required
                  value={prodName}
                  onFocus={() => setShowItemDropdown(true)}
                  onChange={(e) => {
                    setProdName(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  placeholder="Type product name..."
                  autoComplete="off"
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                />
                {showItemDropdown && matchingItems.length > 0 && (
                  <div
                    id="batch-item-dropdown"
                    className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-xl flex flex-col custom-scrollbar"
                  >
                    {matchingItems.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => {
                          setProdName(item.name);
                          setShowItemDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-950/40 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between"
                      >
                        <span>{item.name}</span>
                        <span className="text-xs font-mono text-slate-400">
                          Price: ₱ {(item.sellPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="batch-item-qty"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="batch-item-qty"
                    required
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3 text-xs font-mono font-bold text-center focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="batch-item-cost"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Total Cost (₱)
                  </label>
                  <input
                    type="number"
                    id="batch-item-cost"
                    required
                    min="0.01"
                    step="0.01"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3 text-xs font-mono font-bold tabular-nums focus:ring-2 focus:ring-brand-500/30 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {showPreview && (
                <div
                  id="batch-item-preview"
                  className="p-3.5 bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100/60 dark:border-brand-900/30 rounded-xl space-y-1 text-xs font-bold text-slate-600 dark:text-slate-400 animate-scale-in"
                >
                  <div className="flex justify-between">
                    <span>Calculated CPP:</span>
                    <span className="text-brand-600 dark:text-brand-400 font-mono tabular-nums">
                      ₱ <span id="preview-cpp">{previewCpp.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Selling Price:</span>
                    <span className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                      ₱ <span id="preview-sp">{previewSp.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin / Pc:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      ₱ <span id="preview-ppp">{previewPpp.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-brand-100/50 dark:border-brand-900/40 pt-1">
                    <span>Target Profit Margin:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                      <span id="preview-margin">{previewMargin.toFixed(2)}</span>%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="bnpl-notes"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Internal Notes
                </label>
                <input
                  type="text"
                  id="bnpl-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional supplier notes..."
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3.5 text-xs outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="bnpl-received-checkbox"
                  checked={inventoryReceived}
                  onChange={(e) => setInventoryReceived(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 accent-emerald-600"
                />
                <label
                  htmlFor="bnpl-received-checkbox"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                >
                  Inventory Stock Already Received
                </label>
              </div>

              <button
                type="submit"
                className="btn-transition w-full bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
              >
                <FilePlus className="w-4 h-4" /> Post Supplier Purchase
              </button>
            </form>
          </div>
        </details>

        {/* Accounts Payable Ledger */}
        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder xl:col-span-2 overflow-hidden flex flex-col min-h-[480px] w-full">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-darkborder bg-slate-50/60 dark:bg-darksurface/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Accounts Payable History Ledger
            </h2>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44 group">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  id="bnpl-search"
                  value={bnplSearch}
                  onChange={(e) => {
                    setBnplSearch(e.target.value);
                    setBnplCurrentPage(1);
                  }}
                  placeholder="Search supplier..."
                  className="w-full bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-1.5 pl-8 pr-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-900 dark:text-white"
                />
              </div>
              <div
                id="bnpl-history-filters"
                className="flex bg-slate-200/60 dark:bg-darkinput p-1 rounded-lg text-xs font-semibold border border-slate-200/80 dark:border-darkborder"
              >
                {AP_FILTERS.map(({ id, label }) => {
                  const active = apFilter === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setApFilter(id);
                        setBnplCurrentPage(1);
                      }}
                      data-ap-btn={id}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                        active
                          ? 'bg-white dark:bg-slate-800 shadow-xs text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <select
                id="bnpl-rows-per-page-select"
                aria-label="Supplier purchase rows per page"
                value={bnplRowsPerPage}
                onChange={(e) => {
                  setBnplRowsPerPage(parseInt(e.target.value, 10) || 10);
                  setBnplCurrentPage(1);
                }}
                className="bg-white dark:bg-darkinput border border-slate-200 dark:border-darkborder p-1.5 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>

          <div className="w-full overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full divide-y divide-slate-200 dark:divide-darkborder ledger-bnpl-table">
              <thead className="bg-slate-50/80 dark:bg-darkbg/80">
                <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-left whitespace-nowrap select-none">
                  <th
                    onClick={(e) => onToggleSort('supplier', e.shiftKey)}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Supplier &amp; Batch <SortIndicator stack={sortStack} col="supplier" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('date', e.shiftKey)}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Dates <SortIndicator stack={sortStack} col="date" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('product', e.shiftKey)}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Line Items <SortIndicator stack={sortStack} col="product" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('financials', e.shiftKey)}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Financials <SortIndicator stack={sortStack} col="financials" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('status', e.shiftKey)}
                    className="py-3 px-3 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-start gap-1">
                      Status <SortIndicator stack={sortStack} col="status" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                id="bnpl-list"
                className="divide-y divide-slate-100 dark:divide-darkborder/60 text-xs"
              >
                {pageSlicedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No supplier purchases recorded.
                    </td>
                  </tr>
                ) : (
                  pageSlicedRecords.map((b) => {
                    const unpaidBal = b.totalAmount - (b.amountPaid || 0);
                    const dueDateStr = b.dueDate || 'N/A';
                    const rDate = b.receivedDate
                      ? new Date(b.receivedDate).toLocaleDateString()
                      : '';

                    return (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td data-label="Supplier & Batch" className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {b.supplierName}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 whitespace-nowrap">
                            Batch: {b.invoiceNumber || 'N/A'}
                          </div>
                        </td>
                        <td data-label="Dates" className="py-3 px-3 text-xs whitespace-nowrap">
                          <div className="text-slate-500 dark:text-slate-400 font-medium text-[11px] whitespace-nowrap">
                            Pur: {b.purchaseDate}
                          </div>
                          <div className="text-rose-500 font-semibold text-[11px] mt-0.5 whitespace-nowrap">
                            Due: {dueDateStr}
                          </div>
                        </td>
                        <td data-label="Line Items" className="py-3 px-3 min-w-[180px] whitespace-nowrap">
                          {(b.items || []).map((item, idx) => {
                            const matchedInv = inventory.find(
                              (inv) =>
                                inv.name.toLowerCase().trim() ===
                                item.itemName.toLowerCase().trim()
                            );
                            return (
                              <div
                                key={`${item.itemName}-${idx}`}
                                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center mb-1 whitespace-nowrap"
                              >
                                {matchedInv && matchedInv.image && (
                                  <img
                                    src={matchedInv.image}
                                    loading="lazy"
                                    alt={item.itemName}
                                    className="w-6 h-6 object-cover rounded-md mr-2 inline-block border border-slate-200"
                                  />
                                )}
                                • {item.qty}x {item.itemName}{' '}
                                <span className="text-slate-400 text-[10px] font-mono tabular-nums ml-1">
                                  (₱ {(item.costPerPiece || 0).toFixed(2)}/pc)
                                </span>
                              </div>
                            );
                          })}
                        </td>
                        <td
                          data-label="Financials"
                          className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap"
                        >
                          <div className="font-bold text-slate-800 dark:text-white text-xs whitespace-nowrap">
                            Total: ₱{' '}
                            {b.totalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 whitespace-nowrap">
                            Paid: ₱{' '}
                            {(b.amountPaid || 0).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-[10px] text-rose-500 font-semibold mt-0.5 whitespace-nowrap">
                            Bal: ₱{' '}
                            {unpaidBal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </td>
                        <td data-label="Status" className="py-3 px-3 text-left whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            {b.status === 'fully_paid' ? (
                              <span className="inline-block bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase whitespace-nowrap">
                                Fully Paid
                              </span>
                            ) : b.status === 'partially_paid' ? (
                              <span className="inline-block bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase whitespace-nowrap">
                                Partial
                              </span>
                            ) : (
                              <span className="inline-block bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase whitespace-nowrap">
                                Unpaid
                              </span>
                            )}
                            {b.isReceived ? (
                              <div className="flex flex-col items-start">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md whitespace-nowrap">
                                  <PackageCheck className="w-3 h-3" /> Loaded
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{rDate}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => onReceiveSupplierBatch(b.id)}
                                title="Load Quantities to Active Inventory"
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase rounded-md border border-emerald-100 dark:border-emerald-800/30 btn-transition flex items-center gap-1 whitespace-nowrap"
                              >
                                <DownloadCloud className="w-3 h-3" /> Receive
                              </button>
                            )}
                          </div>
                        </td>
                        <td
                          data-label="Actions"
                          className="py-3 px-4 text-right whitespace-nowrap"
                        >
                          <div className="inline-flex items-center justify-end gap-1 flex-nowrap">
                            {unpaidBal > 0.01 && (
                                <button
                                  onClick={() => onOpenApPaymentModal(b.id)}
                                  title="Record AP Payment Balance"
                                  aria-label="Record AP Payment Balance"
                                  className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30 btn-transition"
                                >
                                  <Coins className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onViewPaymentHistory(b.id)}
                                title="View Settlement Audit History"
                                aria-label="View Settlement Audit History"
                                className="p-1.5 text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:hover:bg-brand-500/20 rounded-lg border border-brand-100 dark:border-brand-800/30 btn-transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onOpenSupplierPurchaseEdit(b.id)}
                                title="Modify Invoice Fields"
                                aria-label="Modify Invoice Fields"
                                className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg btn-transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteSupplierPurchase(b.id)}
                                title="Purge Record"
                                aria-label="Purge Record"
                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg btn-transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 border-t border-slate-200/80 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-darkbg/40 text-xs">
              <span
                id="bnpl-pagination-info-text"
                className="text-slate-500 font-bold text-xs"
              >
                Showing page {safePage} of {totalPages} ({filteredRecords.length} total)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBnplCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className="p-1.5 bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all shadow-xs btn-transition flex items-center justify-center text-slate-700 dark:text-slate-200"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setBnplCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className="p-1.5 bg-white dark:bg-darkcard border border-slate-200/80 dark:border-darkborder rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-all shadow-xs btn-transition flex items-center justify-center text-slate-700 dark:text-slate-200"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Analysis Matrix Table */}
        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-darkborder overflow-hidden mt-6 w-full">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-darkborder bg-slate-50/60 dark:bg-darksurface/40">
            <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <BarChart2 className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Stock Batch Performance Matrix (Gross
              Sold vs Spent)
            </h2>
          </div>
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full divide-y divide-slate-200 dark:divide-darkborder ledger-matrix-table">
              <thead className="bg-slate-50/80 dark:bg-darkbg/80">
                <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-left">
                <th className="py-3 px-5">Item Name</th>
                <th className="py-3 px-4 text-right text-amber-600 dark:text-amber-400">
                  Total Procurement Spent
                </th>
                <th className="py-3 px-4 text-right text-brand-600 dark:text-brand-400">
                  Total Retail Sales (Gross)
                </th>
                <th className="py-3 px-5 text-right text-emerald-600 dark:text-emerald-400">
                  Net Profit Engine
                </th>
              </tr>
            </thead>
            <tbody
              id="batch-matrix-list"
              className="divide-y divide-slate-100 dark:divide-darkborder/60 text-xs"
            >
              {matrixEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                    No stock procurement or sales matrix context.
                  </td>
                </tr>
              ) : (
                matrixEntries.map((name) => {
                  const spent = productMap[name].spent;
                  const sold = productMap[name].sold;
                  const profit = sold - spent;
                  return (
                    <tr
                      key={name}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td
                        data-label="Item Name"
                        className="py-3 px-5 font-bold text-xs text-slate-900 dark:text-white truncate whitespace-nowrap"
                      >
                        {name}
                      </td>
                      <td
                        data-label="Total Procurement Spent"
                        className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap"
                      >
                        ₱ {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        data-label="Total Retail Sales (Gross)"
                        className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-xs text-brand-600 dark:text-brand-400 whitespace-nowrap"
                      >
                        ₱ {sold.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        data-label="Net Profit Engine"
                        className={`py-3 px-5 text-right font-mono font-bold tabular-nums text-xs whitespace-nowrap ${
                          profit >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        ₱ {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
