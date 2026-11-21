import React, { useState, useEffect } from 'react';
import { Edit2, X, Image, Sliders } from 'lucide-react';
import { BnplRecord, InventoryItem } from '../../types';
import { getProductHistoricalCPP } from '../../services/calculations';
import { resizeProductImage } from '../../services/exportReceipt';

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
    <div
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-stock-modal-title"
        className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-darkborder animate-scale-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 dark:border-darkborder flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
              <Edit2 className="w-5 h-5" />
            </div>
            <h3 id="edit-stock-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              Edit Product Details
            </h3>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Product Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-medium bg-white dark:bg-darkinput text-slate-900 dark:text-white transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Update Image (Optional)
            </label>
            <label className="flex items-center justify-center w-full px-4 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-brand-400 transition-all bg-slate-50/50 dark:bg-darkinput group">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 group-hover:text-brand-600">
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

          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-darksurface p-3.5 rounded-lg border border-slate-100 dark:border-darkborder">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                disabled
                value={item.stockQty}
                className="w-full bg-transparent font-mono font-bold tabular-nums text-slate-700 dark:text-slate-300 text-base outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Calculated CPP
              </label>
              <input
                type="text"
                disabled
                value={`₱ ${calculatedCpp.toFixed(2)}`}
                className="w-full bg-transparent font-mono font-bold tabular-nums text-slate-700 dark:text-slate-300 text-base outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200/80 dark:border-amber-800/30 space-y-3">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-400 flex items-center">
              <Sliders className="w-3.5 h-3.5 mr-1.5 text-amber-600 dark:text-amber-400" /> Manual
              Inventory Adjustment
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={adjType}
                onChange={(e) =>
                  setAdjType(
                    e.target.value as 'none' | 'correction' | 'damaged' | 'expired'
                  )
                }
                className="px-3 py-2 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs font-bold bg-white dark:bg-darkinput text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                className="px-3 py-2 border border-amber-200 dark:border-amber-800/50 rounded-lg text-xs font-mono font-bold tabular-nums bg-white dark:bg-darkinput text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Selling Price (₱)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-bold tabular-nums text-slate-900 dark:text-white bg-white dark:bg-darkinput shadow-xs transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-darkborder mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 dark:border-darkborder rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-500 transition-all shadow-md shadow-brand-500/20 active:scale-[0.99]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
