import React, { useState, useRef, useEffect } from 'react';
import {
  PlusCircle,
  ChevronDown,
  ImagePlus,
  Plus,
  Package,
  History,
  PackageOpen,
  AlertOctagon,
  Trash2,
} from 'lucide-react';
import { InventoryItem, BnplRecord, SortEntry } from '../../types';
import { getProductHistoricalCPP, getSortedInventory } from '../../services/calculations';
import { resizeProductImage } from '../../services/exportReceipt';
import { SortIndicator } from '../common/SortIndicator';

interface InventoryViewProps {
  inventory: InventoryItem[];
  bnplRecords: BnplRecord[];
  sortStack: SortEntry[];
  onToggleSort: (col: string, isShift: boolean) => void;
  onRegisterProduct: (
    name: string,
    sellPrice: number,
    image: string | null,
    recMin: number,
    recMax: number
  ) => void;
  onEditStock: (id: string) => void;
  onDeleteStock: (id: string) => void;
  onOpenRejectModal: (id: string) => void;
  onOpenStockHistoryModal: () => void;
  onSellItemToPos: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  bnplRecords,
  sortStack,
  onToggleSort,
  onRegisterProduct,
  onEditStock,
  onDeleteStock,
  onOpenRejectModal,
  onOpenStockHistoryModal,
  onSellItemToPos,
}) => {
  const [itemName, setItemName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownWrapperRef.current &&
        !dropdownWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredDropdownItems = itemName.trim()
    ? inventory.filter((item) =>
        item.name.toLowerCase().includes(itemName.trim().toLowerCase())
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = itemName.trim();
    const parsedPrice = parseFloat(sellPrice);
    if (!trimmedName || isNaN(parsedPrice)) return;

    let base64Image: string | null = null;
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      try {
        base64Image = await resizeProductImage(file);
      } catch {
        base64Image = null;
      }
    }

    onRegisterProduct(trimmedName, parsedPrice, base64Image, 0, 0);
    setItemName('');
    setSellPrice('');
    setShowDropdown(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayList = getSortedInventory(inventory, bnplRecords, sortStack);

  return (
    <section data-tab-content="inventory" className="space-y-6 block animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Collapsible Form */}
        <details
          id="inventory-form-container"
          className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-sleek xl:col-span-1 group"
          open
        >
          <summary className="p-5 sm:p-6 border-b border-slate-200 dark:border-darkborder flex justify-between items-center cursor-pointer select-none focus:outline-none">
            <h2 className="text-base font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
              <PlusCircle className="w-5 h-5 text-emerald-600" /> Register Product
            </h2>
            <div className="text-slate-400 group-open:rotate-180 transition-transform">
              <ChevronDown className="w-5 h-5" />
            </div>
          </summary>

          <div className="p-5 sm:p-6 space-y-4">
            <form id="stock-form" onSubmit={handleSubmit} className="space-y-4">
              <div ref={dropdownWrapperRef} className="relative space-y-1.5">
                <label
                  htmlFor="item-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  id="item-name"
                  required
                  value={itemName}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Type product name..."
                  autoComplete="off"
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-3.5 text-xs font-medium focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none transition-all text-slate-900 dark:text-white"
                />
                {showDropdown && filteredDropdownItems.length > 0 && (
                  <div
                    id="custom-dropdown"
                    className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800 custom-scrollbar"
                  >
                    {filteredDropdownItems.map((item) => (
                      <div
                        key={item.id}
                        onMouseDown={() => {
                          setItemName(item.name);
                          setSellPrice(String(item.sellPrice || 0));
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-950/40 cursor-pointer text-xs font-semibold flex justify-between items-center transition-colors group"
                      >
                        <span className="group-hover:text-brand-600 dark:group-hover:text-brand-400 text-slate-900 dark:text-slate-100">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          ₱{' '}
                          {(item.sellPrice || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="item-image-file"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Product Image (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-50/50 dark:bg-darkbg/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImagePlus className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors mb-1" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Click to upload photo
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="item-image-file"
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor="sell-price"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Selling Price / unit
                </label>
                <input
                  type="number"
                  id="sell-price"
                  required
                  min="0"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-3.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <button
                type="submit"
                className="btn-transition w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold py-3 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              >
                <Plus className="w-4 h-4" /> Register Item
              </button>
            </form>
          </div>
        </details>

        {/* Active Inventory Table */}
        <div className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-darkborder shadow-sleek xl:col-span-2 overflow-hidden flex flex-col min-h-[500px] w-full">
          <div className="p-5 border-b border-slate-200 dark:border-darkborder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-darkbg/40">
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Package className="w-5 h-5 text-brand-500" /> Active Inventory Items
            </h2>
            <button
              onClick={onOpenStockHistoryModal}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-all shadow-xs btn-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
            >
              <History className="w-4 h-4" /> Restock Audit Log
            </button>
          </div>
          <div className="w-full overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full divide-y divide-slate-200 dark:divide-darkborder ledger-inventory-table">
              <thead className="bg-slate-50/80 dark:bg-darkbg/80">
                <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-left whitespace-nowrap select-none">
                  <th
                    onClick={(e) => onToggleSort('name', e.shiftKey)}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Product Details <SortIndicator stack={sortStack} col="name" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('stock', e.shiftKey)}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Current Stock <SortIndicator stack={sortStack} col="stock" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('cpp', e.shiftKey)}
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Average CPP <SortIndicator stack={sortStack} col="cpp" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('price', e.shiftKey)}
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Selling Price <SortIndicator stack={sortStack} col="price" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('profit', e.shiftKey)}
                    className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Profit / Pc <SortIndicator stack={sortStack} col="profit" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('margin', e.shiftKey)}
                    className="py-3.5 px-4 text-right text-brand-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Margin <SortIndicator stack={sortStack} col="margin" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('value', e.shiftKey)}
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Inventory Value <SortIndicator stack={sortStack} col="value" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                id="inventory-list"
                className="divide-y divide-slate-100 dark:divide-darkborder/60 text-xs"
              >
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-xs font-bold">Inventory database is empty</p>
                    </td>
                  </tr>
                ) : (
                  displayList.map((item) => {
                    const averageCPP = getProductHistoricalCPP(
                      item.name,
                      bnplRecords,
                      item.unitCost
                    );
                    const sellingPrice = item.sellPrice || 0;
                    const profitPerPiece = sellingPrice - averageCPP;
                    const profitMargin =
                      sellingPrice > 0 ? (profitPerPiece / sellingPrice) * 100 : 0;
                    const totalValue = item.stockQty * averageCPP;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onEditStock(item.id)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                          item.isReject ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td
                          data-label="Product Details"
                          className="py-3 px-4 sm:px-5 whitespace-nowrap"
                        >
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={item.image}
                                loading="lazy"
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded-lg shadow-xs border border-slate-200/50 dark:border-darkborder flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-brand-100 dark:border-brand-900/50">
                                {item.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-white max-w-[150px] truncate flex items-center">
                                {item.name}
                                {item.isReject && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 whitespace-nowrap">
                                    {item.rejectStatus || 'Reject'}
                                  </span>
                                )}
                              </span>
                              {item.notes && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td data-label="Current Stock" className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap ${
                              item.stockQty <= 0
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800/30'
                                : item.stockQty <= 3
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/50'
                            } border`}
                          >
                            {item.stockQty} pcs
                          </span>
                        </td>
                        <td
                          data-label="Average CPP"
                          className="py-3 px-3 sm:px-4 text-right text-slate-500 font-mono tabular-nums font-medium tracking-tight whitespace-nowrap"
                          title={String(averageCPP)}
                        >
                          ₱{' '}
                          {averageCPP.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                        </td>
                        <td
                          data-label="Selling Price"
                          className="py-3 px-3 sm:px-4 text-right font-bold text-brand-600 dark:text-brand-400 font-mono tabular-nums tracking-tight whitespace-nowrap"
                        >
                          ₱{' '}
                          {sellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          data-label="Profit / Pc"
                          className="py-3 px-3 sm:px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight whitespace-nowrap"
                        >
                          ₱{' '}
                          {profitPerPiece.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          data-label="Margin"
                          className="py-3 px-3 sm:px-4 text-right font-semibold text-brand-600 dark:text-brand-400 font-mono tabular-nums whitespace-nowrap"
                        >
                          {profitMargin.toFixed(2)}%
                        </td>
                        <td
                          data-label="Inventory Value"
                          className="py-3 px-3 sm:px-4 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
                        >
                          ₱ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          data-label="Actions"
                          onClick={(e) => e.stopPropagation()}
                          className="py-3 px-4 sm:px-5 text-right action-prevent-trigger whitespace-nowrap"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSellItemToPos(item.id)}
                              title="Sell Item"
                              aria-label="Sell Item"
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-100 dark:border-blue-800/30 shadow-xs btn-transition flex items-center justify-center min-w-[34px] min-h-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {!item.isReject && (
                              <button
                                onClick={() => onOpenRejectModal(item.id)}
                                title="Isolate Defective Item"
                                aria-label="Isolate Defective Item"
                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-100 dark:border-amber-800/30 shadow-xs btn-transition flex items-center justify-center min-w-[34px] min-h-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                              >
                                <AlertOctagon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteStock(item.id)}
                              title="Delete Product"
                              aria-label="Delete Product"
                              className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-100 dark:border-rose-800/30 shadow-xs btn-transition flex items-center justify-center min-w-[34px] min-h-[34px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
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
        </div>
      </div>
    </section>
  );
};
