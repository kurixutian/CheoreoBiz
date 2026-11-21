import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { InventoryItem } from '../../types';

interface RejectStockModalProps {
  sourceItem: InventoryItem | null;
  onClose: () => void;
  onSubmit: (payload: {
    sourceId: string;
    name: string;
    classification: string;
    qty: number;
    sellPrice: number;
    notes: string;
  }) => void;
}

export const RejectStockModal: React.FC<RejectStockModalProps> = ({
  sourceItem,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [classification, setClassification] = useState('Reject');
  const [qty, setQty] = useState('1');
  const [sellPrice, setSellPrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (sourceItem) {
      setName(`${sourceItem.name} (Defective)`);
      setClassification('Reject');
      setQty('1');
      setSellPrice((sourceItem.sellPrice * 0.5).toFixed(2));
      setNotes('');
    }
  }, [sourceItem]);

  if (!sourceItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      sourceId: sourceItem.id,
      name: name.trim(),
      classification,
      qty: parseInt(qty, 10) || 0,
      sellPrice: parseFloat(sellPrice) || 0,
      notes: notes.trim()
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-stock-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-amber-50/60 dark:bg-amber-900/20">
          <div className="flex items-center space-x-2.5">
            <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 p-2 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="reject-stock-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">Isolate Defective Stock</h3>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Deduct from main stock & create discounted listing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-darksurface p-1.5 rounded-lg border border-slate-200 dark:border-darkborder shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-darksurface p-3.5 rounded-xl border border-slate-200 dark:border-darkborder flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-slate-400 block">Source Product</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white">{sourceItem.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block">Available</span>
              <span className="text-sm font-extrabold font-mono tabular-nums text-brand-600 dark:text-brand-400">{sourceItem.stockQty}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Defective Item Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-bold bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Classification</label>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-xs font-bold bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
              >
                <option value="Reject">Reject</option>
                <option value="Damaged">Damaged</option>
                <option value="Clearance">Clearance</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Deduct Quantity</label>
              <input
                type="number"
                min="1"
                max={sourceItem.stockQty}
                required
                value={qty}
                onChange={e => setQty(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-mono font-bold tabular-nums bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Clearance Price (₱)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-xs">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={sellPrice}
                  onChange={e => setSellPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400 bg-white dark:bg-darkinput shadow-xs transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes / Defect Reason (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g., Torn packaging, Scratched cover, Dented..."
              className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm font-medium bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100 dark:border-darkborder">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-500 transition-all shadow-md shadow-amber-500/20 active:scale-[0.99] flex items-center"
            >
              <Check className="w-4 h-4 mr-1.5" /> Separate Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
