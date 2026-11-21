import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Plus,
  X,
  CheckCircle,
  Tags,
  Edit2,
  Trash2,
} from 'lucide-react';
import { InventoryItem, Bundle, BundleItem, SortEntry } from '../../types';
import { getSortedBundles } from '../../services/calculations';
import { SortIndicator } from '../common/SortIndicator';

interface BundlesViewProps {
  inventory: InventoryItem[];
  bundles: Bundle[];
  sortStack: SortEntry[];
  onToggleSort: (col: string, isShift: boolean) => void;
  onSaveBundle: (
    type: 'same' | 'mixed',
    name: string,
    price: number,
    items: BundleItem[],
    editingId: string | null
  ) => void;
  onToggleBundleStatus: (id: string) => void;
  onDeleteBundle: (id: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const BundlesView: React.FC<BundlesViewProps> = ({
  inventory,
  bundles,
  sortStack,
  onToggleSort,
  onSaveBundle,
  onToggleBundleStatus,
  onDeleteBundle,
  onShowToast,
}) => {
  const [bundleType, setBundleType] = useState<'same' | 'mixed'>('same');
  const [bundleName, setBundleName] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState('1');
  const [draftItems, setDraftItems] = useState<BundleItem[]>([]);
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);

  const handleTypeChange = (nextType: 'same' | 'mixed') => {
    setBundleType(nextType);
    if (nextType === 'same' && draftItems.length > 1) {
      setDraftItems([draftItems[0]]);
    }
  };

  const addDraftItem = () => {
    if (!selectedItemId) return;
    const item = inventory.find((i) => i.id === selectedItemId);
    if (!item) return;
    const qty = parseInt(selectedItemQty, 10) || 1;

    if (bundleType === 'same' && draftItems.length >= 1) {
      setDraftItems([{ itemId: item.id, name: item.name, qty }]);
    } else {
      const existingIdx = draftItems.findIndex((d) => d.itemId === item.id);
      if (existingIdx > -1) {
        setDraftItems(
          draftItems.map((d, idx) => (idx === existingIdx ? { ...d, qty: d.qty + qty } : d))
        );
      } else {
        setDraftItems([...draftItems, { itemId: item.id, name: item.name, qty }]);
      }
    }
    setSelectedItemId('');
    setSelectedItemQty('1');
  };

  const removeDraftItem = (idx: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== idx));
  };

  const cancelEdit = () => {
    setEditingBundleId(null);
    setBundleType('same');
    setBundleName('');
    setBundlePrice('');
    setDraftItems([]);
  };

  const startEdit = (bundle: Bundle) => {
    setEditingBundleId(bundle.id);
    setBundleType(bundle.type);
    setBundleName(bundle.name);
    setBundlePrice(String(bundle.price));
    setDraftItems(JSON.parse(JSON.stringify(bundle.items || [])));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftItems.length === 0) {
      onShowToast('Add line items to the promo bundle.', 'error');
      return;
    }
    const price = parseFloat(bundlePrice);
    if (!bundleName.trim() || isNaN(price)) return;

    onSaveBundle(bundleType, bundleName.trim(), price, draftItems, editingBundleId);
    cancelEdit();
  };

  const displayBundles = getSortedBundles(bundles, sortStack);

  return (
    <section data-tab-content="bundles" className="space-y-6 block animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <details
          id="bundle-form-container"
          className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200/80 dark:border-darkborder shadow-sleek xl:col-span-1 group"
          open
        >
          <summary className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-darkborder flex justify-between items-center cursor-pointer select-none focus:outline-none">
            <h2 className="text-base font-extrabold flex items-center gap-2.5 text-slate-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-brand-500" /> Promo &amp; Bundle Builder
            </h2>
            <div className="text-slate-400 group-open:rotate-180 transition-transform">
              <ChevronDown className="w-5 h-5" />
            </div>
          </summary>

          <div className="p-5 sm:p-6 space-y-4">
            <form id="bundle-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="bundle-type"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Bundle Type
                </label>
                <select
                  id="bundle-type"
                  value={bundleType}
                  onChange={(e) => handleTypeChange(e.target.value as 'same' | 'mixed')}
                  required
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none transition-all text-slate-900 dark:text-white"
                >
                  <option value="same">Same Item Quantity Discount</option>
                  <option value="mixed">Mixed Item Combo Package</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="bundle-name"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Bundle Title
                </label>
                <input
                  type="text"
                  id="bundle-name"
                  required
                  value={bundleName}
                  onChange={(e) => setBundleName(e.target.value)}
                  placeholder="e.g. Buy 2 Take 1 Special Promo"
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-4 text-xs font-semibold focus:ring-2 focus:ring-brand-500/30 outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-4 bg-slate-50/80 dark:bg-darkbg/40 rounded-xl border border-slate-200/80 dark:border-darkborder space-y-3">
                <label
                  htmlFor="bundle-item-select"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Included Line Items
                </label>
                <div className="flex gap-2">
                  <select
                    id="bundle-item-select"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="flex-1 w-full bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-lg py-2 px-3.5 text-xs focus:ring-2 focus:ring-brand-500/30 outline-none truncate font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">Select product...</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (₱ {(item.sellPrice || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    id="bundle-item-qty"
                    min="1"
                    value={selectedItemQty}
                    onChange={(e) => setSelectedItemQty(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDraftItem();
                      }
                    }}
                    placeholder="Qty"
                    className="w-16 bg-white dark:bg-darkcard border border-slate-200 dark:border-darkborder rounded-lg py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-brand-500/30 outline-none text-center text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={addDraftItem}
                    aria-label="Add line item to bundle"
                    className="px-3.5 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg btn-transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div
                  id="draft-bundle-list"
                  className="space-y-2 mt-2 max-h-32 overflow-y-auto custom-scrollbar"
                >
                  {draftItems.map((d, i) => (
                    <div
                      key={`${d.itemId}-${i}`}
                      className="flex justify-between items-center bg-white dark:bg-darkcard p-2.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-darkborder shadow-xs transition-all hover:border-brand-300 dark:hover:border-brand-600"
                    >
                      <span>
                        {d.qty}x {d.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDraftItem(i)}
                        aria-label={`Remove ${d.name}`}
                        className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-md btn-transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="bundle-price"
                  className="block text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Bundle Selling Price
                </label>
                <input
                  type="number"
                  id="bundle-price"
                  required
                  step="0.01"
                  min="0"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-darkinput border border-slate-200 dark:border-darkborder rounded-lg py-2.5 px-4 text-sm font-mono font-bold tabular-nums focus:ring-2 focus:ring-emerald-500/30 outline-none text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  id="bundle-submit-btn"
                  className="btn-transition w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />{' '}
                  {editingBundleId ? 'Update Promo' : 'Save Promo Bundle'}
                </button>
                {editingBundleId && (
                  <button
                    type="button"
                    id="bundle-cancel-btn"
                    onClick={cancelEdit}
                    className="btn-transition w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </details>

        <div className="bg-white dark:bg-darkcard rounded-2xl border border-slate-200/80 dark:border-darkborder shadow-sleek xl:col-span-2 overflow-hidden flex flex-col w-full">
          <div className="p-5 border-b border-slate-200/80 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-darkbg/40">
            <h2 className="text-base font-extrabold flex items-center gap-2.5 text-slate-900 dark:text-white">
              <Tags className="w-5 h-5 text-brand-500" /> Active Promotional Bundles
            </h2>
          </div>
          <div className="w-full overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full divide-y divide-slate-200 dark:divide-darkborder ledger-bundles-table">
              <thead className="bg-slate-50/80 dark:bg-darkbg/80">
                <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-left select-none">
                  <th
                    onClick={(e) => onToggleSort('name', e.shiftKey)}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Bundle Title <SortIndicator stack={sortStack} col="name" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('includes', e.shiftKey)}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Includes <SortIndicator stack={sortStack} col="includes" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('price', e.shiftKey)}
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      Price <SortIndicator stack={sortStack} col="price" />
                    </div>
                  </th>
                  <th
                    onClick={(e) => onToggleSort('status', e.shiftKey)}
                    className="py-3.5 px-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-start gap-1">
                      Status <SortIndicator stack={sortStack} col="status" />
                    </div>
                  </th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                id="bundles-list"
                className="divide-y divide-slate-100 dark:divide-darkborder/60 text-xs"
              >
                {displayBundles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-xs font-bold">No promo bundles created.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayBundles.map((bundle) => (
                    <tr
                      key={bundle.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !bundle.isActive ? 'opacity-50 grayscale' : ''
                      }`}
                    >
                      <td data-label="Bundle Title" className="py-3 px-4 sm:px-5 whitespace-nowrap truncate-cell">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {bundle.name}
                        </div>
                        <div className="text-[10px] font-semibold text-brand-500 mt-0.5 capitalize whitespace-nowrap">
                          {bundle.type} Item Bundle
                        </div>
                      </td>
                      <td data-label="Includes" className="py-3 px-3 sm:px-4 text-xs">
                        {(bundle.items || []).map((i, idx) => (
                          <span
                            key={`${i.itemId}-${idx}`}
                            className="block w-fit bg-slate-100 dark:bg-darkinput text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-semibold text-[10px] mb-1 border border-slate-200/80 dark:border-darkborder leading-snug whitespace-nowrap"
                          >
                            {i.qty}x {i.name}
                          </span>
                        ))}
                      </td>
                      <td
                        data-label="Price"
                        className="py-3 px-3 sm:px-4 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight whitespace-nowrap text-xs"
                      >
                        ₱ {bundle.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td data-label="Status" className="py-3 px-3 sm:px-4 text-left whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bundle.isActive}
                            onChange={() => onToggleBundleStatus(bundle.id)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-700 peer-checked:bg-emerald-500 shadow-inner" />
                        </label>
                      </td>
                      <td
                        data-label="Actions"
                        className="py-3 px-4 sm:px-5 text-right whitespace-nowrap"
                      >
                        <button
                          onClick={() => startEdit(bundle)}
                          title="Edit Bundle"
                          aria-label="Edit Bundle"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors btn-transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteBundle(bundle.id)}
                          title="Delete Bundle"
                          aria-label="Delete Bundle"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors btn-transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
