import React, { useState, useEffect } from 'react';
import { Edit2, Image, Sliders } from 'lucide-react';
import { BnplRecord, InventoryItem } from '../../types';
import { getProductHistoricalCPP } from '../../services/calculations';
import { resizeProductImage } from '../../services/exportReceipt';
import { ModalShell } from '../common/ModalShell';

interface EditStockModalProps {
  item: InventoryItem | null;
  bnplRecords: BnplRecord[];
  onClose: () => void;
  onSave: (payload: {
    id: string;
    name: string;
    sellPrice: number;
    adjType: 'none' | 'correction' | 'damaged' | 'expired';
    adjQty: number;
    newImageDataUrl?: string | null;
  }) => void;
  onErrorToast: (msg: string) => void;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
  item,
  bnplRecords,
  onClose,
  onSave,
  onErrorToast,
}) => {
  const [name, setName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [adjType, setAdjType] = useState<'none' | 'correction' | 'damaged' | 'expired'>('none');
  const [adjQty, setAdjQty] = useState('');
  const [newImageDataUrl, setNewImageDataUrl] = useState<string | null | undefined>(undefined);
  const [fileName, setFileName] = useState('Upload new photo...');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSellPrice(String(item.sellPrice));
      setAdjType('none');
      setAdjQty('');
      setNewImageDataUrl(undefined);
      setFileName('Upload new photo...');
    }
  }, [item]);

  if (!item) return null;

  const calculatedCpp = getProductHistoricalCPP(item.name, bnplRecords, item.unitCost);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNewImageDataUrl(undefined);
      setFileName('Upload new photo...');
      return;
    }
    setFileName(file.name);
    try {
      const dataUrl = await resizeProductImage(file);
      setNewImageDataUrl(dataUrl);
    } catch {
      onErrorToast('Failed to process image');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(sellPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      onErrorToast('Invalid selling price');
      return;
    }
    onSave({
      id: item.id,
      name: name.trim(),
      sellPrice: parsedPrice,
      adjType,
      adjQty: parseInt(adjQty, 10) || 0,
      newImageDataUrl,
    });
  };

  return (
    <ModalShell
      title="Edit Product Details"
      titleId="edit-stock-modal-title"
      icon={<Edit2 className="w-5 h-5" />}
      iconClassName="bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Product Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-sm font-medium bg-slate-50 dark:bg-darkinput text-slate-900 dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Update Image (Optional)
          </label>
          <label className="flex items-center justify-center w-full px-4 py-2.5 border border-dashed border-slate-300 dark:border-darkborder rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-darksurface hover:border-brand-400 transition-all bg-slate-50/50 dark:bg-darkinput group">
            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400">
              <Image className="w-4 h-4" />
              <span className="text-xs font-semibold truncate max-w-[200px]">{fileName}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-darksurface p-3.5 rounded-xl border border-slate-200 dark:border-darkborder">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Current Stock
            </label>
            <input
              type="number"
              disabled
              value={item.stockQty}
              className="w-full bg-transparent font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200 text-base outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Calculated CPP
            </label>
            <input
              type="text"
              disabled
              value={`₱ ${calculatedCpp.toFixed(2)}`}
              className="w-full bg-transparent font-mono font-bold tabular-nums text-slate-900 dark:text-slate-200 text-base outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 space-y-3">
          <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center">
            <Sliders className="w-3.5 h-3.5 mr-1.5 text-amber-600 dark:text-amber-400" /> Manual
            Inventory Adjustment
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={adjType}
              onChange={(e) =>
                setAdjType(e.target.value as 'none' | 'correction' | 'damaged' | 'expired')
              }
              className="px-3 py-2 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs font-semibold bg-white dark:bg-darkinput text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              <option value="none">No Change</option>
              <option value="correction">Count Correction (+/-)</option>
              <option value="damaged">Damaged (-)</option>
              <option value="expired">Expired (-)</option>
            </select>
            <input
              type="number"
              value={adjQty}
              onChange={(e) => setAdjQty(e.target.value)}
              placeholder="Qty (e.g. -2 or 5)"
              disabled={adjType === 'none'}
              className="px-3 py-2 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs font-mono font-bold tabular-nums bg-white dark:bg-darkinput text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Selling Price (₱)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 dark:text-slate-400 font-semibold">
              ₱
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-white bg-slate-50 dark:bg-darkinput transition-all"
            />
          </div>
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
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.99]"
          >
            Save Changes
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
