import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
import { InventoryItem } from '../../types';
import { ModalShell } from '../common/ModalShell';

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
  onSubmit,
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
      notes: notes.trim(),
    });
  };

  return (
    <ModalShell
      title="Isolate Defective Stock"
      titleId="reject-stock-modal-title"
      subtitle="Deduct from main stock & create discounted listing"
      icon={<ShieldAlert className="w-5 h-5" />}
      iconClassName="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
      headerClassName="bg-amber-50/60 dark:bg-amber-500/10"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div className="bg-slate-50 dark:bg-darksurface p-3.5 rounded-xl border border-slate-200 dark:border-darkborder flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              Source Product
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {sourceItem.name}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              Available
            </span>
            <span className="text-sm font-bold font-mono tabular-nums text-brand-600 dark:text-brand-400">
              {sourceItem.stockQty}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Defective Item Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm font-semibold bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Classification
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-xs font-semibold bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Deduct Quantity
            </label>
            <input
              type="number"
              min="1"
              max={sourceItem.stockQty}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm font-mono font-bold tabular-nums bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Clearance Price (₱)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm font-mono font-bold tabular-nums text-amber-700 dark:text-amber-400 bg-slate-50 dark:bg-darkinput transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Notes / Defect Reason (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Torn packaging, Scratched cover, Dented..."
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-sm font-medium bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200 dark:border-darkborder">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-darksurface transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.99] flex items-center"
          >
            <Check className="w-4 h-4 mr-1.5" /> Separate Stock
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
